import { ROOM_LABEL, ROOMS, fa, faPercent } from '../../sim';
import { sim, useSim } from '../../state/store';
import { Chip, MetricBar, Section, StatLine, Toggle } from '../components/ui';

export function LifePanel() {
  useSim();
  const state = sim.state;
  const o2Gen = state.equipment['o2-gen-1'];
  const scrubber = state.equipment['scrubber-1'];
  const alive = state.crew.filter((member) => member.alive).length;

  return (
    <div>
      <div className="grid-3">
        <div className="card">
          <div className="card__title">ذخیرهٔ اکسیژن</div>
          <div className={`card__value ${state.resources.oxygenKg < 60 ? 'is-danger' : state.resources.oxygenKg < 140 ? 'is-warn' : 'is-good'}`}>
            {fa(state.resources.oxygenKg)} kg
          </div>
          <div className="card__foot">ظرفیت مخزن ۴۰۰ کیلوگرم</div>
        </div>
        <div className="card">
          <div className="card__title">تولید اکسیژن</div>
          <div className="card__value">{faPercent((state.power.roomFactor.life ?? 0) * 100)}</div>
          <div className="card__foot">توان دریافتی الکترولیز</div>
        </div>
        <div className="card">
          <div className="card__title">مصرف خدمه</div>
          <div className="card__value">{fa(alive * 1.2, 1)} kg/h</div>
          <div className="card__foot">{fa(alive)} نفر فعال</div>
        </div>
        <div className="card">
          <div className="card__title">آب شیرین</div>
          <div className={`card__value ${state.resources.waterL < 150 ? 'is-warn' : ''}`}>{fa(state.resources.waterL)} L</div>
          <div className="card__foot">مصرف الکترولیز و خنک‌کننده</div>
        </div>
      </div>

      <Section title="سامانهٔ حیات">
        <Toggle
          label="الکترولیز فعال"
          hint="آب را به اکسیژن و هیدروژن جدا می‌کند؛ به برق و آب نیاز دارد."
          checked={state.life.electrolysisEnabled}
          onChange={(next) => sim.setElectrolysis(next)}
        />
        <StatLine label="وضعیت الکترولیز" value={`${o2Gen?.label ?? '—'} • ${faPercent(o2Gen?.health ?? 0)}`} />
        <StatLine label="بار اسکرابر" value={faPercent(state.life.scrubberLoad * 100)} />
        <StatLine label="سلامت اسکرابر" value={`${scrubber?.label ?? '—'} • ${faPercent(scrubber?.health ?? 0)}`} />
        <StatLine label="CO₂ جمع‌آوری‌شده" value={`${fa(state.life.co2StoredKg, 1)} kg`} />
        <StatLine label="جیرهٔ غذایی" value={`${fa(state.resources.foodKg)} kg`} />
      </Section>

      <Section title="اتمسفر اتاق‌ها">
        {ROOMS.map((room) => {
          const live = state.rooms[room.id];
          return (
            <div key={room.id} style={{ marginBottom: 6 }}>
              <div className="row row--between" style={{ marginBottom: 2 }}>
                <span style={{ fontSize: 12 }}>{ROOM_LABEL[room.id]}</span>
                <span className="mini-stat">
                  O₂ <b>{fa(live.o2, 1)}٪</b> • CO₂ <b>{fa(live.co2, 2)}٪</b> • <b>{fa(live.tempC, 1)}°C</b>
                </span>
              </div>
              <MetricBar label="O₂" value={live.o2} max={23} tone={live.o2 < 17 ? 'danger' : live.o2 < 19.5 ? 'warn' : 'good'} />
            </div>
          );
        })}
      </Section>

      <Section title="آستانه‌های خطر">
        <div className="row" style={{ gap: 6 }}>
          <Chip tone="danger">O₂ زیر ۱۷٪</Chip>
          <Chip tone="danger">CO₂ بالای ۲٫۲٪</Chip>
          <Chip tone="warn">ذخیرهٔ اکسیژن زیر ۶۰ کیلوگرم</Chip>
          <Chip tone="warn">آب زیر ۱۵۰ لیتر</Chip>
        </div>
      </Section>
    </div>
  );
}
