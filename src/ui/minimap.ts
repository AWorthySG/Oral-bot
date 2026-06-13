import type { Progression } from '../progression/progression';
import { SUBJECT_SHORT } from '../types';
import { ZONE_CONFIGS, ZONE_RING_RADIUS } from '../world/zoneConfigs';
import { ISLAND_RADIUS } from '../world/world';

// A small top-right radar showing the island, the seven zones (locked ones
// dimmed with a padlock), and the player as a heading arrow.

const SIZE = 150;
const PAD = 12;

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale = (SIZE / 2 - PAD) / ISLAND_RADIUS;

  constructor(root: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'minimap';
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    this.ctx = this.canvas.getContext('2d')!;
    root.appendChild(this.canvas);
  }

  private toScreen(x: number, z: number): [number, number] {
    // World +x = right, world +z = down on the radar.
    return [SIZE / 2 + x * this.scale, SIZE / 2 + z * this.scale];
  }

  update(px: number, pz: number, facing: number, p: Progression): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Island disc.
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - PAD + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(126, 200, 80, 0.85)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a2c22';
    ctx.stroke();

    // Hub marker.
    const [hx, hy] = this.toScreen(0, 0);
    ctx.beginPath();
    ctx.arc(hx, hy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f3e2b8';
    ctx.fill();

    // Zone dots.
    for (const cfg of ZONE_CONFIGS) {
      const a = (cfg.angleDeg * Math.PI) / 180;
      const zx = Math.cos(a) * ZONE_RING_RADIUS;
      const zz = Math.sin(a) * ZONE_RING_RADIUS;
      const [sx, sy] = this.toScreen(zx, zz);
      const open = p.isZoneUnlocked(cfg.subject);
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = open ? `#${cfg.accentColor.toString(16).padStart(6, '0')}` : '#9a9181';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3a2c22';
      ctx.stroke();
      ctx.fillStyle = open ? '#fff8ea' : '#5a5142';
      ctx.font = 'bold 8px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(open ? SUBJECT_SHORT[cfg.subject] : '🔒', sx, sy + 0.5);
    }

    // Player heading arrow.
    const [ax, ay] = this.toScreen(px, pz);
    const dx = Math.sin(facing);
    const dz = Math.cos(facing);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(Math.atan2(dx, -dz));
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fillStyle = '#e25563';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
  }
}
