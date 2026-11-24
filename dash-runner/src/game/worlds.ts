import {
  ChallengeStage,
  CostumeDefinition,
  CostumeId,
  GiftRewardConfig,
  WorldDefinition,
  WorldId,
} from './types';

export const WORLDS: WorldDefinition[] = [
  {
    id: 'battlefield',
    name: 'Old Battlefield',
    subtitle: 'Dawn palisades, war banners, and rolling timber',
    accentColor: '#DC2626',
    skyTop: '#6B7FD7',
    skyMid: '#F59E7B',
    skyBottom: '#FDE68A',
    groundFill: '#C29B6B',
    groundAccent: '#9A7449',
    groundLine: '#5C4024',
    isDarkSky: false,
    groundObstacles: ['barrel', 'war_cart', 'palisade'],
    aerialObstacle: 'arrow_volley',
    defaultCostume: 'battlefield',
  },
  {
    id: 'dynasty',
    name: 'Tang & Imperial Dynasty',
    subtitle: 'Crimson palace walls, marble bridges, and lotus ponds',
    accentColor: '#E11D48',
    skyTop: '#38BDF8',
    skyMid: '#BAE6FD',
    skyBottom: '#F0F9FF',
    groundFill: '#CBD5E1',
    groundAccent: '#94A3B8',
    groundLine: '#475569',
    isDarkSky: false,
    groundObstacles: ['scroll_cart', 'tea_table', 'peony_pot'],
    aerialObstacle: 'palace_lantern',
    defaultCostume: 'dynasty',
  },
  {
    id: 'shanghai',
    name: 'Republic Shanghai',
    subtitle: 'Dusk Bund skyline, vintage trams, and wet cobblestones',
    accentColor: '#EA580C',
    skyTop: '#7C3AED',
    skyMid: '#F97316',
    skyBottom: '#FDE047',
    groundFill: '#64748B',
    groundAccent: '#475569',
    groundLine: '#1E293B',
    isDarkSky: false,
    groundObstacles: ['suitcases', 'street_barrier', 'tram_post'],
    aerialObstacle: 'news_drone',
    defaultCostume: 'shanghai',
  },
  {
    id: 'joseon',
    name: 'Korean Dynasty (Joseon)',
    subtitle: 'Spring cherry blossoms, palace eaves, and stone courtyards',
    accentColor: '#0F766E',
    skyTop: '#60A5FA',
    skyMid: '#BFDBFE',
    skyBottom: '#EFF6FF',
    groundFill: '#D6D3D1',
    groundAccent: '#A8A29E',
    groundLine: '#44403C',
    isDarkSky: false,
    groundObstacles: ['onggi_jars', 'straw_cart', 'palace_drum'],
    aerialObstacle: 'magpie_kite',
    defaultCostume: 'joseon',
  },
  {
    id: 'miao',
    name: 'Miao Festival Village',
    subtitle: 'Misty terraced hills, stilt houses, and festival drums',
    accentColor: '#2563EB',
    skyTop: '#38BDF8',
    skyMid: '#E0F2FE',
    skyBottom: '#ECFDF5',
    groundFill: '#D6CFC2',
    groundAccent: '#A39887',
    groundLine: '#57534E',
    isDarkSky: false,
    groundObstacles: ['bamboo_basket', 'festival_drum', 'harvest_baskets'],
    aerialObstacle: 'silk_kite',
    defaultCostume: 'miao',
  },
  {
    id: 'city_park',
    name: 'Golden City Park',
    subtitle: 'Sunset skyline, lakeside fountain, and cafe promenade',
    accentColor: '#D97706',
    skyTop: '#8B5CF6',
    skyMid: '#FB923C',
    skyBottom: '#FEF08A',
    groundFill: '#D6C7B9',
    groundAccent: '#A89485',
    groundLine: '#475569',
    isDarkSky: false,
    groundObstacles: ['skateboard', 'cone_double', 'park_bollard'],
    aerialObstacle: 'park_drone',
    defaultCostume: 'city_park',
  },
  {
    id: 'wedding',
    name: 'Twilight Wedding',
    subtitle: 'Fairy-lit oak tree, floral gazebo, and rose-petal aisle',
    accentColor: '#DB2777',
    skyTop: '#312E81',
    skyMid: '#9333EA',
    skyBottom: '#F472B6',
    groundFill: '#E2D9EC',
    groundAccent: '#C4B5D4',
    groundLine: '#4C1D95',
    isDarkSky: true,
    groundObstacles: ['gift_box', 'ribbon_stanchion', 'flower_urn'],
    aerialObstacle: 'petal_dove',
    defaultCostume: 'wedding',
  },
  {
    id: 'marvel',
    name: 'Marvel Metaverse',
    subtitle: 'Fractured skyline, portal rings, and repulsor drones',
    accentColor: '#E11D48',
    skyTop: '#0F172A',
    skyMid: '#311042',
    skyBottom: '#7C2D12',
    groundFill: '#1E293B',
    groundAccent: '#334155',
    groundLine: '#F97316',
    isDarkSky: true,
    groundObstacles: ['energy_barrier', 'tech_crate', 'rubble_spike'],
    aerialObstacle: 'repulsor_drone',
    defaultCostume: 'marvel',
  },
  {
    id: 'gta6',
    name: 'GTA 6 Vice Coast',
    subtitle: 'Neon palm boulevard, Art Deco hotels, and sunset surf',
    accentColor: '#EC4899',
    skyTop: '#4C1D95',
    skyMid: '#EC4899',
    skyBottom: '#FDBA74',
    groundFill: '#334155',
    groundAccent: '#475569',
    groundLine: '#F472B6',
    isDarkSky: true,
    groundObstacles: ['neon_cones', 'beach_barrier', 'palm_planter'],
    aerialObstacle: 'vice_chopper',
    defaultCostume: 'gta6',
  },
];

