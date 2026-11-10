import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from '../../game/createGame';
import { setRoomSelectHandler } from '../../game/bridge';
import type { RoomId } from '../../sim/types';

export function GameCanvas({ onSelectRoom }: { onSelectRoom: (room: RoomId) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onSelectRoom);
  handlerRef.current = onSelectRoom;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let game: Phaser.Game | null = null;
    let observer: ResizeObserver | null = null;

    setRoomSelectHandler((room) => handlerRef.current(room));

    const boot = async () => {
      // Phaser measures glyphs when the Text object is created; if Vazirmatn has
      // not loaded yet the canvas is sized for the fallback font and Persian
      // descenders get clipped. Load the real font first.
      try {
        await Promise.all([
          document.fonts.load('16px Vazirmatn'),
          document.fonts.load('700 16px Vazirmatn'),
          document.fonts.ready,
        ]);
      } catch {
        /* font loading is best-effort */
      }
      if (disposed || !hostRef.current) return;

      const target = hostRef.current;
      game = createGame(target);
      observer = new ResizeObserver(() => {
        if (!target.clientWidth || !target.clientHeight) return;
        game?.scale.resize(
          Math.max(320, target.clientWidth),
          Math.max(240, target.clientHeight),
        );
      });
      observer.observe(target);
    };

    void boot();

    return () => {
      disposed = true;
      observer?.disconnect();
      setRoomSelectHandler(null);
      game?.destroy(true);
    };
  }, []);

  return <div ref={hostRef} className="stage" id="game-stage" />;
}
