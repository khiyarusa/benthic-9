import { useState } from 'react';
import type { Equipment, RoomId } from '../../sim/types';
import { faPercent } from '../../sim';
import { sim } from '../../state/store';
import { Sheet } from '../components/Sheet';

/**
 * Clickable equipment markers laid over the room render. This is the bridge
 * between "a picture of a room" and "a room you can operate".
 */
const KIND_LABEL: Record<string, string> = {
  reactor: 'رآکتور',
  o2: 'تولید اکسیژن',
  scrubber: 'هواساز',
  pump: 'پمپ',
  coolant: 'خنک‌کاری',
  heater: 'گرمایش',
  fabricator: 'کارگاه ساخت',
  console: 'کنسول',
  lab: 'تجهیز آزمایشگاه',
  medbay: 'تجهیز درمانگاه',
  sonar: 'سونار',
  dock: 'قفل خروج',
  winch: 'وینچ کابل',
};

function positionFor(index: number, total: number): { left: number; top: number } {
  // fixed slots, never hash-based: two machines must not land on one pixel
  const columns = Math.min(4, Math.max(1, total));
  const row = Math.floor(index / columns);
  const column = index % columns;
  const left = 13 + (column * 74) / Math.max(1, columns - 1 || 1);
  const top = 52 + row * 15;
  return { left, top };
}

export function EquipmentHotspots({ roomId, units }: { roomId: RoomId; units: Equipment[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const unit = units.find((entry) => entry.id === open) ?? null;

  return (
    <>
      <div className="hotspots" aria-label={`تجهیزات ${roomId}`}>
        {units.map((entry, index) => {
          const pos = positionFor(index, units.length);
          const bad = entry.tripped || entry.health < 55;
          return (
            <button
              key={entry.id}
              type="button"
              className={`hotspot ${bad ? 'is-warn' : ''} ${entry.running ? '' : 'is-off'}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              onClick={() => setOpen(entry.id)}
              title={entry.label}
            >
              <span className="hotspot__dot" />
              <span className="hotspot__label">
                {entry.label}
                <small>{faPercent(entry.health)}</small>
              </span>
            </button>
          );
        })}
      </div>

      {unit ? (
        <Sheet title={unit.label} onClose={() => setOpen(null)}>
          <div className="equip-card">
            <div className="equip-card__row">
              <span>وضعیت</span>
              <strong className={unit.running ? 'is-good' : 'is-warn'}>
                {unit.tripped ? 'قطع اضطراری' : unit.running ? 'در کار' : 'خاموش'}
              </strong>
            </div>
            <div className="equip-card__row">
              <span>سلامت</span>
              <strong>{faPercent(unit.health)}</strong>
            </div>
            <div className="equip-card__row">
              <span>نوع</span>
              <strong>{KIND_LABEL[unit.kind] ?? unit.kind}</strong>
            </div>
            <p className="hint">
              {unit.running
                ? 'این دستگاه اکنون در حال کار است. خاموش‌کردنش فشار را از شبکه برمی‌دارد اما کارکردش را متوقف می‌کند.'
                : 'دستگاه خاموش است. تا روشنش نکنی، وظیفه‌اش انجام نمی‌شود.'}
            </p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                sim.toggleEquipment(unit.id);
              }}
            >
              {unit.running ? 'خاموش کردن' : 'روشن کردن'}
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
