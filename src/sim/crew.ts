import { ROOM_LABEL, externalPressureMPa, roomDef } from './content';
import { clamp, mods, unitFactor } from './power';
import type { CrewMember, CrewTask, GameState, RoomId } from './types';

const HOP_MINUTES = 5;

const RESEARCH_ROOM: Record<string, RoomId> = {
  alloy: 'geolab',
  'auto-weld': 'geolab',
  'modular-reactor': 'reactor',
  'smart-grid': 'reactor',
  electrolysis: 'life',
  'carbon-scrubber': 'life',
  'sonar-array': 'rov',
  'robotic-arm': 'rov',
  bioluminescence: 'biolab',
};

export function travelMinutes(from: RoomId | null, to: RoomId): number {
  if (from === to) return 0;
  if (!from) return HOP_MINUTES;
  if (from === 'corridor' || to === 'corridor') return HOP_MINUTES;
  return HOP_MINUTES * 2;
}

function moveCrew(member: CrewMember, destination: RoomId): void {
  if (member.room === destination && !member.travelTo) return;
  const minutes = travelMinutes(member.room, destination);
  if (minutes === 0) {
    member.travelTo = null;
    member.travelRemaining = 0;
    return;
  }
  member.travelTo = destination;
  member.travelRemaining = minutes;
  member.room = null;
}

function rebuildOccupancy(state: GameState): void {
  for (const room of Object.values(state.rooms)) room.occupiedBy = [];
  for (const member of state.crew) {
    if (member.alive && member.room) state.rooms[member.room].occupiedBy.push(member.id);
  }
}

function claimedEquipment(state: GameState, exceptId: string): Set<string> {
  const claimed = new Set<string>();
  for (const member of state.crew) {
    if (member.id === exceptId) continue;
    if (member.task.kind === 'repair') claimed.add(member.task.equipmentId);
  }
  return claimed;
}

function taskKey(task: CrewTask): string {
  switch (task.kind) {
    case 'repair':
      return `repair:${task.equipmentId}`;
    case 'seal':
      return `seal:${task.room}`;
    case 'weld':
      return `weld:${task.room}`;
    case 'pump':
      return `pump:${task.room}`;
    case 'research':
      return `research:${task.nodeId}`;
    default:
      return task.kind;
  }
}

function chooseTask(state: GameState, member: CrewMember): CrewTask {
  const claimed = claimedEquipment(state, member.id);

  const breaches = Object.values(state.rooms)
    .filter((room) => room.breached)
    .filter((room) => !state.crew.some((c) => c.id !== member.id && c.task.kind === 'seal' && c.task.room === room.id))
    .sort((a, b) => b.water + b.breachSize * 40 - (a.water + a.breachSize * 40));
  if (breaches.length > 0 && member.skills.engineering >= 2) {
    return { kind: 'seal', room: breaches[0]!.id, progress: 0 };
  }

  const damaged = Object.values(state.equipment)
    .filter((unit) => (unit.health < 55 || unit.tripped) && !claimed.has(unit.id))
    .sort((a, b) => Number(b.critical) - Number(a.critical) || a.health - b.health);
  if (damaged.length > 0 && member.skills.engineering >= 2) {
    return { kind: 'repair', equipmentId: damaged[0]!.id, progress: 0 };
  }

  const flooded = Object.values(state.rooms)
    .filter((room) => room.water > 6)
    .filter((room) => !state.crew.some((c) => c.id !== member.id && c.task.kind === 'pump' && c.task.room === room.id))
    .sort((a, b) => b.water - a.water);
  if (flooded.length > 0) {
    return { kind: 'pump', room: flooded[0]!.id };
  }

  const weakest = Object.values(state.rooms)
    .filter((room) => !room.breached && room.hull < 70)
    .filter((room) => !state.crew.some((c) => c.id !== member.id && c.task.kind === 'weld' && c.task.room === room.id))
    .sort((a, b) => a.hull - b.hull);
  if (weakest.length > 0 && member.skills.engineering >= 2 && state.resources.partsKg >= 3) {
    return { kind: 'weld', room: weakest[0]!.id, progress: 0 };
  }

  if (state.research.activeNodeId && member.energy > 25) {
    return { kind: 'research', nodeId: state.research.activeNodeId };
  }

  if (member.energy < 45) return { kind: 'rest' };
  return { kind: 'idle' };
}

