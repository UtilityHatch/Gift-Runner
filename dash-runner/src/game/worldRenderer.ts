import {
  AmbientPetal,
  Obstacle,
  RoseCollectible,
  WorldDefinition,
} from './types';

export const LOGICAL_WIDTH = 1000;
export const LOGICAL_HEIGHT = 360;
export const GROUND_Y = 294;

export function drawWorldBackdrop(
  ctx: CanvasRenderingContext2D,
  world: WorldDefinition,
  distance: number,
  time: number,
  logicalWidth: number = LOGICAL_WIDTH
): void {
  // 1. Multi-stop Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, world.skyTop);
  skyGrad.addColorStop(0.55, world.skyMid);
  skyGrad.addColorStop(1, world.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, logicalWidth, GROUND_Y);

  // 2. World-specific far & mid parallax architecture
  switch (world.id) {
    case 'battlefield':
      drawBattlefieldParallax(ctx, distance, time, logicalWidth);
      break;
    case 'dynasty':
      drawDynastyParallax(ctx, distance, time);
      break;
    case 'shanghai':
      drawShanghaiParallax(ctx, distance, time, logicalWidth);
      break;
    case 'joseon':
      drawJoseonParallax(ctx, distance, time);
      break;
    case 'miao':
      drawMiaoParallax(ctx, distance, time);
      break;
    case 'city_park':
      drawCityParkParallax(ctx, distance, time, logicalWidth);
      break;
    case 'wedding':
      drawWeddingParallax(ctx, distance, time, logicalWidth);
      break;
    case 'marvel':
      drawMarvelParallax(ctx, distance, time);
      break;
    case 'gta6':
      drawGta6Parallax(ctx, distance, time, logicalWidth);
      break;
  }

  // 3. Ground Strip & World Road Texture
  ctx.fillStyle = world.groundFill;
  ctx.fillRect(0, GROUND_Y, logicalWidth, LOGICAL_HEIGHT - GROUND_Y);

  // Cobble / stone / asphalt pattern
  drawGroundTexture(ctx, world, distance, time, logicalWidth);

  // Crisp horizon line
  ctx.strokeStyle = world.groundLine;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(logicalWidth, GROUND_Y);
  ctx.stroke();
}

