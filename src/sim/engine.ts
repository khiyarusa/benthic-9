import { ROOM_LABEL } from './content';
import { createInitialState } from './state';
import { stepCrew } from './crew';
import { stepHull } from './hull';
import { stepIncidents } from './incidents';
import { stepLifeSupport } from './lifeSupport';
import { cancelResearch, startResearch, stepResearch } from './research';
import { stepObjectives } from './objectives';
import { dispatchPower } from './power';
import { deployRov, recallRov, repairRov, stepRov } from './rov';
import { stepThermal } from './thermal';
import type { CrewTask, GameMode, GameState, RoomId, Speed } from './types';

const SECONDS_PER_GAME_MINUTE = 1;
const MAX_TICKS_PER_ADVANCE = 12;

export class BenthicSimulationCore {
  state: GameState;
  private listeners = new Set<(state: GameState) => void>();
  private accumulator = 0;

  constructor(state?: GameState) {
    this.state = state ?? createInitialState();
  }

  static newGame(mode: GameMode = 'campaign', seed?: number): BenthicSimulationCore {
    return new BenthicSimulationCore(createInitialState(mode, seed));
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }

  replaceState(next: GameState): void {
    this.state = next;
    this.accumulator = 0;
    this.emit();
  }

  start(): void {
    this.state.paused = false;
    if (this.state.speed === 0) this.state.speed = 1;
    this.emit();
  }

  setPaused(paused: boolean): void {
    this.state.paused = paused;
    this.emit();
  }

  togglePause(): void {
    this.setPaused(!this.state.paused);
  }

  setSpeed(speed: Speed): void {
    this.state.speed = speed;
    if (speed === 0) this.state.paused = true;
    this.emit();
  }

  /** Called from the host loop with real elapsed seconds. */
  advance(realSeconds: number): void {
    const state = this.state;
    if (state.gameOver || state.paused || state.speed === 0) return;
    if (realSeconds <= 0) return;

    this.accumulator += Math.min(realSeconds, 2) * state.speed;
    let ticks = 0;
    while (this.accumulator >= SECONDS_PER_GAME_MINUTE && ticks < MAX_TICKS_PER_ADVANCE) {
      this.accumulator -= SECONDS_PER_GAME_MINUTE;
      this.tick(1);
      ticks += 1;
      if (state.gameOver) break;
    }
    if (ticks > 0) this.emit();
  }

  tick(dtMin: number): void {
    const state = this.state;
    if (state.gameOver) return;

    state.minute += dtMin;
    const frame = dispatchPower(state, dtMin);
    stepLifeSupport(state, dtMin, frame.roomFactor);
    stepThermal(state, dtMin, frame.roomFactor);
    stepHull(state, dtMin, frame.roomFactor);
    stepCrew(state, dtMin, frame.roomFactor);
    stepResearch(state);
    stepRov(state, dtMin, frame.roomFactor);
    stepIncidents(state, dtMin);
    stepObjectives(state);
    this.checkFailure();

    if (state.incidentLog.length > 80) state.incidentLog.length = 80;
  }

  private checkFailure(): void {
    const state = this.state;
    if (state.crew.every((member) => !member.alive)) {
      state.gameOver = true;
      state.gameOverReason = 'تمام خدمهٔ ایستگاه از دست رفتند.';
      state.paused = true;
      state.incidentLog.unshift({
        minute: state.minute,
        text: 'تمام خدمه از دست رفتند. ایستگاه خاموش شد.',
        severity: 'critical',
      });
      return;
    }
    const integrity = state.hullIntegrity ?? 100;
    if (integrity < 5) {
      state.gameOver = true;
      state.gameOverReason = 'یکپارچگی سازهٔ ایستگاه از حد بحرانی گذشت.';
      state.paused = true;
      state.incidentLog.unshift({
        minute: state.minute,
        text: 'سازهٔ ایستگاه فروپاشید.',
        severity: 'critical',
      });
    }
  }

  // ----- player commands -------------------------------------------------

  setRoomSealed(room: RoomId, sealed: boolean): void {
    this.state.rooms[room].sealed = sealed;
    this.emit();
  }

  toggleLights(room: RoomId): void {
    this.state.rooms[room].lightsOn = !this.state.rooms[room].lightsOn;
    this.emit();
  }

  toggleVent(room: RoomId): void {
    this.state.rooms[room].ventOpen = !this.state.rooms[room].ventOpen;
    this.emit();
  }