function taskRoom(state: GameState, task: CrewTask): RoomId | null {
  switch (task.kind) {
    case 'repair': {
      const unit = state.equipment[task.equipmentId];
      return unit ? unit.room : null;
    }
    case 'pump':
    case 'seal':
      return task.room;
    case 'weld':
      return task.room;
    case 'research':
      return RESEARCH_ROOM[state.research.activeNodeId ?? ''] ?? 'geolab';
    case 'rest':
      return 'quarters';
    default:
      return null;
  }
}

export interface CrewFrame {
  working: number;
  repairing: number;
  sealing: number;
  pumping: number;
  researching: number;
}

export function stepCrew(state: GameState, dtMin: number, roomFactor: Record<RoomId, number>): CrewFrame {
  const m = mods(state);
  const frame: CrewFrame = { working: 0, repairing: 0, sealing: 0, pumping: 0, researching: 0 };

  rebuildOccupancy(state);

  for (const member of state.crew) {
    if (!member.alive) continue;

    if (member.travelTo) {
      member.travelRemaining -= dtMin;
      if (member.travelRemaining <= 0) {
        member.room = member.travelTo;
        member.travelTo = null;
        member.travelRemaining = 0;
      } else {
        member.energy = clamp(member.energy - 0.02 * dtMin, 0, 100);
        continue;
      }
    }

    if (!member.room) continue;

    if (member.autoTask) {
      const next = chooseTask(state, member);
      // Re-planning must not wipe progress: only replace the task when the target changed.
      if (taskKey(next) !== taskKey(member.task)) member.task = next;
    }

    const requiredRoom = taskRoom(state, member.task);
    if (requiredRoom && requiredRoom !== member.room) {
      moveCrew(member, requiredRoom);
      continue;
    }

    const skillFactor = 0.5 + member.energy / 200;
    const engineering = member.skills.engineering;

    switch (member.task.kind) {
      case 'repair': {
        const unit = state.equipment[member.task.equipmentId];
        if (!unit || unit.health >= 100) {
          member.task = { kind: 'idle' };
          break;
        }
        frame.repairing += 1;
        const speed = (2.4 + engineering * 1.15) * skillFactor * (m.autoWeld ? 1.5 : 1);
        member.task.progress = clamp(member.task.progress + speed * dtMin, 0, 100);
        if (member.task.progress >= 100) {
          if (state.resources.partsKg >= unit.repairParts) {
            state.resources.partsKg -= unit.repairParts;
            unit.health = 100;
            unit.tripped = false;
            unit.running = true;
            state.stats.repairs += 1;
            state.incidentLog.push({
              minute: state.minute,
              text: `${member.name} تجهیز «${unit.label}» را ترمیم کرد.`,
              severity: 'info',
            });
            member.task = { kind: 'idle' };
            member.energy = clamp(member.energy - 4, 0, 100);
          } else {
            member.task.progress = 85;
            if (!state.flags['parts-shortage']) {
              state.flags['parts-shortage'] = true;
              state.incidentLog.push({
                minute: state.minute,
                text: 'قطعات یدکی برای تکمیل تعمیر کافی نیست. کارگاه ساخت را فعال کن.',
                severity: 'warning',
              });
            }
          }
        }
        break;
      }
      case 'seal': {
        const target = state.rooms[member.task.room];
        frame.sealing += 1;
        const speed = (2.0 + engineering * 0.9) * skillFactor;
        member.task.progress = clamp(member.task.progress + speed * dtMin, 0, 100);
        if (member.task.progress >= 100) {
          target.breached = false;
          target.breachSize = 0;
          target.hull = clamp(target.hull + 18, 0, 100);
          state.stats.incidentsResolved += 1;
          state.incidentLog.push({
            minute: state.minute,
            text: `${member.name} ترک بدنهٔ «${ROOM_LABEL[target.id]}» را مهار کرد.`,
            severity: 'info',
          });
          member.task = { kind: 'idle' };
        }
        break;
      }
      case 'pump': {
        const target = state.rooms[member.task.room];
        frame.pumping += 1;
        const removed = 0.85 * skillFactor * dtMin;
        target.water = clamp(target.water - removed, 0, 100);
        if (target.water <= 1) member.task = { kind: 'idle' };
        break;
      }
      case 'weld': {
        const target = state.rooms[member.task.room];
        frame.repairing += 1;
        const speed = (1.5 + engineering * 0.7) * skillFactor * (m.autoWeld ? 1.5 : 1);
        member.task.progress = clamp(member.task.progress + speed * dtMin, 0, 100);
        if (member.task.progress >= 100) {
          if (state.resources.partsKg >= 3) {
            state.resources.partsKg -= 3;
            target.hull = clamp(target.hull + 22, 0, 100);
            state.stats.repairs += 1;
            state.incidentLog.push({
              minute: state.minute,
              text: `${member.name} بدنهٔ «${ROOM_LABEL[target.id]}» را تقویت کرد.`,
              severity: 'info',
            });
            member.task = { kind: 'idle' };
            member.energy = clamp(member.energy - 3, 0, 100);
          } else {
            member.task.progress = 85;
          }
        }
        break;
      }
      case 'research': {
        frame.researching += 1;
        const biology = member.skills.biology;
        const geology = member.skills.geology;
        const rate = 0.4 + Math.max(biology, geology) * 0.22;
        state.research.progress = clamp(state.research.progress + rate * dtMin, 0, 100);
        break;
      }
      case 'rest': {
        const restRoom = member.room === 'quarters';
        member.energy = clamp(member.energy + (restRoom ? 0.7 : 0.2) * dtMin, 0, 100);
        member.stress = clamp(member.stress - (restRoom ? 0.28 : 0.08) * dtMin, 0, 100);
        if (member.energy > 92) member.task = { kind: 'idle' };
        break;
      }
      default:
        break;
    }

    // Needs.
    member.energy = clamp(member.energy - 0.05 * dtMin, 0, 100);
    const stressRate = state.power.brownout ? 0.075 : 0.028;
    member.stress = clamp(member.stress + stressRate * dtMin, 0, 100);

    if (state.resources.foodKg > 0) state.resources.foodKg = Math.max(0, state.resources.foodKg - 0.008 * dtMin);
    else member.health = clamp(member.health - 0.06 * dtMin, 0, 100);

    if (state.resources.waterL > 0) state.resources.waterL = Math.max(0, state.resources.waterL - 0.02 * dtMin);
    else member.health = clamp(member.health - 0.08 * dtMin, 0, 100);

    const medbay = state.equipment['med-station'];
    const medFactor = medbay ? unitFactor(state, roomFactor, medbay) : 0;
    if (member.room === 'medbay' && medFactor > 0.3) {
      member.health = clamp(member.health + 0.16 * medFactor * dtMin, 0, 100);
    } else if (member.health < 40) {
      member.health = clamp(member.health + 0.02 * dtMin, 0, 100);
    }

    if (member.stress > 88) member.health = clamp(member.health - 0.03 * dtMin, 0, 100);
  }

  // Deaths are resolved for everyone, including crew who spent the tick in transit.
  for (const member of state.crew) {
    if (member.alive && member.health <= 0) {
      member.health = 0;
      member.alive = false;
      member.room = null;
      member.travelTo = null;
      state.incidentLog.push({
        minute: state.minute,
        text: `${member.name} جان خود را در ایستگاه از دست داد.`,
        severity: 'critical',
      });
    }
  }

  rebuildOccupancy(state);

  return frame;
}

export function pressureAt(state: GameState): number {
  return externalPressureMPa(state.depthM);
}

export function roomCondition(state: GameState, room: RoomId): 'nominal' | 'degraded' | 'critical' {
  const target = state.rooms[room];
  if (target.breached || target.water > 35 || target.hull < 45) return 'critical';
  if (target.water > 5 || target.hull < 75 || target.o2 < 18 || target.tempC > 30) return 'degraded';
  return 'nominal';
}

export function roomDefSafe(room: RoomId) {
  return roomDef(room);
}
