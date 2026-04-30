export interface ObtainWay {
  desc: string
}

export interface Craft {
  blackbox: string | null
  blueprint: string | null
}

export interface DroppedByEntry {
  id: string
  name: string | null
}

export interface SourceEnemy {
  id: string
  name: string
  levels: number[]
  count?: number | null
}

export interface SourceGroup {
  area: string
  enemies: SourceEnemy[]
}

export interface SourceSummary {
  grouped: SourceGroup[]
}

export interface Item {
  id: string
  name: string
  rarity: number
  type: number
  description: string
  icon: string | null
  obtainWays?: ObtainWay[]
  craft?: Craft | null
  droppedBy?: DroppedByEntry[]
  alluviumSourceSummary?: SourceSummary
  mapSourceSummary?: SourceSummary
  manualSourceSummary?: SourceSummary
}

export interface EnergyAlluviumEnemy {
  id: string
  name: string
  enName: string
  count: number | null
}

export interface EnergyAlluviumRow {
  locationEn: string
  locationZh: string | null
  mapId: string
  enemies: EnergyAlluviumEnemy[]
}

export interface DataFile {
  items: Item[]
  missing: string[]
  enemyCount: number
  energyAlluviumRows?: EnergyAlluviumRow[]
}
