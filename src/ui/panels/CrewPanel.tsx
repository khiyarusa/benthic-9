import { ROOM_LABEL, fa, faPercent } from '../../sim';
import { sim, useSim } from '../../state/store';
import { describeTask } from '../labels';
import { Chip, EmptyNote, MetricBar, Section, Toggle } from '../components/ui';

const SKILLS = [
  { key: 'engineering', label: 'مهندسی' },
  { key: 'biology', label: 'زیست' },
  { key: 'geology', label: 'زمین' },
  { key: 'medical', label: 'پزشکی' },
] as const;

export function CrewPanel() {
  useSim();
  const state = sim.state;

  return (
    <div>
      {state.crew.map((member) => (
        <div key={member.id} className="card" style={{ marginBottom: 8, opacity: member.alive ? 1 : 0.5 }}>
          <div className="row row--between" style={{ alignItems: 'flex-start' }}>
            <div className="crew-card" style={{ border: 'none', background: 'transparent', padding: 0 }}>
              <div className="crew-avatar">{member.name.slice(0, 1)}</div>
              <div>
                <div className="crew-card__name">{member.name}</div>
                <div className="crew-card__role">{member.role}</div>
                <div className="crew-card__stats">
                  {SKILLS.map((skill) => (
                    <span key={skill.key} className="mini-stat">
                      {skill.label}
                      <span className="skill-dots" style={{ marginInlineStart: 3 }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className={`skill-dot ${index < member.skills[skill.key] ? 'is-on' : ''}`} />
                        ))}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <Chip tone={member.alive ? (member.health < 45 ? 'danger' : 'good') : 'danger'}>
                {member.alive ? ROOM_LABEL[member.room ?? 'corridor'] : 'از دست رفته'}
              </Chip>
              <Chip>{fa(Math.round(member.energy))}٪ انرژی</Chip>
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <MetricBar label="سلامت" value={member.health} display={faPercent(member.health)} tone={member.health < 45 ? 'danger' : member.health < 70 ? 'warn' : 'good'} />
            <MetricBar label="انرژی" value={member.energy} display={faPercent(member.energy)} tone={member.energy < 30 ? 'danger' : member.energy < 50 ? 'warn' : 'good'} />
            <MetricBar label="استرس" value={member.stress} display={faPercent(member.stress)} tone={member.stress > 70 ? 'danger' : member.stress > 45 ? 'warn' : 'good'} />
          </div>

          <div className="row row--between" style={{ marginTop: 6 }}>
            <span className="hint">{describeTask(state, member)}</span>
            <div className="row" style={{ gap: 4 }}>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => sim.assignTask(member.id, { kind: 'rest' })}
                disabled={!member.alive}
              >
                استراحت
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => sim.setAutoTask(member.id, !member.autoTask)}
                disabled={!member.alive}
              >
                {member.autoTask ? 'خودکار فعال' : 'دستی'}
              </button>
            </div>
          </div>

          {member.task.kind === 'repair' ? (
            <MetricBar label="پیشرفت تعمیر" value={member.task.progress} display={faPercent(member.task.progress)} tone="good" />
          ) : null}
          {member.task.kind === 'seal' ? (
            <MetricBar label="پیشرفت مهار" value={member.task.progress} display={faPercent(member.task.progress)} tone="good" />
          ) : null}
          {member.task.kind === 'weld' ? (
            <MetricBar label="پیشرفت تقویت" value={member.task.progress} display={faPercent(member.task.progress)} tone="good" />
          ) : null}
        </div>
      ))}

      <Section title="رفتار خودکار">
        <Toggle
          label="همهٔ خدمه در حالت خودکار"
          hint="در حالت خودکار، خدمه بر اساس فوریت (ترک، تعمیر، آب، پژوهش) وظیفه برمی‌دارند."
          checked={state.crew.every((member) => member.autoTask || !member.alive)}
          onChange={(next) => {
            for (const member of state.crew) if (member.alive) sim.setAutoTask(member.id, next);
          }}
        />
        {state.crew.some((member) => !member.alive) ? (
          <EmptyNote>خدمهٔ ازدست‌رفته قابل جایگزینی نیستند؛ مراقب باش.</EmptyNote>
        ) : null}
      </Section>
    </div>
  );
}
