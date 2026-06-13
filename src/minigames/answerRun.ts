import * as THREE from 'three';
import { box, mat, textPanel } from '../world/props';
import { sample, type Minigame, type MinigameContext } from './minigame';

// 3D arcade minigame: the player is teleported to a walled arena floating
// off the island. A question appears in the HUD banner and four answer
// gates stand across the arena - run through the right one before time runs
// out. Six rounds, then back to the station.

const ARENA_X = 0;
const ARENA_Z = -400;
const ROUNDS = 6;
const ROUND_TIME = 12;
const GATE_LINE = -14; // relative z of the gates
const START_Z = 16; // relative z of the start pad
const GATE_XS = [-12, -4, 4, 12];

export function createAnswerRun(ctx: MinigameContext): Minigame {
  const arena = ctx.arena!;
  const questions = sample(ctx.bank.questions, ROUNDS);
  const group = new THREE.Group();
  let panels: THREE.Mesh[] = [];
  let round = 0;
  let correct = 0;
  let timeLeft = ROUND_TIME;
  let phase: 'run' | 'flash' | 'done' = 'run';
  let flashTimer = 0;
  let returnPos: THREE.Vector3;
  let returnFacing = 0;

  function buildArena(): void {
    const floor = box(36, 1.2, 42, 0xf3e2b8);
    floor.position.y = -0.6;
    group.add(floor);
    const rim = box(38, 0.5, 44, 0x3a2c22);
    rim.position.y = -1.3;
    group.add(rim);
    for (const sx of [-17.5, 17.5]) {
      const wall = box(1, 3, 42, 0xe2c98f);
      wall.position.set(sx, 1.5, 0);
      group.add(wall);
    }
    const backWall = box(36, 3, 1, 0xe2c98f);
    backWall.position.set(0, 1.5, 20.5);
    group.add(backWall);

    // Gate posts and the beam the answer panels hang from.
    for (const px of [-16, -8, 0, 8, 16]) {
      const post = box(0.7, 5, 0.7, 0xc2554f);
      post.position.set(px, 2.5, GATE_LINE);
      group.add(post);
    }
    const beam = box(34, 0.7, 0.9, 0xc2554f);
    beam.position.set(0, 5.2, GATE_LINE);
    group.add(beam);

    const startPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.18, 20),
      mat(0x2fae62),
    );
    startPad.position.set(0, 0.09, START_Z);
    group.add(startPad);

    group.position.set(ARENA_X, 0, ARENA_Z);
    arena.scene.add(group);
  }

  function showRound(): void {
    const q = questions[round]!;
    timeLeft = ROUND_TIME;
    phase = 'run';
    for (const p of panels) group.remove(p);
    panels = q.choices.map((choice, i) => {
      const panel = textPanel(choice, { height: 1.7, fontPx: 56 });
      panel.position.set(GATE_XS[i]!, 3.2, GATE_LINE);
      group.add(panel);
      return panel;
    });
    arena.player.teleport(ARENA_X, ARENA_Z + START_Z, Math.PI);
    arena.snapCamera();
    arena.showBanner(q.prompt, round + 1, ROUNDS, 1);
  }

  function resolveRound(gateIndex: number): void {
    const q = questions[round]!;
    const ok = gateIndex === q.answerIndex;
    if (ok) correct++;
    arena.flashAnswer(ok, q.choices[q.answerIndex]);
    phase = 'flash';
    flashTimer = 1.4;
  }

  function endGame(): void {
    phase = 'done';
    arena.hideBanner();
    arena.player.teleport(returnPos.x, returnPos.z, returnFacing);
    arena.snapCamera();
    ctx.finish({ correct, total: ROUNDS, perfect: correct === ROUNDS, forfeited: false });
  }

  return {
    start() {
      returnPos = arena.player.pos.clone();
      returnFacing = arena.player.facing;
      buildArena();
      showRound();
    },
    update(dt: number) {
      if (phase === 'done') return;
      if (phase === 'flash') {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          round++;
          if (round >= ROUNDS) endGame();
          else showRound();
        }
        return;
      }
      // Run phase: drive the player inside the arena bounds.
      arena.player.move(dt, arena.input);
      const p = arena.player.pos;
      p.x = Math.min(ARENA_X + 16.2, Math.max(ARENA_X - 16.2, p.x));
      p.z = Math.min(ARENA_Z + 19.2, Math.max(ARENA_Z + GATE_LINE - 2, p.z));
      arena.player.syncVisuals();

      timeLeft -= dt;
      const q = questions[round]!;
      arena.showBanner(q.prompt, round + 1, ROUNDS, Math.max(0, timeLeft / ROUND_TIME));

      const relZ = p.z - ARENA_Z;
      if (relZ <= GATE_LINE + 0.4) {
        const relX = p.x - ARENA_X;
        let gate = 0;
        let best = Infinity;
        GATE_XS.forEach((gx, i) => {
          const d = Math.abs(relX - gx);
          if (d < best) {
            best = d;
            gate = i;
          }
        });
        resolveRound(gate);
      } else if (timeLeft <= 0) {
        resolveRound(-1);
      }
    },
    dispose() {
      arena.scene.remove(group);
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          // Only dispose unique canvas-text materials, not the shared cache.
          if (m instanceof THREE.MeshBasicMaterial && m.map) {
            m.map.dispose();
            m.dispose();
          }
        }
      });
      if (phase !== 'done') {
        arena.hideBanner();
        if (returnPos) {
          arena.player.teleport(returnPos.x, returnPos.z, returnFacing);
          arena.snapCamera();
        }
      }
      phase = 'done';
    },
  };
}
