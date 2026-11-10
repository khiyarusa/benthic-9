import { fa, faPercent, stationClock } from '../../sim/format';
import { stationMood } from '../../sim/derived';
import { sim, useSim } from '../../state/store';
import { Chip } from './ui';

const MOOD_LABEL = {
  stable: 'پایدار',
  strained: 'تحت فشار',
  critical: 'بحرانی',
} as const;

const MOOD_TONE: Record<string, 'good' | 'warn' | 'danger'> = {
  stable: 'good',
  strained: 'warn',
  critical: 'danger',
};

export function TopBar({ onOpenLog }: { onOpenLog: () => void }) {
  useSim();
  const state = sim.state;
  const clock = stationClock(state.minute);
  const mood = stationMood(state);
  const alerts = state.incidents.filter((entry) => entry.minute > state.minute - 60).length;

  return (
    <header className="topbar">
      <div className="topbar__clock">
        <strong>{clock.label}</strong>
        <span>{MOOD_LABEL[mood]} • {state.mode === 'campaign' ? 'کمپین' : state.mode === 'endless' ? 'بقا' : 'چالش'}</span>
      </div>

      <div className="speed-group" role="group" aria-label="سرعت شبیه‌سازی">
        <button
          type="button"
          className={`speed-btn ${state.paused ? 'is-active' : ''}`}
          onClick={() => sim.setPaused(!state.paused)}
          aria-label={state.paused ? 'ادامه' : 'توقف'}
        >
          {state.paused ? '▶' : '❚❚'}
        </button>
        {[1, 2, 4].map((speed) => (
          <button
            key={speed}
            type="button"
            className={`speed-btn ${!state.paused && state.speed === speed ? 'is-active' : ''}`}
            onClick={() => {
              if (state.paused) sim.setPaused(false);
              sim.setSpeed(speed as 1 | 2 | 4);
            }}
          >
            {fa(speed)}×
          </button>
        ))}
      </div>

      <div className="topbar__spacer" />

      <div className="resource-strip">
        <div className={`res ${state.power.brownout ? 'is-critical' : ''}`}>
          <span className="res__label">برق (kW)</span>
          <span className="res__value">
            {fa(state.power.suppliedKW)} / {fa(state.power.capacityKW)}
          </span>
        </div>
        <div className={`res ${state.resources.oxygenKg < 60 ? 'is-critical' : state.resources.oxygenKg < 120 ? 'is-low' : ''}`}>
          <span className="res__label">اکسیژن (kg)</span>
          <span className="res__value">{fa(state.resources.oxygenKg)}</span>
        </div>
        <div className={`res ${state.resources.partsKg < 10 ? 'is-low' : ''}`}>
          <span className="res__label">قطعات (kg)</span>
          <span className="res__value">{fa(state.resources.partsKg)}</span>
        </div>
        <div className="res">
          <span className="res__label">داده</span>
          <span className="res__value">{fa(state.resources.data)}</span>
        </div>
        <div className={`res ${state.resources.foodKg < 15 ? 'is-low' : ''}`}>
          <span className="res__label">جیره (kg)</span>
          <span className="res__value">{fa(state.resources.foodKg)}</span>
        </div>
      </div>

      <button type="button" className="btn btn--sm btn--ghost" onClick={onOpenLog}>
        <Chip tone={MOOD_TONE[mood]}>
          {alerts > 0 ? `${fa(alerts)} هشدار` : 'گزارش'}
        </Chip>
      </button>

      <div className="res" style={{ minWidth: 66 }}>
        <span className="res__label">سازه</span>
        <span className="res__value">{faPercent(state.hullIntegrity, 0)}</span>
      </div>
    </header>
  );
}
