import { useEffect, useState } from 'react';
import { ROOM_LABEL, fa, stationClock } from '../../sim';
import { stationAlerts } from '../../sim/derived';
import { sim, useSim } from '../../state/store';
import { track } from '../../state/telemetry';
import type { GameMode, RoomId } from '../../sim/types';
import { BottomNav, type PanelId } from '../components/BottomNav';
import { GameCanvas } from '../components/GameCanvas';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import { OverviewPanel } from '../panels/OverviewPanel';
import { RoomPanel } from '../panels/RoomPanel';
import { PowerPanel } from '../panels/PowerPanel';
import { LifePanel } from '../panels/LifePanel';
import { CrewPanel } from '../panels/CrewPanel';
import { LogisticsPanel } from '../panels/LogisticsPanel';
import { ResearchPanel } from '../panels/ResearchPanel';
import { ExplorationPanel } from '../panels/ExplorationPanel';
import { ReportsPanel } from '../panels/ReportsPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { HelpPanel } from '../panels/HelpPanel';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { NextActionBar } from '../components/NextActionBar';

const PANEL_TITLES: Record<PanelId, string> = {
  overview: 'نمای ایستگاه',
  power: 'مدیریت برق',
  life: 'پشتیبانی حیات',
  crew: 'خدمه و وظایف',
  storage: 'انبار و تولید',
  research: 'پژوهش و فناوری',
  rov: 'اکتشاف با ROV',
  log: 'گزارش‌ها و تنظیمات',
  help: 'راهنمای فرمانده',
};

const MODE_LABEL: Record<GameMode, string> = {
  campaign: 'کمپین',
  endless: 'بقای بی‌پایان',
  challenge: 'چالش سیل',
};

export function GameScreen({ onQuit, onRestart }: { onQuit: () => void; onRestart: (mode: GameMode) => void }) {
  useSim();
  const state = sim.state;
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [room, setRoom] = useState<RoomId | null>(null);
  const [logTab, setLogTab] = useState<'reports' | 'settings'>('reports');
  const [victoryDismissed, setVictoryDismissed] = useState(false);

  const alerts = stationAlerts(state);
  const criticalCount = alerts.filter((alert) => alert.level === 'critical').length;

  useEffect(() => {
    const closeAll = () => {
      setPanel(null);
      setRoom(null);
    };
    window.addEventListener('benthic:close-overlays', closeAll);
    return () => window.removeEventListener('benthic:close-overlays', closeAll);
  }, []);

  const openPanel = (id: PanelId) => {
    setRoom(null);
    setLogTab('reports');
    track(`panel:${id}`);
    setPanel((current) => (current === id ? null : id));
  };

  const openRoom = (id: RoomId) => {
    setPanel(null);
    setRoom(id);
    track('room:open');
  };

  const content = (() => {
    switch (panel) {
      case 'overview':
        return <OverviewPanel onOpenRoom={openRoom} onOpenPanel={openPanel} />;
      case 'power':
        return <PowerPanel />;
      case 'life':
        return <LifePanel />;
      case 'crew':
        return <CrewPanel />;
      case 'storage':
        return <LogisticsPanel />;
      case 'research':
        return <ResearchPanel />;
      case 'rov':
        return <ExplorationPanel />;
      case 'help':
        return <HelpPanel />;
      case 'log':
        return (
          <div>
            <div className="tabs" style={{ marginBottom: 8 }}>
              <button type="button" className={`tab ${logTab === 'reports' ? 'is-active' : ''}`} onClick={() => setLogTab('reports')}>
                گزارش‌ها
              </button>
              <button type="button" className={`tab ${logTab === 'settings' ? 'is-active' : ''}`} onClick={() => setLogTab('settings')}>
                تنظیمات
              </button>
            </div>
            {logTab === 'reports' ? <ReportsPanel /> : <SettingsPanel onQuit={onQuit} />}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <TopBar onOpenLog={() => openPanel('log')} />

      <div className="stage-area">
        <GameCanvas onSelectRoom={openRoom} />
        <NextActionBar onOpenRoom={openRoom} onOpenPanel={openPanel} />
        <TutorialOverlay />
      </div>

      <BottomNav
        active={room ? null : panel}
        onSelect={openPanel}
        badge={{
          overview: criticalCount,
          log: Math.min(9, state.incidents.filter((entry) => entry.minute > state.minute - 60).length),
        }}
      />

      {room ? (
        <Sheet title={ROOM_LABEL[room]} onClose={() => setRoom(null)}>
          <RoomPanel roomId={room} />
        </Sheet>
      ) : null}

      {panel ? (
        <Sheet
          title={PANEL_TITLES[panel]}
          onClose={() => setPanel(null)}
          extra={<span className="chip">{MODE_LABEL[state.mode]}</span>}
        >
          {content}
        </Sheet>
      ) : null}

      {state.victory && !victoryDismissed ? (
        <div className="modal-center">
          <div className="modal-card">
            <h3>کمپین کامل شد</h3>
            <p>
              ایستگاه در عمق ۵۸۰۰ متری پایدار ماند، پژوهش‌ها تکمیل شد و نمونه‌های اعماق به
              آزمایشگاه رسیدند. می‌توانی به مدیریت ایستگاه ادامه بدهی.
            </p>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
              <button type="button" className="btn btn--primary" onClick={() => setVictoryDismissed(true)}>
                ادامهٔ مدیریت
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.gameOver ? (
        <div className="modal-center">
          <div className="modal-card">
            <h3>مأموریت پایان یافت</h3>
            <p>{state.gameOverReason ?? 'ایستگاه از کار افتاد.'}</p>
            <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--primary" onClick={() => onRestart(state.mode)}>
                مأموریت تازه
              </button>
              <button type="button" className="btn btn--ghost" onClick={onQuit}>
                منوی اصلی
              </button>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              دوام: {fa(state.minute)} دقیقهٔ بازی • تعمیرها: {fa(state.stats.repairs)} • رویدادهای
              مهارشده: {fa(state.stats.incidentsResolved)} • {stationClock(state.minute).label}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
