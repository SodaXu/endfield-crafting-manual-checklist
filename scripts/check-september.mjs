#!/usr/bin/env node
// September snapshot regression checks; no dependencies. Run after npm run extract.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(new URL(`../${path}`, import.meta.url))
const json = path => JSON.parse(read(path))
const baseline = path => JSON.parse(execFileSync('git', ['show', `925d8af:${path}`], { cwd: root, encoding: 'utf8' }))
const data = json('public/data/items.json')
const notes = json('energy-alluvium-notes.json')
const oldData = baseline('public/data/items.json')
const oldNotes = baseline('energy-alluvium-notes.json')
const area = '重度能量淤积点 - 雪松林'
const manualBlock = read('scripts/extract.mjs').toString().match(/const MANUAL_ITEM_NAMES = \[([\s\S]*?)\]/)[1]
const manualNames = [...manualBlock.matchAll(/'([^']+)'/g)].map(match => match[1])
assert.equal(manualNames.length, 47)
assert.equal(new Set(manualNames).size, 47)
assert.deepEqual(data.items.map(item => item.name), manualNames)
assert.equal(new Set(data.items.map(item => item.id)).size, 47)
assert.deepEqual(data.missing, [])
for (const item of data.items) {
  assert.ok(item.icon, `${item.name}: missing icon`)
  const icon = read(`public/${item.icon.replace(/^\.\//, '')}`)
  assert.ok(icon.length > 8, `${item.name}: empty icon`)
  assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${item.name}: not PNG`)
}
console.log('PASS: 47 unique manual names/IDs in order; missing []; all 47 icons present and PNG')

assert.equal(oldNotes.rows.length, 11)
assert.equal(notes.rows.length, 12)
assert.equal(data.energyAlluviumRows.length, 12)
assert.equal(new Set(data.energyAlluviumRows.map(row => row.mapId)).size, 12)
assert.deepEqual(notes.rows.slice(0, 11), oldNotes.rows)
assert.deepEqual(data.energyAlluviumRows.slice(0, 11), oldData.energyAlluviumRows)
assert.equal(oldData.items.length, 45)
const oldItemsWithoutNewSource = data.items.slice(0, 45).map(item => ({
  ...item,
  alluviumSourceSummary: { grouped: item.alluviumSourceSummary.grouped.filter(group => group.area !== area) },
}))
assert.deepEqual(oldItemsWithoutNewSource, oldData.items)
console.log('PASS: original 11 rows unchanged; original 45 items unchanged except added Snowy Forest sources')

const snow = data.energyAlluviumRows.find(row => row.mapId === 'wiki:snowy_forest')
assert.equal(snow.locationZh, '雪松林')
assert.equal(snow.status, 'partial')
assert.match(snow.note, /地图编号待核验/)
assert.equal(json('location-notes.json')[snow.mapId].status, 'local_key')
assert.deepEqual(snow.enemies.map(enemy => [enemy.id, enemy.count]), [
  ['eny_0007_mimicw', null],
  ['eny_0073_slimerg', null],
  ['eny_0100_slimerg2', null],
  ['eny_0128_babyents', null],
  ['eny_0129_slwood', null],
])
assert.deepEqual(data.energyAlluviumRows.find(row => row.locationEn === 'Yinglung Pass').enemies.map(e => e.count), [8, 2, 1, 6, 6])
assert.deepEqual(data.energyAlluviumRows.find(row => row.locationEn === 'North Wuling EZ').enemies.map(e => e.count), [null, null, null, null, null])
console.log('PASS: 12 unique maps; Snowy Forest local key, partial, five null counts; Yinglung/North Wuling counts preserved')

const additions = [
  ['柔嫩苔藓', 'item_drop_babyents_1', 4, 'eny_0128_babyents', '徘徊树傀', '装箱运送'],
  ['虫角嫩枝', 'item_drop_slwood_1', 1, 'eny_0129_slwood', '虫体树傀', '精制食药'],
]
assert.deepEqual(data.items.slice(45).map(item => item.name), additions.map(row => row[0]))
for (const [name, id, rarity, enemyId, enemyName, use] of additions) {
  const item = data.items.find(item => item.name === name)
  assert.equal(item.id, id)
  assert.equal(item.rarity, rarity)
  assert.equal(item.type, 8)
  assert.ok(item.description.includes(use))
  if (name === '柔嫩苔藓') assert.ok(!item.description.includes('精制食药'))
  assert.ok(item.obtainWays.some(way => way.desc.includes('雪松林')))
  assert.deepEqual(item.droppedBy, [{ id: enemyId, name: enemyName }])
  assert.deepEqual(item.alluviumSourceSummary.grouped, [{ area, enemies: [{ id: enemyId, name: enemyName, levels: [], count: null }] }])
  assert.deepEqual(item.mapSourceSummary.grouped, [])
  assert.deepEqual(item.manualSourceSummary.grouped, [])
}
for (const [name, ids] of [
  ['虬兽的须', ['eny_0007_mimicw']],
  ['虫肉', ['eny_0073_slimerg', 'eny_0100_slimerg2']],
]) {
  const source = data.items.find(item => item.name === name).alluviumSourceSummary.grouped.find(group => group.area === area)
  assert.deepEqual(source.enemies.map(enemy => enemy.id), ids)
  assert.ok(source.enemies.every(enemy => enemy.count === null && enemy.levels.length === 0))
}
console.log('PASS: new item metadata, distinct uses, drops and unknown-count sources; existing 虬兽的须/虫肉 gain matching sources; no invented spawners')
