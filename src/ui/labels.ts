import { ROOM_LABEL } from '../sim/content';
import { nodeById } from '../sim/research';
import type { CrewMember, Equipment, GameState } from '../sim/types';

export function describeTask(state: GameState, member: CrewMember): string {
  if (!member.alive) return 'از دست رفته';
  const task = member.task;
  const travel = member.travelTo ? ` (در مسیر ${ROOM_LABEL[member.travelTo]})` : '';
  switch (task.kind) {
    case 'repair': {
      const unit = state.equipment[task.equipmentId];
      return `${member.travelTo ? 'در مسیر' : 'در حال'} تعمیر «${unit?.label ?? 'تجهیز'}»${travel}`;
    }
    case 'seal':
      return `${member.travelTo ? 'در مسیر' : 'در حال'} مهار ترک «${ROOM_LABEL[task.room]}»${travel}`;
    case 'pump':
      return `${member.travelTo ? 'در مسیر' : 'در حال'} تخلیهٔ آب «${ROOM_LABEL[task.room]}»${travel}`;
    case 'research': {
      const node = nodeById(task.nodeId);
      return `${member.travelTo ? 'در مسیر' : 'در حال'} پژوهش «${node?.label ?? '—'}»${travel}`;
    }
    case 'rest':
      return `${member.travelTo ? 'در مسیر اقامتگاه' : 'در حال استراحت'}${travel}`;
    default:
      return member.travelTo ? `در مسیر ${ROOM_LABEL[member.travelTo]}` : 'آماده‌به‌کار';
  }
}

export function equipmentCondition(unit: Equipment): { label: string; tone: 'good' | 'warn' | 'danger' } {
  if (unit.tripped || unit.health <= 15) return { label: 'از کار افتاده', tone: 'danger' };
  if (unit.health < 55) return { label: 'نیازمند تعمیر', tone: 'warn' };
  if (!unit.running) return { label: 'خاموش', tone: 'warn' };
  return { label: 'سالم', tone: 'good' };
}

export function roomOccupants(state: GameState, roomId: keyof typeof ROOM_LABEL): string {
  const names = state.crew.filter((member) => member.alive && member.room === roomId).map((member) => member.name);
  return names.length > 0 ? names.join('، ') : 'کسی حاضر نیست';
}
