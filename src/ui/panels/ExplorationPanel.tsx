import { fa, faPercent } from '../../sim';
import { rovDepthLimit } from '../../sim/rov';
import { sim, useSim } from '../../state/store';
import { Card, Chip, MetricBar, Section, StatLine } from '../components/ui';
import { DiveEntry } from './DiveLauncher';

export function ExplorationPanel() {
  useSim();
  const state = sim.state;
  const rov = state.rov;
  const limit = rovDepthLimit(state);
  const depths = [
    { depth: 5200, label: 'فلات عمیق', hint: 'کم‌خطر، نمونهٔ کم' },
    { depth: 6000, label: 'درهٔ میانی', hint: 'تعادل ریسک و بازده' },
    { depth: 7000, label: 'گودال بتیک', hint: 'نمونهٔ نادر، آسیب بالا' },
  ];

  return (
    <div>
      <div className="grid-3">
        <Card
          title="بدنهٔ ROV"
          value={faPercent(rov.hull)}
          tone={rov.hull < 30 ? 'danger' : rov.hull < 60 ? 'warn' : 'good'}
          foot="تعمیر با ۸ کیلوگرم قطعه"
        />
        <Card title="باتری" value={faPercent(rov.batteryPct)} tone={rov.batteryPct < 25 ? 'warn' : 'default'} foot="شارژ در قفل خروج" />
        <Card title="وضعیت" value={rov.deployed ? 'در مأموریت' : 'در اسکله'} foot={rov.deployed ? `${fa(Math.ceil(rov.missionMinutesLeft))} دقیقه تا بازگشت` : 'آمادهٔ رهاسازی'} />
        <Card title="نمونه و داده" value={`${fa(state.resources.samples)} / ${fa(state.resources.data)}`} foot="نمونه / داده" />
      </div>

      {rov.deployed ? (
        <Section title="مأموریت جاری">
          <StatLine label="عمق هدف" value={`${fa(rov.targetDepthM)} متر`} />
          <StatLine label="عمق فعلی" value={`${fa(rov.depthM)} متر`} />
          <MetricBar label="باتری" value={rov.batteryPct} display={faPercent(rov.batteryPct)} tone={rov.batteryPct < 30 ? 'danger' : 'good'} />
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn--sm" onClick={() => sim.recallRov()}>
              بازگشت فوری
            </button>
          </div>
          <p className="hint">کاهش باتری در عمق، ROV را از دست می‌دهد. بازگشت فوری امن‌تر است اما نمونهٔ کمتری می‌آورد.</p>
        </Section>
      ) : (
        <Section title="انتخاب عمق مأموریت">
          <div className="depth-scale">
            {depths.map((entry) => {
              const locked = entry.depth > limit;
              return (
                <button
                  key={entry.depth}
                  type="button"
                  className={`depth-btn ${locked ? 'is-locked' : ''}`}
                  onClick={() => sim.deployRov(entry.depth)}
                  disabled={locked}
                >
                  <strong>{fa(entry.depth)} متر</strong>
                  <small>{entry.label}</small>
                  <small>{locked ? 'نیازمند سونار بلندبرد' : entry.hint}</small>
                </button>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <Chip tone={rov.hull < 30 ? 'danger' : 'good'}>بدنه {faPercent(rov.hull)}</Chip>
            <Chip tone={state.rooms.rov.water > 10 ? 'danger' : 'good'}>محفظه {faPercent(state.rooms.rov.water)} آب</Chip>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => sim.repairRov()}>
              تعمیر بدنه
            </button>
          </div>
          <p className="hint">
            برد فعلی سونار {fa(limit)} متر است. پژوهش «آرایهٔ سونار بلندبرد» برد را به ۷۰۰۰ متر
            می‌رساند و «بازوی رباتیک» یک نمونهٔ بیشتر برمی‌گرداند.
          </p>
        </Section>
      )}

      <DiveEntry />

      <Section title="گزارش آخرین سفر">
        <p className="hint">{rov.lastMissionResult ?? 'هنوز سفری انجام نشده است.'}</p>
        <StatLine label="تعداد سفرها" value={fa(state.stats.expeditions)} />
      </Section>
    </div>
  );
}
