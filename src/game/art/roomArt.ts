import { surface } from './painter';

/**
 * Pre-rendered 2.5D room art: a photographic render is cover-cropped into the
 * cutaway rectangle and colour-graded so every room shares one lighting model.
 */
export function paintRoomPhoto(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(Math.max(8, Math.round(w)), Math.max(8, Math.round(h)));
  const W = canvas.width;
  const H = canvas.height;

  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, dw, dh);

  // unify the palette: cold ambient + warm practicals, slightly crushed blacks
  ctx.globalCompositeOperation = 'multiply';
  const cold = ctx.createLinearGradient(0, 0, W, H);
  cold.addColorStop(0, 'rgba(150, 205, 222, 0.62)');
  cold.addColorStop(0.55, 'rgba(120, 172, 196, 0.58)');
  cold.addColorStop(1, 'rgba(70, 118, 144, 0.62)');
  ctx.fillStyle = cold;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'overlay';
  const warm = ctx.createRadialGradient(W * 0.32, H * 0.28, 0, W * 0.32, H * 0.28, Math.max(W, H) * 0.8);
  warm.addColorStop(0, 'rgba(255, 196, 120, 0.22)');
  warm.addColorStop(1, 'rgba(20, 60, 90, 0.05)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'source-over';
  // vignette keeps the eye inside the room, matching the cutaway framing
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(2, 8, 12, 0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // a thin scanline layer sells the "screen render" without being pixel art
  ctx.globalAlpha = 0.035;
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, W, 1);
  }
  ctx.globalAlpha = 1;

  return canvas;
}


/**
 * A crew member on the cutaway: a photographic head-and-shoulders disc with a
 * role-coloured ring, so the map shows real people instead of cartoon dolls.
 */
export function paintCrewDisc(img: HTMLImageElement, size = 96, ring = '#4fe0e6'): HTMLCanvasElement {
  const { canvas, ctx } = surface(size, size);
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  // crop the portrait to the face area, keeping the head centred
  const faceH = Math.min(img.height, img.width * 1.05);
  const sy = img.height * 0.06;
  const sx = Math.max(0, (img.width - faceH) / 2);
  ctx.drawImage(img, sx, sy, Math.min(img.width, faceH), faceH, 0, 0, size, size);
  const shade = ctx.createLinearGradient(0, 0, 0, size);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(2, 10, 14, 0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(2, 10, 14, 0.9)';
  ctx.beginPath();
  ctx.arc(r, r, r - 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(r, r, r - 5, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}
