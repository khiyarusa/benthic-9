import Phaser from 'phaser';
import { BootScene, StationScene } from './StationScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  const width = Math.max(320, parent.clientWidth);
  const height = Math.max(240, parent.clientHeight);

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#03101a',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },
    scene: [BootScene, StationScene],
    render: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    fps: { target: 60 },
    callbacks: {
      postBoot: (game) => {
        (window as unknown as { __benthicGame?: Phaser.Game }).__benthicGame = game;
      },
    },
  });
}
