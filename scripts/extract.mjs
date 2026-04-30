#!/usr/bin/env node
/**
 * 从 AKEDatabase 提取「简制手册」截图中出现的物品，生成紧凑 items.json。
 * 不做全量物品库，不访问线上 wiki/API。
 */
import { readdir, readFile, writeFile, mkdir, copyFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_ROOT = join(ROOT, '..')
const AKE = join(DATA_ROOT, 'AKEDatabase', 'public')
const CH = join(AKE, 'CH')
const OUT = join(ROOT, 'public', 'data', 'items.json')
const ICON_OUT_DIR = join(ROOT, 'public', 'icons')

// 只保留 Soda 截图里「简制手册」可见的条目。
// OCR/肉眼校正：清波竹铃、黯银柑实、萤壳虫、彪兽的长绒等。
const MANUAL_ITEM_NAMES = [
  '新笋', '兽肉', '苦涩麦粉',
  '中空异香石', '水灯虫的灯坠', '回响尘埃',
  '软骨碎屑', '竹林虫蛹', '球刺兽的肝脏',
  '崩碎斧刃', '浸雾大弩', '清波竹铃',
  '彪兽的长绒', '荞花', '映火荞花',
  '柑实', '黯银柑实', '酮化灌木',
  '锦草', '芽针', '蓬茸锦草',
  '荆刺芽针', '灰芦麦', '苦叶椒',
  '琼叶参', '金石稻', '萤壳虫',
  '灼壳虫', '坚硬异香石', '高能异香石',
  '草籽干粉', '刺鼻干肉', '虫肉',
  '坚韧的水', '天然气泡水', '虬兽的须',
  '异色油脂', '甜腻黑水', '大斧角',
]

const MANUAL_ITEM_SET = new Set(MANUAL_ITEM_NAMES)


const MANUAL_SOURCE_OVERRIDES = {
  // SpawnerConfig 当前只在未开放 map02_lv005 / 副本里能看到彪兽，实际手册攻略源交叉指向武陵城岸边石窟。
  // Sources: B站 wiki/游侠/玩家攻略均确认百眼彪兽、怒目彪兽掉落彪兽的长绒；玩家攻略定位为武陵城岸边石窟。
  '彪兽的长绒': [
    { area: '武陵城 · 岸边石窟', mapId: 'map02_lv002', enemies: [
      { id: 'eny_0083_hstiger', name: '百眼彪兽', levels: [] },
      { id: 'eny_0102_hstiger2', name: '怒目彪兽', levels: [] },
    ], configCount: 0, source: 'manual-cross-check' },
  ],
}

const MAP_TYPE_HINTS = new Map([
  ['map01_lv001', '重度能量淤积点'],
  ['map01_lv006', '重度能量淤积点'],
  ['map01_lv007', '重度能量淤积点'],
  ['map02_lv003', '重度能量淤积点'],
  ['map02_lv004', '重度能量淤积点'],
  ['map02_lv005', '重度能量淤积点'],
])

async function readJSON(path) {
  return JSON.parse(await readFile(path, 'utf-8'))
}

async function loadEnemyMap() {
  const dir = join(CH, 'enemy')
  const map = {}
  try {
    const files = (await readdir(dir)).filter(f => f.endsWith('.json'))
    for (const f of files) {
      const data = await readJSON(join(dir, f))
      if (data && !Array.isArray(data) && data.templateId && data.name) {
        map[data.templateId] = data.name
      }
    }
  } catch { /* no enemy dir */ }
  return map
}

async function loadLocationNotes() {
  try {
    return await readJSON(join(DATA_ROOT, 'location-notes.json'))
  } catch { return {} }
}

function normalizeEnemyId(id) {
  return String(id || '')
    .replace(/_settlement$/i, '')
    .replace(/_settlment$/i, '')
    .replace(/_nearspecial$/i, '')
}

function cleanRichText(text) {
  return String(text || '')
    .replace(/<@[^>]+>/g, '')
    .replace(/<\/>/g, '')
    .trim()
}

function areaLabel(mapId, locationNotes) {
  const note = locationNotes[mapId]
  if (note?.status === 'not_released_yet') return `未开放区域（${mapId}）`
  if (!note || !note.zh) return mapId
  const type = MAP_TYPE_HINTS.get(mapId)
  return type ? `${type} - ${note.zh}` : note.zh
}

async function loadSpawnerSources(enemyMap, locationNotes) {
  const root = join(AKE, 'Json', 'SpawnerConfig')
  const sourcesByEnemy = new Map()

  let mapDirs = []
  try {
    mapDirs = await readdir(root, { withFileTypes: true })
  } catch { return sourcesByEnemy }

  for (const dirent of mapDirs) {
    if (!dirent.isDirectory()) continue
    const mapId = dirent.name
    // 只保留大地图刷点；测试图、独立副本、活动副本不作为简制手册推荐来源。
    if (!/^map\d+_lv\d+$/.test(mapId)) continue
    const dir = join(root, mapId)
    let files = []
    try {
      files = (await readdir(dir)).filter(f => f.startsWith('sc_') && f.endsWith('.json'))
    } catch { continue }

    for (const f of files) {
      let data
      try { data = await readJSON(join(dir, f)) } catch { continue }
      const forbidDrop = Boolean(data?.settings?.forbidDrop)
      const configId = data?.configId || f.replace(/\.json$/, '')
      for (const entry of data?.enemyLibrary || []) {
        const rawEnemyId = entry.enemyId
        const enemyId = normalizeEnemyId(rawEnemyId)
        if (!enemyId) continue
        const released = locationNotes[mapId]?.status !== 'not_released_yet'
        const source = {
          mapId,
          area: areaLabel(mapId, locationNotes),
          configId,
          enemyId: rawEnemyId,
          enemyName: enemyMap[rawEnemyId] || enemyMap[enemyId] || rawEnemyId,
          level: entry.enemyLevel ?? null,
          forbidDrop,
          released,
        }
        if (!sourcesByEnemy.has(enemyId)) sourcesByEnemy.set(enemyId, [])
        sourcesByEnemy.get(enemyId).push(source)
      }
    }
  }

  return sourcesByEnemy
}

function uniqueBy(arr, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of arr) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function summarizeSources(dropEnemies, sourcesByEnemy) {
  const all = []
  for (const enemy of dropEnemies) {
    const normalized = normalizeEnemyId(enemy.id)
    const sources = sourcesByEnemy.get(normalized) || []
    for (const source of sources) {
      all.push({ ...source, itemEnemyId: enemy.id, itemEnemyName: enemy.name || enemy.id })
    }
  }

  const mapAppearances = uniqueBy(
    all.filter(s => s.released),
    s => `${s.mapId}:${s.configId}:${normalizeEnemyId(s.enemyId)}`,
  )

  const grouped = []
  const byArea = new Map()
  for (const s of mapAppearances) {
    if (!byArea.has(s.area)) byArea.set(s.area, { area: s.area, mapId: s.mapId, enemies: new Map(), configs: new Set() })
    const group = byArea.get(s.area)
    group.configs.add(s.configId)
    const eid = normalizeEnemyId(s.enemyId)
    if (!group.enemies.has(eid)) group.enemies.set(eid, { id: eid, name: s.enemyName, levels: new Set() })
    if (s.level != null) group.enemies.get(eid).levels.add(s.level)
  }

  for (const group of byArea.values()) {
    grouped.push({
      area: group.area,
      mapId: group.mapId,
      enemies: [...group.enemies.values()].map(e => ({
        id: e.id,
        name: e.name,
        levels: [...e.levels].sort((a, b) => a - b),
      })),
      configCount: group.configs.size,
    })
  }

  grouped.sort((a, b) => a.area.localeCompare(b.area, 'zh'))

  const unreleasedOnly = uniqueBy(
    all.filter(s => !s.released),
    s => `${s.mapId}:${s.configId}:${normalizeEnemyId(s.enemyId)}`,
  )

  return { grouped, dropEnabledCount: mapAppearances.length, disabledCount: unreleasedOnly.length }
}

function extractMonsterIdsFromObtainWays(raw) {
  const ids = []
  for (const way of raw.obtainWays || []) {
    if (!way.phaseArgs) continue
    try {
      const parsed = JSON.parse(way.phaseArgs)
      if (parsed.monsterId) ids.push(parsed.monsterId)
    } catch { /* ignore malformed phaseArgs */ }
  }
  return ids
}

async function copyIcon(iconPath) {
  if (!iconPath) return null
  const rel = iconPath.replace(/^\/?public\//, '')
  const src = join(AKE, rel)
  const fileName = rel.split('/').pop()
  if (!fileName) return null
  await mkdir(ICON_OUT_DIR, { recursive: true })
  try {
    await copyFile(src, join(ICON_OUT_DIR, fileName))
    return `./icons/${fileName}`
  } catch {
    return null
  }
}

async function main() {
  const enemyMap = await loadEnemyMap()
  const locationNotes = await loadLocationNotes()
  const sourcesByEnemy = await loadSpawnerSources(enemyMap, locationNotes)

  const itemDir = join(CH, 'item')
  const files = (await readdir(itemDir)).filter(f => f.endsWith('.json') && f !== 'manifest.json')

  const byName = new Map()
  for (const f of files) {
    const raw = await readJSON(join(itemDir, f))
    if (!raw || Array.isArray(raw) || !MANUAL_ITEM_SET.has(raw.name)) continue
    // 同名蓝图/配方也会出现在 item 目录里；简制手册条目优先物品本体。
    if (!String(raw.id || '').startsWith('item_')) continue

    const explicitDrops = Array.isArray(raw.droppedBy) ? raw.droppedBy : []
    const phaseDrops = extractMonsterIdsFromObtainWays(raw)
    const dropIds = uniqueBy([...explicitDrops, ...phaseDrops].map(normalizeEnemyId).filter(Boolean), x => x)
    const droppedBy = dropIds.map(id => ({ id, name: enemyMap[id] || null }))
    const sourceSummary = summarizeSources(droppedBy, sourcesByEnemy)
    if (MANUAL_SOURCE_OVERRIDES[raw.name]) {
      sourceSummary.grouped = uniqueBy(
        [...sourceSummary.grouped, ...MANUAL_SOURCE_OVERRIDES[raw.name]],
        group => group.area,
      )
    }

    byName.set(raw.name, {
      id: raw.id,
      name: raw.name,
      rarity: raw.rarity,
      type: raw.type,
      description: cleanRichText(raw.description),
      icon: await copyIcon(raw.icon),
      obtainWays: (raw.obtainWays || []).map(w => ({
        desc: cleanRichText(w.desc),
      })),
      craft: raw.craft ? {
        blackbox: raw.craft.blackboxId || null,
        blueprint: raw.craft.blueprintId || null,
      } : null,
      droppedBy,
      sourceSummary,
    })
  }

  const items = MANUAL_ITEM_NAMES.map(name => byName.get(name)).filter(Boolean)
  const missing = MANUAL_ITEM_NAMES.filter(name => !byName.has(name))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({
    scope: '简制手册截图可见条目',
    items,
    missing,
    enemyCount: Object.keys(enemyMap).length,
    generatedAt: new Date().toISOString(),
  }, null, 0))

  console.log(`Extracted ${items.length} manual items`)
  console.log(`Missing: ${missing.length}${missing.length ? ' - ' + missing.join(', ') : ''}`)
  console.log(`Enemy map: ${Object.keys(enemyMap).length} entries`)
  console.log(`Location notes: ${Object.keys(locationNotes).length} entries`)
  console.log(`Output: ${OUT}`)
}

main().catch(e => { console.error(e); process.exit(1) })
