import * as THREE from 'three';
import { Sfx } from './audio';
import { getTierBank } from './data';
import { Colliders } from './collision';
import { Input } from './input';
import { Interactions } from './interaction';
import { createAnswerRun } from './minigames/answerRun';
import { createBalancePuzzle } from './minigames/balancePuzzle';
import {
  type ArenaAccess,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './minigames/minigame';
import { createMatchPuzzle } from './minigames/matchPuzzle';
import { createQuiz } from './minigames/quiz';
import { Player } from './player';
import { Progression } from './progression/progression';
import { resetSave, scheduleSave } from './progression/save';
import { loadSave } from './progression/save';
import {
  SUBJECT_NAMES,
  type MinigameKind,
  type MinigameResult,
  type SubjectId,
  type Tier,
} from './types';
import { Hud } from './ui/hud';
import { Minimap } from './ui/minimap';
import { Overlay } from './ui/overlay';
import { TouchControls, isTouchDevice } from './ui/touch';
import { PLAYER_BOUND_RADIUS, World } from './world/world';

type State = 'explore' | 'minigame' | 'paused';

const FACTORIES: Record<MinigameKind, MinigameFactory> = {
  quiz: createQuiz,
  match: createMatchPuzzle,
  balance: createBalancePuzzle,
  arcade: createAnswerRun,
};

const KIND_LABEL: Record<MinigameKind, string> = {
  quiz: 'Quiz',
  match: 'Matching',
  balance: 'Puzzle',
  arcade: 'Arcade',
};

export class Game {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private input = new Input();
  private colliders = new Colliders();
  private interactions = new Interactions();
  private player: Player;
  private world: World;
  private hud: Hud;
  private minimap: Minimap;
  private overlay: Overlay;
  private progression: Progression;
  private sfx = new Sfx();

  private state: State = 'explore';
  private activeMinigame: Minigame | null = null;
  private activeContext: { subject: SubjectId; kind: MinigameKind; tier: Tier } | null = null;
  private inArena = false;

  constructor(canvas: HTMLCanvasElement, private renderer: THREE.WebGLRenderer) {
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.progression = new Progression(loadSave());

    const uiRoot = document.getElementById('ui-root')!;
    this.hud = new Hud(uiRoot);
    this.minimap = new Minimap(uiRoot);
    // Touch controls go in before the overlay so modal backdrops sit above them.
    new TouchControls(uiRoot, this.input);
    this.overlay = new Overlay(uiRoot);

    this.world = new World({
      scene: this.scene,
      colliders: this.colliders,
      interactions: this.interactions,
      isZoneUnlocked: (s) => this.progression.isZoneUnlocked(s),
      openStation: (s, k) => this.openStation(s, k),
      openReportCard: () => this.openReportCard(),
    });

    this.player = new Player(this.scene);
    this.applyCosmetics();
    this.player.updateCamera(this.camera, 0, true);

    this.hud.refreshGrades(this.progression);
    this.hud.setObjective(this.progression.nextObjective());
    this.hud.showHint(
      isTouchDevice()
        ? 'Drag the joystick to move · tap E near a station to play'
        : 'W/S move · A/D turn · Shift run · E interact · R report · P pause',
    );

    this.setupDevApi();
    void canvas;
  }

  private setupDevApi(): void {
    (window as unknown as { oralbot: unknown }).oralbot = {
      grantXp: (subject: SubjectId, n: number) => {
        const summary = this.progression.applyXp(subject, n);
        this.afterAward(subject, summary);
      },
      getState: () => ({
        xp: { ...this.progression.xp },
        grades: Object.fromEntries(
          (Object.keys(this.progression.xp) as SubjectId[]).map((s) => [s, this.progression.gradeOf(s)]),
        ),
        pos: { x: this.player.pos.x, z: this.player.pos.z },
      }),
      startMinigame: (kind: MinigameKind, subject: SubjectId, tier: Tier) =>
        this.startMinigame(subject, kind, tier),
      teleport: (x: number, z: number) => this.player.teleport(x, z),
    };
  }

  // --- station / minigame flow -------------------------------------------

  private openStation(subject: SubjectId, kind: MinigameKind): void {
    if (this.state !== 'explore') return;
    const tiers = this.progression.availableTiers(subject);
    const allTiers: Tier[] = subject === 'econs' || subject === 'gp' ? ['A'] : ['O', 'A'];
    this.state = 'paused';
    this.overlay.showTierChooser(
      subject,
      allTiers.map((tier) => ({
        tier,
        enabled: tiers.includes(tier),
        note: tiers.includes(tier) ? '' : `Reach C6 in ${SUBJECT_NAMES[subject]}`,
      })),
      (tier) => {
        this.overlay.close();
        this.startMinigame(subject, kind, tier);
      },
      () => {
        this.overlay.close();
        this.state = 'explore';
      },
    );
  }

  startMinigame(subject: SubjectId, kind: MinigameKind, tier: Tier): void {
    const bank = getTierBank(subject, tier);
    if (!bank) return;
    this.state = 'minigame';
    this.activeContext = { subject, kind, tier };
    let finished = false;

    const finish = (result: MinigameResult) => {
      if (finished) return;
      finished = true;
      this.endMinigame(result);
    };

    let panel: HTMLElement | null = null;
    let arena: ArenaAccess | null = null;

    if (kind === 'arcade') {
      this.inArena = true;
      arena = {
        scene: this.scene,
        player: this.player,
        input: this.input,
        snapCamera: () => this.player.updateCamera(this.camera, 0, true),
        showBanner: (q, round, total, frac) => this.hud.showArcade(q, round, total, frac),
        flashAnswer: (correct, text) => {
          this.sfx.play(correct ? 'correct' : 'wrong');
          this.hud.flashAnswer(correct, text);
        },
        hideBanner: () => this.hud.hideArcade(),
      };
    } else {
      panel = this.overlay.openMinigamePanel(
        `${SUBJECT_NAMES[subject]} · ${tier}-Level`,
        () => this.confirmForfeit(),
      );
    }

    const ctx: MinigameContext = {
      subject,
      subjectName: SUBJECT_NAMES[subject],
      tier,
      bank,
      panel,
      arena,
      playSfx: (name) => this.sfx.play(name),
      finish,
    };
    this.activeMinigame = FACTORIES[kind](ctx);
    this.sfx.play('start');
    this.activeMinigame.start();
  }

  private confirmForfeit(): void {
    const ctx = this.activeContext;
    if (!ctx) return;
    // Pure-DOM minigames pause behind a confirm; arcade just forfeits.
    this.overlay.showConfirm(
      'Leave this game? You will not earn XP.',
      () => this.endMinigame({ correct: 0, total: 0, perfect: false, forfeited: true }),
      () => {
        const c = this.activeContext;
        if (c && c.kind !== 'arcade') {
          // Re-open the minigame panel host so play continues.
          this.overlay.openMinigamePanel(
            `${SUBJECT_NAMES[c.subject]} · ${c.tier}-Level`,
            () => this.confirmForfeit(),
          );
        } else {
          this.overlay.close();
        }
      },
    );
  }

  private endMinigame(result: MinigameResult): void {
    const ctx = this.activeContext;
    this.activeMinigame?.dispose();
    this.activeMinigame = null;
    this.activeContext = null;
    this.inArena = false;
    this.hud.hideArcade();
    if (!ctx) {
      this.overlay.close();
      this.state = 'explore';
      return;
    }

    let summary: ReturnType<Progression['applyXp']> | null = null;
    if (!result.forfeited) {
      summary = this.progression.award(ctx.subject, ctx.kind, ctx.tier, result);
      this.applySideEffects(ctx.subject, summary);
      this.sfx.play(summary.newGrade !== summary.oldGrade ? 'gradeUp' : 'xp');
    } else {
      this.sfx.play('forfeit');
    }

    // Hold in a paused state behind the results card until the player continues.
    this.state = 'paused';
    this.overlay.showResults(
      {
        title: `${SUBJECT_NAMES[ctx.subject]} ${ctx.tier}-Level`,
        kindLabel: KIND_LABEL[ctx.kind],
        correct: result.correct,
        total: result.total,
        perfect: result.perfect,
        forfeited: result.forfeited,
        xpGain: summary?.xpGain ?? 0,
        messages: summary?.messages ?? [],
      },
      () => {
        this.overlay.close();
        this.state = 'explore';
      },
    );
  }

  /** Dev/grantXp path: shows HUD toast + banner instead of the results card. */
  private afterAward(
    subject: SubjectId,
    summary: ReturnType<Progression['applyXp']>,
  ): void {
    if (summary.xpGain > 0) {
      this.hud.toast(`+${Math.round(summary.xpGain)} XP ${SUBJECT_NAMES[subject]}`);
    }
    if (summary.newGrade !== summary.oldGrade) {
      this.hud.banner(
        `${SUBJECT_NAMES[subject]}: ${summary.oldGrade} → ${summary.newGrade}!`,
        summary.messages,
      );
    } else if (summary.messages.length > 0) {
      this.hud.banner('Unlocked!', summary.messages);
    }
    this.applySideEffects(subject, summary);
    this.sfx.play(summary.newGrade !== summary.oldGrade ? 'gradeUp' : 'xp');
  }

  /** Shared post-award updates: world unlocks, cosmetics, HUD, objective, save. */
  private applySideEffects(
    subject: SubjectId,
    summary: ReturnType<Progression['applyXp']>,
  ): void {
    for (const s of summary.zoneUnlocks) this.world.zones.get(s)?.unlock();
    if (summary.messages.length > 0) this.sfx.play('unlock');
    this.applyCosmetics();
    this.hud.refreshGrades(this.progression);
    this.hud.flashChip(subject);
    this.hud.setObjective(this.progression.nextObjective());
    scheduleSave(() => this.progression.toSave());
  }

  private applyCosmetics(): void {
    this.player.applyCosmetics(this.progression.unlockedCosmetics);
    if (this.progression.equippedColor) this.player.setBodyColor(this.progression.equippedColor);
  }

  // --- report card & pause -----------------------------------------------

  private openReportCard(): void {
    if (this.state !== 'explore') return;
    this.state = 'paused';
    this.overlay.showReportCard(this.progression, {
      onClose: () => {
        this.overlay.close();
        this.state = 'explore';
      },
      onEquipColor: (color) => {
        this.progression.equippedColor = color;
        this.player.setBodyColor(color);
        scheduleSave(() => this.progression.toSave());
      },
    });
  }

  private togglePause(): void {
    if (this.state === 'explore') {
      this.state = 'paused';
      this.overlay.showPause({
        onResume: () => {
          this.overlay.close();
          this.state = 'explore';
        },
        onReset: () => {
          resetSave();
          window.location.reload();
        },
        objective: this.progression.nextObjective(),
        muted: this.sfx.muted,
        onToggleMute: () => this.sfx.toggleMute(),
      });
    } else if (this.state === 'paused' && this.overlay.isOpen) {
      this.overlay.requestClose();
    }
  }

  // --- main loop ----------------------------------------------------------

  update(dt: number): void {
    if (this.input.wasPressed('Escape')) {
      if (this.state === 'minigame') this.confirmForfeit();
      else if (this.state === 'paused' && this.overlay.isOpen) this.overlay.requestClose();
      else this.togglePause();
    }
    if (this.input.wasPressed('KeyP') && this.state !== 'minigame') this.togglePause();
    if (this.input.wasPressed('KeyR') && this.state === 'explore') this.openReportCard();
    if (this.input.wasPressed('KeyM')) {
      const muted = this.sfx.toggleMute();
      this.hud.showHint(muted ? '🔇 Sound off' : '🔊 Sound on', 1500);
    }

    if (this.state === 'explore') {
      this.updateExplore(dt);
    } else if (this.state === 'minigame') {
      this.activeMinigame?.update(dt);
      if (this.inArena) this.player.updateCamera(this.camera, dt);
    }

    this.world.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  private updateExplore(dt: number): void {
    this.player.move(dt, this.input);
    this.colliders.resolve(this.player.pos, this.player.radius);
    this.colliders.clampToIsland(this.player.pos, PLAYER_BOUND_RADIUS);
    this.player.syncVisuals();
    this.player.updateCamera(this.camera, dt);

    const near = this.interactions.findNearest(this.player.pos.x, this.player.pos.z);
    this.hud.setPrompt(near ? near.prompt() : null);
    if (near && this.input.wasPressed('KeyE')) near.onInteract();

    this.minimap.update(this.player.pos.x, this.player.pos.z, this.player.facing, this.progression);
  }

  onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
