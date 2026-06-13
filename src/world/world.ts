import * as THREE from 'three';
import type { Colliders } from '../collision';
import type { Interactions } from '../interaction';
import type { MinigameKind, SubjectId } from '../types';
import { blobShadow, box, cyl, lamp, mat, sph, textPanel, tree } from './props';
import { Zone } from './zone';
import { ZONE_CONFIGS, ZONE_RING_RADIUS } from './zoneConfigs';

export const ISLAND_RADIUS = 110;
export const PLAYER_BOUND_RADIUS = 104;

export interface WorldDeps {
  scene: THREE.Scene;
  colliders: Colliders;
  interactions: Interactions;
  isZoneUnlocked: (subject: SubjectId) => boolean;
  openStation: (subject: SubjectId, kind: MinigameKind) => void;
  openReportCard: () => void;
}

/** The toy-diorama island: ground slab, hub plaza, paths, props and 7 zones. */
export class World {
  readonly zones = new Map<SubjectId, Zone>();
  private water: THREE.Mesh;
  private t = 0;

  constructor(deps: WorldDeps) {
    const { scene, colliders, interactions } = deps;

    scene.background = new THREE.Color(0x8fd3f4);
    scene.fog = new THREE.Fog(0x8fd3f4, 120, 320);
    scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x9bbf6a, 1.15));
    const sun = new THREE.DirectionalLight(0xfff3d6, 1.6);
    sun.position.set(60, 90, 40);
    scene.add(sun);

    // Floating island slab: grassy top, earthy cliff sides.
    const islandGeo = new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 9, 10, 56);
    const island = new THREE.Mesh(islandGeo, [
      mat(0x9a6b3f),
      mat(0x7ec850),
      mat(0x7a5430),
    ]);
    island.position.y = -5;
    scene.add(island);

    // Hub plaza with paths radiating to each zone.
    const plaza = cyl(25, 26.5, 0.16, 0xf3e2b8, 44);
    plaza.position.y = 0.04;
    scene.add(plaza);
    for (const cfg of ZONE_CONFIGS) {
      const a = (cfg.angleDeg * Math.PI) / 180;
      const path = box(24, 0.1, 4, 0xeed9a4);
      const mid = 25 + 24 / 2 - 1;
      path.position.set(Math.cos(a) * mid, 0.03, Math.sin(a) * mid);
      path.rotation.y = -a;
      scene.add(path);
      const zoneLamp = lamp(cfg.accentColor);
      const lr = 31;
      zoneLamp.position.set(
        Math.cos(a + 0.12) * lr,
        0,
        Math.sin(a + 0.12) * lr,
      );
      scene.add(zoneLamp);
      colliders.add(`lamp:${cfg.subject}`, zoneLamp.position.x, zoneLamp.position.z, 0.5);
    }

    // Fountain at the very centre.
    const fountain = new THREE.Group();
    const basin = cyl(3.4, 3.8, 0.9, 0xdcd2ba, 24);
    basin.position.y = 0.45;
    const column = cyl(0.6, 0.9, 2.2, 0xcfc4a8, 16);
    column.position.y = 1.8;
    const bowl = cyl(1.6, 1.1, 0.5, 0xdcd2ba, 18);
    bowl.position.y = 3.0;
    const orb = sph(0.55, 0x6fd6ff, 14);
    orb.position.y = 3.7;
    this.water = cyl(3.1, 3.1, 0.12, 0x6fd6ff, 24);
    this.water.position.y = 0.95;
    fountain.add(basin, column, bowl, orb, this.water, blobShadow(3.9));
    scene.add(fountain);
    colliders.add('fountain', 0, 0, 4.0);

    // Notice board: opens the report card.
    const board = new THREE.Group();
    board.position.set(8, 0, 12);
    board.lookAt(0, 0, 0);
    for (const sx of [-1.6, 1.6]) {
      const post = box(0.25, 2.8, 0.25, 0x6e4a26);
      post.position.set(sx, 1.4, 0);
      board.add(post);
    }
    const panel = textPanel('RESULTS\nBOARD', { height: 2.0 });
    panel.position.y = 2.2;
    board.add(panel, blobShadow(1.8));
    scene.add(board);
    colliders.add('board', board.position.x, board.position.z, 1.6);
    interactions.add({
      id: 'report-card',
      x: board.position.x,
      z: board.position.z,
      radius: 3.6,
      prompt: () => 'View Report Card',
      enabled: () => true,
      onInteract: () => deps.openReportCard(),
    });

    // Trees and benches scattered between zones.
    for (let i = 0; i < ZONE_CONFIGS.length; i++) {
      const cfg = ZONE_CONFIGS[i]!;
      const gapA = ((cfg.angleDeg + 25.7) * Math.PI) / 180;
      for (const r of [44, 68, 96]) {
        const tr = tree(1 + ((i + r) % 3) * 0.35, r > 90 ? 0x3f9d43 : 0x4cae4f);
        tr.position.set(Math.cos(gapA) * r, 0, Math.sin(gapA) * r);
        scene.add(tr);
        colliders.add(`tree:${i}:${r}`, tr.position.x, tr.position.z, 0.8);
      }
      const a = (cfg.angleDeg * Math.PI) / 180;
      const b = lamp(cfg.accentColor);
      b.position.set(Math.cos(a - 0.1) * 44, 0, Math.sin(a - 0.1) * 44);
      scene.add(b);
      colliders.add(`lamp2:${cfg.subject}`, b.position.x, b.position.z, 0.5);
    }

    // Welcome sign near spawn.
    const welcome = textPanel('SCHOLAR WORLD', { height: 1.7 });
    welcome.position.set(-8, 3.2, 12);
    welcome.lookAt(0, 3.2, 0);
    const wPost = box(0.25, 2.6, 0.25, 0x6e4a26);
    wPost.position.set(-8, 1.3, 12);
    scene.add(welcome, wPost);
    colliders.add('welcome', -8, 12, 0.6);

    for (const cfg of ZONE_CONFIGS) {
      const startLocked = cfg.lockedByDefault && !deps.isZoneUnlocked(cfg.subject);
      this.zones.set(cfg.subject, new Zone(cfg, deps, startLocked));
    }

    // A few decorative clouds drifting overhead.
    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puff = sph(3 + (j % 2) * 1.6, 0xffffff, 10);
        puff.position.set(j * 3.4 - 3.4, (j % 2) * 0.9, j * 1.2 - 1.2);
        cloud.add(puff);
      }
      const a = (i / 6) * Math.PI * 2;
      cloud.position.set(Math.cos(a) * 95, 34 + (i % 3) * 6, Math.sin(a) * 95);
      scene.add(cloud);
    }

    // Distant "sea" disc far below so the island reads as floating.
    const sea = new THREE.Mesh(
      new THREE.CircleGeometry(600, 32),
      new THREE.MeshBasicMaterial({ color: 0x5fb7e8 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -42;
    scene.add(sea);
  }

  update(dt: number): void {
    this.t += dt;
    this.water.position.y = 0.95 + Math.sin(this.t * 2.2) * 0.05;
    this.water.rotation.y += dt * 0.4;
    for (const zone of this.zones.values()) zone.update(dt, this.t);
  }
}

export { ZONE_RING_RADIUS };
