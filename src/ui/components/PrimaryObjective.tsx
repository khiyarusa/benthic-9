import { primaryMission } from '../../sim/missions';
import { fa } from '../../sim/format';
import { sim, useSim } from '../../state/store';

/**
 * One line, always visible: what to do next and why. Tapping it opens the full
 * mission board instead of hiding the objective inside a menu.
 */
export function PrimaryObjective({ onOpen }: { onOpen: () => void }) {
  useSim();
  const mission = primaryMission(sim.state);
  if (!mission) return null;
  const pct = Math.round(mission.value * 100);

  return (
    <button type="button" className="primary" onClick={onOpen} data-ui="primary">
      <span className="primary__label">هدف بعدی: {mission.title}</span>
      <span className="primary__bar">
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="primary__pct">{fa(pct)}٪</span>
    </button>
  );
}
