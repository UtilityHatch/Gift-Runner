import React, { useEffect, useState } from 'react';
import { Gift, Image as ImageIcon, Minus, Plus, Smile, Trash2, Upload, X } from 'lucide-react';
import { ChallengeStage, GiftRewardConfig } from '../game/types';
import { WORLD_MAP } from '../game/worlds';

interface GiftEditorModalProps {
  stages: ChallengeStage[];
  onUpdateStage: (stageIndex: number, gift: GiftRewardConfig, targetRoses: number) => void;
  onClose: () => void;
}

const PRESET_EMOJIS = ['🎁', '💐', '💍', '🍫', '🧸', '💌', '🎂', '☕', '👑', '✈️', '🌹', '🎟️'];

function clampRoses(n: number): number {
  return Math.max(3, Math.min(100, Math.round(n)));
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function GiftEditorModal({ stages, onUpdateStage, onClose }: GiftEditorModalProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');

  const stage = stages[activeIdx];
  const world = WORLD_MAP[stage.worldId];

  const [rosesDraft, setRosesDraft] = useState<string>(String(stage.targetRoses));
  const [emojiDraft, setEmojiDraft] = useState<string>(stage.gift.emoji);

  useEffect(() => {
    setRosesDraft(String(stage.targetRoses));
    setEmojiDraft(stage.gift.emoji);
  }, [activeIdx, stage.targetRoses, stage.gift.emoji]);

  const updateGift = (patch: Partial<GiftRewardConfig>) => {
    onUpdateStage(activeIdx, { ...stage.gift, ...patch }, stage.targetRoses);
  };

  const commitRosesDraft = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? clampRoses(parsed) : stage.targetRoses;
    setRosesDraft(String(next));
    if (next !== stage.targetRoses) {
      onUpdateStage(activeIdx, stage.gift, next);
    }
  };

  const handleRosesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    setRosesDraft(digitsOnly);
    if (digitsOnly !== '') {
      const parsed = parseInt(digitsOnly, 10);
      if (Number.isFinite(parsed) && parsed >= 3 && parsed <= 100) {
        onUpdateStage(activeIdx, stage.gift, parsed);
      }
    }
  };

  const stepRoses = (delta: number) => {
    const current = parseInt(rosesDraft, 10);
    const base = Number.isFinite(current) ? current : stage.targetRoses;
    const next = clampRoses(base + delta);
    setRosesDraft(String(next));
    onUpdateStage(activeIdx, stage.gift, next);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageToDataUrl(file);
      updateGift({ giftType: 'image', imageDataUrl: dataUrl });
    } catch {
      setUploadError('Could not load that image. Please try another PNG or JPG.');
    }
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customize Challenge Gifts"
    >
      <div className="w-full max-w-xl max-h-[calc(100dvh-24px)] flex flex-col rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Gift className="w-5 h-5 text-rose-600 shrink-0" />
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
              Customize Challenge Gifts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              commitRosesDraft(rosesDraft);
              onClose();
            }}
            aria-label="Close gift editor"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Stage 1-5 Selector Tabs */}
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {stages.map((s, idx) => (
              <button
                key={s.stageIndex}
                type="button"
                onClick={() => {
                  commitRosesDraft(rosesDraft);
                  setActiveIdx(idx);
                  setUploadError('');
                }}
                className={`py-2 px-1 sm:px-2 text-xs font-semibold rounded-md transition-colors flex flex-col items-center gap-0.5 ${
                  activeIdx === idx
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Stage {idx + 1}</span>
                <span className="text-[11px] font-normal">
                  {s.gift.giftType === 'image' && s.gift.imageDataUrl ? 'Photo' : s.gift.emoji}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 sm:px-4 py-3">
            <div>
              <span className="text-xs text-slate-500 block">Assigned World</span>
              <span className="font-display font-bold text-slate-900">{world.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">Target Roses:</span>
              <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => stepRoses(-1)}
                  aria-label="Decrease target roses"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 border-r border-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Target roses"
                  value={rosesDraft}
                  onFocus={(e) => e.target.select()}
                  onChange={handleRosesChange}
                  onBlur={() => commitRosesDraft(rosesDraft)}
                  className="w-12 h-9 px-1 bg-white font-mono-tabular text-sm font-semibold text-slate-900 text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => stepRoses(1)}
                  aria-label="Increase target roses"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 border-l border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Gift Type Toggle */}
          <div className="space-y-3">
            <span className="block text-xs font-medium text-slate-500">Gift Format</span>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => updateGift({ giftType: 'emoji' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  stage.gift.giftType === 'emoji'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Emoji Gift</span>
              </button>
              <button
                type="button"
                onClick={() => updateGift({ giftType: 'image' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  stage.gift.giftType === 'image'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom Image</span>
              </button>
            </div>
          </div>

          {stage.gift.giftType === 'emoji' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setEmojiDraft(em);
                      updateGift({ emoji: em });
                    }}
                    className={`w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all ${
                      stage.gift.emoji === em
                        ? 'border-slate-900 bg-slate-900/5 scale-105'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Or enter any emoji</span>
                <input
                  type="text"
                  maxLength={6}
                  value={emojiDraft}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmojiDraft(val);
                    if (val.trim()) {
                      updateGift({ emoji: val });
                    }
                  }}
                  onBlur={() => {
                    if (!emojiDraft.trim()) {
                      setEmojiDraft('🎁');
                      updateGift({ emoji: '🎁' });
                    }
                  }}
                  className="mt-1 w-24 px-3 py-2 text-lg text-center rounded-lg border border-slate-300 bg-white"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {stage.gift.imageDataUrl ? (
                <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={stage.gift.imageDataUrl}
                    alt="Uploaded custom gift"
                    className="w-24 h-24 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-600">
                      Custom image saved for Stage {activeIdx + 1}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => updateGift({ imageDataUrl: undefined })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Upload a gift photo or illustration
                  </span>
                  <span className="text-xs text-slate-500">PNG, JPG, or WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
              {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
            </div>
          )}

          {/* Gift Title & Message */}
          <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Gift Title</span>
              <input
                type="text"
                maxLength={50}
                value={stage.gift.title}
                onChange={(e) => updateGift({ title: e.target.value })}
                placeholder="e.g. Surprise Coffee Voucher"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Pop-Up Message</span>
              <input
                type="text"
                maxLength={120}
                value={stage.gift.message}
                onChange={(e) => updateGift({ message: e.target.value })}
                placeholder="Write a personal note shown when this gift unlocks..."
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </label>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">Range: 3–100 roses</span>
          <button
            type="button"
            onClick={() => {
              commitRosesDraft(rosesDraft);
              onClose();
            }}
            className="min-h-[40px] px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
