import { INCIDENTS, ROOM_LABEL } from './content';
import { breachRoom } from './hull';
import { clamp } from './power';
import { Rng } from './rng';
import type { GameState, IncidentRecord, RoomId } from './types';

function pushIncident(
  state: GameState,
  entry: IncidentRecord,
  text: string,
): void {
  state.incidents.unshift(entry);
  if (state.incidents.length > 40) state.incidents.pop();
  state.incidentLog.unshift({ minute: state.minute, text, severity: entry.severity });
  if (state.incidentLog.length > 120) state.incidentLog.pop();
}

const PREFERRED_ROOMS: RoomId[] = ['corridor', 'reactor', 'life', 'storage', 'biolab', 'geolab', 'medbay', 'quarters', 'rov'];

export function incidentChance(state: GameState): number {
  const modeFactor = state.mode === 'endless' ? 1.7 : state.mode === 'challenge' ? 1.25 : 1;
  const escalation = Math.min(0.0035, state.minute / 320000);
  return (0.0022 + escalation) * modeFactor;
}

export function stepIncidents(state: GameState, dtMin: number): IncidentRecord[] {
  const rng = new Rng(state.rngState);
  const fired: IncidentRecord[] = [];

  const chance = incidentChance(state) * dtMin;
  if (!rng.chance(chance)) {
    state.rngState = rng.state;
    return fired;
  }

  const eligible = INCIDENTS.filter((incident) => state.minute >= incident.minMinute);
  if (eligible.length === 0) {
    state.rngState = rng.state;
    return fired;
  }

  const chosen = rng.weighted(eligible.map((incident) => ({ item: incident, weight: incident.weight })));
  const record: IncidentRecord = {
    minute: state.minute,
    title: chosen.title,
    severity: chosen.severity,
  };
  let text = chosen.title;

  switch (chosen.id) {
    case 'hull-crack': {
      const room = rng.pick(PREFERRED_ROOMS);
      breachRoom(state, room, rng.range(0.35, 0.8));
      record.room = room;
      text = `ترک در بدنهٔ «${ROOM_LABEL[room]}»؛ آب وارد می‌شود.`;
      break;
    }
    case 'pump-failure': {
      const pumps = Object.values(state.equipment).filter((unit) => unit.kind === 'pump');
      const pump = rng.pick(pumps);
      pump.health = clamp(pump.health - rng.range(35, 60), 0, 100);
      pump.tripped = true;
      pump.running = false;
      record.room = pump.room;
      text = `پمپ «${pump.label}» از کار افتاد.`;
      break;
    }
    case 'power-surge': {
      const reactor = state.equipment['reactor-1'];
      reactor.tripped = true;
      reactor.running = false;
      reactor.health = clamp(reactor.health - 8, 0, 100);
      state.power.batteryKWh = Math.max(0, state.power.batteryKWh - 12);
      record.room = 'reactor';
      text = 'نوسان شبکه، رآکتور را به‌صورت ایمن قطع کرد. راه‌اندازی مجدد لازم است.';
      break;
    }
    case 'o2-leak': {
      const lost = Math.min(state.resources.oxygenKg, rng.range(25, 55));
      state.resources.oxygenKg -= lost;
      record.room = 'life';
      text = `نشت در مدار اکسیژن؛ ${Math.round(lost)} کیلوگرم ذخیره از دست رفت.`;
      break;
    }
    case 'coolant-fault': {
      const coolants = Object.values(state.equipment).filter((unit) => unit.kind === 'coolant');
      const unit = rng.pick(coolants);
      unit.health = clamp(unit.health - rng.range(20, 38), 0, 100);
      record.room = unit.room;
      text = `افت فشار در «${unit.label}»؛ دمای رآکتور بالا می‌رود.`;
      break;
    }
    case 'crew-injury': {
      const alive = state.crew.filter((member) => member.alive);
      const member = rng.pick(alive);
      member.health = clamp(member.health - rng.range(14, 30), 0, 100);
      member.stress = clamp(member.stress + 18, 0, 100);
      record.room = member.room ?? undefined;
      text = `${member.name} در جریان کار آسیب دید.`;
      break;
    }
    case 'debris-impact': {
      breachRoom(state, 'rov', rng.range(0.5, 1));
      state.rooms.rov.hull = clamp(state.rooms.rov.hull - 10, 0, 100);
      record.room = 'rov';
      text = 'برخورد جسم ناشناس با محفظهٔ خروج؛ بدنه آسیب دید.';
      break;
    }
    case 'comm-ghost': {
      state.flags.ghostSignal = true;
      for (const member of state.crew) {
        if (member.alive) member.stress = clamp(member.stress + 6, 0, 100);
      }
      record.room = 'command';
      text = 'سیگنالی ناشناس از باند عمیق ثبت شد. منبع مشخص نیست.';
      break;
    }
    default:
      break;
  }

  fired.push(record);
  pushIncident(state, record, text);
  state.rngState = rng.state;
  return fired;
}
