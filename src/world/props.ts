import * as THREE from 'three';
import type { SubjectId } from '../types';

// Geometry helpers for the Overcooked-style toy world: chunky flat-shaded
// primitives, a shared toon-material cache and canvas-texture text panels.

const materialCache = new Map<number, THREE.MeshToonMaterial>();

export function mat(color: number): THREE.MeshToonMaterial {
  let m = materialCache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color });
    materialCache.set(color, m);
  }
  return m;
}

export function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

export function cyl(
  rTop: number,
  rBottom: number,
  h: number,
  color: number,
  seg = 18,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat(color));
}

export function sph(r: number, color: number, seg = 16): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), mat(color));
}

export function cone(r: number, h: number, color: number, seg = 18): THREE.Mesh {
  return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color));
}

export function torus(r: number, tube: number, color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 24), mat(color));
}

/** Soft dark disc used instead of shadow maps. */
export function blobShadow(r: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 20),
    new THREE.MeshBasicMaterial({ color: 0x1b2a20, transparent: true, opacity: 0.28 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

export interface TextPanelOptions {
  /** World height of the panel; width follows the text aspect. */
  height?: number;
  bg?: string;
  fg?: string;
  fontPx?: number;
  bold?: boolean;
  /** Padding and rounded "card" frame, Overcooked menu style. */
  framed?: boolean;
}

/** Double-sided plane with crisp canvas text, used for signs and answer gates. */
export function textPanel(text: string, opts: TextPanelOptions = {}): THREE.Mesh {
  const fontPx = opts.fontPx ?? 72;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${opts.bold === false ? '' : 'bold '}${fontPx}px "Trebuchet MS", sans-serif`;
  const lines = text.split('\n');
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const pad = opts.framed === false ? 12 : 36;
  canvas.width = Math.ceil(textW + pad * 2);
  canvas.height = Math.ceil(fontPx * 1.25 * lines.length + pad * 2);

  if (opts.framed !== false) {
    ctx.fillStyle = opts.bg ?? '#fff8ea';
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 28);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3a2c22';
    roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 26);
    ctx.stroke();
  } else if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.font = `${opts.bold === false ? '' : 'bold '}${fontPx}px "Trebuchet MS", sans-serif`;
  ctx.fillStyle = opts.fg ?? '#3a2c22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    ctx.fillText(l, canvas.width / 2, pad + fontPx * 1.25 * (i + 0.5));
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const h = opts.height ?? 1.6;
  const w = (h * canvas.width) / canvas.height;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Fat toy tree: stubby trunk + big leaf ball(s). */
export function tree(scale = 1, leaf = 0x4cae4f): THREE.Group {
  const g = new THREE.Group();
  const trunk = cyl(0.35 * scale, 0.45 * scale, 1.2 * scale, 0x8a5a33, 10);
  trunk.position.y = 0.6 * scale;
  const ball = sph(1.25 * scale, leaf, 12);
  ball.position.y = 2.1 * scale;
  ball.scale.y = 0.9;
  const ball2 = sph(0.7 * scale, leaf, 10);
  ball2.position.set(0.7 * scale, 1.5 * scale, 0.3 * scale);
  g.add(trunk, ball, ball2, blobShadow(1.1 * scale));
  return g;
}

export function lamp(accent: number): THREE.Group {
  const g = new THREE.Group();
  const post = cyl(0.09, 0.13, 2.6, 0x4a4458, 8);
  post.position.y = 1.3;
  const head = sph(0.32, 0xffe9a8, 10);
  head.position.y = 2.75;
  const cap = cone(0.4, 0.35, accent, 10);
  cap.position.y = 3.05;
  g.add(post, head, cap, blobShadow(0.45));
  return g;
}

export function bench(): THREE.Group {
  const g = new THREE.Group();
  const seat = box(1.8, 0.16, 0.6, 0xb98045);
  seat.position.y = 0.5;
  const back = box(1.8, 0.5, 0.12, 0xb98045);
  back.position.set(0, 0.85, -0.26);
  for (const sx of [-0.7, 0.7]) {
    const leg = box(0.16, 0.5, 0.5, 0x6e4a26);
    leg.position.set(sx, 0.25, 0);
    g.add(leg);
  }
  g.add(seat, back, blobShadow(1.0));
  return g;
}

/** Triumphal little gate arch used for stations and the arcade gates. */
export function gateArch(width: number, height: number, color: number): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-width / 2, width / 2]) {
    const post = cyl(0.28, 0.34, height, color, 12);
    post.position.set(sx, height / 2, 0);
    g.add(post);
  }
  const bar = box(width + 1.0, 0.55, 0.55, color);
  bar.position.y = height + 0.2;
  g.add(bar);
  return g;
}

// ---------------------------------------------------------------------------
// Zone landmarks. Each builder returns a group plus an optional per-frame
// animation hook driven by world.update().
// ---------------------------------------------------------------------------

export interface Landmark {
  group: THREE.Group;
  update?: (dt: number, t: number) => void;
}

export function buildLandmark(subject: SubjectId, accent: number): Landmark {
  switch (subject) {
    case 'math':
      return mathLandmark(accent);
    case 'english':
      return englishLandmark(accent);
    case 'physics':
      return physicsLandmark(accent);
    case 'chemistry':
      return chemistryLandmark(accent);
    case 'biology':
      return biologyLandmark(accent);
    case 'econs':
      return econsLandmark(accent);
    case 'gp':
      return gpLandmark(accent);
  }
}

/** Giant pi symbol on a stepped pyramid. */
function mathLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const steps = [7, 5.4, 3.8];
  steps.forEach((s, i) => {
    const step = box(s, 0.8, s, i % 2 ? 0xe8e2d2 : 0xd8d0bb);
    step.position.y = 0.4 + i * 0.8;
    g.add(step);
  });
  const pi = new THREE.Group();
  const barTop = box(3.2, 0.55, 0.55, accent);
  barTop.position.y = 3.0;
  const legL = box(0.55, 3.0, 0.55, accent);
  legL.position.set(-1.0, 1.5, 0);
  const legR = box(0.55, 3.0, 0.55, accent);
  legR.position.set(1.0, 1.5, 0);
  pi.add(barTop, legL, legR);
  pi.position.y = 2.4;
  g.add(pi, blobShadow(4));
  return { group: g, update: (_dt, t) => (pi.rotation.y = t * 0.4) };
}

/** Mini library with columns and a giant open book. */
function englishLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const base = box(7, 0.6, 5, 0xd8d0bb);
  base.position.y = 0.3;
  const hall = box(5.6, 3.2, 3.6, 0xefe6cf);
  hall.position.y = 2.2;
  const roof = box(7.2, 0.7, 5.2, accent);
  roof.position.y = 4.0;
  g.add(base, hall, roof);
  for (const sx of [-2.4, -0.8, 0.8, 2.4]) {
    const col = cyl(0.28, 0.32, 3.2, 0xfffaf0, 10);
    col.position.set(sx, 2.2, 2.1);
    g.add(col);
  }
  const book = new THREE.Group();
  const left = box(2.2, 0.25, 1.6, 0xfffdf5);
  left.rotation.z = 0.35;
  left.position.x = -1.0;
  const right = box(2.2, 0.25, 1.6, 0xfffdf5);
  right.rotation.z = -0.35;
  right.position.x = 1.0;
  const spine = box(0.4, 0.5, 1.6, accent);
  book.add(left, right, spine);
  book.position.y = 5.2;
  g.add(book, blobShadow(4));
  return { group: g, update: (_dt, t) => (book.position.y = 5.2 + Math.sin(t * 1.4) * 0.25) };
}

/** Pendulum tower plus a chunky rocket. */
function physicsLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const tower = box(0.9, 6.2, 0.9, 0xcfc6e8);
  tower.position.y = 3.1;
  const armPivot = new THREE.Group();
  const rod = cyl(0.08, 0.08, 3.4, 0x4a4458, 8);
  rod.position.y = -1.7;
  const bob = sph(0.7, accent, 14);
  bob.position.y = -3.5;
  armPivot.add(rod, bob);
  armPivot.position.y = 6.0;
  g.add(tower, armPivot);

  const rocket = new THREE.Group();
  const bodyR = cyl(0.7, 0.7, 2.6, 0xf3f0ff, 14);
  bodyR.position.y = 2.0;
  const nose = cone(0.7, 1.2, accent, 14);
  nose.position.y = 3.9;
  for (let i = 0; i < 3; i++) {
    const fin = box(0.18, 1.1, 0.9, accent);
    const a = (i / 3) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.75, 1.0, Math.sin(a) * 0.75);
    fin.rotation.y = -a;
    rocket.add(fin);
  }
  rocket.add(bodyR, nose, blobShadow(1.2));
  rocket.position.set(3.4, 0, 1.5);
  g.add(rocket, blobShadow(1.4));
  return {
    group: g,
    update: (_dt, t) => {
      armPivot.rotation.z = Math.sin(t * 1.5) * 0.55;
    },
  };
}

/** Giant conical flask with looping bubbles. */
function chemistryLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const body = cone(2.6, 4.2, accent, 20);
  body.position.y = 2.1;
  const neck = cyl(0.7, 0.7, 1.6, accent, 14);
  neck.position.y = 4.9;
  const lip = cyl(0.95, 0.95, 0.35, 0xfffaf0, 14);
  lip.position.y = 5.8;
  g.add(body, neck, lip, blobShadow(2.8));
  const bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const b = sph(0.28 + (i % 3) * 0.09, 0xbef3d4, 10);
    g.add(b);
    bubbles.push(b);
  }
  return {
    group: g,
    update: (_dt, t) => {
      bubbles.forEach((b, i) => {
        const phase = t * 0.9 + i * 1.3;
        const y = 5.5 + ((phase % 3) / 3) * 3.5;
        b.position.set(Math.sin(phase * 2) * 0.5, y, Math.cos(phase * 2) * 0.5);
      });
    },
  };
}

/** Rotating DNA double helix beside an oversized tree. */
function biologyLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const helix = new THREE.Group();
  const turns = 2.2;
  const beads = 16;
  for (let i = 0; i < beads; i++) {
    const f = i / (beads - 1);
    const a = f * Math.PI * 2 * turns;
    const y = 0.6 + f * 5.6;
    const b1 = sph(0.3, accent, 10);
    b1.position.set(Math.cos(a) * 1.1, y, Math.sin(a) * 1.1);
    const b2 = sph(0.3, 0xfff2b8, 10);
    b2.position.set(-Math.cos(a) * 1.1, y, -Math.sin(a) * 1.1);
    helix.add(b1, b2);
    if (i % 2 === 0) {
      const rung = box(2.0, 0.14, 0.14, 0xe8e2d2);
      rung.position.y = y;
      rung.rotation.y = -a;
      helix.add(rung);
    }
  }
  g.add(helix, blobShadow(2));
  const bigTree = tree(2.1, 0x57c75b);
  bigTree.position.set(4.2, 0, 1.2);
  g.add(bigTree);
  return { group: g, update: (_dt, t) => (helix.rotation.y = t * 0.5) };
}

/** Bank facade, giant $ sign and a rising 3D bar chart. */
function econsLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  const base = box(7, 0.7, 4.6, 0xd8d0bb);
  base.position.y = 0.35;
  const hall = box(5.8, 3.0, 3.4, 0xf2ead4);
  hall.position.y = 2.2;
  const roofE = box(7.4, 0.8, 5.0, accent);
  roofE.position.y = 4.1;
  g.add(base, hall, roofE);
  for (const sx of [-2.4, -1.2, 0, 1.2, 2.4]) {
    const col = cyl(0.24, 0.28, 3.0, 0xfffaf0, 10);
    col.position.set(sx, 2.2, 2.0);
    g.add(col);
  }
  const dollar = textPanel('$', { height: 2.4, framed: false, fg: '#f7b733', fontPx: 160 });
  dollar.position.y = 5.8;
  g.add(dollar);
  const heights = [0.8, 1.4, 2.0, 2.7, 3.5];
  heights.forEach((h, i) => {
    const bar = box(0.8, h, 0.8, i === heights.length - 1 ? accent : 0x86c98f);
    bar.position.set(4.6, h / 2, -1.6 + i * 1.0);
    g.add(bar);
  });
  g.add(blobShadow(4));
  return { group: g, update: (_dt, t) => (dollar.rotation.y = t * 0.8) };
}

/** Amphitheatre with podium and spinning globe. */
function gpLandmark(accent: number): Landmark {
  const g = new THREE.Group();
  for (let ring = 0; ring < 3; ring++) {
    const r = 3.0 + ring * 1.2;
    const segs = 7 + ring * 2;
    for (let i = 0; i < segs; i++) {
      const a = Math.PI * 0.25 + (i / (segs - 1)) * Math.PI * 0.5;
      const seat = box(1.4, 0.45 + ring * 0.3, 0.7, 0xe8e2d2);
      seat.position.set(Math.cos(a) * r, (0.45 + ring * 0.3) / 2, Math.sin(a) * r);
      seat.rotation.y = -a + Math.PI / 2;
      g.add(seat);
    }
  }
  const podium = box(1.2, 1.3, 1.0, accent);
  podium.position.set(0, 0.65, 0);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), mat(0x6fb7e8));
  globe.position.y = 2.6;
  g.add(podium, globe, blobShadow(3));
  return { group: g, update: (_dt, t) => (globe.rotation.y = t * 0.6) };
}