export const WORLD_MAP: Record<WorldId, WorldDefinition> = Object.fromEntries(
  WORLDS.map((w) => [w.id, w])
) as Record<WorldId, WorldDefinition>;

export const COSTUMES: CostumeDefinition[] = [
  {
    id: 'battlefield',
    name: 'Battlefield Armor',
    maleLabel: 'Vanguard Armor',
    femaleLabel: 'Valkyrie Armor',
    primaryColor: '#1E3A8A',
    secondaryColor: '#94A3B8',
    trimColor: '#E2E8F0',
    accentColor: '#DC2626',
    hairColor: '#271C19',
  },
  {
    id: 'dynasty',
    name: 'Imperial Dynasty',
    maleLabel: 'Dynasty Scholar',
    femaleLabel: 'Palace Princess',
    primaryColor: '#1D4ED8',
    secondaryColor: '#1E3A8A',
    trimColor: '#FACC15',
    accentColor: '#E11D48',
    hairColor: '#1E1B24',
  },
  {
    id: 'shanghai',
    name: 'Republic Era',
    maleLabel: 'Bund Gentleman',
    femaleLabel: 'Shanghai Qipao',
    primaryColor: '#57534E',
    secondaryColor: '#F8FAFC',
    trimColor: '#D97706',
    accentColor: '#B91C1C',
    hairColor: '#1C1917',
  },
  {
    id: 'joseon',
    name: 'Joseon Hanbok',
    maleLabel: 'Joseon Noble',
    femaleLabel: 'Hanbok Maiden',
    primaryColor: '#F8FAFC',
    secondaryColor: '#0F766E',
    trimColor: '#FACC15',
    accentColor: '#E11D48',
    hairColor: '#18181B',
  },
  {
    id: 'miao',
    name: 'Miao Festival',
    maleLabel: 'Miao Silver Tunic',
    femaleLabel: 'Miao Festival Dress',
    primaryColor: '#1E1B4B',
    secondaryColor: '#E2E8F0',
    trimColor: '#EC4899',
    accentColor: '#38BDF8',
    hairColor: '#18181B',
  },
  {
    id: 'city_park',
    name: 'City Streetwear',
    maleLabel: 'Amber Bomber',
    femaleLabel: 'Park Varsity',
    primaryColor: '#D97706',
    secondaryColor: '#FFFFFF',
    trimColor: '#1E293B',
    accentColor: '#E11D48',
    hairColor: '#292524',
  },
  {
    id: 'wedding',
    name: 'Wedding Formal',
    maleLabel: 'Groom Tuxedo',
    femaleLabel: 'Bridal Gown',
    primaryColor: '#1E293B',
    secondaryColor: '#FFFFFF',
    trimColor: '#F43F5E',
    accentColor: '#E11D48',
    hairColor: '#1C1917',
  },
  {
    id: 'marvel',
    name: 'Multiverse Hero',
    maleLabel: 'Metaverse Hero',
    femaleLabel: 'Metaverse Heroine',
    primaryColor: '#B91C1C',
    secondaryColor: '#1E3A8A',
    trimColor: '#38BDF8',
    accentColor: '#FACC15',
    hairColor: '#1E293B',
  },
  {
    id: 'gta6',
    name: 'Vice Coast Resort',
    maleLabel: 'Vice Shirt',
    femaleLabel: 'Vice Resort',
    primaryColor: '#EC4899',
    secondaryColor: '#2DD4BF',
    trimColor: '#FEF08A',
    accentColor: '#F97316',
    hairColor: '#27272A',
  },
];

