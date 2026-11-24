import {
  CostumeDefinition,
  PlayerState,
  RunnerGender,
} from './types';

export function drawAnimeCharacter(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  gender: RunnerGender,
  costume: CostumeDefinition,
  time: number
): void {
  const ink = '#18181B';
  const skin = '#FCD5B5';
  const skinShade = '#F3B48A';

  // Flowing sash / cape / scarf ribbon behind character
  drawRibbonTrail(ctx, player, costume, ink);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const centerX = player.x + player.width / 2;
  const bottomY = player.y + player.height;
  ctx.translate(centerX, bottomY);
  ctx.scale(player.squashX, player.squashY);

  if (player.hitStun) {
    ctx.rotate(-0.18);
  } else if (player.isDucking && player.isGrounded) {
    drawSlidePose(ctx, gender, costume, ink, skin, skinShade);
    ctx.restore();
    return;
  }

  const bob = player.isGrounded && !player.hitStun ? Math.abs(Math.sin(player.runCycle)) * -3.5 : 0;
  const lean = player.hitStun ? -0.08 : !player.isGrounded ? (player.vy < 0 ? 0.08 : 0.14) : 0.13;
  ctx.translate(0, bob);
  ctx.rotate(lean);

  const stride = player.isGrounded ? Math.sin(player.runCycle) : 0.85;
  const strideOpp = player.isGrounded ? Math.sin(player.runCycle + Math.PI) : -0.65;

  // Determine skirt / robe hem vs trousers
  const hasFlowingSkirtOrRobe =
    costume.id === 'dynasty' ||
    costume.id === 'joseon' ||
    (gender === 'female' && (costume.id === 'wedding' || costume.id === 'shanghai'));

  // Back Arm
  drawCharArm(ctx, 2, -38, strideOpp * 0.72 - 0.15, costume.secondaryColor, skinShade, ink);

  // Back Leg
  drawCharLeg(ctx, -2, -20, strideOpp * 0.8, !player.isGrounded, costume, ink);

  // Front Leg
  drawCharLeg(ctx, 3, -20, stride * 0.84, !player.isGrounded, costume, ink);

  // Flowing skirt / robe tail for Dynasty, Joseon, Female Wedding/Qipao
  if (hasFlowingSkirtOrRobe) {
    const skirtColor =
      costume.id === 'joseon' && gender === 'female'
        ? '#0F766E'
        : costume.id === 'wedding' && gender === 'female'
          ? '#FFFFFF'
          : costume.primaryColor;
    const flutter = Math.sin(time * 12) * 2.5;
    ctx.fillStyle = skirtColor;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, -23);
    ctx.lineTo(10, -23);
    ctx.quadraticCurveTo(15, -10, 12, -5 + flutter * 0.4);
    ctx.lineTo(-18 - Math.abs(stride) * 4, -4 - flutter);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold/floral hem trim
    ctx.strokeStyle = costume.trimColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -7 - flutter);
    ctx.lineTo(10, -7);
    ctx.stroke();
  }

  // Torso Garment
  drawCharTorso(ctx, gender, costume, ink);

  // Front Arm (and Wedding Bouquet if Wedding Formal!)
  drawCharArm(
    ctx,
    -3,
    -38,
    costume.id === 'wedding' ? -0.45 + stride * 0.25 : stride * 0.82 + 0.1,
    costume.primaryColor,
    skin,
    ink,
    costume.id === 'wedding'
  );

  // Waist Sash / Belt / Collar Ornament
  drawGarmentAccents(ctx, gender, costume, ink);

  // Head, Hair & Era Headwear
  drawCharHead(ctx, 2, -60, player, gender, costume, time, ink, skin, skinShade);

  ctx.restore();
}

