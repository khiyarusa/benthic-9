import { useEffect, useRef, useState } from 'react';
import { isAudioEnabled, playClick } from '../audio/sfx';
import { isMixEnabled, setMixEnabled, unlockAudio } from '../audio/mixer';
import { applyScene, narrate, tickAudio } from '../audio/director';
import { Narrator } from './components/Narrator';
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

  // The audio graph can only start after a real gesture, so unlock on the
  // first pointer event and never again.
  useEffect(() => {
    const startAudio = () => {
      unlockAudio();
      setMixEnabled(isAudioEnabled());
      document.removeEventListener('pointerdown', startAudio);
    };
    document.addEventListener('pointerdown', startAudio);
    return () => document.removeEventListener('pointerdown', startAudio);
  }, []);

  // Adaptive bed: menu, calm station, tension, emergency and dive each have
  // their own music; the director swaps them with a crossfade.
  useEffect(() => {
    if (!isMixEnabled()) return;
    applyScene(screen === 'title' ? 'menu' : 'calm');
    const timer = window.setInterval(() => {
      if (screen === 'game') tickAudio(sim.state);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== 'title' || !isMixEnabled()) return;
    const intro = window.setTimeout(() => applyScene('menu'), 400);
    return () => window.clearTimeout(intro);
  }, [screen]);

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
        if (latest.severity === 'critical') void narrate('emergency');
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, []);

  const handleStart = (mode: GameMode) => {
    startNewGame(mode);
    setScreen('game');
    if (mode === 'campaign') window.setTimeout(() => void narrate('intro'), 700);
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
      <Narrator />
    </div>
  );
}
