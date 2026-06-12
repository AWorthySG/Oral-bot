import * as THREE from 'three';
import type { Colliders } from '../collision';
import type { Interactions } from '../interaction';
import type { MinigameKind, SubjectId } from '../types';
import { blobShadow, box, buildLandmark, cyl, gateArch, textPanel, type Landmark } from './props';
import { ZONE_RADIUS, ZONE_RING_RADIUS, type ZoneConfig } from './zoneConfigs';

export interface ZoneDeps {
  scene: THREE.Scene;
  colliders: Colliders;
  interactions: Interactions;
  isZoneUnlocked: (subject: SubjectId) => boolean;
  openStation: (subject: SubjectId, kind: MinigameKind) => void;
}

interface StationDef {
  kind: MinigameKind;
  label: string;
  /** Offset in the zone frame: u = toward the hub, v = sideways. */
  u: number;
  v: number;
}

const STATIONS: StationDef[] = [
  { kind: 'quiz', label: 'Quiz', u: 5, v: -11 },
  { kind: 'match', label: 'Matching', u: 11, v: -4 },
  { kind: 'balance', label: 'Puzzle', u: 11, v: 4 },
  { kind: 'arcade', label: 'Arcade', u: 5, v: 11 },
];

export class Zone {
  readonly config: ZoneConfig;
  readonly center: THREE.Vector3;
  private deps: ZoneDeps;
  private group = new THREE.Group();
  private landmark: Landmark;
  private sign: THREE.Mesh;
  private barrier: THREE.Mesh | null = null;
  private lockSign: THREE.Mesh | null = null;
  private unlockTimer = -1;

  constructor(config: ZoneConfig, deps: ZoneDeps, startLocked: boolean) {
    this.config = config;
    this.deps = deps;
    const a = (config.angleDeg * Math.PI) / 180;
    this.center = new THREE.Vector3(
      Math.cos(a) * ZONE_RING_RADIUS,
      0,
      Math.sin(a) * ZONE_RING_RADIUS,
    );
    // Zone frame: u points from the zone centre toward the hub, v is sideways.
    const uAxis = this.center.clone().multiplyScalar(-1).normalize();
    const vAxis = new THREE.Vector3(-uAxis.z, 0, uAxis.x);
    const at = (u: number, v: number) =>
      this.center
        .clone()
        .addScaledVector(uAxis, u)
        .addScaledVector(vAxis, v);

    // Coloured ground disc.
    const disc = cyl(ZONE_RADIUS, ZONE_RADIUS + 1.5, 0.18, config.groundColor, 36);
    disc.position.copy(this.center);
    disc.position.y = 0.05;
    this.group.add(disc);

    // Floating subject sign above the centre.
    this.sign = textPanel(config.name, { height: 2.2 });
    this.sign.position.copy(this.center);
    this.sign.position.y = 9.5;
    this.group.add(this.sign);

    // Landmark at the rear of the zone.
    this.landmark = buildLandmark(config.subject, config.accentColor);
    this.landmark.group.position.copy(at(-9, 0));
    this.landmark.group.rotation.y = Math.atan2(uAxis.x, uAxis.z);
    this.group.add(this.landmark.group);
    deps.colliders.add(`zone:${config.subject}:landmark`, at(-9, 0).x, at(-9, 0).z, 4.5);

    for (const s of STATIONS) {
      this.buildStation(s, at(s.u, s.v), uAxis);
    }

    if (startLocked) {
      this.buildBarrier(at(ZONE_RADIUS, 0), uAxis);
    }

    deps.scene.add(this.group);
  }

