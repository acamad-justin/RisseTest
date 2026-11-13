// frontend/resources/js/views/mentor/curriculum/modulePreview.js
/**
 * Pure helpers for the Module Preview and the Learning Path Editor (Phase 1).
 *
 * Everything here is read-only: functions never mutate the nodes they receive and never
 * touch the store, the service, or Supabase. Safe to call from any teacher-facing view.
 */

// ── Node order ──────────────────────────────────────────────────────────────

/** Flatten legacy `modules[].checkpoints` into one ordered list (used only when there are no learning_nodes). */
export function flattenModuleCheckpoints(proposalData) {
  const mods = Array.isArray(proposalData?.modules) ? proposalData.modules : [];
  return mods.flatMap(m => (Array.isArray(m?.checkpoints) ? m.checkpoints : []));
}

/**
 * Ordered nodes of a proposal. Same precedence as CurriculumDesigner's `learningNodesList`:
 * `learning_nodes` first, then legacy `modules[].checkpoints`. Array position IS the order
 * (moveNodeUp/Down keep `order` / `node_number` in sync with it).
 */
export function getOrderedNodes(proposalData) {
  if (Array.isArray(proposalData?.learning_nodes) && proposalData.learning_nodes.length > 0) {
    return proposalData.learning_nodes;
  }
  return flattenModuleCheckpoints(proposalData);
}

/** Stable selection key: the node id, falling back to its position for nodes that have none. */
export function nodeKey(node, index) {
  return node?.id != null && node.id !== '' ? String(node.id) : `idx-${index}`;
}

export function findNodeIndex(nodes, target) {
  if (!target) return -1;
  const byRef = nodes.indexOf(target);
  if (byRef >= 0) return byRef;
  return target.id != null ? nodes.findIndex(n => n?.id === target.id) : -1;
}

// ── Normalisation (non-mutating; mirrors the alias pairs in CurriculumDesigner.normalizeNodeContent) ──

export function toList(value) {
  if (Array.isArray(value)) return value.filter(v => v !== null && v !== undefined && v !== '');
  if (typeof value === 'string') return value.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
}

function asText(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.title || v.text || v.description || v.citation_text || '';
  return v == null ? '' : String(v);
}

/** A display-ready copy of node_content. Never writes back to the node. */
export function normalizeContentForDisplay(node) {
  const c = node?.node_content && typeof node.node_content === 'object' ? node.node_content : {};
  let concepts = c.core_concepts || c.key_concepts || [];
  if (typeof concepts === 'string') {
    try { concepts = JSON.parse(concepts); } catch (_) {
      concepts = concepts.split('\n').filter(Boolean).map(x => ({ concept: x, explanation: '' }));
    }
  }
  return {
    objectives: toList(c.learning_objectives),
    overview: c.overview || c.introduction || '',
    guide: c.step_by_step_guide || c.core_lesson || '',
    concepts: Array.isArray(concepts) ? concepts : [],
    examples: toList(c.examples),
    materials: toList(c.materials_needed || c.practical_applications),
    activities: toList(c.activities),
    challenges: toList(c.engineering_challenges || c.troubleshooting),
    safety: c.safety_guidelines || '',
    questions: Array.isArray(c.interactive_quiz) && c.interactive_quiz.length
      ? c.interactive_quiz
      : (Array.isArray(c.assessment_questions) ? c.assessment_questions : []),
    rubric: c.assessment_rubric || '',
    references: toList(c.suggested_references).map(asText).filter(Boolean),
  };
}

