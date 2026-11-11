import Phaser from 'phaser';
import { DiveScene } from './DiveScene';
import type { DiveTheme } from './scenery';

export interface DiveHandle {
  game: Phaser.Game;
  /** The scene is created asynchronously by Phaser, so resolve it lazily. */
  getScene: () => DiveScene | null;
}

export function createDiveGame(
  parent: HTMLElement,
  themeId: DiveTheme['id'],
  battery: number,
  hull: number,
): DiveHandle {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const cssW = Math.max(320, parent.clientWidth);
  const cssH = Math.max(220, parent.clientHeight);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.round(cssW * dpr),
    height: Math.round(cssH * dpr),
    backgroundColor: '#02080d',
    scale: { mode: Phaser.Scale.NONE },
    render: { antialias: false, roundPixels: true, powerPreference: 'high-performance' },
    scene: [DiveScene],
  });

  // Phaser auto-starts the first scene in the array; hand it the parameters
  // through the registry so a second `scene.start` cannot reset the dive.
  game.registry.set('dpr', dpr);
  game.registry.set('diveTheme', themeId);
  game.registry.set('diveBattery', battery);
  game.registry.set('diveHull', hull);

  return {
    game,
    getScene: () => {
      const scene = game.scene.getScene('dive');
      return (scene as DiveScene | null) ?? null;
    },
  };
}