  private buildStation(def: StationDef, pos: THREE.Vector3, uAxis: THREE.Vector3): void {
    const { config, deps } = this;
    const g = new THREE.Group();
    g.position.copy(pos);
    g.rotation.y = Math.atan2(uAxis.x, uAxis.z);

    if (def.kind === 'quiz') {
      const base = box(1.6, 1.0, 1.2, config.accentColor);
      base.position.y = 0.5;
      const top = box(1.8, 0.25, 1.5, 0xfff8ea);
      top.position.y = 1.1;
      top.rotation.x = -0.18;
      const q = textPanel('?', { height: 1.0, fontPx: 130 });
      q.position.y = 2.3;
      g.add(base, top, q, blobShadow(1.2));
    } else if (def.kind === 'match') {
      const table = box(2.2, 0.18, 1.4, 0xb98045);
      table.position.y = 0.85;
      for (const [sx, sz] of [
        [-0.9, -0.5],
        [0.9, -0.5],
        [-0.9, 0.5],
        [0.9, 0.5],
      ] as const) {
        const leg = box(0.16, 0.85, 0.16, 0x6e4a26);
        leg.position.set(sx, 0.42, sz);
        g.add(leg);
      }
      for (let i = 0; i < 4; i++) {
        const card = box(0.42, 0.1, 0.6, i % 2 ? 0xfff8ea : config.accentColor);
        card.position.set(-0.75 + i * 0.5, 0.99, (i % 2) * 0.3 - 0.15);
        card.rotation.y = i * 0.25;
        g.add(card);
      }
      g.add(table, blobShadow(1.4));
    } else if (def.kind === 'balance') {
      const table = box(2.0, 0.18, 1.4, 0xb98045);
      table.position.y = 0.85;
      for (const [sx, sz] of [
        [-0.8, -0.5],
        [0.8, -0.5],
        [-0.8, 0.5],
        [0.8, 0.5],
      ] as const) {
        const leg = box(0.16, 0.85, 0.16, 0x6e4a26);
        leg.position.set(sx, 0.42, sz);
        g.add(leg);
      }
      for (let i = 0; i < 3; i++) {
        const cube = box(0.4, 0.4, 0.4, config.accentColor);
        cube.position.set(-0.55 + i * 0.55, 1.14, 0);
        cube.rotation.y = i * 0.4;
        g.add(cube);
      }
      g.add(table, blobShadow(1.3));
    } else {
      const arch = gateArch(3.2, 2.8, config.accentColor);
      g.add(arch);
      const star = textPanel('GO!', { height: 0.8 });
      star.position.y = 3.7;
      g.add(star, blobShadow(1.8));
    }

    const label = textPanel(def.label, { height: 0.8 });
    label.position.y = def.kind === 'arcade' ? 4.6 : 3.1;
    g.add(label);

    this.group.add(g);
    if (def.kind !== 'arcade') {
      deps.colliders.add(`zone:${config.subject}:station:${def.kind}`, pos.x, pos.z, 1.4);
    }
    deps.interactions.add({
      id: `station:${config.subject}:${def.kind}`,
      x: pos.x,
      z: pos.z,
      radius: 3.4,
      prompt: () => `Play ${config.name} ${def.label}`,
      enabled: () => deps.isZoneUnlocked(config.subject),
      onInteract: () => deps.openStation(config.subject, def.kind),
    });
  }

  private buildBarrier(entrancePos: THREE.Vector3, uAxis: THREE.Vector3): void {
    const { config, deps } = this;
    const wallR = ZONE_RADIUS + 1;
    this.barrier = new THREE.Mesh(
      new THREE.CylinderGeometry(wallR, wallR, 9, 40, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff4d5e,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.barrier.position.copy(this.center);
    this.barrier.position.y = 4.5;
    this.group.add(this.barrier);

    this.lockSign = textPanel(`LOCKED\n${config.requirementText ?? ''}`, {
      height: 3.0,
      bg: '#ffe2e2',
      fg: '#a33',
    });
    this.lockSign.position.copy(entrancePos).addScaledVector(uAxis, 2.5);
    this.lockSign.position.y = 3.6;
    this.lockSign.lookAt(0, 3.6, 0);
    this.group.add(this.lockSign);

    const n = 24;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      deps.colliders.add(
        `zone:${config.subject}:lock:${i}`,
        this.center.x + Math.cos(a) * wallR,
        this.center.z + Math.sin(a) * wallR,
        3.2,
      );
    }
  }

  /** Drop the barrier with a short fade/sink animation. */
  unlock(): void {
    if (!this.barrier || this.unlockTimer >= 0) return;
    this.deps.colliders.removeByPrefix(`zone:${this.config.subject}:lock`);
    this.unlockTimer = 0;
  }

  update(dt: number, t: number): void {
    this.sign.position.y = 9.5 + Math.sin(t * 1.2 + this.center.x) * 0.3;
    this.sign.lookAt(0, this.sign.position.y, 0);
    this.sign.rotateY(Math.PI);
    this.landmark.update?.(dt, t);

    if (this.unlockTimer >= 0 && this.barrier) {
      this.unlockTimer += dt;
      const f = Math.min(this.unlockTimer / 1.6, 1);
      (this.barrier.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - f);
      this.barrier.position.y = 4.5 - f * 8;
      if (this.lockSign) {
        (this.lockSign.material as THREE.MeshBasicMaterial).opacity = 1 - f;
        (this.lockSign.material as THREE.MeshBasicMaterial).transparent = true;
      }
      if (f >= 1) {
        this.group.remove(this.barrier);
        if (this.lockSign) this.group.remove(this.lockSign);
        this.barrier = null;
        this.lockSign = null;
      }
    }
  }
}