function drawCharTorso(
  ctx: CanvasRenderingContext2D,
  gender: RunnerGender,
  costume: CostumeDefinition,
  ink: string
): void {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.3;

  const topHalfW = gender === 'female' ? 9.5 : 11;
  const botHalfW = gender === 'female' ? 10.5 : 12.5;

  ctx.fillStyle =
    costume.id === 'wedding' && gender === 'female'
      ? '#FFFFFF'
      : costume.id === 'shanghai' && gender === 'male'
        ? '#FFFFFF'
        : costume.primaryColor;

  ctx.beginPath();
  ctx.moveTo(-topHalfW, -43);
  ctx.lineTo(topHalfW, -43);
  ctx.lineTo(botHalfW, -20);
  ctx.lineTo(-botHalfW, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Era-specific chest details
  if (costume.id === 'battlefield') {
    // Lamellar chestplate & shoulder guard
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-9, -41, 18, 13);
    ctx.strokeRect(-9, -41, 18, 13);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(-9, -35, 18, 2);
  } else if (costume.id === 'shanghai' && gender === 'male') {
    // Charcoal waistcoat over white shirt
    ctx.fillStyle = '#44403C';
    ctx.fillRect(-9, -42, 16, 20);
    ctx.strokeRect(-9, -42, 16, 20);
  } else if (costume.id === 'city_park') {
    // Open amber jacket over white tee
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, -42, 8, 20);
  } else if (costume.id === 'marvel') {
    // Glowing chest arc/core
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(3, -34, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (costume.id === 'gta6') {
    // Open-collar tropical shirt + white undershirt
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, -42, 8, 20);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(-5, -32, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (costume.id === 'wedding' && gender === 'male') {
    // Crisp white shirt V + bowtie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.lineTo(7, -43);
    ctx.lineTo(4, -27);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(1, -42, 5, 3);
  }
}

function drawGarmentAccents(
  ctx: CanvasRenderingContext2D,
  gender: RunnerGender,
  costume: CostumeDefinition,
  ink: string
): void {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.8;

  if (costume.id === 'miao') {
    // Ornate Miao silver chest collar
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(1, -41, 10, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Waist sash / belt
  ctx.fillStyle = costume.accentColor;
  ctx.fillRect(-11, -24, 22, 4.5);
  ctx.strokeRect(-11, -24, 22, 4.5);

  if (costume.id === 'dynasty' || costume.id === 'joseon') {
    // Gold emblem on chest
    ctx.fillStyle = costume.trimColor;
    ctx.beginPath();
    ctx.roundRect(-2, -37, 8, 7, 2);
    ctx.fill();
  }
  if (costume.id === 'joseon' && gender === 'female') {
    // Pink/white collar ribbon (goreum)
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(2, -39, 3, 12);
  }
}

function drawCharLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  angle: number,
  isAir: boolean,
  costume: CostumeDefinition,
  ink: string
): void {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(angle);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.1;

  const pantsColor =
    costume.id === 'joseon'
      ? '#F8FAFC'
      : costume.id === 'city_park' || costume.id === 'battlefield'
        ? '#1E293B'
        : costume.id === 'shanghai'
          ? '#44403C'
          : costume.secondaryColor;

  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(-4.5, 0, 9, 12, 4);
  ctx.fill();
  ctx.stroke();

  const kneeAngle = isAir ? 0.6 : Math.max(0, -angle * 0.8 + 0.25);
  ctx.translate(0, 10);
  ctx.rotate(kneeAngle);

  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 10, 3);
  ctx.fill();
  ctx.stroke();

  // Footwear (Boots vs Sneakers vs Traditional Shoes)
  const isBoot = costume.id === 'battlefield' || costume.id === 'shanghai' || costume.id === 'marvel';
  ctx.fillStyle = isBoot ? '#451A03' : costume.id === 'dynasty' || costume.id === 'joseon' ? '#18181B' : '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-4, 8, 13, 6.5, 3);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCharArm(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  angle: number,
  sleeveColor: string,
  skinColor: string,
  ink: string,
  holdBouquet = false
): void {
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(angle);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;

  ctx.fillStyle = sleeveColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 11, 4);
  ctx.fill();
  ctx.stroke();

  ctx.translate(0, 9.5);
  ctx.rotate(-0.95);
  ctx.fillStyle = sleeveColor;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 10, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 10.5, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (holdBouquet) {
    // Mini rose bouquet
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(6, 6);
    ctx.lineTo(3, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.arc(5, 7, 3.5, 0, Math.PI * 2);
    ctx.arc(2, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCharHead(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  player: PlayerState,
  gender: RunnerGender,
  costume: CostumeDefinition,
  time: number,
  ink: string,
  skin: string,
  skinShade: string
): void {
  ctx.save();
  ctx.translate(hx, hy);

  // Back hair for Female runner (drawn behind head!)
  if (gender === 'female') {
    const hairWave = Math.sin(time * 10) * 3;
    ctx.fillStyle = costume.hairColor;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.1;
    if (costume.id === 'city_park' || costume.id === 'battlefield' || costume.id === 'marvel') {
      // High bouncy ponytail
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.quadraticCurveTo(-24, -8 + hairWave, -26, 12 + hairWave);
      ctx.quadraticCurveTo(-18, 16, -12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (costume.id === 'shanghai') {
      // Wavy 1930s bob
      ctx.beginPath();
      ctx.arc(-6, 4, 10, 0.4, Math.PI * 1.4);
      ctx.fill();
      ctx.stroke();
    } else {
      // Long flowing anime hair
      ctx.beginPath();
      ctx.moveTo(-11, -6);
      ctx.quadraticCurveTo(-21, 8, -22, 22 + hairWave * 0.6);
      ctx.lineTo(-10, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (costume.id === 'battlefield') {
    // Male warrior ponytail
    const hairWave = Math.sin(time * 10) * 3;
    ctx.fillStyle = costume.hairColor;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -6);
    ctx.quadraticCurveTo(-25, -8 + hairWave, -24, 9 + hairWave);
    ctx.lineTo(-13, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Neck
  ctx.fillStyle = skinShade;
  ctx.fillRect(-4, 9, 8, 6);

  // Face contour
  ctx.fillStyle = skin;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.quadraticCurveTo(-13, 8, -3, 13);
  ctx.lineTo(7, 12);
  ctx.quadraticCurveTo(14, 7, 13, -6);
  ctx.quadraticCurveTo(8, -16, -4, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle anime cheek blush for female
  if (gender === 'female') {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.ellipse(5, 6, 3.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes & Expression
  if (player.hitStun) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.lineTo(8, 2);
    ctx.lineTo(2, 5);
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(-5, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.isBlinking) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(3, 2);
    ctx.lineTo(10, 2);
    ctx.stroke();
  } else if (costume.id === 'gta6') {
    // Cool Vice Coast sunglasses!
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(1, -2.5, 11, 6, 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(6.5, 1.5, 4.4, gender === 'female' ? 4.6 : 4.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = gender === 'female' ? '#7C3AED' : '#92400E';
    ctx.beginPath();
    ctx.ellipse(7.5, 1.5, 2.7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(7.8, 1.6, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(6.6, 0.2, 1.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ink;
    ctx.lineWidth = gender === 'female' ? 2.4 : 2.1;
    ctx.beginPath();
    ctx.moveTo(2, -1.5);
    ctx.quadraticCurveTo(7, -3.5, 11.8, -0.5);
    ctx.stroke();

    if (gender === 'female') {
      // Cute eyelash flick
      ctx.beginPath();
      ctx.moveTo(10.5, -1);
      ctx.lineTo(13, -3);
      ctx.stroke();
    }

    // Smile
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(4, 8.5);
    ctx.quadraticCurveTo(7, 10, 10, 7.5);
    ctx.stroke();
  }

  // Front Hair Cap
  ctx.fillStyle = costume.hairColor;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-13, 1);
  ctx.quadraticCurveTo(-15, -16, 0, -17);
  ctx.quadraticCurveTo(14, -17, 15, -5);
  ctx.lineTo(10, -2);
  ctx.lineTo(6, -7);
  ctx.lineTo(1, -2);
  ctx.lineTo(-4, -7);
  ctx.lineTo(-10, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Era-Specific Headwear!
  drawEraHeadwear(ctx, gender, costume, ink);

  ctx.restore();
}

function drawEraHeadwear(
  ctx: CanvasRenderingContext2D,
  gender: RunnerGender,
  costume: CostumeDefinition,
  ink: string
): void {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;

  if (costume.id === 'shanghai' && gender === 'male') {
    // 1930s Newsboy Flat Cap
    ctx.fillStyle = '#57534E';
    ctx.beginPath();
    ctx.ellipse(0, -13, 16, 6.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(19, -8);
    ctx.lineTo(11, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (costume.id === 'joseon' && gender === 'male') {
    // Traditional black Joseon Gat hat
    ctx.fillStyle = 'rgba(24, 24, 27, 0.88)';
    ctx.beginPath();
    ctx.ellipse(0, -14, 22, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-7, -28, 14, 14);
    ctx.strokeRect(-7, -28, 14, 14);
  } else if (costume.id === 'dynasty' && gender === 'male') {
    // Official Tang/Ming Scholar Winged Hat
    ctx.fillStyle = '#1E1B24';
    ctx.beginPath();
    ctx.roundRect(-10, -26, 20, 14, 5);
    ctx.fill();
    ctx.stroke();
    // Side wings
    ctx.fillRect(-20, -20, 10, 4);
    ctx.fillRect(10, -20, 10, 4);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(6, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (costume.id === 'dynasty' && gender === 'female') {
    // Golden hairpins & twin buns
    ctx.fillStyle = costume.hairColor;
    ctx.beginPath();
    ctx.arc(-8, -17, 5, 0, Math.PI * 2);
    ctx.arc(4, -18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-13, -19, 10, 2.5);
  } else if (costume.id === 'miao') {
    // Miao embroidered cap + silver crescent horns
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.roundRect(-11, -21, 22, 9, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, -25, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (costume.id === 'wedding' && gender === 'female') {
    // Floral bridal tiara
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(-6, -15);
    ctx.lineTo(0, -22);
    ctx.lineTo(6, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawSlidePose(
  ctx: CanvasRenderingContext2D,
  gender: RunnerGender,
  costume: CostumeDefinition,
  ink: string,
  skin: string,
  skinShade: string
): void {
  ctx.save();
  ctx.translate(0, -14);

  // Extended front leg kicking forward
  ctx.save();
  ctx.translate(4, 2);
  ctx.rotate(-1.35);
  ctx.fillStyle = costume.secondaryColor;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 22, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-5, 20, 13, 6.5, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Tucked back leg
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.roundRect(-15, 2, 15, 9, 4);
  ctx.fill();
  ctx.stroke();

  // Leaned-back torso
  ctx.save();
  ctx.translate(-8, 0);
  ctx.rotate(-0.78);
  ctx.fillStyle = costume.primaryColor;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.roundRect(-10, -22, 20, 24, 5);
  ctx.fill();
  ctx.stroke();

  ctx.rotate(0.55);
  drawCharHead(
    ctx,
    4,
    -34,
    { isBlinking: false, hitStun: false, isGrounded: true } as PlayerState,
    gender,
    costume,
    0,
    ink,
    skin,
    skinShade
  );
  ctx.restore();

  ctx.restore();
}

function drawRibbonTrail(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  costume: CostumeDefinition,
  ink: string
): void {
  const nodes = player.ribbonNodes;
  if (nodes.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = ink;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = costume.accentColor;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.stroke();
  ctx.restore();
}
