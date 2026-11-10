import { CAMPAIGN_OBJECTIVES } from './content';
import type { GameState } from './types';

function progressFor(state: GameState, id: string): number {
  switch (id) {
    case 'repair-one':
      return Math.min(1, state.stats.repairs / 1);
    case 'dry-station':
      return state.rooms.corridor.water <= 5 ? 1 : Math.max(0, 1 - state.rooms.corridor.water / 60);
    case 'first-research':
      return Math.min(1, state.research.completed.length);
    case 'first-expedition':
      return Math.min(1, state.stats.expeditions);
    case 'five-samples':
      return Math.min(1, state.resources.samples / 5);
    case 'survive-1440':
      return Math.min(1, state.minute / 1440);
    default:
      return 0;
  }
}

export function stepObjectives(state: GameState): void {
  if (state.mode !== 'campaign' || state.objectives.length === 0) return;
  for (const objective of state.objectives) {
    const progress = progressFor(state, objective.id);
    objective.progress = progress;
    if (!objective.done && progress >= 1) {
      objective.done = true;
      const def = CAMPAIGN_OBJECTIVES.find((entry) => entry.id === objective.id);
      state.incidentLog.push({
        minute: state.minute,
        text: `هدف محقق شد: ${def?.label ?? objective.id}`,
        severity: 'info',
      });
    }
  }
  if (!state.victory && state.objectives.every((objective) => objective.done)) {
    state.victory = true;
    state.incidentLog.push({
      minute: state.minute,
      text: 'کمپین نخست با موفقیت به پایان رسید؛ ایستگاه پایدار ماند.',
      severity: 'info',
    });
  }
}

export function objectiveLabel(id: string): string {
  return CAMPAIGN_OBJECTIVES.find((entry) => entry.id === id)?.label ?? id;
}
