import { ACTS, missionBoard, type ActId } from '../../sim/missions';
import { fa } from '../../sim/format';
import { sim, useSim } from '../../state/store';
import { Chip, MetricBar } from '../components/ui';

/**
 * Mission board: three acts, twelve missions, every progress bar derived from
 * live simulation values. Nothing here is a checklist of prose.
 */
export function MissionBoard({ onClose }: { onClose?: () => void }) {
  useSim();
  const board = missionBoard(sim.state);

  return (
    <div className="board">
      <header className="board__head">
        <p className="hint">هدف بعدی همیشه در نوار بالا دیده می‌شود؛ این صفحه نقشهٔ کامل است.</p>
        {onClose ? (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>
            بستن
          </button>
        ) : null}
      </header>

      {board.acts.map(({ id, missions, done, total }) => {
        const act = ACTS[id as ActId];
        const locked = missions.every((m) => m.locked);
        return (
          <section key={id} className={`board-act ${locked ? 'is-locked' : ''}`}>
            <div className="board-act__head">
              <div>
                <h3>{act.title}</h3>
                <span className="hint">{act.subtitle}</span>
              </div>
              <Chip tone={done === total ? 'good' : locked ? 'warn' : 'warn'}>
                {locked ? 'قفل تا پایان پردهٔ قبل' : `${fa(done)} / ${fa(total)}`}
              </Chip>
            </div>
            <p className="board-act__goal">{act.goal}</p>

            <ol className="board-list">
              {missions.map((mission) => (
                <li key={mission.id} className={`board-item ${mission.done ? 'is-done' : ''}`}>
                  <div className="board-item__bar">
                    <span className="board-item__mark">{mission.done ? '✓' : '·'}</span>
                    <div>
                      <h4>{mission.title}</h4>
                      <p>{mission.why}</p>
                      <ul className="board-steps">
                        {mission.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <MetricBar
                    label={mission.done ? 'تکمیل‌شده' : 'پیشرفت'}
                    value={mission.value * 100}
                    display={`${fa(Math.round(mission.value * 100))}٪`}
                    tone={mission.done ? 'good' : 'default'}
                  />
                  <p className="board-item__reward">پاداش: {mission.reward}</p>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
