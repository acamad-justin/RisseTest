// frontend/lib/memory/memoryService.ts
/**
 * Student Memory Ingestion & Retrieval Service (Milestone 2B).
 * Implements the three-layer student memory architecture:
 * Layer 1: Global durable learner memory (learning preferences, experience, strengths)
 * Layer 2: Module-specific memory (checkpoint progress, concept mastery, misconceptions)
 * Layer 3: Provenance-aware evidence memory (reported, observed, demonstrated, inferred)
 */

export interface LearnerMemoryContext {
  studentId?: string;
  generalExperience?: 'novice' | 'intermediate' | 'advanced';
  learningPreferences?: {
    hintStyle?: string;
    tone?: string;
    handsOnFirst?: boolean;
    stepByStep?: boolean;
    [key: string]: any;
  };
  masteredConcepts?: string[];
  activeMisconceptions?: string[];
  currentCheckpoint?: string;
  progressPercent?: number;
}

export interface CandidateMemoryExtraction {
  globalMemoryUpdate?: {
    generalExperience?: 'novice' | 'intermediate' | 'advanced';
    learningPreferences?: Record<string, any>;
    growthAreas?: string[];
    strengths?: string[];
  };
  candidateEvidence?: Array<{
    moduleId: string;
    conceptId: string;
    checkpointId?: string;
    provenance: 'student_reported' | 'directly_observed' | 'inferred';
    claim: string;
  }>;
}

/**
 * Extracts candidate memories from student-assistant interaction.
 * Strictly adheres to privacy and security boundaries:
 * 1. Notebook Exclusion: Excludes Personal Project Notebooks entirely.
 * 2. Inferred evidence is tagged 'inferred' and never verified automatically.
 * 3. Student reported claims are tagged 'student_reported' and never verified automatically.
 */
