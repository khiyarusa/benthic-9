import { clamp, mods, unitFactor } from './power';
import { Rng } from './rng';
import type { GameState, RoomId } from './types';

export function rovDepthLimit(state: GameState): number {
  return mods(state).sonarArray ? 7000 : 5200;
}

export function canDeployRov(state: GameState, depth: number): { ok: boolean; reason?: string } {
  if (state.rov.deployed) return { ok: false, reason: 'ROV هم‌اکنون در مأموریت است.' };
  const dock = state.equipment['rov-dock'];
  if (!dock || dock.health < 35) return { ok: false, reason: 'قفل خروج آسیب جدی دیده است.' };
  if (dock.tripped) return { ok: false, reason: 'قفل خروج در حالت قطع اضطراری است.' };
  if (state.rov.hull < 25) return { ok: false, reason: 'بدنهٔ ROV نیاز به تعمیر دارد.' };
  if (state.rov.batteryPct < 20) return { ok: false, reason: 'شارژ باتری ROV کافی نیست.' };
  if (state.rooms.rov.water > 30) return { ok: false, reason: 'محفظهٔ خروج آب‌گرفته است.' };
  if (depth > rovDepthLimit(state)) return { ok: false, reason: 'عمق درخواستی فراتر از برد سونار است.' };
  if (depth < 1000) return { ok: false, reason: 'عمق مأموریت نامعتبر است.' };
  return { ok: true };
}

export function deployRov(state: GameState, depth: number): { ok: boolean; reason?: string } {
  const check = canDeployRov(state, depth);
  if (!check.ok) return check;

  const missionMinutes = Math.round(depth / 190);
  state.rov.deployed = true;
  state.rov.targetDepthM = depth;
  state.rov.depthM = 0;
  state.rov.missionMinutesLeft = missionMinutes;
  state.rov.samplesFound = 0;
  state.rov.dataFound = 0;
  state.rov.lastMissionResult = `مأموریت تا عمق ${depth} متر آغاز شد.`;
  state.incidentLog.push({
    minute: state.minute,
    text: `ROV به سمت عمق ${depth} متر رها شد. مدت تخمینی: ${missionMinutes} دقیقه.`,
    severity: 'info',
  });
  return { ok: true };
}

export function recallRov(state: GameState): void {
  if (!state.rov.deployed) return;
  state.rov.missionMinutesLeft = Math.min(state.rov.missionMinutesLeft, 4);
  state.rov.lastMissionResult = 'فرمان بازگشت فوری صادر شد.';
}

export function repairRov(state: GameState): { ok: boolean; reason?: string } {
  const cost = 8;
  if (state.resources.partsKg < cost) return { ok: false, reason: 'برای تعمیر بدنهٔ ROV به ۸ کیلوگرم قطعه نیاز است.' };
  if (state.rov.hull > 92) return { ok: false, reason: 'بدنهٔ ROV سالم است.' };
  state.resources.partsKg -= cost;
  state.rov.hull = 100;
  state.rov.batteryPct = Math.max(state.rov.batteryPct, 60);
  return { ok: true };
}

export function stepRov(state: GameState, dtMin: number, roomFactor: Record<RoomId, number>): void {
  const dock = state.equipment['rov-dock'];
  const dockFactor = dock ? unitFactor(state, roomFactor, dock) : 0;

  if (!state.rov.deployed) {
    if (dockFactor > 0.4 && state.rov.batteryPct < 100) {
      state.rov.batteryPct = clamp(state.rov.batteryPct + 0.55 * dockFactor * dtMin, 0, 100);
    }
    state.rov.depthM = 0;
    return;
  }

  state.rov.missionMinutesLeft -= dtMin;
  const totalMinutes = Math.max(1, state.rov.targetDepthM / 190);
  state.rov.batteryPct = clamp(state.rov.batteryPct - (100 / (totalMinutes * 1.35)) * dtMin, 0, 100);

  const progress = 1 - clamp(state.rov.missionMinutesLeft / totalMinutes, 0, 1);
  state.rov.depthM = Math.round(state.rov.targetDepthM * Math.min(1, progress * 1.15));

  if (state.rov.batteryPct <= 0.5) {
    state.rov.deployed = false;
    state.rov.hull = 0;
    state.rov.lastMissionResult = 'باتری در عمق تمام شد؛ ROV از دست رفت.';
    state.incidentLog.push({
      minute: state.minute,
      text: 'باتری ROV در عمق تمام شد و ارتباط قطع گردید.',
      severity: 'critical',
    });
    return;
  }

  if (state.rov.missionMinutesLeft > 0) return;

  const rng = new Rng(state.rngState);
  const m = mods(state);
  const baseSamples = 1 + (m.roboticArm ? 1 : 0) + (rng.chance(0.35) ? 1 : 0);
  const dataGain = Math.round(10 + state.rov.targetDepthM / 520 + (m.sonarArray ? 6 : 0));
  const hullDamage = clamp((state.rov.targetDepthM - 4800) / 260, 2, 30) + rng.range(0, 9);

  state.resources.samples += baseSamples;
  state.resources.data += dataGain;
  state.rov.hull = clamp(state.rov.hull - hullDamage, 0, 100);
  state.rov.deployed = false;
  state.rov.depthM = 0;
  state.rov.missionMinutesLeft = 0;
  state.rov.samplesFound = baseSamples;
  state.rov.dataFound = dataGain;
  state.rov.lastMissionResult = `بازگشت موفق: ${baseSamples} نمونه و ${dataGain} دادهٔ پژوهشی. آسیب بدنه: ${Math.round(hullDamage)}٪`;
  state.stats.expeditions += 1;
  state.rngState = rng.state;

  for (const member of state.crew) {
    if (member.alive) member.stress = clamp(member.stress - 3, 0, 100);
  }

  state.incidentLog.push({
    minute: state.minute,
    text: `ROV بازگشت: ${baseSamples} نمونه، ${dataGain} داده.`,
    severity: 'info',
  });
}
