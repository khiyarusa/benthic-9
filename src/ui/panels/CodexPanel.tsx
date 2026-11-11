import { CODEX_GROUPS, codexStatus } from '../../sim/codex';
import { fa } from '../../sim/format';
import { sim, useSim } from '../../state/store';
import { MetricBar, Section } from '../components/ui';

/**
 * The codex: every unlocked entry is a real note about something the player
 * actually did; locked entries show what would unlock them.
 */
export function CodexPanel() {
  useSim();
  const { unlocked, locked, total } = codexStatus(sim.state);

  return (
    <div className="codex">
      <div className="codex__head">
        <p className="hint">
          هر یادداشت فقط وقتی باز می‌شود که همان کار در بازی انجام شده باشد؛ نه با گذشت زمان.
        </p>
        <MetricBar
          label="ثبت‌شده"
          value={(unlocked.length / total) * 100}
          display={`${fa(unlocked.length)} / ${fa(total)}`}
          tone={unlocked.length / total > 0.6 ? 'good' : 'default'}
        />
      </div>

      {(['biology', 'geology', 'wreck', 'signal', 'crew'] as const).map((group) => {
        const items = unlocked.filter((entry) => entry.group === group);
        const pending = locked.filter((entry) => entry.group === group);
        if (items.length === 0 && pending.length === 0) return null;
        return (
          <Section key={group} title={CODEX_GROUPS[group]}>
            <div className="codex__grid">
              {items.map((entry) => (
                <article key={entry.id} className="codex-card">
                  <h3>{entry.title}</h3>
                  <p>{entry.body}</p>
                  <span className="codex-card__tag">ثبت‌شده</span>
                </article>
              ))}
              {pending.map((entry) => (
                <article key={entry.id} className="codex-card codex-card--locked">
                  <h3>؟؟؟</h3>
                  <p>{entry.hint}</p>
                  <span className="codex-card__tag">قفل</span>
                </article>
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