function drawGroundTexture(
  ctx: CanvasRenderingContext2D,
  world: WorldDefinition,
  distance: number,
  _time: number,
  logicalWidth: number
): void {
  ctx.save();
  const tileW = 80;
  const offset = distance % tileW;

  // Wet puddle reflections for Shanghai, City Park, GTA6
  if (world.id === 'shanghai' || world.id === 'city_park' || world.id === 'gta6') {
    const puddleSpan = 260;
    const pOffset = (distance * 1.0) % puddleSpan;
    for (let x = -pOffset; x < logicalWidth + puddleSpan; x += puddleSpan) {
      ctx.fillStyle =
        world.id === 'gta6'
          ? 'rgba(236, 72, 153, 0.25)'
          : world.id === 'shanghai'
            ? 'rgba(251, 146, 60, 0.28)'
            : 'rgba(147, 197, 253, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x + 90, GROUND_Y + 28, 54, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Paving seams or dirt dashes
  ctx.strokeStyle = world.groundAccent;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.48;
  for (let x = -offset; x < logicalWidth + tileW; x += tileW) {
    if (world.id === 'battlefield') {
      ctx.beginPath();
      ctx.moveTo(x + 12, GROUND_Y + 18);
      ctx.lineTo(x + 36, GROUND_Y + 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 50, GROUND_Y + 38);
      ctx.lineTo(x + 68, GROUND_Y + 38);
      ctx.stroke();
    } else if (world.id === 'marvel' || world.id === 'gta6') {
      ctx.beginPath();
      ctx.moveTo(x + 10, GROUND_Y + 24);
      ctx.lineTo(x + 48, GROUND_Y + 24);
      ctx.stroke();
    } else {
      // Stone tiles / cobble blocks
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x - 14, LOGICAL_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 26);
      ctx.lineTo(x + tileW, GROUND_Y + 26);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSunOrMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  haloColor: string
): void {
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.5);
  halo.addColorStop(0, haloColor);
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSoftCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(20, -6, 22, 0, Math.PI * 2);
  ctx.arc(44, -2, 17, 0, Math.PI * 2);
  ctx.arc(22, 8, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 1. OLD BATTLEFIELD
function drawBattlefieldParallax(
  ctx: CanvasRenderingContext2D,
  dist: number,
  time: number,
  logicalWidth: number
): void {
  drawSunOrMoon(ctx, logicalWidth * 0.75, 145, 34, '#FEF3C7', 'rgba(253, 186, 116, 0.55)');

  // Distant blue-violet mountain ridge
  ctx.fillStyle = '#6B7AA1';
  const mSpan = 600;
  const mOff = (dist * 0.08) % mSpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * mSpan - mOff;
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.lineTo(bx + 140, GROUND_Y - 125);
    ctx.lineTo(bx + 290, GROUND_Y - 70);
    ctx.lineTo(bx + 440, GROUND_Y - 140);
    ctx.lineTo(bx + 600, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // Midground wooden watchtowers, war tents, palisades & red banners
  const span = 520;
  const off = (dist * 0.28) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;

    // Watchtower
    ctx.strokeStyle = '#6D4C3D';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx + 270, GROUND_Y);
    ctx.lineTo(bx + 282, GROUND_Y - 115);
    ctx.moveTo(bx + 312, GROUND_Y);
    ctx.lineTo(bx + 300, GROUND_Y - 115);
    ctx.stroke();
    ctx.fillStyle = '#8C6239';
    ctx.fillRect(bx + 274, GROUND_Y - 120, 34, 18);
    // Roof
    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(bx + 266, GROUND_Y - 120);
    ctx.lineTo(bx + 291, GROUND_Y - 140);
    ctx.lineTo(bx + 316, GROUND_Y - 120);
    ctx.closePath();
    ctx.fill();

    // War tent
    ctx.fillStyle = '#F3EAD8';
    ctx.beginPath();
    ctx.moveTo(bx + 60, GROUND_Y);
    ctx.lineTo(bx + 70, GROUND_Y - 65);
    ctx.lineTo(bx + 115, GROUND_Y - 95);
    ctx.lineTo(bx + 160, GROUND_Y - 65);
    ctx.lineTo(bx + 170, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(bx + 70, GROUND_Y - 66, 90, 9);

    // Waving Crimson Banner
    const wave = Math.sin(time * 4 + i) * 6;
    ctx.strokeStyle = '#4A3222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + 210, GROUND_Y);
    ctx.lineTo(bx + 210, GROUND_Y - 145);
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(bx + 210, GROUND_Y - 142);
    ctx.quadraticCurveTo(bx + 250, GROUND_Y - 148 + wave, bx + 285, GROUND_Y - 135 - wave);
    ctx.lineTo(bx + 268, GROUND_Y - 120);
    ctx.lineTo(bx + 210, GROUND_Y - 122);
    ctx.closePath();
    ctx.fill();

    // Palisade fence posts
    ctx.fillStyle = '#7C5836';
    for (let p = 0; p < 5; p++) {
      const px = bx + 340 + p * 18;
      ctx.fillRect(px, GROUND_Y - 46, 10, 46);
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y - 46);
      ctx.lineTo(px + 5, GROUND_Y - 58);
      ctx.lineTo(px + 10, GROUND_Y - 46);
      ctx.fill();
    }
  }
}

// 2. TANG & IMPERIAL DYNASTY
function drawDynastyParallax(ctx: CanvasRenderingContext2D, dist: number, _time: number): void {
  drawSoftCloud(ctx, ((900 - dist * 0.05) % 1100 + 1100) % 1100 - 50, 56, 1.0, 'rgba(255,255,255,0.85)');
  drawSoftCloud(ctx, ((420 - dist * 0.05) % 1100 + 1100) % 1100 - 50, 74, 0.78, 'rgba(255,255,255,0.75)');

  // Distant Golden-Roofed Palace Halls
  const span = 560;
  const off = (dist * 0.16) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // White marble terrace
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(bx + 220, GROUND_Y - 82, 260, 82);

    // Palace hall body
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(bx + 250, GROUND_Y - 138, 200, 56);

    // Tiered golden curved pagoda roofs
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(bx + 225, GROUND_Y - 134);
    ctx.quadraticCurveTo(bx + 350, GROUND_Y - 165, bx + 475, GROUND_Y - 134);
    ctx.lineTo(bx + 448, GROUND_Y - 155);
    ctx.lineTo(bx + 252, GROUND_Y - 155);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx + 258, GROUND_Y - 164);
    ctx.quadraticCurveTo(bx + 350, GROUND_Y - 196, bx + 442, GROUND_Y - 164);
    ctx.lineTo(bx + 410, GROUND_Y - 186);
    ctx.lineTo(bx + 290, GROUND_Y - 186);
    ctx.closePath();
    ctx.fill();

    // Lotus pond & arched marble bridge
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(bx + 20, GROUND_Y - 32, 190, 32);
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(bx + 115, GROUND_Y + 6, 56, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();

    // Crimson palace pillar + hanging lantern
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(bx + 505, GROUND_Y - 165, 14, 165);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.ellipse(bx + 492, GROUND_Y - 130, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(bx + 487, GROUND_Y - 145, 10, 4);
    ctx.fillRect(bx + 487, GROUND_Y - 117, 10, 4);
  }
}

// 3. REPUBLIC SHANGHAI (民国)
function drawShanghaiParallax(
  ctx: CanvasRenderingContext2D,
  dist: number,
  _time: number,
  logicalWidth: number
): void {
  drawSunOrMoon(ctx, logicalWidth * 0.82, 128, 30, '#FEF08A', 'rgba(251, 146, 60, 0.5)');

  // Distant Bund Skyline & Clocktower
  const skySpan = 640;
  const skyOff = (dist * 0.14) % skySpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * skySpan - skyOff;
    ctx.fillStyle = '#4C3D5C';
    ctx.fillRect(bx + 40, GROUND_Y - 140, 80, 140);
    ctx.fillRect(bx + 140, GROUND_Y - 190, 66, 190);
    // Art Deco spire
    ctx.fillStyle = '#6D5478';
    ctx.fillRect(bx + 158, GROUND_Y - 225, 30, 35);

    // Customs House Clocktower
    ctx.fillStyle = '#5B496B';
    ctx.fillRect(bx + 320, GROUND_Y - 155, 110, 155);
    ctx.fillRect(bx + 355, GROUND_Y - 210, 40, 55);
    // Glowing clock face
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(bx + 375, GROUND_Y - 182, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Midground glowing Bund storefronts & passing green tram
  const midSpan = 560;
  const midOff = (dist * 0.34) % midSpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * midSpan - midOff;
    // Stone facade
    ctx.fillStyle = '#786B7D';
    ctx.fillRect(bx + 20, GROUND_Y - 150, 210, 150);
    // Glowing warm windows
    ctx.fillStyle = '#FDBA74';
    ctx.fillRect(bx + 38, GROUND_Y - 82, 46, 62);
    ctx.fillRect(bx + 102, GROUND_Y - 82, 46, 62);
    ctx.fillRect(bx + 166, GROUND_Y - 82, 46, 62);

    // Red/White striped awning
    for (let s = 0; s < 8; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#B91C1C' : '#FEF3C7';
      ctx.fillRect(bx + 26 + s * 24, GROUND_Y - 96, 24, 14);
    }

    // Vintage Green Shanghai Tram in background lane
    const tx = bx + 310;
    ctx.fillStyle = '#14532D';
    ctx.beginPath();
    ctx.roundRect(tx, GROUND_Y - 78, 125, 62, 6);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(tx + 8, GROUND_Y - 68, 108, 22);
    // Headlight
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(tx + 12, GROUND_Y - 28, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 4. KOREAN DYNASTY (JOSEON SPRING)
function drawJoseonParallax(ctx: CanvasRenderingContext2D, dist: number, _time: number): void {
  // Distant misty spring mountain
  const mSpan = 600;
  const mOff = (dist * 0.08) % mSpan;
  ctx.fillStyle = '#7BA59B';
  for (let i = -1; i <= 2; i++) {
    const bx = i * mSpan - mOff;
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.quadraticCurveTo(bx + 180, GROUND_Y - 130, bx + 380, GROUND_Y - 40);
    ctx.quadraticCurveTo(bx + 490, GROUND_Y - 105, bx + 600, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // Gyeongbokgung Palace Halls & Cherry Blossoms
  const span = 540;
  const off = (dist * 0.25) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // Stone terrace & wall
    ctx.fillStyle = '#E7E5E4';
    ctx.fillRect(bx + 20, GROUND_Y - 52, 220, 52);
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(bx + 40, GROUND_Y - 115, 180, 63);
    // Green lattice doors
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(bx + 75, GROUND_Y - 102, 34, 48);
    ctx.fillRect(bx + 145, GROUND_Y - 102, 34, 48);

    // Sweeping dark-slate giwa roof with dancheong trim
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(bx + 28, GROUND_Y - 122, 204, 8);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(bx + 10, GROUND_Y - 122);
    ctx.quadraticCurveTo(bx + 130, GROUND_Y - 148, bx + 250, GROUND_Y - 122);
    ctx.lineTo(bx + 215, GROUND_Y - 158);
    ctx.lineTo(bx + 45, GROUND_Y - 158);
    ctx.closePath();
    ctx.fill();

    // Blooming Cherry Blossom tree
    ctx.fillStyle = '#573E34';
    ctx.fillRect(bx + 355, GROUND_Y - 135, 16, 135);
    const blossoms = [
      { cx: 340, cy: 135, r: 34 },
      { cx: 382, cy: 122, r: 40 },
      { cx: 418, cy: 145, r: 30 },
    ];
    for (const b of blossoms) {
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.arc(bx + b.cx, b.cy, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(bx + b.cx - 8, b.cy - 6, b.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 5. MIAO FESTIVAL VILLAGE
function drawMiaoParallax(ctx: CanvasRenderingContext2D, dist: number, _time: number): void {
  // Terraced misty green hills
  const mSpan = 620;
  const mOff = (dist * 0.09) % mSpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * mSpan - mOff;
    ctx.fillStyle = '#6EE7B7';
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.quadraticCurveTo(bx + 190, GROUND_Y - 175, bx + 410, GROUND_Y - 60);
    ctx.quadraticCurveTo(bx + 520, GROUND_Y - 145, bx + 620, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Terraced rice lines
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    for (let t = 1; t <= 4; t++) {
      ctx.beginPath();
      ctx.moveTo(bx + 40, GROUND_Y - t * 24);
      ctx.quadraticCurveTo(bx + 190, GROUND_Y - t * 24 - 28, bx + 340, GROUND_Y - t * 24);
      ctx.stroke();
    }
  }

  // Miao Wooden Stilt Houses & Silver Horn Totem
  const span = 500;
  const off = (dist * 0.27) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // Wooden stilt house
    ctx.fillStyle = '#78350F';
    ctx.fillRect(bx + 45, GROUND_Y - 110, 130, 72);
    ctx.fillRect(bx + 54, GROUND_Y - 38, 10, 38);
    ctx.fillRect(bx + 156, GROUND_Y - 38, 10, 38);
    // Tiled roof
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(bx + 28, GROUND_Y - 110);
    ctx.lineTo(bx + 110, GROUND_Y - 152);
    ctx.lineTo(bx + 192, GROUND_Y - 110);
    ctx.closePath();
    ctx.fill();
    // Hanging red festival lanterns
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(bx + 62, GROUND_Y - 92, 9, 0, Math.PI * 2);
    ctx.arc(bx + 158, GROUND_Y - 92, 9, 0, Math.PI * 2);
    ctx.fill();

    // Silver Crescent Horn Pole
    ctx.fillStyle = '#92400E';
    ctx.fillRect(bx + 320, GROUND_Y - 148, 12, 148);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(bx + 326, GROUND_Y - 160, 22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Colorful embroidered banner
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(bx + 314, GROUND_Y - 130, 24, 58);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(bx + 318, GROUND_Y - 118, 16, 16);
  }
}

// 6. GOLDEN CITY PARK
function drawCityParkParallax(
  ctx: CanvasRenderingContext2D,
  dist: number,
  time: number,
  logicalWidth: number
): void {
  drawSunOrMoon(ctx, logicalWidth * 0.78, 128, 32, '#FEF9C3', 'rgba(251, 146, 60, 0.55)');

  // Distant Twin Towers + Skyline across lake
  const skySpan = 720;
  const skyOff = (dist * 0.1) % skySpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * skySpan - skyOff;
    ctx.fillStyle = '#9D8BB5';
    ctx.fillRect(bx + 360, GROUND_Y - 130, 40, 130);
    ctx.fillRect(bx + 410, GROUND_Y - 105, 34, 105);
    // Twin towers silhouette
    ctx.fillStyle = '#B8A8CC';
    ctx.fillRect(bx + 470, GROUND_Y - 210, 22, 210);
    ctx.fillRect(bx + 510, GROUND_Y - 210, 22, 210);
    ctx.fillRect(bx + 492, GROUND_Y - 135, 18, 8);
    // Spire tower
    ctx.fillRect(bx + 610, GROUND_Y - 185, 12, 185);
    ctx.beginPath();
    ctx.arc(bx + 616, GROUND_Y - 160, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Park Lake & Fountain
  ctx.fillStyle = 'rgba(253, 186, 116, 0.45)';
  ctx.fillRect(0, GROUND_Y - 54, logicalWidth, 24);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(0, GROUND_Y - 30, logicalWidth, 30);

  // Midground Cafe Awnings, Park Benches & Lamp Posts
  const span = 520;
  const off = (dist * 0.3) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // Cafe storefront + red/white awning
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 30, GROUND_Y - 135, 140, 135);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(bx + 46, GROUND_Y - 95, 108, 65);
    for (let s = 0; s < 6; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#E11D48' : '#FFFFFF';
      ctx.fillRect(bx + 26 + s * 25, GROUND_Y - 115, 25, 18);
    }

    // Park Lamp Post + Pink Banner
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(bx + 275, GROUND_Y - 125, 6, 125);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(bx + 278, GROUND_Y - 130, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(bx + 262, GROUND_Y - 102, 12, 24);

    // Park Wooden Bench
    ctx.fillStyle = '#92400E';
    ctx.fillRect(bx + 355, GROUND_Y - 34, 72, 16);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(bx + 362, GROUND_Y - 18, 6, 18);
    ctx.fillRect(bx + 414, GROUND_Y - 18, 6, 18);

    // Fountain spray shimmer
    const spray = Math.sin(time * 7 + i) * 4;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(bx + 470, GROUND_Y - 58 - spray, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 7. TWILIGHT WEDDING
function drawWeddingParallax(
  ctx: CanvasRenderingContext2D,
  dist: number,
  time: number,
  logicalWidth: number
): void {
  // Twinkling twilight stars
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const sx = ((i * 157 + 30) % Math.max(100, logicalWidth - 40)) + 20;
    const sy = ((i * 67 + 16) % 110) + 14;
    ctx.globalAlpha = 0.45 + 0.45 * Math.sin(time * 3 + i);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Midground Rose Gazebo Pavilions & String Lights
  const span = 560;
  const off = (dist * 0.26) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // White marble gazebo columns
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(bx + 310, GROUND_Y - 135, 14, 135);
    ctx.fillRect(bx + 416, GROUND_Y - 135, 14, 135);
    // Dome roof
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.arc(bx + 370, GROUND_Y - 135, 68, Math.PI, 0);
    ctx.fill();
    // Floral rose garland arch
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(bx + 370, GROUND_Y - 110, 44, Math.PI, 0);
    ctx.stroke();

    // Oak tree with fairy string lights
    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(bx + 60, GROUND_Y - 130, 24, 130);
    ctx.fillStyle = '#3B0764';
    ctx.beginPath();
    ctx.arc(bx + 72, GROUND_Y - 145, 58, 0, Math.PI * 2);
    ctx.fill();
    // Fairy lights
    ctx.fillStyle = '#FDE047';
    for (let l = 0; l < 6; l++) {
      ctx.beginPath();
      ctx.arc(bx + 35 + l * 16, GROUND_Y - 140 + (l % 2) * 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 8. MARVEL METAVERSE
function drawMarvelParallax(ctx: CanvasRenderingContext2D, dist: number, time: number): void {
  // Futuristic Stark-style skyline
  const skySpan = 600;
  const skyOff = (dist * 0.14) % skySpan;
  for (let i = -1; i <= 2; i++) {
    const bx = i * skySpan - skyOff;
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(bx + 40, GROUND_Y - 170, 56, 170);
    ctx.fillRect(bx + 120, GROUND_Y - 210, 48, 210);
    ctx.fillRect(bx + 290, GROUND_Y - 145, 70, 145);
    // Hero Tower with glowing cyan core
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(bx + 430, GROUND_Y);
    ctx.lineTo(bx + 444, GROUND_Y - 235);
    ctx.lineTo(bx + 485, GROUND_Y - 210);
    ctx.lineTo(bx + 495, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(bx + 468, GROUND_Y - 185, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Swirling Sling-Ring Multiverse Portals
  const pSpan = 480;
  const pOff = (dist * 0.25) % pSpan;
  for (let i = -1; i <= 2; i++) {
    const px = i * pSpan - pOff + 220;
    const py = 112 + (i % 2) * 32;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(time * 2.2);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// 9. GTA 6 VICE COAST
function drawGta6Parallax(
  ctx: CanvasRenderingContext2D,
  dist: number,
  _time: number,
  logicalWidth: number
): void {
  drawSunOrMoon(ctx, logicalWidth * 0.76, 130, 42, '#FDE047', 'rgba(236, 72, 153, 0.5)');

  // Ocean horizon strip
  ctx.fillStyle = 'rgba(45, 212, 191, 0.35)';
  ctx.fillRect(0, GROUND_Y - 38, logicalWidth, 38);

  // Pastel Art Deco Ocean Drive Hotels & Swaying Palm Trees
  const span = 540;
  const off = (dist * 0.28) % span;
  for (let i = -1; i <= 2; i++) {
    const bx = i * span - off;
    // Pastel Art Deco hotel
    ctx.fillStyle = '#FBCFE8';
    ctx.fillRect(bx + 40, GROUND_Y - 140, 145, 140);
    ctx.fillStyle = '#2DD4BF';
    ctx.fillRect(bx + 40, GROUND_Y - 140, 145, 12);
    // Glowing pink neon sign bar
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(bx + 68, GROUND_Y - 115, 88, 12);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(bx + 56, GROUND_Y - 82, 34, 48);
    ctx.fillRect(bx + 132, GROUND_Y - 82, 34, 48);

    // Tall Silhouette Palm Tree
    ctx.strokeStyle = '#311042';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(bx + 320, GROUND_Y);
    ctx.quadraticCurveTo(bx + 332, GROUND_Y - 90, bx + 345, GROUND_Y - 170);
    ctx.stroke();

    // Palm fronds
    ctx.fillStyle = '#1E1B4B';
    for (let f = 0; f < 5; f++) {
      const ang = -2.5 + f * 0.9;
      ctx.beginPath();
      ctx.ellipse(
        bx + 345 + Math.cos(ang) * 26,
        GROUND_Y - 170 + Math.sin(ang) * 14,
        28,
        7,
        ang,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

// GLOWING RED ROSE COLLECTIBLE
export function drawRoseCollectible(
  ctx: CanvasRenderingContext2D,
  rose: RoseCollectible,
  time: number
): void {
  const cy = rose.y + Math.sin(time * 5.2 + rose.bobPhase) * 4;
  ctx.save();
  ctx.translate(rose.x, cy);

  // Warm golden aura (matching reference images)
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, rose.radius + 9);
  glow.addColorStop(0, 'rgba(253, 224, 71, 0.72)');
  glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, rose.radius + 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(Math.sin(time * 2.8 + rose.bobPhase) * 0.14);

  // Green stem & leaves
  ctx.strokeStyle = '#15803D';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.lineTo(-5, 13);
  ctx.stroke();

  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.ellipse(-6, 9, 4.5, 2.2, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Outer crimson rose petals
  ctx.fillStyle = '#DC2626';
  ctx.strokeStyle = '#7F1D1D';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -1, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner brighter petal swirl
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(-1, -2, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, -2, 3.6, 0.3, Math.PI * 1.7);
  ctx.stroke();

  // Specular sparkle
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(8, -8, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawAmbientPetals(ctx: CanvasRenderingContext2D, petals: AmbientPetal[], time: number): void {
  ctx.save();
  for (const p of petals) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(time * 2 + p.phase);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// WORLD-SPECIFIC OBSTACLES
export function drawWorldObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
  const { x, y, width: w, height: h, kind, animPhase } = obs;
  const ink = '#1E293B';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;

  switch (kind) {
    case 'barrel': {
      ctx.fillStyle = '#9A6338';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 2, y + 7, w - 4, 5);
      ctx.fillRect(x + 2, y + h - 12, w - 4, 5);
      break;
    }
    case 'war_cart':
    case 'scroll_cart':
    case 'straw_cart': {
      // Wooden cart chassis
      ctx.fillStyle = '#8C5A32';
      ctx.fillRect(x + 4, y + h * 0.32, w - 8, h * 0.42);
      ctx.strokeRect(x + 4, y + h * 0.32, w - 8, h * 0.42);
      // Cargo
      ctx.fillStyle = kind === 'scroll_cart' ? '#FEF3C7' : kind === 'straw_cart' ? '#FDE047' : '#A16207';
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 4, w - 16, h * 0.34, 4);
      ctx.fill();
      ctx.stroke();
      // Wheel
      ctx.fillStyle = '#5C3A21';
      ctx.beginPath();
      ctx.arc(x + w * 0.52, y + h - 11, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'palisade': {
      ctx.fillStyle = '#7C5836';
      for (let i = 0; i < 3; i++) {
        const px = x + i * (w / 3) + 2;
        const pw = w / 3 - 4;
        ctx.beginPath();
        ctx.moveTo(px, y + h);
        ctx.lineTo(px, y + 12);
        ctx.lineTo(px + pw / 2, y);
        ctx.lineTo(px + pw, y + 12);
        ctx.lineTo(px + pw, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(x + 2, y + h * 0.46, w - 4, 6);
      break;
    }
    case 'tea_table': {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x, y + 10, w, 8);
      ctx.strokeRect(x, y + 10, w, 8);
      ctx.fillRect(x + 6, y + 18, 6, h - 18);
      ctx.fillRect(x + w - 12, y + 18, 6, h - 18);
      // Teapot
      ctx.fillStyle = '#A7F3D0';
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'peony_pot':
    case 'flower_urn':
    case 'palm_planter': {
      ctx.fillStyle = kind === 'peony_pot' ? '#EFF6FF' : kind === 'flower_urn' ? '#F8FAFC' : '#F472B6';
      ctx.beginPath();
      ctx.roundRect(x + 6, y + h * 0.4, w - 12, h * 0.6, 5);
      ctx.fill();
      ctx.stroke();
      // Foliage / Flowers
      ctx.fillStyle = kind === 'palm_planter' ? '#22C55E' : '#F43F5E';
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.28, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'suitcases': {
      const colors = ['#92400E', '#365314', '#B45309'];
      for (let i = 0; i < 3; i++) {
        const sw = w - i * 8;
        const sx = x + i * 4;
        const sy = y + h - (i + 1) * 15;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, 14, 3);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'street_barrier':
    case 'beach_barrier': {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 4, y + 4, 6, h - 4);
      ctx.fillRect(x + w - 10, y + 4, 6, h - 4);
      ctx.fillStyle = kind === 'beach_barrier' ? '#2DD4BF' : '#DC2626';
      ctx.fillRect(x, y + 8, w, 13);
      ctx.strokeRect(x, y + 8, w, 13);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + w * 0.28, y + 8, 8, 13);
      ctx.fillRect(x + w * 0.64, y + 8, 8, 13);
      break;
    }
    case 'tram_post':
    case 'park_bollard': {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(x + w * 0.25, y + 8, w * 0.5, h - 8, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'onggi_jars': {
      ctx.fillStyle = '#5C3A21';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.36, y + h * 0.55, 13, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + w * 0.72, y + h * 0.68, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'palace_drum':
    case 'festival_drum': {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 6, y + h * 0.55, 6, h * 0.45);
      ctx.fillRect(x + w - 12, y + h * 0.55, 6, h * 0.45);
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.4, w * 0.42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.28, w * 0.34, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bamboo_basket':
    case 'harvest_baskets': {
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 6);
      ctx.lineTo(x + w - 4, y + 6);
      ctx.lineTo(x + w - 8, y + h);
      ctx.lineTo(x + 8, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(x + 6, y + h * 0.42, w - 12, 7);
      break;
    }
    case 'skateboard': {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(x, y + h - 15, w, 7, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(x + 11, y + h - 5, 5, 0, Math.PI * 2);
      ctx.arc(x + w - 11, y + h - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'cone_double':
    case 'neon_cones': {
      const cColor = kind === 'neon_cones' ? '#EC4899' : '#F97316';
      for (let i = 0; i < 2; i++) {
        const cx = x + i * (w * 0.52);
        const cw = w * 0.46;
        ctx.fillStyle = cColor;
        ctx.beginPath();
        ctx.moveTo(cx + 2, y + h);
        ctx.lineTo(cx + cw * 0.36, y + 4);
        ctx.lineTo(cx + cw * 0.64, y + 4);
        ctx.lineTo(cx + cw - 2, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx + cw * 0.25, y + h * 0.45, cw * 0.5, 6);
      }
      break;
    }
    case 'gift_box': {
      ctx.fillStyle = '#FBCFE8';
      ctx.fillRect(x + 2, y + 8, w - 4, h - 8);
      ctx.strokeRect(x + 2, y + 8, w - 4, h - 8);
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(x + w * 0.42, y + 8, 7, h - 8);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ribbon_stanchion': {
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(x + 4, y + 6, 5, h - 6);
      ctx.fillRect(x + w - 9, y + 6, 5, h - 6);
      ctx.strokeStyle = '#F472B6';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 12);
      ctx.quadraticCurveTo(x + w * 0.5, y + 28, x + w - 6, y + 12);
      ctx.stroke();
      break;
    }
    case 'energy_barrier': {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y + h - 10, w, 10);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
      ctx.strokeStyle = '#38BDF8';
      ctx.fillRect(x + 4, y, w - 8, h - 10);
      ctx.strokeRect(x + 4, y, w - 8, h - 10);
      break;
    }
    case 'tech_crate':
    case 'rubble_spike': {
      ctx.fillStyle = kind === 'tech_crate' ? '#1E293B' : '#475569';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F97316';
      ctx.fillRect(x + 6, y + h * 0.42, w - 12, 6);
      break;
    }
    // AERIAL OBSTACLES
    case 'arrow_volley': {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 10, y + 10, w - 14, 4);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(x, y + 12);
      ctx.lineTo(x + 12, y + 6);
      ctx.lineTo(x + 12, y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(x + w - 10, y + 7, 10, 10);
      break;
    }
    case 'palace_lantern': {
      const bob = Math.sin(animPhase * 0.4) * 3;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.5 + bob, 14, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(x + w * 0.5 - 6, y + 2 + bob, 12, 4);
      ctx.fillRect(x + w * 0.5 - 6, y + h - 6 + bob, 12, 4);
      break;
    }
    case 'magpie_kite':
    case 'silk_kite': {
      const sway = Math.sin(animPhase * 0.5) * 5;
      ctx.fillStyle = kind === 'magpie_kite' ? '#0F766E' : '#EC4899';
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.5);
      ctx.lineTo(x + w * 0.5, y);
      ctx.lineTo(x + w, y + h * 0.5 + sway * 0.3);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'petal_dove': {
      const flap = Math.sin(animPhase) * 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.55, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.45, y + h * 0.5);
      ctx.quadraticCurveTo(x + w * 0.65, y - flap, x + w * 0.8, y + 4 + flap);
      ctx.lineTo(x + w * 0.6, y + h * 0.55);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'vice_chopper':
    case 'repulsor_drone':
    case 'news_drone':
    case 'park_drone': {
      const rotor = Math.sin(animPhase * 2) * 18;
      ctx.fillStyle = kind === 'repulsor_drone' ? '#B91C1C' : kind === 'vice_chopper' ? '#EC4899' : '#334155';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.6, 17, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Visor / Cockpit
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(x + w * 0.32, y + h * 0.55, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Spinning top blade
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5 - rotor, y + 3);
      ctx.lineTo(x + w * 0.5 + rotor, y + 3);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}
