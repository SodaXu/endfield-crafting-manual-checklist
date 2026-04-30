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
}

export interface SourceGroup {
  area: string
  mapId: string
  enemies: SourceEnemy[]
  configCount: number
}

export interface SourceSummary {
  grouped: SourceGroup[]
  dropEnabledCount: number
  disabledCount: number
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
  sourceSummary?: SourceSummary
}

export interface LocationNote {
  zh: string | null
  status: string
  source: string
}

export interface DataFile {
  scope: string
  items: Item[]
  missing: string[]
  enemyCount: number
  generatedAt: string
}
