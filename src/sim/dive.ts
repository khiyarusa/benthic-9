import type { GameState } from './types';
import type { DiveResult } from '../game/dive/DiveScene';

/**
 * Applies a finished manual dive to the station simulation.
 *
 * Everything the player collected or damaged is written to the same state the
 * management screens read, so a dive is never a separate "minigame score".
 */
export function applyDiveResult(state: GameState, result: DiveResult): { samples: number; data: number; discoveries: number } {
  const samples = Math.max(0, Math.round(result.samples));
  const data = Math.max(0, Math.round(result.data));

  state.resources.samples += samples;
  state.resources.data += data;
  state.stats.expeditions += 1;

  state.rov.deployed = false;
  state.rov.depthM = Math.max(state.rov.depthM, result.depthM);
  state.rov.samplesFound += samples;
  state.rov.dataFound += data;
  state.rov.hull = Math.max(0, Math.min(100, state.rov.hull - Math.max(0, result.hullDamage)));
  state.rov.batteryPct = Math.max(0, Math.min(100, state.rov.batteryPct - Math.max(0, result.batteryUsed)));
  state.rov.missionMinutesLeft = 0;

  const locked: string[] = [];
  for (const id of result.discoveries) {
    // scans share one codex entry; clues keep one flag each
    const key = id.startsWith('scan-') ? `codex.${id}` : `codex.${id}`;
    if (!state.flags[key]) {
      state.flags[key] = true;
      locked.push(id);
    }
  }

  state.rov.lastMissionResult = `شیرجه در ${result.depthM} متر — ${samples} نمونه، ${data} داده، ${locked.length} کشف تازه.`;
  state.incidentLog.push({
    minute: state.minute,
    text: state.rov.lastMissionResult,
    severity: locked.length > 0 ? 'info' : 'info',
  });

  if (state.rov.hull < 25) {
    state.incidentLog.push({
      minute: state.minute,
      text: 'بدنهٔ ROV آسیب جدی دیده؛ تا تعمیر، شیرجه ممکن نیست.',
      severity: 'warning',
    });
  }

  return { samples, data, discoveries: locked.length };
}
