# Scholar World

A 3D open-world browser game where you roam a floating "campus island" and
play minigames based on the subjects tested at Singapore's **O-Levels** and
**A-Levels**. Earn XP, raise your grade in each subject from **F9 to A1**, and
unlock A-Level papers, the Junior College zones, and cosmetic rewards. The art
style is a chunky, cheerful, *Overcooked*-inspired toy diorama.

Built with **Three.js + TypeScript + Vite**. No backend — progress is saved in
your browser's `localStorage`.

## Run it

```bash
npm install
npm run dev      # play at the printed localhost URL
npm run build    # type-check + produce a static site in dist/
npm run preview  # serve the production build
```

Desktop with a keyboard is recommended.

## Controls

| Key | Action |
| --- | --- |
| `W` / `S` | Move forward / back |
| `A` / `D` | Turn left / right |
| `Shift` | Run |
| `E` | Interact with a station or sign |
| `R` | Open your report card |
| `M` | Toggle sound on/off |
| `P` / `Esc` | Pause / help |

The HUD shows a **mini-map** (top-right) of the island and zones, plus a
**current objective** that suggests what to aim for next. Finishing a minigame
brings up a **results card** with your score and XP earned. Sound effects are
synthesised in-browser via the Web Audio API (no audio files), and your mute
preference is remembered.

## How to play

The hub plaza sits at the centre, with seven subject zones around it:
Mathematics, English, Physics, Chemistry, Biology, Economics and General Paper.
Each zone has four stations:

- **Quiz** — timed multiple-choice questions.
- **Matching** — pair terms with their definitions.
- **Puzzle** — balance equations or arrange steps into the right order.
- **Arcade** — run through the correct answer gate in a 3D arena.

Every game awards XP toward that subject's grade. **A-Level** papers unlock once
you reach **C6** in a subject. **Economics** and **General Paper** are JC
subjects whose zones unlock after you do well across your O-Level subjects (the
locked gates show the exact requirement).

## Progression

- **Grades**: F9 → E8 → D7 → C6 → C5 → B4 → B3 → A2 → A1, derived from
  cumulative XP per subject.
- **Unlocks**: A-Level tiers, the Economics and General Paper zones, and
  cosmetics (outfit colours, scholar's cap, golden scarf, graduate's gold trim).
- **Saving**: automatic to `localStorage`; reset from the pause menu.

## Adding content

Question banks live in `src/data/questions/<subject>.ts` and are plain
TypeScript objects type-checked against the interfaces in `src/types.ts`, so a
typo fails `npm run build`. Each subject has an `O` and/or `A` tier with
`questions`, `matchSets` and `balancePuzzles`. Add entries to any array and they
are sampled automatically.

## Project layout

```
src/
  main.ts            bootstrap + render loop
  game.ts            state machine and system wiring
  player.ts          avatar, tank controls, follow camera, cosmetics
  world/             island, zones, props, landmarks
  minigames/         quiz, match, balance, arcade + plug-in contract
  progression/       grades, XP ledger, unlocks, save
  ui/                HUD and modal overlays
  data/              question banks per subject
```

## Tests

A Playwright smoke test boots the game, checks the canvas renders, and verifies
progression via the dev console API (`window.oralbot`):

```bash
npx playwright test
```
