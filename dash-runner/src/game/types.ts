export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GIFT_POPUP' | 'GAME_OVER';

export type PlayMode = 'free' | 'challenge';

export type DifficultyMode = 'normal' | 'turbo';

export type RunnerGender = 'male' | 'female';

export type WorldId =
  | 'battlefield'
  | 'dynasty'
  | 'shanghai'
  | 'joseon'
  | 'miao'
  | 'city_park'
  | 'wedding'
  | 'marvel'
  | 'gta6';

export type CostumeId = WorldId;

export type ObstacleKind =
  | 'barrel'
  | 'war_cart'
  | 'palisade'
  | 'arrow_volley'
  | 'scroll_cart'
  | 'tea_table'
  | 'peony_pot'
  | 'palace_lantern'
  | 'suitcases'
  | 'street_barrier'
  | 'tram_post'
  | 'news_drone'
  | 'onggi_jars'
  | 'straw_cart'
  | 'palace_drum'
  | 'magpie_kite'
  | 'bamboo_basket'
  | 'festival_drum'
  | 'harvest_baskets'
  | 'silk_kite'
  | 'skateboard'
  | 'cone_double'
  | 'park_bollard'
  | 'park_drone'
  | 'gift_box'
  | 'ribbon_stanchion'
  | 'flower_urn'
  | 'petal_dove'
  | 'energy_barrier'
  | 'tech_crate'
  | 'rubble_spike'
  | 'repulsor_drone'
  | 'neon_cones'
  | 'beach_barrier'
  | 'palm_planter'
  | 'vice_chopper';

export interface WorldDefinition {
  id: WorldId;
  name: string;
  subtitle: string;
  accentColor: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  groundFill: string;
  groundAccent: string;
  groundLine: string;
  isDarkSky: boolean;
  groundObstacles: ObstacleKind[];
  aerialObstacle: ObstacleKind;
  defaultCostume: CostumeId;
}

export interface CostumeDefinition {
  id: CostumeId;
  name: string;
  maleLabel: string;
  femaleLabel: string;
  primaryColor: string;
  secondaryColor: string;
  trimColor: string;
  accentColor: string;
  hairColor: string;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  isAerial: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  animPhase: number;
  passed: boolean;
}

export interface RoseCollectible {
  id: number;
  x: number;
  y: number;
  radius: number;
  bobPhase: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  shape: 'circle' | 'spark' | 'petal';
  rotation: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  alpha: number;
  color: string;
}

export interface AmbientPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  color: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isDucking: boolean;
  jumpHeld: boolean;
  jumpHoldTime: number;
  runCycle: number;
  squashX: number;
  squashY: number;
  blinkTimer: number;
  isBlinking: boolean;
  ribbonNodes: Array<{ x: number; y: number }>;
  hitStun: boolean;
}

export interface RunSummary {
  worldId: WorldId;
  score: number;
  worldBest: number;
  overallBest: number;
  isNewWorldRecord: boolean;
  obstaclesCleared: number;
  rosesCollected: number;
  topSpeedMultiplier: number;
}

export interface GiftRewardConfig {
  giftType: 'emoji' | 'image';
  emoji: string;
  imageDataUrl?: string;
  title: string;
  message: string;
}

export interface ChallengeStage {
  stageIndex: number;
  worldId: WorldId;
  targetRoses: number;
  completed: boolean;
  gift: GiftRewardConfig;
}