  setPriority(room: RoomId, priority: number): void {
    this.state.power.roomPriority[room] = Math.min(5, Math.max(1, Math.round(priority)));
    this.emit();
  }

  setReactorThrottle(throttle: number): void {
    this.state.power.reactorThrottle = Math.min(1, Math.max(0, throttle));
    this.emit();
  }

  restartReactor(): { ok: boolean; reason?: string } {
    const reactor = this.state.equipment['reactor-1'];
    if (!reactor.tripped) return { ok: false, reason: 'رآکتور در حالت عادی است.' };
    if (reactor.health < 20) return { ok: false, reason: 'رآکتور آسیب جدی دیده و باید ترمیم شود.' };
    if (this.state.rooms.reactor.tempC > 68) return { ok: false, reason: 'دمای رآکتور برای راه‌اندازی زیاد است.' };
    reactor.tripped = false;
    reactor.running = true;
    this.state.incidentLog.unshift({
      minute: this.state.minute,
      text: 'رآکتور دوباره راه‌اندازی شد.',
      severity: 'info',
    });
    this.emit();
    return { ok: true };
  }

  toggleEquipment(id: string): void {
    const unit = this.state.equipment[id];
    if (!unit) return;
    if (unit.tripped) return;
    unit.running = !unit.running;
    this.emit();
  }

  setElectrolysis(enabled: boolean): void {
    this.state.life.electrolysisEnabled = enabled;
    this.emit();
  }

  assignTask(crewId: string, task: CrewTask): void {
    const member = this.state.crew.find((entry) => entry.id === crewId);
    if (!member || !member.alive) return;
    member.autoTask = false;
    member.task = task;
    if (task.kind === 'idle' || task.kind === 'rest') member.autoTask = true;
    this.emit();
  }

  setAutoTask(crewId: string, auto: boolean): void {
    const member = this.state.crew.find((entry) => entry.id === crewId);
    if (!member) return;
    member.autoTask = auto;
    if (auto) member.task = { kind: 'idle' };
    this.emit();
  }

  startResearch(nodeId: string): { ok: boolean; reason?: string } {
    const result = startResearch(this.state, nodeId);
    this.emit();
    return result;
  }

  cancelResearch(): void {
    cancelResearch(this.state);
    this.emit();
  }

  deployRov(depth: number): { ok: boolean; reason?: string } {
    const result = deployRov(this.state, depth);
    this.emit();
    return result;
  }

  recallRov(): void {
    recallRov(this.state);
    this.emit();
  }

  repairRov(): { ok: boolean; reason?: string } {
    const result = repairRov(this.state);
    this.emit();
    return result;
  }

  craftParts(): { ok: boolean; reason?: string } {
    const fabricator = this.state.equipment['fabricator-1'];
    if (!fabricator || fabricator.tripped || fabricator.health < 15) {
      return { ok: false, reason: 'کارگاه ساخت از کار افتاده است.' };
    }
    if (this.state.resources.scrapKg < 6) return { ok: false, reason: 'قراضهٔ کافی برای ساخت قطعه نیست.' };
    this.state.resources.scrapKg -= 6;
    this.state.resources.partsKg += 2;
    this.state.incidentLog.unshift({
      minute: this.state.minute,
      text: 'کارگاه ساخت ۲ کیلوگرم قطعهٔ یدکی تولید کرد.',
      severity: 'info',
    });
    this.emit();
    return { ok: true };
  }

  refillCoolant(): { ok: boolean; reason?: string } {
    if (this.state.resources.waterL < 120) return { ok: false, reason: 'آب کافی برای پر کردن مدار خنک‌کننده نیست.' };
    this.state.resources.waterL -= 120;
    this.state.thermal.coolantPct = 100;
    this.emit();
    return { ok: true };
  }

  /** Manual bulkhead isolation used by the flood-response flow. */
  isolateRoom(room: RoomId): void {
    this.setRoomSealed(room, true);
    this.state.incidentLog.unshift({
      minute: this.state.minute,
      text: `دریچهٔ «${ROOM_LABEL[room]}» بسته شد.`,
      severity: 'info',
    });
  }
}

export function createCore(mode: GameMode = 'campaign', seed?: number): BenthicSimulationCore {
  return BenthicSimulationCore.newGame(mode, seed);
}
