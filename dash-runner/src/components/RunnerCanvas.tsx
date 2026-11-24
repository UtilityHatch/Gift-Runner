import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { arcadeAudio } from '../game/audio';
import { drawAnimeCharacter } from '../game/characterRenderer';
import {
  AmbientPetal,
  CostumeId,
  DifficultyMode,
  FloatingText,
  GameState,
  Obstacle,
  ObstacleKind,
  Particle,
  PlayerState,
  RoseCollectible,
  RunSummary,
  RunnerGender,
  WorldId,
} from '../game/types';
import {
  GROUND_Y,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  drawAmbientPetals,
  drawRoseCollectible,
  drawWorldBackdrop,
  drawWorldObstacle,
} from '../game/worldRenderer';
import { COSTUME_MAP, WORLD_MAP } from '../game/worlds';

export interface RunnerCanvasHandle {
  pressJump: () => void;
  releaseJump: () => void;
  setDuck: (ducking: boolean) => void;
}

interface RunnerCanvasProps {
  gameState: GameState;
  worldId: WorldId;
  gender: RunnerGender;
  costumeId: CostumeId;
  difficulty: DifficultyMode;
  worldBest: number;
  overallBest: number;
  runId: number;
  onHudUpdate: (score: number, roses: number, speedMult: number) => void;
  onGameOver: (summary: RunSummary) => void;
  onTogglePause: () => void;
  onStartFromCanvas: () => void;
  challengeTargetRoses?: number;
  onChallengeGoalReached?: () => void;
}

const STANDING_W = 38;
const STANDING_H = 74;
const DUCKING_W = 48;
const DUCKING_H = 38;

function getViewportMetrics(): { logicalWidth: number; playerX: number } {
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return { logicalWidth: 580, playerX: 64 };
  }
  return { logicalWidth: LOGICAL_WIDTH, playerX: 96 };
}

function createInitialPlayer(playerX: number): PlayerState {
  const nodes = Array.from({ length: 6 }, (_, i) => ({
    x: playerX + 12 - i * 8,
    y: GROUND_Y - STANDING_H + 26,
  }));
  return {
    x: playerX,
    y: GROUND_Y - STANDING_H,
    vy: 0,
    width: STANDING_W,
    height: STANDING_H,
    isGrounded: true,
    isDucking: false,
    jumpHeld: false,
    jumpHoldTime: 0,
    runCycle: 0,
    squashX: 1,
    squashY: 1,
    blinkTimer: 2.4,
    isBlinking: false,
    ribbonNodes: nodes,
    hitStun: false,
  };
}

function createAmbientPetals(worldId: WorldId): AmbientPetal[] {
  const palette =
    worldId === 'marvel'
      ? ['#F97316', '#38BDF8']
      : worldId === 'gta6'
        ? ['#EC4899', '#2DD4BF']
        : worldId === 'battlefield'
          ? ['#FDBA74', '#FCA5A5']
          : ['#FBCFE8', '#F472B6'];

  return Array.from({ length: 14 }, (_, i) => ({
    x: (i * 83) % LOGICAL_WIDTH,
    y: 25 + ((i * 47) % 210),
    vx: -28 - (i % 4) * 14,
    vy: 14 + (i % 3) * 8,
    size: 4 + (i % 3) * 1.5,
    phase: i * 0.9,
    color: palette[i % palette.length],
  }));
}

function getObstacleDimensions(kind: ObstacleKind, isAerial: boolean): { w: number; h: number } {
  if (isAerial) {
    return { w: 46, h: 28 };
  }
  switch (kind) {
    case 'war_cart':
    case 'scroll_cart':
    case 'straw_cart':
    case 'cone_double':
    case 'neon_cones':
    case 'skateboard':
      return { w: 58, h: 38 };
    case 'suitcases':
    case 'palisade':
    case 'onggi_jars':
    case 'energy_barrier':
      return { w: 44, h: 52 };
    case 'tram_post':
    case 'park_bollard':
    case 'flower_urn':
    case 'peony_pot':
    case 'palm_planter':
      return { w: 36, h: 58 };
    default:
      return { w: 42, h: 42 };
  }
}

