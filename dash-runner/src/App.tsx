import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gift,
  Home,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GiftEditorModal } from './components/GiftEditorModal';
import { GiftPopupModal } from './components/GiftPopupModal';
import { RunnerCanvas, RunnerCanvasHandle } from './components/RunnerCanvas';
import { WorldPreviewThumb } from './components/WorldPreviewThumb';
import { arcadeAudio } from './game/audio';
import {
  ChallengeStage,
  CostumeId,
  DifficultyMode,
  GameState,
  GiftRewardConfig,
  PlayMode,
  RunSummary,
  RunnerGender,
  WorldId,
} from './game/types';
import {
  COSTUMES,
  COSTUME_MAP,
  WORLD_MAP,
  WORLDS,
  createRandomChallengeStages,
} from './game/worlds';

const STORAGE_KEY = 'gift_runner_save_v1';
const CHALLENGE_STORAGE_KEY = 'gift_runner_challenge_v1';
// Set to false before sharing with your wife so she cannot open the gift editor beforehand
const SHOW_GIFT_EDITOR = true;

type ScreenView = 'HOME' | 'GAME';

interface SavedProgress {
  overallBest: number;
  totalRoses: number;
  bestByWorld: Partial<Record<WorldId, number>>;
}

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overallBest: 0, totalRoses: 0, bestByWorld: {} };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      overallBest: Number(parsed.overallBest) || 0,
      totalRoses: Number(parsed.totalRoses) || 0,
      bestByWorld: parsed.bestByWorld || {},
    };
  } catch {
    return { overallBest: 0, totalRoses: 0, bestByWorld: {} };
  }
}

function saveProgress(next: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures
  }
}

function loadChallengeStages(): ChallengeStage[] {
  try {
    const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return createRandomChallengeStages();
    const parsed = JSON.parse(raw) as ChallengeStage[];
    if (Array.isArray(parsed) && parsed.length === 5) {
      return parsed;
    }
  } catch {
    // Fall back to fresh random stages
  }
  return createRandomChallengeStages();
}

function saveChallengeStages(stages: ChallengeStage[]): void {
  try {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(stages));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function formatScore(n: number): string {
  return String(Math.min(99999, Math.max(0, Math.floor(n)))).padStart(5, '0');
}

function RoseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 13v8" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 18c-3 0-4.5-1.5-5-3.5 2.2-.2 4 .8 5 3.5Z" fill="#22C55E" />
      <circle cx="12" cy="9" r="6" fill="#E11D48" />
      <circle cx="11.5" cy="8.5" r="3.4" fill="#FB7185" />
      <path
        d="M10 8.5a2 2 0 1 1 3.5 1.3"
        fill="none"
        stroke="#881337"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isMobilePortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
}

