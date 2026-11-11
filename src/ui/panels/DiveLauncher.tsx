import { useEffect, useState } from 'react';
import { sim } from '../../state/store';
import { DIVE_THEMES, type DiveTheme } from '../../game/dive/scenery';
import type { DiveResult } from '../../game/dive/DiveScene';
import { fa } from '../../sim';
import { DiveOverlay } from '../overlay/DiveOverlay';
import { Card, Section } from '../components/ui';

/**
 * Mounted once at game-screen level. Listens for a dive request, runs the scene,
 * and writes the outcome back into the simulation.
 */
interface DiveSession {
  themeId: DiveTheme['id'];
  battery: number;
  hull: number;
}

export function DiveLauncher() {
  // Snapshot the ROV at launch: the station clock keeps running, so reading
  // live battery every render would restart the scene mid-dive.
  const [session, setSession] = useState<DiveSession | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ themeId: DiveTheme['id'] }>).detail;
      if (!detail?.themeId) return;
      const rov = sim.state.rov;
      sim.setPaused(true);
      setSession({ themeId: detail.themeId, battery: rov.batteryPct, hull: rov.hull });
    };
    window.addEventListener('benthic:open-dive', onOpen);
    return () => window.removeEventListener('benthic:open-dive', onOpen);
  }, []);

  if (!session) return null;

  const close = () => {
    sim.setPaused(false);
    setSession(null);
  };

  return (
    <DiveOverlay
      themeId={session.themeId}
      battery={session.battery}
      hull={session.hull}
      onFinish={(result: DiveResult) => {
        sim.applyDive(result);
        close();
      }}
      onAbort={() => {
        sim.recallRov();
        close();
      }}
    />
  );
}

/** Buttons that launch a manual dive into a specific biome. */
export function DiveEntry() {
  const [reason, setReason] = useState<string | null>(null);

  const start = (theme: DiveTheme) => {
    const check = sim.deployRov(theme.depthM);
    if (!check.ok) {
      setReason(check.reason ?? 'امکان شیرجه نیست.');
      return;
    }
    setReason(null);
    window.dispatchEvent(new CustomEvent('benthic:open-dive', { detail: { themeId: theme.id } }));
  };

  return (
    <Section title="شیرجهٔ دستی" action={<span className="chip">کنترل واقعی ROV</span>}>
      <div className="dive-choices">
        {DIVE_THEMES.map((theme) => (
          <button key={theme.id} type="button" className="dive-choice" onClick={() => start(theme)}>
            <Card
              title={theme.label}
              value={`${fa(theme.depthM)} متر`}
              foot={`ریسک ${fa(Math.round(theme.hazard * 100))}٪ · بازده ${fa(Math.round(theme.richness * 100))}٪`}
            />
          </button>
        ))}
      </div>
      {reason ? <p className="hint" style={{ color: 'var(--amber)' }}>{reason}</p> : null}
      <p className="hint">
        در شیرجه با لمس آب حرکت می‌کنی؛ چراغ و سونار باتری مصرف می‌کنند و کابل برد حرکت را
        محدود می‌کند. هر نمونه و کشف مستقیماً به انبار و پژوهش اضافه می‌شود.
      </p>
    </Section>
  );
}
