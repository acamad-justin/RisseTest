// frontend/lib/mentor/publishingPlan.ts
/**
 * RISSE AI — Normalized Publishing Plan
 *
 * Single source of truth for "what will students receive when this curriculum
 * proposal is published". The Curriculum Designer previews (Option A / Option B,
 * the publish confirmation modal) and MentorService.publishCurriculumProposal all
 * call buildPublishingPlan(), so their counts can never disagree.
 *
 * Where the data lives (as produced by generateModuleStructure / saveModuleDraft):
 *   proposal_data.learning_nodes[]        flat, ordered nodes; each carries `topic_group`
 *                                         (the "sections" shown in the Designer)
 *   proposal_data.modules[0].checkpoints  the SAME nodes, wrapped in ONE compatibility module
 *   proposal_data.modules[n].checkpoints  legacy multi-module proposals (no learning_nodes)
 *
 * Root cause of the old count: the preview counted proposal_data.modules.length, which is
 * always 1 for generated proposals, while the four sections only exist as `topic_group`
 * values on the nodes.
 *
 * This module is pure (no I/O, no mutation of its input).
 */

export type PublishingFormat = 'separate_modules' | 'one_module';

export const VALID_NODE_TYPES = [
  'concept',
  'lab',
  'challenge',
  'assessment',
  'project',
  'demonstration',
  'guided_practice',
] as const;

export const DEFAULT_SECTION_TITLE = 'Core Curriculum';

export interface PublishingIssue {
  level: 'error' | 'warning';
  code:
    | 'invalid_format'
    | 'no_nodes'
    | 'empty_section'
    | 'node_missing_title'
    | 'node_invalid_type'
    | 'node_missing_id';
  message: string;
  sectionTitle?: string;
  nodeId?: string;
}

export interface PublishingPlanNode {
  /** Original node id when present (never rewritten); derived deterministic id otherwise. */
  id: string;
  hasStableId: boolean;
  title: string;
  type: string | undefined;
  /** 0-based position in the proposal's original node order. */
  orderIndex: number;
  /** Reference to the ORIGINAL node object (not cloned) so content/activities are preserved. */
  node: any;
}

export interface PublishingPlanSection {
  id: string;
  title: string;
  description: string;
  nodeCount: number;
  nodes: PublishingPlanNode[];
}

export interface PublishingPlanModule {
  id: string;
  title: string;
  description: string;
  nodeCount: number;
  sectionCount: number;
  sections: PublishingPlanSection[];
  /** All nodes of the module in section order, then original node order. */
  nodes: PublishingPlanNode[];
}

export interface PublishingPlan {
  format: PublishingFormat | null;
  modules: PublishingPlanModule[];
  totals: { modules: number; sections: number; nodes: number };
  issues: PublishingIssue[];
  /** false when an error-level issue exists. */
  canPublish: boolean;
}

