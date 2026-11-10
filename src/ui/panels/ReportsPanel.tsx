import { useState } from 'react';
import { fa, faPercent, stationClock } from '../../sim';
import { deleteSave, saveGame } from '../../sim/save';
import { sim, useSim } from '../../state/store';
import { Card, EmptyNote, Section, StatLine } from '../components/ui';

export function ReportsPanel() {
  useSim();
  const [message, setMessage] = useState<string | null>(null);
  const state = sim.state;
  const clock = stationClock(state.minute);
  const alive = state.crew.filter((member) => member.alive).length;

  const handleSave = () => {
    const ok = saveGame(state);
    setMessage(ok ? 'وضعیت ایستگاه ذخیره شد.' : 'ذخیره‌سازی در این مرورگر ممکن نیست.');
  };

  return (
    <div>
      <div className="grid-3">
        <Card title="زمان مأموریت" value={clock.label} foot={`${fa(state.minute)} دقیقهٔ بازی`} />
        <Card title="خدمهٔ فعال" value={`${fa(alive)} از ${fa(state.crew.length)}`} tone={alive < 3 ? 'danger' : 'good'} />
        <Card title="رویدادهای مهارشده" value={fa(state.stats.incidentsResolved)} />
        <Card title="تعمیرهای موفق" value={fa(state.stats.repairs)} />
        <Card title="سفرهای اکتشافی" value={fa(state.stats.expeditions)} />
        <Card title="یکپارچگی سازه" value={faPercent(state.hullIntegrity)} tone={state.hullIntegrity < 50 ? 'danger' : 'good'} />
      </div>

      <Section title="مدیریت ذخیره">
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn--sm btn--primary" onClick={handleSave}>
            ذخیرهٔ دستی
          </button>
          <button
            type="button"
            className="btn btn--sm btn--danger"
            onClick={() => {
              deleteSave();
              setMessage('ذخیرهٔ محلی پاک شد. با بازکردن مجدد، مأموریت از ابتدا شروع می‌شود.');
            }}
          >
            پاک کردن ذخیره
          </button>
          {message ? <span className="hint">{message}</span> : null}
        </div>
        <p className="hint">
          ذخیره در حافظهٔ محلی مرورگر نگهداری می‌شود؛ برای انتقال به دستگاه دیگر از همین مرورگر
          استفاده کن یا از طریق نسخهٔ اندروید، دادهٔ برنامه حفظ می‌شود.
        </p>
      </Section>

      <Section title="گزارش رویدادها">
        <div className="log-list" style={{ maxHeight: 300 }}>
          {state.incidentLog.map((entry, index) => (
            <div
              key={`${entry.minute}-${index}`}
              className={`log-item ${entry.severity === 'critical' ? 'is-critical' : entry.severity === 'warning' ? 'is-warning' : ''}`}
            >
              <time>{clock.label.split('—')[1]?.trim() ?? fa(entry.minute)}</time>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
        {state.incidentLog.length === 0 ? <EmptyNote>هنوز رویدادی ثبت نشده است.</EmptyNote> : null}
      </Section>

      <Section title="خلاصهٔ وضعیت">
        <StatLine label="حالت بازی" value={state.mode === 'campaign' ? 'کمپین' : state.mode === 'endless' ? 'بقای بی‌پایان' : 'چالش سیل'} />
        <StatLine label="سرعت شبیه‌سازی" value={state.paused ? 'متوقف' : `${fa(state.speed)}×`} />
        <StatLine label="پژوهش‌های تکمیل‌شده" value={`${fa(state.research.completed.length)} از ۹`} />
        <StatLine label="اهداف محقق‌شده" value={`${fa(state.objectives.filter((objective) => objective.done).length)} از ${fa(state.objectives.length)}`} />
      </Section>
    </div>
  );
}
