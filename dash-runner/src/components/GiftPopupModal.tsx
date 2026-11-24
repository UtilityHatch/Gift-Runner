import { ArrowRight, Play } from 'lucide-react';
import { ChallengeStage } from '../game/types';
import { WORLD_MAP } from '../game/worlds';

interface GiftPopupModalProps {
  stage: ChallengeStage;
  isFinalStage: boolean;
  allFiveCompleted: boolean;
  onNextStage: () => void;
  onKeepRunning: () => void;
  onReturnToSetup: () => void;
}

export function GiftPopupModal({
  stage,
  isFinalStage,
  allFiveCompleted,
  onNextStage,
  onKeepRunning,
  onReturnToSetup,
}: GiftPopupModalProps) {
  const world = WORLD_MAP[stage.worldId];
  const { gift } = stage;

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[3px] p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md [@media(max-height:520px)]:max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-5 sm:p-6 [@media(max-height:520px)]:p-4 max-h-[calc(100dvh-24px)] overflow-y-auto text-center [@media(max-height:520px)]:text-left">
        <div className="[@media(max-height:520px)]:flex [@media(max-height:520px)]:items-center [@media(max-height:520px)]:gap-5">
          {/* Visual Gift Display (Custom Image or Large Emoji) */}
          <div className="flex justify-center shrink-0">
            {gift.giftType === 'image' && gift.imageDataUrl ? (
              <div className="w-32 h-32 sm:w-36 sm:h-36 [@media(max-height:520px)]:w-24 [@media(max-height:520px)]:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                <img
                  src={gift.imageDataUrl}
                  alt={gift.title || 'Unlocked gift'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 [@media(max-height:520px)]:w-22 [@media(max-height:520px)]:h-22 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-5xl sm:text-6xl [@media(max-height:520px)]:text-5xl shadow-xs">
                <span role="img" aria-label={gift.title || 'Gift'}>
                  {gift.emoji || '🎁'}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mt-3 [@media(max-height:520px)]:mt-0 text-xs font-semibold text-rose-600">
              Stage {stage.stageIndex + 1} of 5 Cleared · {stage.targetRoses} Roses Collected
            </p>

            <h2 className="mt-1.5 [@media(max-height:520px)]:mt-1 font-display text-xl sm:text-2xl [@media(max-height:520px)]:text-lg font-bold text-slate-900">
              {gift.title || 'Gift Unlocked!'}
            </h2>
            <p className="mt-1 text-sm [@media(max-height:520px)]:text-xs text-slate-600 leading-relaxed">
              {gift.message || `You completed the ${world.name} rose challenge!`}
            </p>

            {allFiveCompleted && (
              <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                All 5 Random Challenge Worlds Completed!
              </p>
            )}

            <div className="mt-4 sm:mt-5 [@media(max-height:520px)]:mt-3 flex flex-wrap items-center justify-center [@media(max-height:520px)]:justify-start gap-2.5">
              <button
                type="button"
                onClick={onKeepRunning}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                <span>Keep Running</span>
              </button>

              {!isFinalStage ? (
                <button
                  type="button"
                  onClick={onNextStage}
                  style={{ backgroundColor: world.accentColor }}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap"
                >
                  <span>Next Challenge World</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onReturnToSetup}
                  style={{ backgroundColor: world.accentColor }}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap"
                >
                  <span>View All 5 Gifts</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