export function nodeMinutes(node) {
  const m = node?.estimated_minutes ?? node?.duration_minutes;
  if (Number.isFinite(Number(m)) && Number(m) > 0) return Number(m);
  const parsed = parseInt(String(node?.estimated_duration || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null; // null = not available (never invented)
}

export function nodeQuestions(node) {
  const fromAssessment = Array.isArray(node?.assessment?.questions) ? node.assessment.questions : [];
  return fromAssessment.length ? fromAssessment : normalizeContentForDisplay(node).questions;
}

export function nodeActivities(node) {
  const items = normalizeContentForDisplay(node).activities.map(asText);
  if (node?.interactive_activity) items.unshift(asText(node.interactive_activity));
  return items.filter(Boolean);
}

/** Checkpoint-style items attached to a node: completion criteria, challenge, gating assessment. */
export function nodeCheckpoints(node) {
  const out = [];
  if (node?.completion_criteria) out.push({ kind: 'criteria', label: 'Completion criteria', text: node.completion_criteria });
  if (node?.engineering_challenge) out.push({ kind: 'challenge', label: 'Engineering challenge', text: node.engineering_challenge });
  const qs = nodeQuestions(node);
  if (qs.length) {
    const pass = node?.assessment?.passing_score_percentage;
    out.push({
      kind: 'assessment',
      label: 'Assessment',
      text: `${qs.length} question${qs.length === 1 ? '' : 's'}${pass ? ` · pass at ${pass}%` : ''}`,
      gates: Boolean(node?.assessment?.required_to_unlock_next),
    });
  }
  return out;
}

export function nodeBlocks(node) {
  return Array.isArray(node?.blocks) ? node.blocks : [];
}

export function nodeImageCount(node) {
  return nodeBlocks(node).filter(b => b?.type === 'image').length;
}

export function nodeHasContent(node) {
  if (nodeBlocks(node).length) return true;
  const c = normalizeContentForDisplay(node);
  return Boolean(c.overview || c.guide || c.concepts.length || c.activities.length || c.questions.length);
}

/** One flat, display-ready description of a node for list rows. */
export function describeNode(node, index) {
  const c = normalizeContentForDisplay(node);
  const summary = node?.description || (c.overview ? c.overview.slice(0, 180) : '');
  return {
    key: nodeKey(node, index),
    index,
    number: index + 1,
    title: node?.title || `Untitled node ${index + 1}`,
    type: node?.type || 'concept',
    topicGroup: node?.topic_group || '',
    summary,
    minutes: nodeMinutes(node),
    hasContent: nodeHasContent(node),
    activities: nodeActivities(node),
    checkpoints: nodeCheckpoints(node),
    imageCount: nodeImageCount(node),
  };
}

// ── Adjacent-node selection (Phase 2 "Combine Nodes" will consume this) ─────

export function isContiguous(sortedIndices) {
  return sortedIndices.every((n, i) => i === 0 || n === sortedIndices[i - 1] + 1);
}

/**
 * Next selection after the teacher toggles `clicked`. Selections are always one contiguous run
 * of nodes, so the future merge can safely treat them as a single block in original order.
 * `total` is the node count (only used to word the hint). Returns { ok, indices (sorted ascending), reason }.
 */
export function toggleAdjacentSelection(currentIndices, clicked, total = Infinity) {
  const cur = [...currentIndices].sort((a, b) => a - b);
  if (cur.length === 0) return { ok: true, indices: [clicked] };

  const min = cur[0];
  const max = cur[cur.length - 1];

  if (cur.includes(clicked)) {
    if (cur.length === 1 || clicked === min || clicked === max) {
      return { ok: true, indices: cur.filter(i => i !== clicked) };
    }
    return { ok: false, indices: cur, reason: 'Deselect from either end of the selected range so the nodes stay adjacent.' };
  }
  if (clicked === min - 1 || clicked === max + 1) {
    return { ok: true, indices: [...cur, clicked].sort((a, b) => a - b) };
  }
  // Nodes that would extend the run, as 1-based display numbers (index min-1 -> number min; index max+1 -> number max+2).
  const options = [];
  if (min > 0) options.push(`Node ${String(min).padStart(2, '0')}`);
  if (max + 1 < total) options.push(`Node ${String(max + 2).padStart(2, '0')}`);
  return {
    ok: false,
    indices: cur,
    reason: `Only adjacent nodes can be combined. Extend the selection with ${options.join(' or ')}.`,
  };
}

/** Whether `index` could be added or removed without breaking adjacency (drives disabled styling). */
export function canToggle(currentIndices, index, total = Infinity) {
  return toggleAdjacentSelection(currentIndices, index, total).ok;
}

// ── Mapping: curriculum proposal node  ->  structures CheckpointContentView.vue expects ─────────────
// The student roadmap (ModuleRoadmapView) hands CheckpointContentView a checkpoint shaped as
//   { ...cp, id, name, title, desc, type, node_content }   and a module with a `checkpoints` array.
// We reproduce that shape and spread the WHOLE node, so node_content, blocks, assessment,
// source_reference, topic_group, completion_criteria, etc. all pass through untouched.

/** Student-facing checkpoint for one node. Deep-cloned: the student component can never reach the editor's data. */
export function toStudentCheckpoint(node, index) {
  const n = JSON.parse(JSON.stringify(node || {}));
  const title = n.title || n.name || `Checkpoint ${index + 1}`;
  return {
    ...n,
    id: n.id !== undefined && n.id !== null && n.id !== '' ? n.id : `preview-node-${index + 1}`,
    step_number: index + 1,
    name: title,
    title,
    description: n.description || '',
    desc: n.description || n.desc || '',
    type: n.type || 'concept',
    node_content: n.node_content || null,
  };
}

/**
 * Student-facing module for the preview. `id` is the real course id when known; it is never 999
 * (CheckpointContentView treats 999 as its built-in test module). currentStep/totalSteps mirror
 * the node's position; nothing about them is saved anywhere.
 */
export function toStudentModuleData({ nodes, index = 0, moduleTitle = '', moduleId = null, description = '' }) {
  const checkpoints = (nodes || []).map((n, i) => toStudentCheckpoint(n, i));
  return {
    id: moduleId || 'preview',
    title: moduleTitle || 'Untitled module',
    description,
    checkpoints,
    currentStep: index,
    totalSteps: checkpoints.length,
    progressPercent: 0,
  };
}