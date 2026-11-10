import { useEffect, useRef, useState } from 'react';
import { playAlarm, playClick } from '../audio/sfx';
import { saveGame, savedAt } from '../sim/save';
import type { GameMode } from '../sim/types';
import { continueGame, sim, startNewGame } from '../state/store';
import { GameScreen } from './screens/GameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { OrientationGate } from './components/OrientationGate';

const AUTOSAVE_INTERVAL_MS = 30_000;

export default function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const lastIncidentRef = useRef<string>('');

  useEffect(() => {
    const timer = window.setInterval(() => sim.advance(0.25), 250);

    const onVisibility = () => {
      if (document.hidden && !sim.state.paused) sim.setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const state = sim.state;
      if (state.paused || state.gameOver) return;
      let autosave = true;
      try {
        autosave = localStorage.getItem('benthic9.autosave') !== 'off';
      } catch {
        autosave = true;
      }
      if (!autosave) return;
      const last = savedAt();
      if (!last || Date.now() - last > AUTOSAVE_INTERVAL_MS) saveGame(state);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.btn, .nav-btn, .tab, .room-card, .depth-btn, .switch, .speed-btn, .sheet__close')) {
        playClick();
      }
    };
    document.addEventListener('pointerdown', onClick);
    return () => document.removeEventListener('pointerdown', onClick);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const state = sim.state;
      const latest = state.incidentLog[0];
      if (!latest) return;
      const key = `${latest.minute}-${latest.text}`;
      if (key !== lastIncidentRef.current) {
        lastIncidentRef.current = key;
        if (latest.severity === 'critical') playAlarm();
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, []);

  const handleStart = (mode: GameMode) => {
    startNewGame(mode);
    setScreen('game');
  };

  const handleContinue = () => {
    if (continueGame()) setScreen('game');
    else handleStart('campaign');
  };

  return (
    <div className="shell">
      <OrientationGate />
      {screen === 'title' ? (
        <TitleScreen onStart={handleStart} onContinue={handleContinue} />
      ) : (
        <GameScreen onQuit={() => setScreen('title')} onRestart={handleStart} />
      )}
    </div>
  );
}
