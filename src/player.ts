import * as THREE from 'three';
import type { Input } from './input';
import { blobShadow, box, mat, sph, torus } from './world/props';

// Overcooked-style stubby avatar: big round head, tiny body, floating hands,
// waddle animation. Tank controls (W/S move, A/D turn, Shift run).

const WALK_SPEED = 4.8;
const RUN_SPEED = 8.2;
const TURN_SPEED = 2.8;

export class Player {
  readonly group = new THREE.Group();
  readonly pos = new THREE.Vector3(0, 0, 10);
  facing = 0;
  radius = 0.6;

  private bodyMat: THREE.MeshToonMaterial;
  private footL: THREE.Mesh;
  private footR: THREE.Mesh;
  private handL: THREE.Mesh;
  private handR: THREE.Mesh;
  private torso: THREE.Group;
  private cap: THREE.Group;
  private scarf: THREE.Mesh;
  private trim: THREE.Mesh;
  private walkPhase = 0;
  private moving = false;

  constructor(scene: THREE.Scene) {
    this.bodyMat = new THREE.MeshToonMaterial({ color: 0x4f7df9 });

    this.torso = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), this.bodyMat);
    body.scale.y = 1.1;
    body.position.y = 0.78;
    const head = sph(0.5, 0xffd9b0, 18);
    head.position.y = 1.62;
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const eyeMat = mat(0x2b2430);
    for (const sx of [-0.17, 0.17]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(sx, 1.7, 0.44);
      this.torso.add(eye);
    }
    this.handL = sph(0.16, 0xffd9b0, 10);
    this.handL.position.set(-0.66, 0.85, 0.08);
    this.handR = sph(0.16, 0xffd9b0, 10);
    this.handR.position.set(0.66, 0.85, 0.08);

    // Cosmetics (hidden until unlocked).
    this.cap = new THREE.Group();
    const capBase = box(1.0, 0.09, 1.0, 0x2c2c3a);
    capBase.rotation.y = Math.PI / 4;
    const capBand = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.22, 12), mat(0x2c2c3a));
    capBand.position.y = -0.12;
    const tassel = box(0.07, 0.3, 0.07, 0xf2b53a);
    tassel.position.set(0.5, -0.12, 0.5);
    this.cap.add(capBase, capBand, tassel);
    this.cap.position.y = 2.12;
    this.cap.visible = false;

    this.scarf = torus(0.38, 0.13, 0xf2b53a);
    this.scarf.rotation.x = Math.PI / 2;
    this.scarf.position.y = 1.2;
    this.scarf.visible = false;

    this.trim = torus(0.6, 0.07, 0xf2b53a);
    this.trim.rotation.x = Math.PI / 2;
    this.trim.position.y = 0.62;
    this.trim.visible = false;

    this.torso.add(body, head, this.handL, this.handR, this.cap, this.scarf, this.trim);

    this.footL = sph(0.26, 0x2c2c3a, 10);
    this.footL.scale.y = 0.55;
    this.footL.position.set(-0.26, 0.14, 0);
    this.footR = this.footL.clone();
    this.footR.position.x = 0.26;

    this.group.add(this.torso, this.footL, this.footR, blobShadow(0.72));
    scene.add(this.group);
    this.syncVisuals();
  }

  /** Apply input to facing/position. Caller resolves collisions afterwards. */
  move(dt: number, input: Input): void {
    const left = input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0;
    const right = input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0;
    this.facing += (left - right) * TURN_SPEED * dt;

    const fwd =
      (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0) -
      (input.isDown('KeyS') || input.isDown('ArrowDown') ? 0.6 : 0);
    const run = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const speed = run ? RUN_SPEED : WALK_SPEED;
    this.moving = fwd !== 0;
    if (this.moving) {
      this.pos.x += Math.sin(this.facing) * fwd * speed * dt;
      this.pos.z += Math.cos(this.facing) * fwd * speed * dt;
      this.walkPhase += dt * (run ? 14 : 10);
    }
  }

  /** Snap the mesh to the simulated position and run the waddle animation. */
  syncVisuals(): void {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.facing;
    if (this.moving) {
      const s = Math.sin(this.walkPhase);
      this.torso.position.y = Math.abs(Math.cos(this.walkPhase)) * 0.09;
      this.torso.rotation.z = s * 0.05;
      this.footL.position.z = s * 0.22;
      this.footR.position.z = -s * 0.22;
      this.handL.position.z = 0.08 - s * 0.14;
      this.handR.position.z = 0.08 + s * 0.14;
    } else {
      this.torso.position.y *= 0.8;
      this.torso.rotation.z *= 0.8;
      this.footL.position.z *= 0.8;
      this.footR.position.z *= 0.8;
    }
  }

  /** High Overcooked-style follow camera (~52 degree pitch). */
  updateCamera(camera: THREE.PerspectiveCamera, dt: number, immediate = false): void {
    const back = 8.2;
    const up = 10.6;
    const tx = this.pos.x - Math.sin(this.facing) * back;
    const tz = this.pos.z - Math.cos(this.facing) * back;
    if (immediate) {
      camera.position.set(tx, up, tz);
    } else {
      const k = 1 - Math.exp(-4.5 * dt);
      camera.position.lerp(new THREE.Vector3(tx, up, tz), k);
    }
    camera.lookAt(this.pos.x, 1.4, this.pos.z);
  }

  teleport(x: number, z: number, facing?: number): void {
    this.pos.set(x, 0, z);
    if (facing !== undefined) this.facing = facing;
    this.syncVisuals();
  }

  setBodyColor(hex: string): void {
    this.bodyMat.color.set(hex);
  }

  applyCosmetics(unlocked: string[]): void {
    this.cap.visible = unlocked.includes('cap');
    this.scarf.visible = unlocked.includes('scarf');
    this.trim.visible = unlocked.includes('trim');
  }
}
