import type { ReactNode } from 'react';
import { fa, faPercent } from '../../sim';
import { sim } from '../../state/store';
import type { PanelId } from '../components/BottomNav';

const ACCENTS: Partial<Record<PanelId, string>> = {
  overview: '#4fe0e6',
  power: '#ffb454',
  life: '#6fe3a6',
  crew: '#c9a0ff',
  storage: '#e0b96f',
  research: '#7fd8e8',
  rov: '#ff9f68',
  missions: '#4fe0e6',
  codex: '#a8c8ff',
  log: '#9fb6c2',
  help: '#9fb6c2',
};

interface Fact {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'danger';
}

function factsFor(panel: PanelId): Fact[] {
  const state = sim.state;
  const rooms = Object.values(state.rooms);
  const o2 = Math.min(...rooms.map((room) => room.o2));
  const water = Math.max(...rooms.map((room) => room.water));
  const crewAlive = state.crew.filter((member) => member.alive).length;

  switch (panel) {
    case 'power':
      return [
        { label: 'تأمین / تقاضا', value: `${fa(Math.round(state.power.suppliedKW))} / ${fa(Math.round(state.power.demandKW))} kW`, tone: state.power.brownout ? 'danger' : 'good' },
        { label: 'باتری', value: `${fa(Math.round(state.power.batteryKWh))} kWh` },
        { label: 'دمای رآکتور', value: `${fa(Math.round(state.power.reactorTempC))}°C`, tone: state.power.reactorTempC > 260 ? 'danger' : 'good' },
      ];
    case 'life':
      return [
        { label: 'کمترین اکسیژن', value: faPercent(o2), tone: o2 < 16 ? 'danger' : o2 < 20 ? 'warn' : 'good' },
        { label: 'بیشترین CO₂', value: faPercent(Math.max(...rooms.map((room) => room.co2))), tone: 'warn' },
        { label: 'فشار بدنه', value: faPercent(state.hullIntegrity), tone: state.hullIntegrity < 50 ? 'danger' : 'good' },
      ];
    case 'crew':
      return [
        { label: 'زنده', value: `${fa(crewAlive)} / ${fa(state.crew.length)}` },
        { label: 'میانگین انرژی', value: faPercent(state.crew.reduce((sum, m) => sum + m.energy, 0) / Math.max(1, state.crew.length)) },
        { label: 'استرس', value: faPercent(state.crew.reduce((sum, m) => sum + m.stress, 0) / Math.max(1, state.crew.length)), tone: 'warn' },
      ];
    case 'storage':
      return [
        { label: 'قطعات', value: `${fa(Math.round(state.resources.partsKg))} kg` },
        { label: 'اکسیژن', value: `${fa(Math.round(state.resources.oxygenKg))} kg` },
        { label: 'خوراک', value: `${fa(Math.round(state.resources.foodKg))} kg` },
      ];
    case 'research':
      return [
        { label: 'نمونه', value: fa(state.resources.samples) },
        { label: 'داده', value: fa(state.resources.data) },
        { label: 'فناوری کامل', value: fa(state.research.completed.length) },
      ];
    case 'rov':
      return [
        { label: 'بدنه', value: faPercent(state.rov.hull), tone: state.rov.hull < 40 ? 'danger' : 'good' },
        { label: 'باتری', value: faPercent(state.rov.batteryPct) },
        { label: 'عمق ثبت‌شده', value: `${fa(state.rov.depthM)} m` },
      ];
    default:
      return [
        { label: 'بیشترین آب‌گرفتگی', value: faPercent(water), tone: water > 25 ? 'danger' : 'good' },
        { label: 'ساعت ایستگاه', value: fa(state.minute) },
        { label: 'هشدارها', value: fa(state.incidents.filter((entry) => entry.minute > state.minute - 60).length) },
      ];
  }
}

/**
 * Full-screen workspace. The old bottom sheet forced every area into the same
 * 62%-height card; each workspace now owns the whole screen with its own accent
 * colour and a live fact rail on the side.
 */
export function Workspace({
  panel,
  title,
  extra,
  onClose,
  children,
}: {
  panel: PanelId;
  title: string;
  extra?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const accent = ACCENTS[panel] ?? '#4fe0e6';
  const facts = factsFor(panel);

  return (
    <section
      className="workspace"
      data-ui="sheet"
      data-workspace={panel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ ['--accent' as string]: accent }}
    >
      <header className="workspace__head">
        <button type="button" className="workspace__close" onClick={onClose} aria-label="بستن">
          ✕
        </button>
        <div className="workspace__titles">
          <span className="workspace__eyebrow">میزکار</span>
          <h2>{title}</h2>
        </div>
        <div className="workspace__facts">
          {facts.map((fact) => (
            <div key={fact.label} className={`workspace__fact ${fact.tone ? `is-${fact.tone}` : ''}`}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
        {extra ? <div className="workspace__extra">{extra}</div> : null}
      </header>

      <div className="workspace__body">{children}</div>
    </section>
  );
}
