#!/usr/bin/env node
// October snapshot only. Optional argv[2]: directory containing cached wiki API wikitext.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(join(root, path))
const json = path => JSON.parse(read(path))
const baseline = path => JSON.parse(execFileSync('git', ['show', `2fa3cd6:${path}`], { cwd: root, encoding: 'utf8' }))
const data = json('public/data/items.json')
const notes = json('energy-alluvium-notes.json')
const wiki = json('wiki-item-notes.json')
const old = baseline('public/data/items.json')
const oldNotes = baseline('energy-alluvium-notes.json')
const changedAreas = new Set(['重度能量淤积点 - 北部禁区', '重度能量淤积点 - 雪松林'])
const names = [...read('scripts/extract.mjs').toString().match(/const MANUAL_ITEM_NAMES = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1])
assert.equal(names.length, 50)
assert.equal(new Set(names).size, 50)
assert.deepEqual(data.items.map(i => i.name), names)
assert.equal(new Set(data.items.map(i => i.id)).size, 50)
assert.deepEqual(data.missing, [])
assert.equal(old.items.length, 47)
// Only independently evidenced alluvium counts may change in the original 47 items.
for (const [index, previous] of old.items.entries()) {
  const item = structuredClone(data.items[index])
  for (const group of item.alluviumSourceSummary.grouped) {
    if (changedAreas.has(group.area)) for (const enemy of group.enemies) enemy.count = null
  }
  assert.deepEqual(item, previous, previous.name)
}
for (const item of data.items) {
  assert.ok(item.icon)
  assert.equal(read(`public/${item.icon}`).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
}
console.log('PASS: 50 unique items/icons; original 47 records preserved except verified alluvium count updates')

assert.equal(notes.rows.length, 13)
assert.equal(data.energyAlluviumRows.length, 13)
assert.equal(new Set(notes.rows.map(r => r.mapId)).size, 13)
for (const [index, previous] of oldNotes.rows.entries()) {
  const current = notes.rows[index]
  assert.equal(current.locationEn, previous.locationEn)
  assert.deepEqual(current.enemies.map(e => [e.enemyId, e.enName, e.zhName]), previous.enemies.map(e => [e.enemyId, e.enName, e.zhName]))
  if (index < 10) assert.deepEqual(current.enemies, previous.enemies)
}
const counts = key => notes.rows.find(r => r.mapId === key).enemies.map(e => e.count)
assert.deepEqual(counts('wiki:yinglung_pass'), [8, 2, 1, 6, 6])
assert.deepEqual(counts('wiki:north_wuling_ez'), [12, 9, 6, 1, 1])
assert.deepEqual(counts('wiki:snowy_forest'), [2, 4, 4, 3, 16])
assert.deepEqual(counts('wiki:sis_painting'), [null, null, null, 1])
const locations = json('location-notes.json')
assert.ok(!locations.map02_lv007 && !locations.map02_lv008)
for (const row of notes.rows) {
  assert.equal(row.status || 'verified', row.enemies.some(e => e.count === null) ? 'partial' : 'verified')
  if (row.mapId.startsWith('wiki:')) assert.equal(locations[row.mapId].status, 'local_key')
  const output = data.energyAlluviumRows.find(r => r.mapId === row.mapId)
  assert.deepEqual(output.enemies.map(e => [e.id, e.count]), row.enemies.map(e => [e.enemyId, e.count]))
}
// Chinese name is user-confirmed; cached wiki evidence remains the original English.
assert.equal(locations['wiki:sis_painting'].zh, '祀的画')
assert.equal(notes.rows.find(r => r.mapId === 'wiki:sis_painting').locationZh, '祀的画')
assert.equal(data.energyAlluviumRows.find(r => r.mapId === 'wiki:sis_painting').locationZh, '祀的画')
console.log('PASS: 13 alluvia; previous rosters preserved; exact count updates; only 3 unknown counts; unknown map IDs use wiki keys')

const additions = [
  ['小墨团', 'item_drop_inkbiter_1', 1, [['eny_0130_inkbiter', '存禄', null], ['eny_0131_inkscroll', '用奇', null]], '精制食药'],
  ['降劫雨露', 'item_drop_inkkirin_1', 2, [['eny_0132_inkkirin', '解燥', null]], '精制食药'],
  ['敕律玉球', 'item_drop_inklion_1', 4, [['eny_0133_inklion', '行度', 1]], '装箱运送'],
]
assert.deepEqual(data.items.slice(47).map(i => i.name), additions.map(i => i[0]))
for (const [name, id, rarity, enemies, use] of additions) {
  const item = data.items.find(i => i.id === id)
  const source = wiki.items.find(i => i.id === id)
  assert.equal(item.name, name)
  assert.equal(item.rarity, rarity)
  assert.equal(item.type, 8)
  assert.ok(item.description.includes(use))
  assert.deepEqual(item.droppedBy, enemies.map(([id, name]) => ({ id, name })))
  assert.deepEqual(item.alluviumSourceSummary.grouped, [{
    area: '重度能量淤积点 - 祀的画',
    enemies: enemies.map(([id, name, count]) => ({ id, name, levels: [], count })),
  }])
  assert.deepEqual(item.mapSourceSummary.grouped, [])
  assert.deepEqual(item.manualSourceSummary.grouped, [])
  assert.equal(item.craft, null)
  assert.match(source.sourceUrl, /^https:\/\/endfield\.wiki\.gg\/wiki\//)
  assert.match(source.iconSourceUrl, /^https:\/\/endfield\.wiki\.gg\/images\/.*\.png$/)
  assert.ok(source.manualSourceUrl && source.accessedAt && source.sourceNote)
  assert.equal(createHash('sha256').update(read(`public/${item.icon}`)).digest('hex'), source.iconSha256)
}
console.log('PASS: new item IDs, rarity, drop enemies, uses, original icon hashes, provenance and separate world/alluvium scopes')

if (process.argv[2]) {
  const evidence = name => readFileSync(join(process.argv[2], `${name.replaceAll(' ', '_').replaceAll('/', '_')}.wikitext`), 'utf8')
  // Compare every row, not just the additions. Never turn N/TBA into a guessed number.
  const table = [...evidence('Energy Alluvium').matchAll(/\| \[\[([^\]]+)\]\]\s*\n\| (\{\{E\|[^\n]+)/g)].map(([, link, enemies]) => ({
    locationEn: link.split('|').at(-1),
    enemies: [...enemies.matchAll(/\{\{E\|([^|]+)\|([^|]+)\|g=1\}\}/g)].map(([, enName, value]) => {
      assert.match(value, /^(?:\d+|N|TBA)$/)
      return { enName, count: /^\d+$/.test(value) ? Number(value) : null }
    }),
  }))
  assert.equal(table.length, 13)
  assert.deepEqual(notes.rows.map(r => ({ locationEn: r.locationEn, enemies: r.enemies.map(({ enName, count }) => ({ enName, count })) })), table)
  const field = (text, key) => text.match(new RegExp(`\\|${key}\\s*=\\s*([^\\n}]+)`))?.[1].trim()
  const manual = evidence('Crafting/Crafting Manual')
  for (const source of wiki.items.slice(5)) {
    const text = evidence(source.enName)
    assert.equal(field(text, 'filename'), source.id)
    assert.equal(field(text, 'cnname'), source.name)
    assert.equal(Number(field(text, 'rarity')), source.rarity)
    assert.equal(field(text, 'images'), decodeURIComponent(source.iconSourceUrl.split('/').at(-1)))
    assert.ok(manual.includes(`|item = ${source.enName}\n`))
    assert.equal(field(manual.split(`|item = ${source.enName}\n`)[1], 'gather'), '1,10,50')
    for (const enemy of source.droppedBy) {
      const enemyText = evidence(enemy.enName)
      assert.equal(field(enemyText, 'filename'), enemy.enemyId)
      assert.equal(field(enemyText, 'cnname'), enemy.zhName)
      assert.ok(enemyText.includes(`|drops = {{I|${source.enName}}}`))
      assert.ok(enemyText.includes("*[[Energy Alluvium: Si's Painting]]"))
    }
  }
  assert.ok(evidence("Si's Painting").includes("[[Energy Alluvium: Si's Painting]]"))
  console.log('PASS: full live-table snapshot and all new item/enemy/manual fields match cached original wiki API evidence')
}
console.log(JSON.stringify({ items: data.items.length, alluvia: notes.rows.length, enemyMap: data.enemyCount, unknownCounts: notes.rows.flatMap(r => r.enemies).filter(e => e.count === null).length }))
