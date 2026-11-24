import { useEffect, useRef } from 'react';
import { WorldDefinition } from '../game/types';
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  drawRoseCollectible,
  drawWorldBackdrop,
} from '../game/worldRenderer';

interface WorldPreviewThumbProps {
  world: WorldDefinition;
}

export function WorldPreviewThumb({ world }: WorldPreviewThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = 480;
    const previewH = 270;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = previewW * dpr;
    canvas.height = previewH * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Map our 1000x360 world canvas cleanly into the 16:9 card thumbnail
    const scaleY = previewH / LOGICAL_HEIGHT;
    const scaleX = previewW / LOGICAL_WIDTH;
    const scale = Math.max(scaleX, scaleY);
    const offsetX = (previewW - LOGICAL_WIDTH * scale) / 2;

    ctx.translate(offsetX, 0);
    ctx.scale(scale, scale);

    drawWorldBackdrop(ctx, world, 140, 1.2);

    // Draw 3 signature glowing roses along the path preview
    drawRoseCollectible(
      ctx,
      { id: 1, x: 420, y: 245, radius: 11, bobPhase: 0, collected: false },
      1.2
    );
    drawRoseCollectible(
      ctx,
      { id: 2, x: 485, y: 215, radius: 11, bobPhase: 0.8, collected: false },
      1.2
    );
    drawRoseCollectible(
      ctx,
      { id: 3, x: 550, y: 245, radius: 11, bobPhase: 1.6, collected: false },
      1.2
    );

    ctx.restore();
  }, [world]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full object-cover"
      aria-label={`${world.name} background preview`}
    />
  );
}