export function extractCandidateMemories(options: {
  messages: Array<{ role: string; content: string }>;
  lastUserMessage: string;
  moduleId?: string;
  checkpointId?: string;
  targetConcept?: string;
  isNotebook?: boolean;
}): CandidateMemoryExtraction {
  // CRITICAL PRIVACY INVARIANT: Personal Project Notebooks are strictly excluded
  if (options.isNotebook) {
    return {};
  }

  const result: CandidateMemoryExtraction = {};
  const query = options.lastUserMessage.trim();
  const lowerQuery = query.toLowerCase();

  // ── 1. Layer 1: Global Learning Preference Extraction ─────────────────────
  const prefs: Record<string, any> = {};
  if (/\b(step[- ]by[- ]step|one step at a time|break it down)\b/i.test(lowerQuery)) {
    prefs.stepByStep = true;
    prefs.hintStyle = 'step_by_step';
  } else if (/\b(hands[- ]on|practical|real[- ]life|build it|try it)\b/i.test(lowerQuery)) {
    prefs.handsOnFirst = true;
    prefs.hintStyle = 'hands_on';
  } else if (/\b(visual|diagram|show me a picture|draw)\b/i.test(lowerQuery)) {
    prefs.visualLearning = true;
  }

  let detectedExperience: 'novice' | 'intermediate' | 'advanced' | undefined;
  if (/\b(i'?m a beginner|never done robotics|first time|new to this|no experience)\b/i.test(lowerQuery)) {
    detectedExperience = 'novice';
  } else if (/\b(built robots before|familiar with arduino|know some code|intermediate)\b/i.test(lowerQuery)) {
    detectedExperience = 'intermediate';
  } else if (/\b(advanced|years of robotics|competition veteran|built many robots)\b/i.test(lowerQuery)) {
    detectedExperience = 'advanced';
  }

  if (Object.keys(prefs).length > 0 || detectedExperience) {
    result.globalMemoryUpdate = {
      ...(detectedExperience ? { generalExperience: detectedExperience } : {}),
      ...(Object.keys(prefs).length > 0 ? { learningPreferences: prefs } : {}),
    };
  }

  // ── 2. Layer 3: Candidate Evidence Extraction ─────────────────────────────
  if (options.moduleId && options.targetConcept) {
    const candidateEvidenceList: CandidateMemoryExtraction['candidateEvidence'] = [];
    const normalizedConcept = options.targetConcept.toLowerCase();

    // Student-reported claim: "I already know [concept]" or "I don't know [concept]"
    if (/\b(i know|i already understand|i have mastered)\b/i.test(lowerQuery)) {
      candidateEvidenceList.push({
        moduleId: options.moduleId,
        conceptId: normalizedConcept,
        checkpointId: options.checkpointId,
        provenance: 'student_reported',
        claim: `Student reported understanding of ${options.targetConcept}`,
      });
    } else if (/\b(i don'?t understand|confused about|what is)\b/i.test(lowerQuery)) {
      candidateEvidenceList.push({
        moduleId: options.moduleId,
        conceptId: normalizedConcept,
        checkpointId: options.checkpointId,
        provenance: 'directly_observed',
        claim: `Student directly expressed confusion or asked for clarification on ${options.targetConcept}`,
      });
    }

    if (candidateEvidenceList.length > 0) {
      result.candidateEvidence = candidateEvidenceList;
    }
  }

  return result;
}

/**
 * Retrieves student memory context from Supabase.
 * Returns default empty context on failure to guarantee non-blocking chat behavior.
 */
export async function fetchStudentLearnerContext(
  supabaseClient: any,
  studentId: string,
  moduleId?: string
): Promise<LearnerMemoryContext> {
  const context: LearnerMemoryContext = {
    studentId,
    masteredConcepts: [],
    activeMisconceptions: [],
  };

  if (!supabaseClient || !studentId) {
    return context;
  }

  try {
    // 1. Fetch Global Memory (Layer 1)
    const { data: globalMem, error: globalErr } = await supabaseClient
      .from('student_global_memory')
      .select('general_experience, learning_preferences, general_strengths, growth_areas')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!globalErr && globalMem) {
      context.generalExperience = globalMem.general_experience;
      context.learningPreferences = globalMem.learning_preferences || {};
    }

    // 2. Fetch Module Memory & Concept Mastery if moduleId is provided (Layer 2)
    if (moduleId) {
      const { data: moduleMem, error: modErr } = await supabaseClient
        .from('student_module_memory')
        .select('status, progress_percent, current_checkpoint')
        .eq('student_id', studentId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (!modErr && moduleMem) {
        context.progressPercent = moduleMem.progress_percent;
        context.currentCheckpoint = moduleMem.current_checkpoint;
      }

      // Fetch mastered concepts for this specific module
      const { data: masteryRecords, error: masteryErr } = await supabaseClient
        .from('concept_mastery_records')
        .select(`
          mastery_state,
          active_misconceptions,
          concept_module_mappings!inner(concept_id, module_id)
        `)
        .eq('student_id', studentId)
        .eq('concept_module_mappings.module_id', moduleId);

      if (!masteryErr && Array.isArray(masteryRecords)) {
        for (const rec of masteryRecords) {
          const cId = rec.concept_module_mappings?.concept_id;
          if (cId) {
            if (rec.mastery_state === 'mastered') {
              context.masteredConcepts?.push(cId);
            }
            if (Array.isArray(rec.active_misconceptions) && rec.active_misconceptions.length > 0) {
              context.activeMisconceptions?.push(...rec.active_misconceptions);
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[MemoryService] Non-fatal error fetching student learner context:', err?.message || err);
  }

  return context;
}

/**
 * Persists candidate memory evidence asynchronously in the background.
 * Wrapped to guarantee that failures never interrupt the primary chat stream.
 */
export async function syncStudentMemoryInteraction(
  supabaseClient: any,
  studentId: string,
  extraction: CandidateMemoryExtraction
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseClient || !studentId) {
    return { success: false, error: 'Missing client or studentId' };
  }

  try {
    // 1. Sync Global Memory Update if present
    if (extraction.globalMemoryUpdate) {
      const gUpdate = extraction.globalMemoryUpdate;
      await supabaseClient.rpc('sync_student_global_memory', {
        p_student_id: studentId,
        p_learning_preferences: gUpdate.learningPreferences || null,
        p_general_experience: gUpdate.generalExperience || null,
        p_growth_areas: gUpdate.growthAreas || null,
        p_general_strengths: gUpdate.strengths || null,
      });
    }

    // 2. Record Candidate Evidence (provenance-aware, never automatically verified)
    if (Array.isArray(extraction.candidateEvidence) && extraction.candidateEvidence.length > 0) {
      for (const ev of extraction.candidateEvidence) {
        await supabaseClient.rpc('record_candidate_evidence', {
          p_student_id: studentId,
          p_module_id: ev.moduleId,
          p_concept_id: ev.conceptId,
          p_checkpoint_id: ev.checkpointId || null,
          p_provenance: ev.provenance,
          p_claim: ev.claim,
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[MemoryService] Asynchronous memory ingestion non-fatal error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Persists conversation turn messages adhering strictly to append-only rules
 * and student/assistant sender role authorization.
 */
export async function persistConversationTurn(
  supabaseClient: any,
  studentId: string,
  conversationId: string,
  userMessage: string,
  assistantMessage?: string
): Promise<void> {
  if (!supabaseClient || !studentId || !conversationId) return;

  try {
    if (userMessage && userMessage.trim()) {
      await supabaseClient.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_role: 'student',
        content: userMessage.trim(),
      });
    }

    if (assistantMessage && assistantMessage.trim()) {
      await supabaseClient.from('conversation_messages').insert({
        conversation_id: conversationId,
        sender_role: 'assistant',
        content: assistantMessage.trim(),
      });
    }
  } catch (err: any) {
    console.warn('[MemoryService] Non-fatal conversation message persistence warning:', err?.message || err);
  }
}
