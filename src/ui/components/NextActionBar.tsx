import { nextAction } from '../nextAction';
import { sim, useSim } from '../../state/store';

/**
 * Command bar: one sentence about what matters right now, with a button that
 * jumps straight to the room or panel that fixes it.
 */
export function NextActionBar({
  onOpenRoom,
  onOpenPanel,
}: {
  onOpenRoom: (room: import('../../sim/types').RoomId) => void;
  onOpenPanel: (panel: import('../components/BottomNav').PanelId) => void;
}) {
  useSim();
  const action = nextAction(sim.state);

  const act = () => {
    if (action.room) onOpenRoom(action.room);
    else if (action.panel) onOpenPanel(action.panel);
  };

  return (
    <div className={`next-action next-action--${action.tone}`} role="status">
      <span className="next-action__dot" aria-hidden="true" />
      <div className="next-action__text">
        <strong>{action.label}</strong>
        <span>{action.reason}</span>
      </div>
      <button type="button" className="btn btn--sm btn--primary" onClick={act}>
        برو
      </button>
    </div>
  );
}