export interface BuildPublishingPlanOptions {
  /** Used to derive deterministic ids for generated modules/sections (e.g. the course id). */
  baseId?: string;
  /** Title used for the combined module and for ungrouped nodes. */
  fallbackTitle?: string;
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function cleanText(v: any): string {
  return typeof v === 'string' ? v.trim() : '';
}

function slug(v: string): string {
  return (
    v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'section'
  );
}

export function normalizePublishingFormat(v: any): PublishingFormat | null {
  return v === 'separate_modules' || v === 'one_module' ? v : null;
}

/** Format persisted with the proposal (publishing_format wins over organization_mode). */
export function resolvePublishingFormat(proposalData: any): PublishingFormat | null {
  return (
    normalizePublishingFormat(proposalData?.publishing_format) ||
    normalizePublishingFormat(proposalData?.organization_mode)
  );
}

interface RawSection {
  title: string;
  description: string;
  idHint?: string;
  rawNodes: any[];
}

/**
 * Resolve the raw sections exactly the way the Designer displays them.
 *  1. learning_nodes[] (non-empty): group by node.topic_group. Nodes without a group use
 *     DEFAULT_SECTION_TITLE (same label the Designer's coverage view uses).
 *  2. legacy: modules.length > 1 → each module is a section (its checkpoints are the nodes).
 *  3. modules.length === 1 → that module's checkpoints grouped by topic_group.
 * Sections keep first-appearance order; nodes keep their original order inside a section.
 */
function resolveRawSections(proposalData: any, fallbackTitle: string): RawSection[] {
  const learningNodes = asArray(proposalData?.learning_nodes);
  const modules = asArray(proposalData?.modules);

  const groupNodes = (nodes: any[]): RawSection[] => {
    const order: string[] = [];
    const map = new Map<string, RawSection>();
    for (const n of nodes) {
      if (n === null || typeof n !== 'object') continue;
      const title = cleanText(n.topic_group) || DEFAULT_SECTION_TITLE;
      let s = map.get(title);
      if (!s) {
        s = { title, description: '', rawNodes: [] };
        map.set(title, s);
        order.push(title);
      }
      s.rawNodes.push(n);
    }
    return order.map(t => map.get(t)!);
  };

  if (learningNodes.length > 0) return groupNodes(learningNodes);

  if (modules.length > 1) {
    return modules
      .filter(m => m !== null && typeof m === 'object')
      .map((m, i) => ({
        title: cleanText(m.title) || `Section ${i + 1}`,
        description: cleanText(m.description),
        idHint: cleanText(m.id) || undefined,
        rawNodes: asArray(m.checkpoints),
      }));
  }

  if (modules.length === 1 && modules[0] && typeof modules[0] === 'object') {
    const cps = asArray(modules[0].checkpoints);
    if (cps.length > 0) return groupNodes(cps);
    // A single module with no checkpoints is an empty section, not "nothing".
    return [
      {
        title: cleanText(modules[0].title) || fallbackTitle,
        description: cleanText(modules[0].description),
        idHint: cleanText(modules[0].id) || undefined,
        rawNodes: [],
      },
    ];
  }

  return [];
}

export function buildPublishingPlan(
  proposalData: any,
  format: PublishingFormat | string | null | undefined,
  options: BuildPublishingPlanOptions = {}
): PublishingPlan {
  const issues: PublishingIssue[] = [];
  const baseId = options.baseId || cleanText(proposalData?.id) || 'proposal';
  const fallbackTitle = options.fallbackTitle || cleanText(proposalData?.title) || 'Learning Module';
  const normalizedFormat = normalizePublishingFormat(format);

  if (!normalizedFormat) {
    issues.push({
      level: 'error',
      code: 'invalid_format',
      message: 'A publishing format (separate_modules or one_module) must be selected.',
    });
  }

  const rawSections = resolveRawSections(proposalData, fallbackTitle);

  // Build sections with normalized nodes. orderIndex is the position across the whole proposal.
  let orderIndex = 0;
  const sections: PublishingPlanSection[] = rawSections.map((rs, sIdx) => {
    const sectionId = rs.idHint || `${baseId}-section-${sIdx + 1}-${slug(rs.title)}`;
    const nodes: PublishingPlanNode[] = [];
    rs.rawNodes.forEach(n => {
      if (n === null || typeof n !== 'object') return;
      const rawId = cleanText(n.id);
      const id = rawId || `${sectionId}-node-${nodes.length + 1}`;
      const title = cleanText(n.title) || cleanText(n.name);
      const type = typeof n.type === 'string' ? n.type : undefined;

      if (!rawId) {
        issues.push({ level: 'warning', code: 'node_missing_id', message: `A node in "${rs.title}" has no id; a derived id was used.`, sectionTitle: rs.title, nodeId: id });
      }
      if (!title) {
        issues.push({ level: 'error', code: 'node_missing_title', message: `A node in "${rs.title}" has no title.`, sectionTitle: rs.title, nodeId: id });
      }
      if (!type || !(VALID_NODE_TYPES as readonly string[]).includes(type)) {
        issues.push({ level: 'error', code: 'node_invalid_type', message: `Node "${title || id}" in "${rs.title}" has a missing or unsupported type.`, sectionTitle: rs.title, nodeId: id });
      }
      nodes.push({ id, hasStableId: Boolean(rawId), title, type, orderIndex: orderIndex++, node: n });
    });
    return { id: sectionId, title: rs.title, description: rs.description, nodeCount: nodes.length, nodes };
  });

  const emptySections = sections.filter(s => s.nodeCount === 0);
  emptySections.forEach(s => {
    issues.push({
      level: normalizedFormat === 'separate_modules' ? 'error' : 'warning',
      code: 'empty_section',
      message:
        normalizedFormat === 'separate_modules'
          ? `Section "${s.title}" has no nodes and would publish as an empty module.`
          : `Section "${s.title}" has no nodes.`,
      sectionTitle: s.title,
    });
  });

  const totalNodes = sections.reduce((sum, s) => sum + s.nodeCount, 0);
  if (totalNodes === 0) {
    issues.push({ level: 'error', code: 'no_nodes', message: 'The curriculum has no learning nodes to publish.' });
  }

  let modules: PublishingPlanModule[];
  if (normalizedFormat === 'one_module') {
    modules = sections.length === 0 && totalNodes === 0
      ? []
      : [
          {
            id: `${baseId}-combined`,
            title: fallbackTitle,
            description: cleanText(proposalData?.summary) || cleanText(proposalData?.description),
            nodeCount: totalNodes,
            sectionCount: sections.length,
            sections,
            nodes: sections.flatMap(s => s.nodes),
          },
        ];
  } else {
    // separate_modules, and the neutral shape when no valid format is chosen yet
    modules = sections.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      nodeCount: s.nodeCount,
      sectionCount: 1,
      sections: [s],
      nodes: s.nodes,
    }));
  }

  return {
    format: normalizedFormat,
    modules,
    totals: { modules: modules.length, sections: sections.length, nodes: totalNodes },
    issues,
    canPublish: !issues.some(i => i.level === 'error'),
  };
}