export const RunnerCanvas = React.forwardRef<RunnerCanvasHandle, RunnerCanvasProps>(
  (
    {
      gameState,
      worldId,
      gender,
      costumeId,
      difficulty,
      worldBest,
      overallBest,
      runId,
      onHudUpdate,
      onGameOver,
      onTogglePause,
      onStartFromCanvas,
      challengeTargetRoses,
      onChallengeGoalReached,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const stateRef = useRef({
      gameState,
      worldId,
      gender,
      costumeId,
      difficulty,
      worldBest,
      overallBest,
      challengeTargetRoses,
    });
    stateRef.current = {
      gameState,
      worldId,
      gender,
      costumeId,
      difficulty,
      worldBest,
      overallBest,
      challengeTargetRoses,
    };

    const callbacksRef = useRef({
      onHudUpdate,
      onGameOver,
      onTogglePause,
      onStartFromCanvas,
      onChallengeGoalReached,
    });
    callbacksRef.current = {
      onHudUpdate,
      onGameOver,
      onTogglePause,
      onStartFromCanvas,
      onChallengeGoalReached,
    };

    const simRef = useRef({
      time: 0,
      distance: 0,
      bonusScore: 0,
      lastReportedScore: -1,
      lastReportedRoses: -1,
      lastMilestone: 0,
      milestoneFlash: 0,
      speed: 390,
      baseSpeed: 390,
      maxSpeed: 920,
      topSpeedMultiplier: 1,
      spawnCooldown: 0.9,
      nextEntityId: 1,
      obstaclesCleared: 0,
      rosesCollected: 0,
      goalTriggered: false,
      logicalWidth: getViewportMetrics().logicalWidth,
      player: createInitialPlayer(getViewportMetrics().playerX),
      obstacles: [] as Obstacle[],
      roses: [] as RoseCollectible[],
      particles: [] as Particle[],
      floatingTexts: [] as FloatingText[],
      petals: createAmbientPetals(worldId),
    });

    const spawnDust = (x: number, y: number, count: number, color: string) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        sim.particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y - Math.random() * 4,
          vx: -60 - Math.random() * 110,
          vy: -20 - Math.random() * 65,
          size: 2.5 + Math.random() * 3.5,
          alpha: 0.78,
          life: 0,
          maxLife: 0.28 + Math.random() * 0.2,
          color,
          shape: 'circle',
          rotation: 0,
        });
      }
    };

    const spawnBurst = (
      x: number,
      y: number,
      color: string,
      shape: 'spark' | 'petal' = 'spark',
      count = 10
    ) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = 70 + Math.random() * 130;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4.5 + Math.random() * 3,
          alpha: 1,
          life: 0,
          maxLife: 0.36 + Math.random() * 0.2,
          color,
          shape,
          rotation: Math.random() * Math.PI,
        });
      }
    };

    const performJump = () => {
      const { gameState: gs } = stateRef.current;
      if (gs === 'TITLE_MENU') {
        callbacksRef.current.onStartFromCanvas();
        return;
      }
      if (gs !== 'PLAYING') return;

      const p = simRef.current.player;
      if (p.isGrounded && !p.hitStun) {
        p.vy = -615;
        p.isGrounded = false;
        p.isDucking = false;
        p.width = STANDING_W;
        p.height = STANDING_H;
        p.jumpHeld = true;
        p.jumpHoldTime = 0;
        p.squashX = 0.84;
        p.squashY = 1.18;
        spawnDust(p.x + p.width * 0.45, GROUND_Y, 7, '#E2E8F0');
        arcadeAudio.playJump();
      }
    };

    const releaseJump = () => {
      simRef.current.player.jumpHeld = false;
    };

    const setDuck = (ducking: boolean) => {
      const { gameState: gs } = stateRef.current;
      if (gs !== 'PLAYING') return;
      const p = simRef.current.player;
      if (p.hitStun) return;

      if (ducking && !p.isDucking) {
        if (p.isGrounded) {
          arcadeAudio.playSlide();
          spawnDust(p.x + 12, GROUND_Y, 4, '#CBD5E1');
        }
        p.isDucking = true;
        if (p.isGrounded) {
          p.width = DUCKING_W;
          p.height = DUCKING_H;
          p.y = GROUND_Y - DUCKING_H;
        }
      } else if (!ducking && p.isDucking) {
        p.isDucking = false;
        p.width = STANDING_W;
        p.height = STANDING_H;
        if (p.isGrounded) {
          p.y = GROUND_Y - STANDING_H;
        }
      }
    };

    useImperativeHandle(ref, () => ({
      pressJump: performJump,
      releaseJump,
      setDuck,
    }));

    // Refresh ambient petals when switching worlds in menu
    useEffect(() => {
      simRef.current.petals = createAmbientPetals(worldId);
    }, [worldId]);

    // Reset simulation on new runId
    useEffect(() => {
      const baseSpeed = difficulty === 'turbo' ? 500 : 390;
      const maxSpeed = difficulty === 'turbo' ? 1040 : 920;
      const metrics = getViewportMetrics();
      simRef.current = {
        time: 0,
        distance: 0,
        bonusScore: 0,
        lastReportedScore: 0,
        lastReportedRoses: 0,
        lastMilestone: 0,
        milestoneFlash: 0,
        speed: baseSpeed,
        baseSpeed,
        maxSpeed,
        topSpeedMultiplier: 1,
        spawnCooldown: 1.15,
        nextEntityId: 1,
        obstaclesCleared: 0,
        rosesCollected: 0,
        goalTriggered: false,
        logicalWidth: metrics.logicalWidth,
        player: createInitialPlayer(metrics.playerX),
        obstacles: [],
        roses: [],
        particles: [],
        floatingTexts: [],
        petals: createAmbientPetals(worldId),
      };
      callbacksRef.current.onHudUpdate(0, 0, 1);
    }, [runId, difficulty, worldId]);

    // Keyboard controls
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const code = e.code;

        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
          e.preventDefault();
          if (stateRef.current.gameState === 'PLAYING') {
            performJump();
          } else if (stateRef.current.gameState === 'TITLE_MENU') {
            callbacksRef.current.onStartFromCanvas();
          }
        } else if (code === 'ArrowDown' || code === 'KeyS') {
          e.preventDefault();
          setDuck(true);
        } else if (code === 'KeyP' || code === 'Escape') {
          if (stateRef.current.gameState === 'PLAYING' || stateRef.current.gameState === 'PAUSED') {
            e.preventDefault();
            callbacksRef.current.onTogglePause();
          }
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        const code = e.code;
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
          releaseJump();
        } else if (code === 'ArrowDown' || code === 'KeyS') {
          setDuck(false);
        }
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }, []);

    // Main 60fps loop
    useEffect(() => {
      let rafId = 0;
      let prevTime = performance.now();

      const spawnWave = (score: number) => {
        const sim = simRef.current;
        const { difficulty: diff, worldId: wId } = stateRef.current;
        const world = WORLD_MAP[wId];

        const aerialUnlockScore = diff === 'turbo' ? 75 : 160;
        const spawnAerial = score >= aerialUnlockScore && Math.random() > 0.72;

        let kind: ObstacleKind;
        let y: number;
        const isAerial = spawnAerial;

        if (isAerial) {
          kind = world.aerialObstacle;
          const tier = Math.floor(Math.random() * 3);
          y = tier === 0 ? GROUND_Y - 36 : tier === 1 ? GROUND_Y - 68 : GROUND_Y - 102;
        } else {
          const pool = world.groundObstacles;
          kind = pool[Math.floor(Math.random() * pool.length)];
          y = GROUND_Y; // Adjusted after dims
        }

        const dims = getObstacleDimensions(kind, isAerial);
        if (!isAerial) {
          y = GROUND_Y - dims.h;
        }

        const obs: Obstacle = {
          id: sim.nextEntityId++,
          kind,
          isAerial,
          x: sim.logicalWidth + 40,
          y,
          width: dims.w,
          height: dims.h,
          animPhase: Math.random() * Math.PI * 2,
          passed: false,
        };
        sim.obstacles.push(obs);

        // Spawn glowing Red Rose trail matching the reference images!
        // Either an inviting jump arc over the ground obstacle or a safe ground strip under an aerial obstacle
        const roseSpawnChance = stateRef.current.challengeTargetRoses ? 0.92 : 0.75;
        if (Math.random() < roseSpawnChance) {
          if (isAerial && y < GROUND_Y - 52) {
            // 3 roses along the slide path underneath
            for (let i = 0; i < 3; i++) {
              sim.roses.push({
                id: sim.nextEntityId++,
                x: obs.x - 16 + i * 36,
                y: GROUND_Y - 22,
                radius: 11,
                bobPhase: i * 0.6,
                collected: false,
              });
            }
          } else {
            // 3-rose arc rising over the obstacle
            const arcOffsets = [
              { dx: -26, dy: -22 },
              { dx: obs.width / 2, dy: -46 },
              { dx: obs.width + 26, dy: -22 },
            ];
            arcOffsets.forEach((off, idx) => {
              sim.roses.push({
                id: sim.nextEntityId++,
                x: obs.x + off.dx,
                y: Math.max(70, y + off.dy),
                radius: 11,
                bobPhase: idx * 0.55,
                collected: false,
              });
            });
          }
        }

        const speedRatio = sim.speed / sim.baseSpeed;
        const minTime = Math.max(0.64, 1.12 / Math.sqrt(speedRatio));
        const maxTime = Math.max(1.08, 1.82 / Math.sqrt(speedRatio));
        sim.spawnCooldown = minTime + Math.random() * (maxTime - minTime);
      };

      const updateRibbonPhysics = (dt: number, isRunning: boolean) => {
        const sim = simRef.current;
        const p = sim.player;
        const anchorX = p.isDucking && p.isGrounded ? p.x + 12 : p.x + 13;
        const anchorY = p.isDucking && p.isGrounded ? p.y + 10 : p.y + 29;

        p.ribbonNodes[0].x = anchorX;
        p.ribbonNodes[0].y = anchorY;

        const windSpeed = isRunning ? sim.speed * 0.42 : 95;
        for (let i = 1; i < p.ribbonNodes.length; i++) {
          const prev = p.ribbonNodes[i - 1];
          const curr = p.ribbonNodes[i];
          const targetX = prev.x - 9.5 - windSpeed * 0.011;
          const waveY = Math.sin(sim.time * 13 - i * 0.85) * (isRunning ? 3.2 : 1.7);
          const targetY = prev.y + waveY + p.vy * 0.008;

          const lerp = Math.min(1, dt * 22);
          curr.x += (targetX - curr.x) * lerp;
          curr.y += (targetY - curr.y) * lerp;
        }
      };

      const step = (now: number) => {
        const rawDt = (now - prevTime) / 1000;
        prevTime = now;
        const dt = Math.min(rawDt, 0.05);

        const sim = simRef.current;
        const {
          gameState: gs,
          worldId: wId,
          gender: g,
          costumeId: cId,
          worldBest: wb,
          overallBest: ob,
        } = stateRef.current;
        const world = WORLD_MAP[wId];
        const costume = COSTUME_MAP[cId];

        if (gs === 'TITLE_MENU') {
          sim.time += dt;
          const p = sim.player;
          p.blinkTimer -= dt;
          if (p.blinkTimer <= 0) {
            p.isBlinking = !p.isBlinking;
            p.blinkTimer = p.isBlinking ? 0.11 : 2.3 + Math.random() * 2.5;
          }
          for (const pt of sim.petals) {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            if (pt.x < -10) pt.x = LOGICAL_WIDTH + 10;
            if (pt.y > GROUND_Y) pt.y = 12;
          }
          updateRibbonPhysics(dt, false);
        } else if (gs === 'PLAYING') {
          sim.time += dt;
          const p = sim.player;

          p.blinkTimer -= dt;
          if (p.blinkTimer <= 0) {
            p.isBlinking = !p.isBlinking;
            p.blinkTimer = p.isBlinking ? 0.1 : 2.6 + Math.random() * 2.4;
          }

          p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
          p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

          const accel = stateRef.current.difficulty === 'turbo' ? 14 : 10.5;
          sim.speed = Math.min(sim.maxSpeed, sim.speed + accel * dt);
          const speedMult = Number((sim.speed / sim.baseSpeed).toFixed(1));
          if (speedMult > sim.topSpeedMultiplier) {
            sim.topSpeedMultiplier = speedMult;
          }

          sim.distance += sim.speed * dt;
          const currentScore = Math.floor(sim.distance / 18) + sim.bonusScore;

          const milestoneBucket = Math.floor(currentScore / 200);
          if (milestoneBucket > sim.lastMilestone && currentScore >= 200) {
            sim.lastMilestone = milestoneBucket;
            sim.milestoneFlash = 1;
            arcadeAudio.playMilestone();
            sim.floatingTexts.push({
              x: p.x + 26,
              y: p.y - 14,
              vy: -44,
              text: `${milestoneBucket * 200}!`,
              alpha: 1,
              color: world.accentColor,
            });
          }
          if (sim.milestoneFlash > 0) {
            sim.milestoneFlash = Math.max(0, sim.milestoneFlash - dt * 2.4);
          }

          // Jump & gravity
          if (!p.isGrounded) {
            if (p.jumpHeld && p.jumpHoldTime < 0.14 && p.vy < 0) {
              p.jumpHoldTime += dt;
              p.vy += 1250 * dt;
            } else if (p.isDucking) {
              p.vy += 4100 * dt;
            } else {
              p.vy += 2350 * dt;
            }
            p.y += p.vy * dt;

            const targetGroundTop = GROUND_Y - (p.isDucking ? DUCKING_H : STANDING_H);
            if (p.y >= targetGroundTop) {
              if (p.isDucking) {
                p.width = DUCKING_W;
                p.height = DUCKING_H;
              } else {
                p.width = STANDING_W;
                p.height = STANDING_H;
              }
              p.y = GROUND_Y - p.height;
              p.vy = 0;
              p.isGrounded = true;
              p.jumpHeld = false;
              p.squashX = 1.15;
              p.squashY = 0.85;
              spawnDust(p.x + p.width * 0.5, GROUND_Y, 6, '#E2E8F0');
            }
          } else {
            const prevCycle = p.runCycle;
            p.runCycle += (sim.speed / 34) * dt;
            if (Math.floor(prevCycle / Math.PI) !== Math.floor(p.runCycle / Math.PI)) {
              if (Math.random() < 0.7) {
                spawnDust(p.x + 10, GROUND_Y, 2, '#E2E8F0');
              }
            }
          }

          updateRibbonPhysics(dt, true);

          for (const pt of sim.petals) {
            pt.x += (pt.vx - sim.speed * 0.15) * dt;
            pt.y += pt.vy * dt;
            if (pt.x < -12) pt.x = sim.logicalWidth + 12;
            if (pt.y > GROUND_Y) pt.y = 10;
          }

          sim.spawnCooldown -= dt;
          if (sim.spawnCooldown <= 0) {
            spawnWave(currentScore);
          }

          // Obstacles & Collisions
          let collided = false;
          const pBox = {
            x: p.x + 8,
            y: p.y + 7,
            w: p.width - 16,
            h: p.height - 11,
          };

          for (let i = sim.obstacles.length - 1; i >= 0; i--) {
            const obs = sim.obstacles[i];
            const obsSpeed = obs.isAerial ? sim.speed * 1.12 : sim.speed;
            obs.x -= obsSpeed * dt;
            obs.animPhase += dt * 15;

            if (!obs.passed && obs.x + obs.width < p.x) {
              obs.passed = true;
              sim.obstaclesCleared += 1;
            }

            const oBox = {
              x: obs.x + 6,
              y: obs.y + 6,
              w: obs.width - 12,
              h: obs.height - 12,
            };

            if (
              pBox.x < oBox.x + oBox.w &&
              pBox.x + pBox.w > oBox.x &&
              pBox.y < oBox.y + oBox.h &&
              pBox.y + pBox.h > oBox.y
            ) {
              collided = true;
            }

            if (obs.x + obs.width < -70) {
              sim.obstacles.splice(i, 1);
            }
          }

          // Roses collection
          for (let i = sim.roses.length - 1; i >= 0; i--) {
            const rose = sim.roses[i];
            rose.x -= sim.speed * dt;
            if (!rose.collected) {
              const cx = p.x + p.width / 2;
              const cy = p.y + p.height / 2;
              const dx = cx - rose.x;
              const dy = cy - rose.y;
              if (dx * dx + dy * dy < Math.pow(rose.radius + 25, 2)) {
                rose.collected = true;
                sim.rosesCollected += 1;
                const isBouquet = sim.rosesCollected % 10 === 0;
                const pts = isBouquet ? 50 : 15;
                sim.bonusScore += pts;
                if (isBouquet) arcadeAudio.playBouquetBonus();
                else arcadeAudio.playRose();

                spawnBurst(rose.x, rose.y, '#F43F5E', 'petal', isBouquet ? 14 : 8);
                sim.floatingTexts.push({
                  x: rose.x,
                  y: rose.y - 12,
                  vy: -52,
                  text: isBouquet ? `+50 Bouquet!` : '+15',
                  alpha: 1,
                  color: isBouquet ? '#FACC15' : '#F43F5E',
                });

                const target = stateRef.current.challengeTargetRoses;
                if (target && !sim.goalTriggered && sim.rosesCollected >= target) {
                  sim.goalTriggered = true;
                  arcadeAudio.playGiftUnlock();
                  callbacksRef.current.onHudUpdate(
                    Math.floor(sim.distance / 18) + sim.bonusScore,
                    sim.rosesCollected,
                    speedMult
                  );
                  callbacksRef.current.onChallengeGoalReached?.();
                }
              }
            }
            if (rose.collected || rose.x < -40) {
              sim.roses.splice(i, 1);
            }
          }

          // Particles & floating texts
          for (let i = sim.particles.length - 1; i >= 0; i--) {
            const pt = sim.particles[i];
            pt.life += dt;
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.alpha = 1 - pt.life / pt.maxLife;
            if (pt.life >= pt.maxLife) {
              sim.particles.splice(i, 1);
            }
          }

          for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
            const ft = sim.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.alpha -= dt * 1.4;
            if (ft.alpha <= 0) {
              sim.floatingTexts.splice(i, 1);
            }
          }

          const finalScore = Math.floor(sim.distance / 18) + sim.bonusScore;
          if (
            finalScore !== sim.lastReportedScore ||
            sim.rosesCollected !== sim.lastReportedRoses
          ) {
            sim.lastReportedScore = finalScore;
            sim.lastReportedRoses = sim.rosesCollected;
            callbacksRef.current.onHudUpdate(finalScore, sim.rosesCollected, speedMult);
          }

          if (collided) {
            p.hitStun = true;
            arcadeAudio.playGameOver();
            spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#F43F5E', 'petal', 16);
            const isNewWorldRecord = finalScore > wb;
            callbacksRef.current.onGameOver({
              worldId: wId,
              score: finalScore,
              worldBest: Math.max(wb, finalScore),
              overallBest: Math.max(ob, finalScore),
              isNewWorldRecord,
              obstaclesCleared: sim.obstaclesCleared,
              rosesCollected: sim.rosesCollected,
              topSpeedMultiplier: sim.topSpeedMultiplier,
            });
          }
        }

        // Render Frame
        const canvas = canvasRef.current;
        if (canvas) {
          const metrics = getViewportMetrics();
          sim.logicalWidth = metrics.logicalWidth;
          sim.player.x = metrics.playerX;

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = sim.logicalWidth * dpr;
          const targetH = LOGICAL_HEIGHT * dpr;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.scale(dpr, dpr);

            drawWorldBackdrop(ctx, world, sim.distance, sim.time, sim.logicalWidth);
            drawAmbientPetals(ctx, sim.petals, sim.time);

            // Roses
            for (const r of sim.roses) {
              if (!r.collected) {
                drawRoseCollectible(ctx, r, sim.time);
              }
            }

            // Obstacles
            for (const obs of sim.obstacles) {
              drawWorldObstacle(ctx, obs);
            }

            // Ground shadow under runner
            const distFromGround = Math.max(0, GROUND_Y - (sim.player.y + sim.player.height));
            const shadowScale = Math.max(0.32, 1 - distFromGround / 170);
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
              sim.player.x + sim.player.width * 0.48,
              GROUND_Y + 4,
              24 * shadowScale,
              5.5 * shadowScale,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.restore();

            // Male or Female Character in chosen Costume
            drawAnimeCharacter(ctx, sim.player, g, costume, sim.time);

            // Particles
            for (const pt of sim.particles) {
              ctx.save();
              ctx.globalAlpha = Math.max(0, pt.alpha);
              ctx.fillStyle = pt.color;
              if (pt.shape === 'petal') {
                ctx.translate(pt.x, pt.y);
                ctx.rotate(pt.rotation + pt.life * 6);
                ctx.beginPath();
                ctx.ellipse(0, 0, pt.size, pt.size * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
              } else if (pt.shape === 'spark') {
                ctx.translate(pt.x, pt.y);
                ctx.rotate(pt.life * 8);
                ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
              } else {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }

            // Floating popups
            for (const ft of sim.floatingTexts) {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.font = '700 15px "JetBrains Mono", monospace';
              ctx.strokeStyle = '#0F172A';
              ctx.lineWidth = 3;
              ctx.textAlign = 'center';
              ctx.strokeText(ft.text, ft.x, ft.y);
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x, ft.y);
              ctx.restore();
            }

            // Subtle milestone flash
            if (sim.milestoneFlash > 0) {
              ctx.save();
              ctx.globalAlpha = sim.milestoneFlash * 0.14;
              ctx.fillStyle = world.accentColor;
              ctx.fillRect(0, 0, sim.logicalWidth, LOGICAL_HEIGHT);
              ctx.restore();
            }

            ctx.restore();
          }
        }

        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }, []);

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          if (stateRef.current.gameState === 'TITLE_MENU') {
            callbacksRef.current.onStartFromCanvas();
          }
        }}
        className="block w-full max-w-full h-auto aspect-[580/360] sm:aspect-[1000/360] [@media(max-height:520px)]:w-auto [@media(max-height:520px)]:max-h-[calc(100dvh-142px)] [@media(max-height:520px)]:mx-auto cursor-pointer touch-none select-none"
        aria-label="Gift Runner 2D game canvas"
      />
    );
  }
);

RunnerCanvas.displayName = 'RunnerCanvas';
