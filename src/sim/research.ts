import { RESEARCH } from './content';
import type { GameState, ResearchNode } from './types';

export function nodeById(id: string): ResearchNode | undefined {
  return RESEARCH.find((node) => node.id === id);
}

export function prerequisitesMet(state: GameState, node: ResearchNode): boolean {
  return node.requires.every((id) => state.research.completed.includes(id));
}

export function isAvailable(state: GameState, node: ResearchNode): boolean {
  return (
    !state.research.completed.includes(node.id) &&
    state.research.activeNodeId !== node.id &&
    prerequisitesMet(state, node) &&
    state.resources.data >= node.costData &&
    state.resources.samples >= node.costSamples
  );
}

export function startResearch(state: GameState, nodeId: string): { ok: boolean; reason?: string } {
  const node = nodeById(nodeId);
  if (!node) return { ok: false, reason: 'پژوهش ناشناخته است.' };
  if (state.research.completed.includes(node.id)) return { ok: false, reason: 'این پژوهش پیش‌تر تکمیل شده است.' };
  if (!prerequisitesMet(state, node)) return { ok: false, reason: 'پیش‌نیازهای این پژوهش تکمیل نشده است.' };
  if (state.resources.data < node.costData) return { ok: false, reason: 'دادهٔ پژوهشی کافی نیست.' };
  if (state.resources.samples < node.costSamples) return { ok: false, reason: 'نمونهٔ زیستی کافی نیست.' };

  state.resources.data -= node.costData;
  state.resources.samples -= node.costSamples;
  state.research.activeNodeId = node.id;
  state.research.progress = 0;
  state.incidentLog.push({
    minute: state.minute,
    text: `پژوهش «${node.label}» آغاز شد.`,
    severity: 'info',
  });
  return { ok: true };
}

export function cancelResearch(state: GameState): void {
  state.research.activeNodeId = null;
  state.research.progress = 0;
}

export function stepResearch(state: GameState): void {
  const activeId = state.research.activeNodeId;
  if (!activeId) return;
  const node = nodeById(activeId);
  if (!node) {
    cancelResearch(state);
    return;
  }
  if (state.research.progress < 100) return;

  state.research.completed.push(node.id);
  state.research.activeNodeId = null;
  state.research.progress = 0;
  state.incidentLog.push({
    minute: state.minute,
    text: `پژوهش «${node.label}» تکمیل شد. ${node.unlocks}`,
    severity: 'info',
  });

  if (node.id === 'smart-grid') {
    state.power.roomPriority = {
      command: 1,
      life: 1,
      reactor: 1,
      corridor: 2,
      medbay: 2,
      quarters: 4,
      biolab: 3,
      geolab: 3,
      storage: 4,
      rov: 4,
    };
  }
}
