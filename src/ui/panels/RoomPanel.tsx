import { useState } from 'react';
import { ROOM_LABEL, fa, faPercent, pressureLabel, roomDef } from '../../sim';
import { externalPressureMPa } from '../../sim/content';
import { roomCondition } from '../../sim/crew';
import { describeTask, equipmentCondition } from '../labels';
import { sim, useSim } from '../../state/store';
import { Chip, EmptyNote, MetricBar, Section, StatLine, Toggle } from '../components/ui';
import type { RoomId } from '../../sim/types';

const TABS = [
  { id: 'overview', label: 'نمای کلی' },
  { id: 'equipment', label: 'تجهیزات' },
  { id: 'environment', label: 'شرایط محیطی' },
  { id: 'crew', label: 'کارکنان' },
  { id: 'repairs', label: 'تعمیرات' },
  { id: 'history', label: 'تاریخچه' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CONDITION = {
  nominal: { label: 'عادی', tone: 'good' as const },
  degraded: { label: 'افت عملکرد', tone: 'warn' as const },
  critical: { label: 'بحرانی', tone: 'danger' as const },
};

export function RoomPanel({ roomId }: { roomId: RoomId }) {
  useSim();
  const [tab, setTab] = useState<TabId>('overview');
  const state = sim.state;
  const room = state.rooms[roomId];
  const def = roomDef(roomId);
  const condition = roomCondition(state, roomId);
  const units = Object.values(state.equipment).filter((unit) => unit.room === roomId);
  const factor = state.power.roomFactor[roomId] ?? 1;
  const outages = units.filter((unit) => unit.tripped || unit.health < 55);
  const bestEngineer = [...state.crew]
    .filter((member) => member.alive)
    .sort((a, b) => b.skills.engineering - a.skills.engineering)[0];

  const assignRepair = (equipmentId: string) => {
    if (!bestEngineer) return;
    sim.assignTask(bestEngineer.id, { kind: 'repair', equipmentId, progress: 0 });
  };

  return (
    <div>
      <div className="row row--between" style={{ marginBottom: 8 }}>
        <div className="row" style={{ gap: 6 }}>
          <Chip tone={CONDITION[condition].tone}>{CONDITION[condition].label}</Chip>
          <Chip>{def.category}</Chip>
          {room.breached ? <Chip tone="danger">ترک فعال</Chip> : null}
          {room.sealed ? <Chip tone="warn">دریچه بسته</Chip> : null}
        </div>
        <span className="hint">
          فشار بیرونی: {pressureLabel(externalPressureMPa(state.depthM))} • ظرفیت بدنه:{' '}
          {pressureLabel(def.hullRatingMPa)}
        </span>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={`tab ${tab === entry.id ? 'is-active' : ''}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div>
          <div className="grid-2" style={{ marginTop: 8 }}>
            <div className="card">
              <div className="card__title">سازهٔ بدنه</div>
              <div className={`card__value ${room.hull < 45 ? 'is-danger' : room.hull < 75 ? 'is-warn' : 'is-good'}`}>
                {faPercent(room.hull, 1)}
              </div>
              <MetricBar label="یکپارچگی" value={room.hull} tone={room.hull < 45 ? 'danger' : room.hull < 75 ? 'warn' : 'good'} />
            </div>
            <div className="card">
              <div className="card__title">آب‌گرفتگی</div>
              <div className={`card__value ${room.water > 25 ? 'is-danger' : room.water > 5 ? 'is-warn' : 'is-good'}`}>
                {faPercent(room.water, 1)}
              </div>
              <MetricBar label="سطح آب" value={room.water} tone={room.water > 25 ? 'danger' : room.water > 5 ? 'warn' : 'good'} />
            </div>
          </div>

          <Section title="محیط اتاق">
            <MetricBar label="دما" value={room.tempC} max={50} display={`${fa(room.tempC, 1)}°C`} tone={room.tempC > 30 || room.tempC < 8 ? 'danger' : 'default'} />
            <MetricBar label="اکسیژن" value={room.o2} max={23} display={faPercent(room.o2, 1)} tone={room.o2 < 17 ? 'danger' : room.o2 < 19 ? 'warn' : 'good'} />
            <MetricBar label="دی‌اکسید کربن" value={room.co2} max={6} display={faPercent(room.co2, 2)} tone={room.co2 > 2.2 ? 'danger' : room.co2 > 1 ? 'warn' : 'good'} />
            <MetricBar label="برق اتاق" value={factor * 100} display={faPercent(factor * 100)} tone={factor < 0.7 ? 'warn' : 'good'} />
          </Section>

          <Section title="فرمان‌های اتاق">
            <Toggle
              label="دریچهٔ ضدآب (Seal)"
              hint="اتاق بسته، هوا و آب را با راهرو تبادل نمی‌کند."
              checked={room.sealed}
              onChange={(next) => sim.setRoomSealed(roomId, next)}
            />
            <Toggle label="روشنایی" checked={room.lightsOn} onChange={() => sim.toggleLights(roomId)} />
            <Toggle
              label="تهویه"
              hint="بستن تهویه، تبادل هوا را در اتاق متوقف می‌کند."
              checked={room.ventOpen}
              onChange={() => sim.toggleVent(roomId)}
            />
          </Section>

          <Section title="خلاصه">
            <StatLine label="حجم اتاق" value={`${fa(def.volumeM3)} متر مکعب`} />
            <StatLine label="افراد حاضر" value={room.occupiedBy.length > 0 ? fa(room.occupiedBy.length) : '—'} />
            <StatLine label="تجهیزات مستقر" value={fa(units.length)} />
            <StatLine label="تجهیزات نیازمند رسیدگی" value={outages.length > 0 ? fa(outages.length) : 'ندارد'} />
          </Section>
        </div>
      ) : null}

      {tab === 'equipment' ? (
        <div style={{ marginTop: 8 }}>
          {units.length === 0 ? <EmptyNote>این اتاق تجهیزات مستقل ندارد.</EmptyNote> : null}
          {units.map((unit) => {
            const status = equipmentCondition(unit);
            return (
              <div key={unit.id} className="equipment-row">
                <div>
                  <div className="equipment-row__name">{unit.label}</div>
                  <div className="equipment-row__meta">
                    {fa(unit.powerDrawKW)} kW • {status.label}
                    {unit.tripped ? ' • قطع اضطراری' : ''}
                  </div>
                </div>
                <div className="equipment-row__health">
                  <div className={`bar ${status.tone === 'danger' ? 'bar--danger' : status.tone === 'warn' ? 'bar--warn' : 'bar--good'}`}>
                    <div className="bar__fill" style={{ width: `${unit.health}%` }} />
                  </div>
                  <div className="card__foot">{faPercent(unit.health)}</div>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => sim.toggleEquipment(unit.id)}
                    disabled={unit.tripped}
                  >
                    {unit.running ? 'خاموش' : 'روشن'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => assignRepair(unit.id)}
                    disabled={unit.health > 92 && !unit.tripped}
                  >
                    تعمیر
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === 'environment' ? (
        <div style={{ marginTop: 8 }}>
          <MetricBar label="یکپارچگی" value={room.hull} display={faPercent(room.hull, 1)} tone={room.hull < 45 ? 'danger' : room.hull < 75 ? 'warn' : 'good'} />
          <MetricBar label="آب" value={room.water} display={faPercent(room.water, 1)} tone={room.water > 25 ? 'danger' : room.water > 5 ? 'warn' : 'good'} />
          <MetricBar label="دما" value={room.tempC} max={50} display={`${fa(room.tempC, 1)}°C`} tone={room.tempC > 30 || room.tempC < 8 ? 'danger' : 'default'} />
          <MetricBar label="اکسیژن" value={room.o2} max={23} display={faPercent(room.o2, 1)} tone={room.o2 < 17 ? 'danger' : 'good'} />
          <MetricBar label="دی‌اکسید کربن" value={room.co2} max={6} display={faPercent(room.co2, 2)} tone={room.co2 > 2.2 ? 'danger' : 'good'} />

          <Section title="تحلیل">
            <StatLine label="فشار هیدرواستاتیک" value={pressureLabel(externalPressureMPa(state.depthM))} />
            <StatLine label="حد تحمل بدنه" value={pressureLabel(def.hullRatingMPa)} />
            <StatLine
              label="حاشیهٔ ایمنی فشار"
              value={`${fa(Math.max(0, (def.hullRatingMPa / externalPressureMPa(state.depthM) - 1) * 100), 1)}٪`}
            />
            <StatLine label="دمای آب بیرون" value={`${fa(state.thermal.ambientC, 1)}°C`} />
            <StatLine label="مدار خنک‌کننده" value={faPercent(state.thermal.coolantPct)} />
          </Section>

          <p className="hint">
            کاهش اکسیژن زیر ۱۷٪ و افزایش دی‌اکسید کربن بالای ۲٫۲٪ به‌سرعت سلامت خدمه را کم می‌کند.
            دمای زیر ۶ یا بالای ۳۳ درجه نیز آسیب‌زا است.
          </p>
        </div>
      ) : null}

      {tab === 'crew' ? (
        <div style={{ marginTop: 8 }}>
          {state.crew.filter((member) => member.alive && member.room === roomId).length === 0 ? (
            <EmptyNote>در این لحظه کسی در اتاق حضور ندارد.</EmptyNote>
          ) : null}
          {state.crew
            .filter((member) => member.alive && member.room === roomId)
            .map((member) => (
              <div key={member.id} className="crew-card" style={{ marginBottom: 6 }}>
                <div className="crew-avatar">{member.name.slice(0, 1)}</div>
                <div>
                  <div className="crew-card__name">{member.name}</div>
                  <div className="crew-card__role">{describeTask(state, member)}</div>
                </div>
                <div className="mini-stat">
                  <b>{faPercent(member.energy)}</b> انرژی
                </div>
              </div>
            ))}

          <Section title="در مسیر این اتاق">
            {state.crew.filter((member) => member.travelTo === roomId).length === 0 ? (
              <EmptyNote>کسی در راه نیست.</EmptyNote>
            ) : (
              state.crew
                .filter((member) => member.travelTo === roomId)
                .map((member) => (
                  <StatLine key={member.id} label={member.name} value={`${fa(Math.ceil(member.travelRemaining))} دقیقه`} />
                ))
            )}
          </Section>
        </div>
      ) : null}

      {tab === 'repairs' ? (
        <div style={{ marginTop: 8 }}>
          {room.breached ? (
            <div className="alert alert--critical" style={{ marginBottom: 8 }}>
              <span className="alert__dot" />
              <span>ترک فعال است؛ تا مهار نشود آب وارد می‌شود.</span>
              <button
                type="button"
                className="btn btn--sm"
                style={{ marginInlineStart: 'auto' }}
                onClick={() => bestEngineer && sim.assignTask(bestEngineer.id, { kind: 'seal', room: roomId, progress: 0 })}
              >
                مهار ترک
              </button>
            </div>
          ) : null}

          {units.length === 0 ? <EmptyNote>تجهیزاتی برای تعمیر وجود ندارد.</EmptyNote> : null}
          {units.map((unit) => (
            <div key={unit.id} className="stat-line">
              <span>
                {unit.label}
                <br />
                <small style={{ color: 'var(--muted)' }}>
                  قطعات لازم: {fa(unit.repairParts)} kg • وضعیت {faPercent(unit.health)}
                </small>
              </span>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => assignRepair(unit.id)}
                disabled={unit.health >= 100 || state.resources.partsKg < unit.repairParts}
              >
                سپردن به مهندس
              </button>
            </div>
          ))}
          <p className="hint" style={{ marginTop: 8 }}>
            قطعات موجود: {fa(state.resources.partsKg)} کیلوگرم. اگر قطعه کم باشد، تعمیر متوقف
            می‌شود؛ از پنل انبار می‌توانی قطعه بسازی.
          </p>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div style={{ marginTop: 8 }}>
          <div className="log-list">
            {state.incidentLog
              .filter((entry) => entry.text.includes(ROOM_LABEL[roomId]))
              .slice(0, 20)
              .map((entry, index) => (
                <div key={`${entry.minute}-${index}`} className={`log-item ${entry.severity === 'critical' ? 'is-critical' : entry.severity === 'warning' ? 'is-warning' : ''}`}>
                  <time>{fa(entry.minute)}′</time>
                  <span>{entry.text}</span>
                </div>
              ))}
          </div>
          {state.incidentLog.filter((entry) => entry.text.includes(ROOM_LABEL[roomId])).length === 0 ? (
            <EmptyNote>رویدادی برای این اتاق ثبت نشده است.</EmptyNote>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
