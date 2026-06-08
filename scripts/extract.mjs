#!/usr/bin/env node
/**
 * 从本地缓存提取当前版本整理的「简制手册」物品，生成紧凑 items.json。
 * 页面运行时不访问线上 wiki/API。
 */
import { access, readdir, readFile, writeFile, mkdir, copyFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_ROOT = join(ROOT, '..')
const AKE = join(DATA_ROOT, 'AKEDatabase', 'public')
const CH = join(AKE, 'CH')
const OUT = join(ROOT, 'public', 'data', 'items.json')
const ICON_OUT_DIR = join(ROOT, 'public', 'icons')

// 当前版本整理的「简制手册」条目。
const MANUAL_ITEM_NAMES = [
  '新笋', '兽肉', '苦涩麦粉',
  '中空异香石', '水灯虫的灯坠', '回响尘埃',
  '软骨碎屑', '竹林虫蛹', '球刺兽的肝脏',
  '崩碎斧刃', '浸雾大弩', '清波竹铃',
  '彪兽的长绒', '咆兽的辫束', '荞花', '映火荞花',
  '柑实', '黯银柑实', '酮化灌木',
  '锦草', '芽针', '蓬茸锦草',
  '荆刺芽针', '灰芦麦', '苦叶椒',
  '琼叶参', '金石稻', '萤壳虫',
  '灼壳虫', '坚硬异香石', '高能异香石',
  '草籽干粉', '刺鼻干肉', '虫肉',
  '坚韧的水', '天然气泡水', '虬兽的须',
  '异色油脂', '甜腻黑水', '大斧角',
  '百年陈皮', '尾尖金甲',
]

const MANUAL_ITEM_SET = new Set(MANUAL_ITEM_NAMES)


const MANUAL_SOURCE_OVERRIDES = {}

const ALLUVIUM_LABEL_PREFIX = '重度能量淤积点'

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
    return await readJSON(join(ROOT, 'location-notes.json'))
  } catch { return {} }
}

async function loadEnergyAlluviumNotes() {
  try {
    return await readJSON(join(ROOT, 'energy-alluvium-notes.json'))
  } catch { return { source: null, rows: [] } }
}

function normalizeEnemyId(id) {
  return String(id || '')
    .replace(/_settlement$/i, '')
    .replace(/_settlment$/i, '')
    .replace(/_nearspecial$/i, '')
    .replace(/_sluggish$/i, '')
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
  return note.zh
}

function alluviumAreaLabel(row, locationNotes) {
  const note = row.locationZh || locationNotes[row.mapId]?.zh || row.locationEn || row.mapId
  return `${ALLUVIUM_LABEL_PREFIX} - ${note}`
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
          released,
        }
        if (!sourcesByEnemy.has(enemyId)) sourcesByEnemy.set(enemyId, [])
        sourcesByEnemy.get(enemyId).push(source)
      }
    }
  }

  return sourcesByEnemy
}

function buildEnergyAlluviumSources(energyAlluvium, locationNotes) {
  const sourcesByEnemy = new Map()
  for (const row of energyAlluvium?.rows || []) {
    if (!row.mapId) continue
    const area = alluviumAreaLabel(row, locationNotes)
    for (const enemy of row.enemies || []) {
      const enemyId = normalizeEnemyId(enemy.enemyId)
      if (!enemyId) continue
      if (!sourcesByEnemy.has(enemyId)) sourcesByEnemy.set(enemyId, [])
      sourcesByEnemy.get(enemyId).push({
        mapId: row.mapId,
        area,
        configId: `energy_alluvium:${row.mapId}`,
        enemyId,
        enemyName: enemy.zhName || enemy.enName || enemyId,
        level: null,
        count: enemy.count ?? null,
        released: true,
      })
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
    all.push(...sources)
  }

  const sourceAppearances = uniqueBy(
    all.filter(s => s.released),
    s => `${s.mapId}:${s.configId}:${normalizeEnemyId(s.enemyId)}`,
  )

  const byArea = new Map()
  for (const source of sourceAppearances) {
    if (!byArea.has(source.area)) byArea.set(source.area, { area: source.area, enemies: new Map() })
    const group = byArea.get(source.area)
    const enemyId = normalizeEnemyId(source.enemyId)
    if (!group.enemies.has(enemyId)) group.enemies.set(enemyId, {
      id: enemyId,
      name: source.enemyName,
      levels: new Set(),
      count: Object.prototype.hasOwnProperty.call(source, 'count') ? source.count : undefined,
    })
    if (source.level != null) group.enemies.get(enemyId).levels.add(source.level)
  }

  const grouped = [...byArea.values()].map(group => ({
    area: group.area,
    enemies: [...group.enemies.values()].map(enemy => ({
      id: enemy.id,
      name: enemy.name,
      levels: [...enemy.levels].sort((a, b) => a - b),
      count: enemy.count,
    })),
  }))

  grouped.sort((a, b) => a.area.localeCompare(b.area, 'zh'))

  return { grouped }
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
    // Some newly-added AKEDatabase item JSON can reference icons before the
    // upstream image files are published. Keep manually-supplied fallbacks in
    // public/icons/ reproducible across extract runs.
    try {
      await access(join(ICON_OUT_DIR, fileName))
      return `./icons/${fileName}`
    } catch {
      return null
    }
  }
}

async function main() {
  const enemyMap = await loadEnemyMap()
  const locationNotes = await loadLocationNotes()
  const energyAlluvium = await loadEnergyAlluviumNotes()
  const energyAlluviumSourcesByEnemy = buildEnergyAlluviumSources(energyAlluvium, locationNotes)
  const mapSourcesByEnemy = await loadSpawnerSources(enemyMap, locationNotes)

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
    const alluviumSourceSummary = summarizeSources(droppedBy, energyAlluviumSourcesByEnemy)
    const mapSourceSummary = summarizeSources(droppedBy, mapSourcesByEnemy)
    const manualGroups = MANUAL_SOURCE_OVERRIDES[raw.name] || []
    const manualSourceSummary = {
      grouped: manualGroups.map(group => ({
        area: group.area,
        enemies: group.enemies,
      })),
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
      alluviumSourceSummary,
      mapSourceSummary,
      manualSourceSummary,
    })
  }

  const items = MANUAL_ITEM_NAMES.map(name => byName.get(name)).filter(Boolean)
  const missing = MANUAL_ITEM_NAMES.filter(name => !byName.has(name))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({
    items,
    missing,
    enemyCount: Object.keys(enemyMap).length,
    energyAlluviumRows: (energyAlluvium.rows || []).map(row => ({
      locationEn: row.locationEn || '',
      locationZh: row.locationZh || locationNotes[row.mapId]?.zh || null,
      mapId: row.mapId || '',
      enemies: (row.enemies || []).map(enemy => ({
        id: normalizeEnemyId(enemy.enemyId),
        name: enemy.zhName || enemy.enName || enemy.enemyId,
        enName: enemy.enName || '',
        count: Object.prototype.hasOwnProperty.call(enemy, 'count') ? enemy.count : null,
      })),
    })),
  }, null, 0))

  console.log(`Extracted ${items.length} manual items`)
  console.log(`Missing: ${missing.length}${missing.length ? ' - ' + missing.join(', ') : ''}`)
  console.log(`Enemy map: ${Object.keys(enemyMap).length} entries`)
  console.log(`Location notes: ${Object.keys(locationNotes).length} entries`)
  console.log(`Energy Alluvium rows: ${energyAlluvium?.rows?.length || 0}`)
  console.log(`Output: ${OUT}`)
}

main().catch(e => { console.error(e); process.exit(1) })
