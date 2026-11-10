import { ROOM_LABEL, ROOMS, fa, faPercent } from '../../sim';
import { stationAlerts } from '../../sim/derived';
import { roomCondition } from '../../sim/crew';
import { objectiveLabel } from '../../sim/objectives';
import { sim, useSim } from '../../state/store';
import type { PanelId } from '../components/BottomNav';
import { Section, StatLine, EmptyNote } from '../components/ui';

const CONDITION_LABEL = {
  nominal: 'عادی',
  degraded: 'افت عملکرد',
  critical: 'بحرانی',
} as const;

export function OverviewPanel({
  onOpenRoom,
  onOpenPanel,
}: {
  onOpenRoom: (roomId: keyof typeof ROOM_LABEL) => void;
  onOpenPanel: (panel: PanelId) => void;
}) {
  useSim();
  const state = sim.state;
  const alerts = stationAlerts(state);
  const totalWater = Object.values(state.rooms).reduce((sum, room) => sum + room.water, 0) / 10;
  const objectives = state.objectives;

  return (
    <div>
      {state.victory ? (
        <div className="victory-banner">
          کمپین نخست کامل شد. ایستگاه در اعماق پایدار ماند و اهداف فرماندهی محقق شدند. می‌توانی
          در همین ایستگاه به مدیریت ادامه بدهی.
        </div>
      ) : null}

      <div className="grid-3">
        <div className="card">
          <div className="card__title">یکپارچگی سازه</div>
          <div className={`card__value ${state.hullIntegrity < 50 ? 'is-danger' : state.hullIntegrity < 75 ? 'is-warn' : 'is-good'}`}>
            {faPercent(state.hullIntegrity, 1)}
          </div>
          <div className="card__foot">فشار بیرونی: {fa(58.3, 1)} مگاپاسکال</div>
        </div>
        <div className="card">
          <div className="card__title">آب‌گرفتگی میانگین</div>
          <div className={`card__value ${totalWater > 20 ? 'is-danger' : totalWater > 5 ? 'is-warn' : 'is-good'}`}>
            {faPercent(totalWater, 1)}
          </div>
          <div className="card__foot">{state.rooms.corridor.breached ? 'ترک فعال در راهرو' : 'بدنهٔ راهرو سالم'}</div>
        </div>
        <div className="card">
          <div className="card__title">شبکهٔ برق</div>
          <div className={`card__value ${state.power.brownout ? 'is-danger' : 'is-good'}`}>
            {fa(state.power.suppliedKW)} / {fa(state.power.capacityKW)} kW
          </div>
          <div className="card__foot">باتری: {fa(state.power.batteryKWh)} کیلووات‌ساعت</div>
        </div>
        <div className="card">
          <div className="card__title">ذخیرهٔ اکسیژن</div>
          <div className={`card__value ${state.resources.oxygenKg < 60 ? 'is-danger' : state.resources.oxygenKg < 140 ? 'is-warn' : 'is-good'}`}>
            {fa(state.resources.oxygenKg)} kg
          </div>
          <div className="card__foot">مصرف خدمه: {fa(state.crew.filter((c) => c.alive).length * 0.02 * 60, 1)} kg در ساعت</div>
        </div>
      </div>

      <Section title={`هشدارهای فعال (${fa(alerts.length)})`}>
        {alerts.length === 0 ? (
          <EmptyNote>همهٔ سامانه‌ها در محدودهٔ عادی کار می‌کنند.</EmptyNote>
        ) : (
          <div className="alert-list">
            {alerts.map((alert, index) => (
              <button
                key={`${alert.text}-${index}`}
                type="button"
                className={`alert ${alert.level === 'critical' ? 'alert--critical' : alert.level === 'warning' ? 'alert--warning' : ''}`}
                onClick={() => (alert.room ? onOpenRoom(alert.room) : onOpenPanel('log'))}
                style={{ cursor: 'pointer' }}
              >
                <span className="alert__dot" />
                <span>{alert.text}</span>
              </button>
            ))}
          </div>
        )}
      </Section>

      {objectives.length > 0 ? (
        <Section title="اهداف کمپین">
          <div className="grid-2">
            {objectives.map((objective) => (
              <div key={objective.id} className="card">
                <div className="card__title">
                  <span>{objectiveLabel(objective.id)}</span>
                  <span>{objective.done ? '✓' : faPercent(objective.progress * 100)}</span>
                </div>
                <div className="bar-row" style={{ gridTemplateColumns: '1fr' }}>
                  <div className={`bar ${objective.done ? 'bar--good' : ''}`}>
                    <div className="bar__fill" style={{ width: `${Math.min(100, objective.progress * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="حالت بقا">
          <EmptyNote>
            در حالت بقای بی‌پایان هدفی جز زنده ماندن نیست؛ هر چه بیشتر دوام بیاوری، رکورد ایستگاه
            بالاتر می‌رود. زمان سپری‌شده: {fa(Math.floor(state.minute / 60))} ساعت.
          </EmptyNote>
        </Section>
      )}

      <Section title="اتاق‌ها">
        <div className="room-grid">
          {ROOMS.map((room) => {
            const live = state.rooms[room.id];
            const condition = roomCondition(state, room.id);
            return (
              <button
                key={room.id}
                type="button"
                className={`room-card is-${condition}`}
                onClick={() => onOpenRoom(room.id)}
              >
                <span className="room-card__name">{room.label}</span>
                <span className="room-card__meta">
                  <span>سازه {faPercent(live.hull)}</span>
                  <span>آب {faPercent(live.water)}</span>
                  <span>{fa(live.tempC, 1)}°C</span>
                </span>
                <span className="room-card__meta">
                  <span style={{ color: condition === 'critical' ? '#ffb3ab' : 'inherit' }}>
                    {CONDITION_LABEL[condition]}
                  </span>
                  {live.breached ? <span style={{ color: '#ffb3ab' }}>ترک فعال</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="آخرین رویدادها">
        <div className="log-list">
          {state.incidentLog.slice(0, 6).map((entry, index) => (
            <div key={`${entry.minute}-${index}`} className={`log-item ${entry.severity === 'critical' ? 'is-critical' : entry.severity === 'warning' ? 'is-warning' : ''}`}>
              <time>{fa(entry.minute)}′</time>
              <span>{entry.text}</span>
            </div>
          ))}
          {state.incidentLog.length === 0 ? <EmptyNote>هنوز رویدادی ثبت نشده است.</EmptyNote> : null}
        </div>
      </Section>

      <Section title="وضعیت خدمه">
        <StatLine label="خدمهٔ فعال" value={`${fa(state.crew.filter((c) => c.alive).length)} از ${fa(state.crew.length)}`} />
        <StatLine
          label="میانگین سلامت"
          value={faPercent(state.crew.reduce((sum, c) => sum + c.health, 0) / state.crew.length, 0)}
        />
        <StatLine
          label="میانگین انرژی"
          value={faPercent(state.crew.reduce((sum, c) => sum + c.energy, 0) / state.crew.length, 0)}
        />
      </Section>
    </div>
  );
}
