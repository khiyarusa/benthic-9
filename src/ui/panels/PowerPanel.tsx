import { ROOM_LABEL, fa, faPercent } from '../../sim';
import type { RoomId } from '../../sim/types';
import { sim, useSim } from '../../state/store';
import { Chip, Section, StatLine } from '../components/ui';

const PRIORITIES = [1, 2, 3, 4, 5];

export function PowerPanel() {
  useSim();
  const state = sim.state;
  const reactor = state.equipment['reactor-1'];
  const rooms = Object.keys(state.rooms) as RoomId[];

  return (
    <div>
      <div className="grid-3">
        <div className="card">
          <div className="card__title">تولید شبکه</div>
          <div className={`card__value ${state.power.capacityKW < 80 ? 'is-danger' : ''}`}>{fa(state.power.capacityKW)} kW</div>
          <div className="card__foot">سقف اسمی: {fa(260 + (state.research.completed.includes('modular-reactor') ? 70 : 0))} kW</div>
        </div>
        <div className="card">
          <div className="card__title">مصرف</div>
          <div className={`card__value ${state.power.brownout ? 'is-danger' : 'is-good'}`}>{fa(state.power.demandKW)} kW</div>
          <div className="card__foot">تحویل‌شده: {fa(state.power.suppliedKW)} kW</div>
        </div>
        <div className="card">
          <div className="card__title">باتری</div>
          <div className="card__value">{fa(state.power.batteryKWh)} kWh</div>
          <div className="card__foot">ظرفیت {fa(state.power.batteryCapacityKWh)} کیلووات‌ساعت</div>
        </div>
        <div className="card">
          <div className="card__title">سوخت رآکتور</div>
          <div className={`card__value ${state.resources.fuelKg < 60 ? 'is-warn' : ''}`}>{fa(state.resources.fuelKg)} kg</div>
          <div className="card__foot">مصرف با throttle فعلی</div>
        </div>
      </div>

      <Section title="رآکتور شکافت">
        <div className="row row--between" style={{ marginBottom: 6 }}>
          <div className="row" style={{ gap: 6 }}>
            <Chip tone={reactor?.tripped ? 'danger' : reactor && reactor.health < 55 ? 'warn' : 'good'}>
              {reactor?.tripped ? 'قطع اضطراری' : reactor?.health && reactor.health < 55 ? 'فرسوده' : 'در مدار'}
            </Chip>
            <Chip>سلامت {faPercent(reactor?.health ?? 0)}</Chip>
            <Chip tone={state.rooms.reactor.tempC > 72 ? 'danger' : state.rooms.reactor.tempC > 60 ? 'warn' : 'good'}>
              دمای هسته {fa(state.power.reactorTempC, 1)}°C
            </Chip>
          </div>
          <button type="button" className="btn btn--sm" onClick={() => sim.restartReactor()} disabled={!reactor?.tripped}>
            راه‌اندازی مجدد
          </button>
        </div>

        <label className="slider-row">
          <span>توان فرمان‌داده‌شده</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.power.reactorThrottle * 100)}
            onChange={(event) => sim.setReactorThrottle(Number(event.target.value) / 100)}
          />
          <strong>{faPercent(state.power.reactorThrottle * 100)}</strong>
        </label>
        <p className="hint">
          کاهش توان، مصرف سوخت و گرمای هسته را کم می‌کند اما ظرفیت شبکه را پایین می‌آورد. اگر
          هسته از ۹۶ درجه بگذرد، رآکتور خودکار قطع می‌شود.
        </p>
      </Section>

      <Section title="اولویت مصرف برق">
        <p className="hint" style={{ marginBottom: 6 }}>
          اولویت ۱ بالاترین است؛ در کمبود برق، اتاق‌های با اولویت پایین‌تر خاموش یا نیمه‌برق
          می‌شوند.
        </p>
        {rooms.map((room) => (
          <div key={room} className="stat-line">
            <span>{ROOM_LABEL[room]}</span>
            <div className="row" style={{ gap: 3 }}>
              {PRIORITIES.map((priority) => {
                const active = state.power.roomPriority[room] === priority;
                return (
                  <button
                    key={priority}
                    type="button"
                    className={`btn btn--sm ${active ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ minWidth: 30, padding: '2px 6px' }}
                    onClick={() => sim.setPriority(room, priority)}
                    aria-pressed={active}
                  >
                    {fa(priority)}
                  </button>
                );
              })}
              <span className="mini-stat" style={{ minWidth: 54, textAlign: 'end' }}>
                {faPercent((state.power.roomFactor[room] ?? 1) * 100)}
              </span>
            </div>
          </div>
        ))}
      </Section>

      <Section title="مدارهای خنک‌کننده">
        <StatLine label="شارژ مایع خنک‌کننده" value={faPercent(state.thermal.coolantPct)} />
        <StatLine label="دمای اتاق رآکتور" value={`${fa(state.rooms.reactor.tempC, 1)}°C`} />
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn--sm" onClick={() => sim.refillCoolant()}>
            پر کردن مدار (۱۲۰ لیتر آب)
          </button>
          <span className="hint">آب موجود: {fa(state.resources.waterL)} لیتر</span>
        </div>
      </Section>

      {state.power.brownout ? (
        <div className="alert alert--warning" style={{ marginTop: 10 }}>
          <span className="alert__dot" />
          <span>کمبود برق فعال است؛ پمپ‌ها و پشتیبانی حیات ممکن است نیمه‌توان کار کنند.</span>
        </div>
      ) : null}
    </div>
  );
}
