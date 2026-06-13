import * as THREE from 'three';

// Flat-ground circle colliders. Props register a circle; each frame the player
// is pushed out of any overlapping circle, then clamped to the island.

export interface Collider {
  id: string;
  x: number;
  z: number;
  r: number;
}

export class Colliders {
  private list: Collider[] = [];

  add(id: string, x: number, z: number, r: number): void {
    this.list.push({ id, x, z, r });
  }

  removeByPrefix(prefix: string): void {
    this.list = this.list.filter((c) => !c.id.startsWith(prefix));
  }

  resolve(pos: THREE.Vector3, radius: number): void {
    for (const c of this.list) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const min = c.r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) continue;
      if (d2 < 1e-8) {
        pos.x = c.x + min;
        continue;
      }
      const d = Math.sqrt(d2);
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }

  /** Keep the player on the circular island. */
  clampToIsland(pos: THREE.Vector3, maxRadius: number): void {
    const d = Math.hypot(pos.x, pos.z);
    if (d > maxRadius) {
      pos.x = (pos.x / d) * maxRadius;
      pos.z = (pos.z / d) * maxRadius;
    }
  }
}
