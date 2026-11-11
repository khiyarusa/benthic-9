import Phaser from 'phaser';
import { BootScene, StationScene } from './StationScene';

export const MAX_DPR = 2;

export function currentDpr(): number {
  return Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
}

export function createGame(parent: HTMLElement): Phaser.Game {
  const dpr = currentDpr();
  const cssW = Math.max(320, parent.clientWidth);
  const cssH = Math.max(220, parent.clientHeight);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#02080d',
    width: Math.round(cssW * dpr),
    height: Math.round(cssH * dpr),
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [BootScene, StationScene],
    render: {
      antialias: false,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    fps: { target: 60 },
    callbacks: {
      postBoot: (booted) => {
        (window as unknown as { __benthicGame?: Phaser.Game }).__benthicGame = booted;
      },
    },
  });

  game.registry.set('dpr', dpr);
  return game;
}
