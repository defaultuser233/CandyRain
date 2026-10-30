// PRD §8.2 - 常量配置，不得修改
export const GAME = {
  width: 960,
  height: 600,
  basketY: 401,
  basketWidth: 170,
  catcherHalfWidth: 68,
  catcherTop: 428,
  catcherBottom: 514,
  maxLives: 3,
  invulnerableMs: 1200,
  deathMs: 900,
  hudHeight: 84,
}

export const COLORS = {
  orange: '#E95620',
  orangeBright: '#FF8A3D',
  orangeDeep: '#B93B10',
  night: '#05070F',
  nightBlue: '#0A1230',
  nightSoft: '#101B45',
  cream: '#FFF5E6',
  white: '#FFFFFF',
  purple: '#8B3FE8',
  lime: '#A3D65C',
  red: '#D62828',
}

export const CANDY_DEFS = {
  pumpkin: { key: 'candyPumpkin', points: 10, size: 84, weight: 30, color: '#F07A19' },
  ghost:   { key: 'candyGhost',   points: 15, size: 108, weight: 26, color: '#A3D65C' },
  purple:  { key: 'candyPurple',  points: 20, size: 78, weight: 22, color: '#8B3FE8' },
  skull:   { key: 'candySkull',   points: 25, size: 54, weight: 22, color: '#F5F1E8' },
}

export const BOMB = { key: 'bomb', size: 92 }
export const HEART = { key: 'heart', size: 52 }

export const SCORING = { comboStep: 5, maxMultiplier: 4 }

export const DIFFICULTY = {
  baseSpawnMs: 950,
  minSpawnMs: 380,
  spawnRampPerSec: 7,
  baseSpeed: 190,
  maxSpeed: 430,
  speedRampPerSec: 4.2,
  bombChanceStart: 0.16,
  bombChanceMax: 0.3,
  bombRampPerSec: 0.0018,
  heartChance: 0.04,
  heartCooldownMs: 15000,
}