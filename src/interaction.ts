// Proximity interactables: the nearest enabled one within range shows an
// "[E] do thing" prompt and fires when E is pressed.

export interface Interactable {
  id: string;
  x: number;
  z: number;
  radius: number;
  prompt: () => string;
  enabled: () => boolean;
  onInteract: () => void;
}

export class Interactions {
  private list: Interactable[] = [];

  add(i: Interactable): void {
    this.list.push(i);
  }

  findNearest(x: number, z: number): Interactable | null {
    let best: Interactable | null = null;
    let bestD2 = Infinity;
    for (const i of this.list) {
      if (!i.enabled()) continue;
      const dx = x - i.x;
      const dz = z - i.z;
      const d2 = dx * dx + dz * dz;
      if (d2 <= i.radius * i.radius && d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return best;
  }
}