export default function App() {
  const runnerRef = useRef<RunnerCanvasHandle | null>(null);

  const [challengeStages, setChallengeStages] = useState<ChallengeStage[]>(() =>
    loadChallengeStages()
  );
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
  const [showGiftEditor, setShowGiftEditor] = useState<boolean>(false);

  const [screen, setScreen] = useState<ScreenView>('HOME');
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [playMode, setPlayMode] = useState<PlayMode>('challenge');
  const [worldId, setWorldId] = useState<WorldId>(() => challengeStages[0]?.worldId || 'city_park');
  const [gender, setGender] = useState<RunnerGender>('female');
  const [costumeId, setCostumeId] = useState<CostumeId>(
    () => WORLD_MAP[challengeStages[0]?.worldId || 'city_park'].defaultCostume
  );
  const [autoMatchCostume, setAutoMatchCostume] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [runId, setRunId] = useState<number>(1);
  const [mobileWardrobeOpen, setMobileWardrobeOpen] = useState<boolean>(false);

  const [showRotatePrompt, setShowRotatePrompt] = useState<boolean>(false);
  const [rotateHintNote, setRotateHintNote] = useState<string>('');

  const [score, setScore] = useState<number>(0);
  const [roses, setRoses] = useState<number>(0);
  const [speedMult, setSpeedMult] = useState<number>(1);
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const gameOverTimestampRef = useRef<number>(0);
  const activeScreenPointersRef = useRef<Map<number, 'duck' | 'jump'>>(new Map());

  const activeStage = challengeStages[activeChallengeIdx] || challengeStages[0];
  const effectiveWorldId: WorldId = playMode === 'challenge' ? activeStage.worldId : worldId;
  const activeWorld = WORLD_MAP[effectiveWorldId];
  const activeCostume = COSTUME_MAP[costumeId];
  const activeWorldBest = progress.bestByWorld[effectiveWorldId] || 0;

  const completedCount = challengeStages.filter((s) => s.completed).length;

  // Automatically dismiss rotate prompt if user rotates their phone to landscape
  useEffect(() => {
    if (screen !== 'GAME' || !showRotatePrompt) return;
    const handleResize = () => {
      if (window.innerWidth > window.innerHeight) {
        setShowRotatePrompt(false);
        setRotateHintNote('');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screen, showRotatePrompt]);

  const handleTryRotateLandscape = useCallback(async () => {
    setRotateHintNote('');
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen && !document.fullscreenElement) {
        await docEl.requestFullscreen();
      }
      const orientation = window.screen?.orientation;
      const lockFn = (orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock;
      if (lockFn) {
        await lockFn.call(orientation, 'landscape');
        setShowRotatePrompt(false);
        return;
      }
    } catch {
      // Browser/iOS Safari blocks programmatic lock; guide user cleanly
    }
    setRotateHintNote('Turn your phone sideways to switch to landscape, or tap Play in Portrait below.');
  }, []);

  const handleGoHome = useCallback(() => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowRotatePrompt(false);
    setRotateHintNote('');
    setSummary(null);
    setScore(0);
    setRoses(0);
    setSpeedMult(1);
    setGameState('TITLE_MENU');
    setScreen('HOME');
  }, []);

  const launchWorldGame = useCallback(
    (targetWorldId: WorldId) => {
      if (autoMatchCostume) {
        setCostumeId(WORLD_MAP[targetWorldId].defaultCostume);
      }
      setSummary(null);
      setScore(0);
      setRoses(0);
      setSpeedMult(1);
      setRunId((id) => id + 1);
      setGameState('TITLE_MENU');
      setScreen('GAME');
      setRotateHintNote('');
      if (isMobilePortraitViewport()) {
        setShowRotatePrompt(true);
      } else {
        setShowRotatePrompt(false);
      }
    },
    [autoMatchCostume]
  );

  const handleSelectMode = useCallback(
    (nextMode: PlayMode) => {
      setPlayMode(nextMode);
      if (nextMode === 'challenge') {
        const targetWorld = challengeStages[activeChallengeIdx]?.worldId || challengeStages[0].worldId;
        if (autoMatchCostume) {
          setCostumeId(WORLD_MAP[targetWorld].defaultCostume);
        }
      } else if (autoMatchCostume) {
        setCostumeId(WORLD_MAP[worldId].defaultCostume);
      }
    },
    [activeChallengeIdx, autoMatchCostume, challengeStages, worldId]
  );

  const handleChooseFreeWorld = useCallback(
    (nextWorldId: WorldId) => {
      setWorldId(nextWorldId);
      launchWorldGame(nextWorldId);
    },
    [launchWorldGame]
  );

  const handleChooseChallengeStage = useCallback(
    (idx: number) => {
      setActiveChallengeIdx(idx);
      const targetWorld = challengeStages[idx].worldId;
      launchWorldGame(targetWorld);
    },
    [challengeStages, launchWorldGame]
  );

  const handleShuffleChallengeWorlds = useCallback(() => {
    const existingGifts = challengeStages.map((s) => s.gift);
    const fresh = createRandomChallengeStages(existingGifts);
    setChallengeStages(fresh);
    saveChallengeStages(fresh);
    setActiveChallengeIdx(0);
    if (autoMatchCostume) {
      setCostumeId(WORLD_MAP[fresh[0].worldId].defaultCostume);
    }
  }, [autoMatchCostume, challengeStages]);

  const handleUpdateStageGift = useCallback(
    (stageIndex: number, gift: GiftRewardConfig, targetRoses: number) => {
      setChallengeStages((prev) => {
        const next = prev.map((s, idx) =>
          idx === stageIndex ? { ...s, gift, targetRoses } : s
        );
        saveChallengeStages(next);
        return next;
      });
    },
    []
  );

  const handleSelectCostume = useCallback((nextCostumeId: CostumeId) => {
    setCostumeId(nextCostumeId);
    setAutoMatchCostume(false);
  }, []);

  const handleToggleAutoMatch = useCallback(() => {
    setAutoMatchCostume((prev) => {
      const next = !prev;
      if (next) {
        setCostumeId(WORLD_MAP[effectiveWorldId].defaultCostume);
      }
      return next;
    });
  }, [effectiveWorldId]);

  const startNewRun = useCallback(() => {
    setShowRotatePrompt(false);
    setSummary(null);
    setScore(0);
    setRoses(0);
    setSpeedMult(1);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
  }, []);

  const handleChallengeGoalReached = useCallback(() => {
    setChallengeStages((prev) => {
      const next = prev.map((s, idx) =>
        idx === activeChallengeIdx ? { ...s, completed: true } : s
      );
      saveChallengeStages(next);
      return next;
    });
    setGameState('GIFT_POPUP');
  }, [activeChallengeIdx]);

  const handleAdvanceNextChallenge = useCallback(() => {
    const nextIdx = Math.min(challengeStages.length - 1, activeChallengeIdx + 1);
    setActiveChallengeIdx(nextIdx);
    const nextWorldId = challengeStages[nextIdx].worldId;
    if (autoMatchCostume) {
      setCostumeId(WORLD_MAP[nextWorldId].defaultCostume);
    }
    setSummary(null);
    setScore(0);
    setRoses(0);
    setSpeedMult(1);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
  }, [activeChallengeIdx, autoMatchCostume, challengeStages]);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      arcadeAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleHudUpdate = useCallback(
    (nextScore: number, nextRoses: number, nextSpeed: number) => {
      setScore(nextScore);
      setRoses(nextRoses);
      setSpeedMult(nextSpeed);
    },
    []
  );

  const handleGameOver = useCallback((runSummary: RunSummary) => {
    gameOverTimestampRef.current = performance.now();
    setSummary(runSummary);
    setProgress((prev) => {
      const updated: SavedProgress = {
        overallBest: Math.max(prev.overallBest, runSummary.score),
        totalRoses: prev.totalRoses + runSummary.rosesCollected,
        bestByWorld: {
          ...prev.bestByWorld,
          [runSummary.worldId]: Math.max(
            prev.bestByWorld[runSummary.worldId] || 0,
            runSummary.score
          ),
        },
      };
      saveProgress(updated);
      return updated;
    });
    setGameState('GAME_OVER');
  }, []);

  useEffect(() => {
    if (screen !== 'GAME' || gameState !== 'GAME_OVER') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
        e.preventDefault();
        if (performance.now() - gameOverTimestampRef.current > 280) {
          startNewRun();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, gameState, startNewRun]);

  // Split-screen touch/pointer cleanup for Left-Slide / Right-Jump
  useEffect(() => {
    if (screen !== 'GAME' || gameState !== 'PLAYING') {
      if (activeScreenPointersRef.current.size > 0) {
        activeScreenPointersRef.current.clear();
        runnerRef.current?.setDuck(false);
        runnerRef.current?.releaseJump();
      }
      return;
    }

    const releasePointer = (pointerId: number) => {
      const action = activeScreenPointersRef.current.get(pointerId);
      if (!action) return;
      activeScreenPointersRef.current.delete(pointerId);

      if (action === 'duck') {
        const stillDucking = Array.from(activeScreenPointersRef.current.values()).includes('duck');
        if (!stillDucking) {
          runnerRef.current?.setDuck(false);
        }
      } else {
        const stillJumping = Array.from(activeScreenPointersRef.current.values()).includes('jump');
        if (!stillJumping) {
          runnerRef.current?.releaseJump();
        }
      }
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      releasePointer(e.pointerId);
    };

    const onWindowBlur = () => {
      activeScreenPointersRef.current.clear();
      runnerRef.current?.setDuck(false);
      runnerRef.current?.releaseJump();
    };

    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [screen, gameState]);

  const handleGameAreaPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (gameState !== 'PLAYING') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [data-modal="true"]')) {
        return;
      }

      const useSplitZones =
        e.pointerType !== 'mouse' || window.innerWidth < 1024 || window.innerHeight < 560;

      if (!useSplitZones) {
        activeScreenPointersRef.current.set(e.pointerId, 'jump');
        runnerRef.current?.pressJump();
        return;
      }

      if (e.clientX < window.innerWidth / 2) {
        activeScreenPointersRef.current.set(e.pointerId, 'duck');
        runnerRef.current?.setDuck(true);
      } else {
        activeScreenPointersRef.current.set(e.pointerId, 'jump');
        runnerRef.current?.pressJump();
      }
    },
    [gameState]
  );

  const challengeProgressPct =
    playMode === 'challenge'
      ? Math.min(100, Math.round((roses / activeStage.targetRoses) * 100))
      : 0;

  // ============================================================================
  // DEDICATED GAME PAGE
  // ============================================================================
  if (screen === 'GAME') {
    return (
      <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col">
        {/* Game Top Bar with Clear Home Return Button */}
        <header className="w-full border-b border-slate-200 bg-white shrink-0">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 h-12 sm:h-16 [@media(max-height:520px)]:h-11 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              className="min-h-[36px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <div className="min-w-0 text-center">
              <span className="font-display text-sm sm:text-lg [@media(max-height:520px)]:text-sm font-bold text-slate-900 truncate block">
                {playMode === 'challenge'
                  ? `Stage ${activeChallengeIdx + 1}/5 · ${activeWorld.name}`
                  : activeWorld.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  aria-label={gameState === 'PAUSED' ? 'Resume game' : 'Pause game'}
                  className="min-h-[36px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {gameState === 'PAUSED' ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
                className="min-h-[36px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Focused Full-Height Game Container (supports Left=Slide / Right=Jump touch zones) */}
        <main
          onPointerDown={handleGameAreaPointerDown}
          className={`flex-1 flex flex-col justify-between sm:justify-center py-2 sm:py-6 [@media(max-height:520px)]:py-1.5 px-3 sm:px-6 max-w-6xl w-full mx-auto gap-2 sm:gap-5 [@media(max-height:520px)]:gap-1.5 select-none ${
            gameState === 'PLAYING' ? 'touch-none' : ''
          }`}
        >
          {/* Stage Card */}
          <section
            aria-label="2D Game Stage"
            className="relative w-full [@media(max-height:520px)]:w-fit [@media(max-height:520px)]:max-w-full [@media(max-height:520px)]:mx-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Clean Stage HUD */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 [@media(max-height:520px)]:py-1 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-800 flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-700 truncate">
                  {gender === 'male' ? activeCostume.maleLabel : activeCostume.femaleLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-slate-500">{speedMult.toFixed(1)}x</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-rose-600 whitespace-nowrap">
                  <RoseIcon className="w-3.5 h-3.5" />
                  <span>
                    {playMode === 'challenge'
                      ? `${roses}/${activeStage.targetRoses}`
                      : roses}
                  </span>
                </span>
                {playMode === 'challenge' && (
                  <div className="hidden sm:block w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 transition-all duration-150"
                      style={{ width: `${challengeProgressPct}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="font-mono-tabular text-xs sm:text-sm font-bold tracking-wider text-slate-900 flex items-center gap-3 shrink-0">
                <span className="text-slate-500 font-medium">
                  HI {formatScore(Math.max(activeWorldBest, score))}
                </span>
                <span>{formatScore(score)}</span>
              </div>
            </div>

            <div className="relative">
              <RunnerCanvas
                ref={runnerRef}
                gameState={gameState}
                worldId={effectiveWorldId}
                gender={gender}
                costumeId={costumeId}
                difficulty={difficulty}
                worldBest={activeWorldBest}
                overallBest={progress.overallBest}
                runId={runId}
                onHudUpdate={handleHudUpdate}
                onGameOver={handleGameOver}
                onTogglePause={handleTogglePause}
                onStartFromCanvas={startNewRun}
                challengeTargetRoses={
                  playMode === 'challenge' ? activeStage.targetRoses : undefined
                }
                onChallengeGoalReached={handleChallengeGoalReached}
              />

              {/* Rotate Phone Prompt when entering Game Page in Mobile Portrait */}
              {showRotatePrompt && gameState === 'TITLE_MENU' && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-5">
                  <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                      <RotateCw className="w-7 h-7" />
                    </div>
                    <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
                      Rotate Phone for Best View
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      Turn your phone sideways (landscape) for a wider runner screen, or continue in portrait mode.
                    </p>
                    {rotateHintNote && (
                      <p className="mt-2.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {rotateHintNote}
                      </p>
                    )}
                    <div className="mt-5 flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleTryRotateLandscape}
                        style={{ backgroundColor: activeWorld.accentColor }}
                        className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-95 transition-opacity"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Rotate to Landscape</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRotatePrompt(false)}
                        className="min-h-[46px] w-full px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        Play in Portrait
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ready-to-Run Prompt when first entering Game Page */}
              {gameState === 'TITLE_MENU' && !showRotatePrompt && (
                <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center sm:justify-end p-3 sm:p-6 pointer-events-none">
                  <div className="pointer-events-auto w-full sm:w-auto sm:max-w-xs rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 shadow-lg p-3.5 sm:p-5 flex sm:flex-col items-center sm:items-stretch justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
                        Ready to Run
                      </p>
                      <p className="text-xs text-slate-600">
                        {playMode === 'challenge'
                          ? `Collect ${activeStage.targetRoses} roses to unlock a surprise! Left side: Slide · Right side: Jump.`
                          : 'Tap Left side to Slide · Right side to Jump (or Space / Down).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startNewRun}
                      style={{ backgroundColor: activeWorld.accentColor }}
                      className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-xs hover:opacity-95 active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
                    >
                      Start Run
                    </button>
                  </div>
                </div>
              )}

              {/* Pause Overlay */}
              {gameState === 'PAUSED' && (
                <div
                  data-modal="true"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
                >
                  <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-5 sm:p-6 max-h-[calc(100dvh-24px)] overflow-y-auto text-center">
                    <h2 className="font-display text-2xl font-bold text-slate-900">Paused</h2>
                    <p className="mt-1 text-sm text-slate-600 font-mono-tabular">
                      {activeWorld.name} · Score {formatScore(score)}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        style={{ backgroundColor: activeWorld.accentColor }}
                        className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={startNewRun}
                        className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={handleGoHome}
                        className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Home
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pop-Up Gift Reward Modal */}
              {gameState === 'GIFT_POPUP' && (
                <GiftPopupModal
                  stage={activeStage}
                  isFinalStage={activeChallengeIdx === challengeStages.length - 1}
                  allFiveCompleted={completedCount === 5}
                  onNextStage={handleAdvanceNextChallenge}
                  onKeepRunning={() => setGameState('PLAYING')}
                  onReturnToSetup={handleGoHome}
                />
              )}

              {/* Game Over Summary Modal */}
              {gameState === 'GAME_OVER' && summary && (
                <div
                  data-modal="true"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
                >
                  <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 sm:p-6 max-h-[calc(100dvh-24px)] overflow-y-auto">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="font-display text-2xl font-bold text-slate-900">Run Over</h2>
                      {summary.isNewWorldRecord && (
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                          New World Record
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{activeWorld.name}</p>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500">Score</div>
                        <div className="font-mono-tabular text-lg font-bold text-slate-900">
                          {summary.score}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">World Best</div>
                        <div className="font-mono-tabular text-lg font-bold text-slate-900">
                          {summary.worldBest}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Roses</div>
                        <div className="font-mono-tabular text-lg font-bold text-rose-600">
                          {summary.rosesCollected}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Cleared</div>
                        <div className="font-mono-tabular text-lg font-bold text-slate-900">
                          {summary.obstaclesCleared}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleGoHome}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                      </button>
                      <button
                        type="button"
                        onClick={startNewRun}
                        style={{ backgroundColor: activeWorld.accentColor }}
                        className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Play Again</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Ergonomic Bottom Thumb Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 [@media(max-height:520px)]:pt-0">
            <div className="hidden sm:flex [@media(max-height:520px)]:hidden text-sm text-slate-500 flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                <strong className="font-semibold text-slate-700">Space / Up</strong> Jump (hold for higher arc)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-slate-700">Down / S</strong> Slide or Fast-Fall
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-slate-700">P</strong> Pause
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex [@media(max-height:520px)]:grid [@media(max-height:520px)]:w-full items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onPointerDown={() => runnerRef.current?.setDuck(true)}
                onPointerUp={() => runnerRef.current?.setDuck(false)}
                onPointerLeave={() => runnerRef.current?.setDuck(false)}
                onPointerCancel={() => runnerRef.current?.setDuck(false)}
                disabled={gameState !== 'PLAYING'}
                className="min-h-[52px] sm:min-h-[44px] [@media(max-height:520px)]:min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-2.5 [@media(max-height:520px)]:py-1.5 text-base sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-45 rounded-xl sm:rounded-lg transition-colors touch-none whitespace-nowrap"
              >
                <ArrowDown className="w-5 h-5 sm:w-4 sm:h-4" />
                <span>Slide</span>
              </button>

              <button
                type="button"
                onPointerDown={() => {
                  if (gameState === 'TITLE_MENU') startNewRun();
                  else runnerRef.current?.pressJump();
                }}
                onPointerUp={() => runnerRef.current?.releaseJump()}
                onPointerCancel={() => runnerRef.current?.releaseJump()}
                disabled={gameState === 'PAUSED' || gameState === 'GAME_OVER' || gameState === 'GIFT_POPUP'}
                style={
                  gameState === 'PLAYING' || gameState === 'TITLE_MENU'
                    ? { backgroundColor: activeWorld.accentColor }
                    : undefined
                }
                className="min-h-[52px] sm:min-h-[44px] [@media(max-height:520px)]:min-h-[40px] inline-flex items-center justify-center gap-2 px-6 py-2.5 [@media(max-height:520px)]:py-1.5 text-base sm:text-sm font-semibold text-white bg-slate-900 hover:opacity-95 active:scale-[0.99] disabled:opacity-45 rounded-xl sm:rounded-lg transition-all touch-none whitespace-nowrap"
              >
                <ArrowUp className="w-5 h-5 sm:w-4 sm:h-4" />
                <span>{gameState === 'TITLE_MENU' ? 'Start' : 'Jump'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // HOME SCREEN: Choose Mode, Runner, Costume & World
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Gift Runner
          </span>

          <div className="hidden md:flex items-center gap-3 text-sm text-slate-500 whitespace-nowrap shrink-0">
            <span>2D Multiverse Runner</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-slate-700 font-medium">
              Best {formatScore(progress.overallBest)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-slate-700 font-medium">
              {progress.totalRoses} Roses
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {SHOW_GIFT_EDITOR && playMode === 'challenge' && (
              <button
                type="button"
                onClick={() => setShowGiftEditor(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Gift className="w-4 h-4" />
                <span>Customize Gifts</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4 sm:py-6 px-4 sm:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Compact Mobile Stats Strip */}
          <div className="flex md:hidden items-center justify-between text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">
            <span className="font-mono-tabular font-semibold text-slate-800">
              Overall Best: {formatScore(progress.overallBest)}
            </span>
            <span className="font-mono-tabular font-semibold text-rose-600">
              {progress.totalRoses} Roses Collected
            </span>
          </div>

          {/* Runner, Mode & Wardrobe Setup */}
          <section className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">
                    Game Mode
                  </span>
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleSelectMode('free')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        playMode === 'free'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Free Run
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMode('challenge')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        playMode === 'challenge'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      5-World Gift Challenge
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">
                    Runner
                  </span>
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        gender === 'male'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        gender === 'female'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">
                    Pace
                  </span>
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDifficulty('normal')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        difficulty === 'normal'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setDifficulty('turbo')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        difficulty === 'turbo'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Turbo
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {SHOW_GIFT_EDITOR && playMode === 'challenge' && (
                  <button
                    type="button"
                    onClick={() => setShowGiftEditor(true)}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Customize Gifts</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleAutoMatch}
                  className={`min-h-[38px] px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    autoMatchCostume
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {autoMatchCostume ? 'Auto-Match Costume: On' : 'Auto-Match Costume: Off'}
                </button>
              </div>
            </div>

            {/* Collapsible Wardrobe on Mobile so Challenge Worlds & Customize Gifts stay above the fold */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2 sm:mb-2">
                <span className="text-xs font-medium text-slate-500">
                  Costume Wardrobe:{' '}
                  <strong className="text-slate-800">
                    {gender === 'male' ? activeCostume.maleLabel : activeCostume.femaleLabel}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileWardrobeOpen((o) => !o)}
                  className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-md bg-slate-100"
                >
                  <span>{mobileWardrobeOpen ? 'Hide' : 'Change'}</span>
                  {mobileWardrobeOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div
                className={`${
                  mobileWardrobeOpen ? 'grid mt-2.5' : 'hidden'
                } sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2`}
              >
                {COSTUMES.map((costume) => {
                  const active = costumeId === costume.id;
                  const label = gender === 'male' ? costume.maleLabel : costume.femaleLabel;
                  return (
                    <button
                      key={costume.id}
                      type="button"
                      onClick={() => handleSelectCostume(costume.id)}
                      className={`min-h-[40px] px-3 py-2 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-black/15"
                        style={{ backgroundColor: costume.accentColor }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* World Selection Gallery */}
          {playMode === 'challenge' ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                    5 Random Challenge Worlds ({completedCount}/5 Cleared)
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Tap any stage to play and collect roses to unlock its pop-up gift.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {SHOW_GIFT_EDITOR && (
                    <button
                      type="button"
                      onClick={() => setShowGiftEditor(true)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Customize Gifts</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleShuffleChallengeWorlds}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Shuffle 5 Worlds</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {challengeStages.map((stage, idx) => {
                  const world = WORLD_MAP[stage.worldId];
                  return (
                    <button
                      key={`${stage.stageIndex}-${stage.worldId}`}
                      type="button"
                      onClick={() => handleChooseChallengeStage(idx)}
                      className="group rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-sm text-left transition-all bg-white flex flex-col"
                    >
                      <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                        <WorldPreviewThumb world={world} />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 text-[11px] font-bold text-slate-900">
                          Stage {idx + 1}
                        </div>
                        {stage.completed && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-[11px] font-semibold text-white inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Cleared</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                        <div>
                          <h2 className="font-display text-sm font-bold text-slate-900 truncate">
                            {world.name}
                          </h2>
                          <p className="mt-0.5 text-xs text-rose-600 font-semibold font-mono-tabular">
                            Goal: {stage.targetRoses} Roses
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {stage.completed ? (
                            <div className="flex items-center gap-2 min-w-0">
                              {stage.gift.giftType === 'image' && stage.gift.imageDataUrl ? (
                                <img
                                  src={stage.gift.imageDataUrl}
                                  alt={stage.gift.title}
                                  className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <span className="text-lg leading-none shrink-0">
                                  {stage.gift.emoji}
                                </span>
                              )}
                              <span className="text-xs text-slate-600 truncate">
                                {stage.gift.title}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                              <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="text-xs truncate">Surprise inside</span>
                            </div>
                          )}
                          <span className="text-xs font-semibold text-slate-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                            Play →
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  Choose a World to Play
                </h1>
                <span className="text-xs sm:text-sm text-slate-500">
                  Tap any world card to launch the game
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {WORLDS.map((world) => {
                  const best = progress.bestByWorld[world.id] || 0;
                  return (
                    <button
                      key={world.id}
                      type="button"
                      onClick={() => handleChooseFreeWorld(world.id)}
                      className="group rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-sm text-left transition-all bg-white flex flex-col"
                    >
                      <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                        <WorldPreviewThumb world={world} />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <h2 className="font-display text-base font-bold text-slate-900 truncate">
                              {world.name}
                            </h2>
                            <span className="font-mono-tabular text-xs text-slate-500 shrink-0">
                              Best {formatScore(best)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                            {world.subtitle}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">
                            {gender === 'male'
                              ? COSTUME_MAP[world.defaultCostume].maleLabel
                              : COSTUME_MAP[world.defaultCostume].femaleLabel}
                          </span>
                          <span style={{ color: world.accentColor }}>Play World →</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {showGiftEditor && (
        <GiftEditorModal
          stages={challengeStages}
          onUpdateStage={handleUpdateStageGift}
          onClose={() => setShowGiftEditor(false)}
        />
      )}
    </div>
  );
}