export const COSTUME_MAP: Record<CostumeId, CostumeDefinition> = Object.fromEntries(
  COSTUMES.map((c) => [c.id, c])
) as Record<CostumeId, CostumeDefinition>;

/**
 * GIFT NOTES (ignored by the game):
 * - Use an image or GIF:
 *     giftType: 'image', then displays the file at below
 *     imageDataUrl: './gifts/stage4.png', // or .gif or jpg
 *
 * - Switch back to emoji:
 *     Change giftType to 'emoji' and DELETE the imageDataUrl line
 *     (do NOT write 'emoji' inside imageDataUrl).
 */
export const DEFAULT_GIFTS: GiftRewardConfig[] = [
  {
    giftType: 'image',
    emoji: '💐',
    imageDataUrl: './gifts/stage1.png',
    title: 'Surprise 1',
    message: 'You cleared the first challenge stage!',
  },
  {
    giftType: 'image',
    emoji: '🍫',
    imageDataUrl: './gifts/stage2.png',
    title: 'Surprise 2',
    message: 'A sweet reward for your second sprint!',
  },
  {
    giftType: 'image',
    emoji: '🧸',
    imageDataUrl: './gifts/stage3.png',
    title: 'Surprise 3',
    message: 'Halfway through the 5-world challenge!',
  },
  {
    giftType: 'image',
    emoji: '💌',
    imageDataUrl: './gifts/stage4.png',
    title: 'Surprise 4',
    message: 'Almost there—one final world left!',
  },
  {
    giftType: 'image',
    emoji: '💍',
    imageDataUrl: './gifts/stage5.png',
    title: 'Grand Finale Gift',
    message: 'You conquered all 5 challenge worlds!',
  },
];

export const CHALLENGE_ROSE_TARGETS = [8, 12, 15, 20, 25];

export function pickFiveRandomWorlds(): WorldId[] {
  const pool = WORLDS.map((w) => w.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

export function createRandomChallengeStages(
  existingGifts?: GiftRewardConfig[]
): ChallengeStage[] {
  const picked = pickFiveRandomWorlds();
  return picked.map((worldId, idx) => ({
    stageIndex: idx,
    worldId,
    targetRoses: CHALLENGE_ROSE_TARGETS[idx] ?? 15,
    completed: false,
    gift: existingGifts?.[idx]
      ? { ...existingGifts[idx] }
      : { ...DEFAULT_GIFTS[idx] },
  }));
}
