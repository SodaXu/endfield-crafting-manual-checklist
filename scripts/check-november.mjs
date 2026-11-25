#!/usr/bin/env node
// November snapshot. argv[2] optionally verifies the local research-*.json extracts.
// Evidence stays outside the repository; no network or dependency changes.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(join(root, path))
const json = path => JSON.parse(read(path))
const baseline = path => JSON.parse(execFileSync('git', ['show', `6769780:${path}`], { cwd: root, encoding: 'utf8' }))
const data = json('public/data/items.json')
const notes = json('energy-alluvium-notes.json')
const wiki = json('wiki-item-notes.json')
const old = baseline('public/data/items.json')
const oldNotes = baseline('energy-alluvium-notes.json')
const oldWiki = baseline('wiki-item-notes.json')
const warning = '已确认部分敌人，完整阵容及数量待核验'
const names = [...read('scripts/extract.mjs').toString().match(/const MANUAL_ITEM_NAMES = \[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1])
assert.equal(names.length, 53)
assert.equal(new Set(names).size, 53)
assert.deepEqual(data.items.map(i => i.name), names)
assert.equal(new Set(data.items.map(i => i.id)).size, 53)
assert.deepEqual(data.missing, [])
assert.equal(old.items.length, 50)
// Exactly three count changes, plus two corresponding formerly "pending" descriptions.
const updatedCounts = { eny_0130_inkbiter: 12, eny_0131_inkscroll: 12, eny_0132_inkkirin: 3 }
for (const [index, previous] of old.items.entries()) {
  const item = structuredClone(data.items[index])
  for (const group of item.alluviumSourceSummary.grouped) {
    if (group.area !== '重度能量淤积点 - 祀的画') continue
    for (const enemy of group.enemies) {
      if (!(enemy.id in updatedCounts)) continue
      assert.equal(enemy.count, updatedCounts[enemy.id])
      enemy.count = null
    }
  }
  if (['item_drop_inkbiter_1', 'item_drop_inkkirin_1'].includes(item.id)) {
    assert.match(item.obtainWays[0].desc, /2026-11-26 淤积点总表复核数量/)
    item.obtainWays = previous.obtainWays
  }
  assert.deepEqual(item, previous, previous.name)
}
for (const source of wiki.items.slice(0, 8)) {
  const previous = oldWiki.items.find(i => i.id === source.id)
  const restored = structuredClone(source)
  if (['item_drop_inkbiter_1', 'item_drop_inkkirin_1'].includes(source.id)) restored.obtainWays = previous.obtainWays
  assert.deepEqual(restored, previous)
}
for (const item of data.items) {
  assert.ok(item.icon)
  assert.equal(read(`public/${item.icon}`).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
}
console.log('PASS: 53 unique items/icons; prior 50 preserved except raw-evidenced Si’s Painting counts and two source descriptions')

assert.equal(notes.rows.length, 14)
assert.equal(data.energyAlluviumRows.length, 14)
assert.equal(new Set(notes.rows.map(r => r.mapId)).size, 14)
assert.deepEqual(notes.rows.slice(0, 12), oldNotes.rows.slice(0, 12))
assert.deepEqual(data.energyAlluviumRows.slice(0, 12), old.energyAlluviumRows.slice(0, 12))
assert.deepEqual(notes.rows[12].enemies, oldNotes.rows[12].enemies.map(e => ({ ...e, count: updatedCounts[e.enemyId] ?? e.count })))
const dam = notes.rows[13]
assert.equal(dam.mapId, 'wiki:old_dam')
assert.equal(dam.region, 'Wuling')
assert.equal(dam.locationEn, 'Old Dam')
assert.equal(dam.locationZh, '旧水坝')
assert.equal(dam.status, 'partial')
assert.equal(dam.rosterCompleteness, 'partial')
assert.ok(dam.note.includes(warning))
assert.match(dam.source, /NOT a row/)
const locations = json('location-notes.json')
assert.deepEqual(Object.fromEntries(Object.entries(locations).filter(([key]) => key !== 'wiki:old_dam')), baseline('location-notes.json'))
assert.equal(locations['wiki:old_dam'].status, 'local_key')
assert.equal(locations['wiki:old_dam'].zh, '旧水坝')
for (const [index, row] of notes.rows.entries()) {
  assert.equal(row.status || 'verified', row.enemies.some(e => e.count === null) ? 'partial' : 'verified')
  const output = data.energyAlluviumRows[index]
  assert.equal(output.mapId, row.mapId)
  assert.equal(output.rosterCompleteness, row.rosterCompleteness)
  assert.equal(output.note, row.note || '')
  assert.deepEqual(output.enemies.map(e => [e.id, e.name, e.enName, e.count]), row.enemies.map(e => [e.enemyId, e.zhName, e.enName, e.count]))
}
assert.equal(notes.rows.flatMap(r => r.enemies).filter(e => e.count === null).length, 4)
console.log('PASS: 13 table rows + separate partial Old Dam supplement; four null counts, unconfirmed full roster, local map key')

const additions = [
  ['健谈的蘑菇', 'item_plant_grass_spmushroom_1', 1, [], [1, 50, 100], '089e280aae4eda2c224117ff962cf25ed4b36c895588013edc6584e0d044d8ca'],
  ['菌王之尘', 'item_drop_mushbug_1', 4, ['eny_0159_mushman', 'eny_0158_mushbug'], [1, 10, 50], '425e4a458ed4c2c509f4e75ec1eae84b69d8519e3e44b25c62ed8394ccba7b7c'],
  ['异彩菌块', 'item_drop_mushro_1', 4, ['eny_0160_mushro', 'eny_0161_mushshd'], [1, 10, 50], '3449404fcf6e2dce31137d993f1ad5f85feaa6d1c5c23ab24e662f9d6eb87903'],
]
assert.deepEqual(data.items.slice(50).map(i => i.name), additions.map(i => i[0]))
assert.equal(wiki.items.length, 11)
assert.deepEqual(dam.enemies.map(e => e.enemyId), additions.flatMap(i => i[3]))
assert.equal(json('../AKEDatabase/public/CH/item/item_plant_grass_1.json').type, 8)
for (const [name, id, rarity, enemies, milestones, hash] of additions) {
  const item = data.items.find(i => i.id === id)
  const source = wiki.items.find(i => i.id === id)
  assert.equal(item.name, name)
  assert.equal(item.rarity, rarity)
  assert.equal(item.type, 8) // Local convention, not new game enum evidence.
  assert.deepEqual(item.droppedBy.map(e => e.id), enemies)
  assert.deepEqual(item.mapSourceSummary.grouped, []) // No fabricated spawns, levels or world counts.
  assert.equal(item.craft, null)
  assert.equal(source.manualSource, '用户游戏截图/2026-11-26')
  assert.deepEqual(source.manualMilestones, milestones)
  assert.ok(!source.manualSourceUrl)
  assert.ok(source.accessedAt && source.sourceNote)
  assert.match(source.sourceUrl, /^https:\/\/endfield\.wiki\.gg\/wiki\/.*\?action=raw$/)
  assert.equal(source.iconSourceUrl, `https://endfieldtools.dev/assets/images/endfield/itemiconbig/${id}.png`)
  assert.equal(item.icon, `./icons/${id}.png`)
  const png = read(`public/${item.icon}`)
  assert.equal(png.readUInt32BE(16), 254)
  assert.equal(png.readUInt32BE(20), 254)
  assert.equal(createHash('sha256').update(png).digest('hex'), hash)
  assert.equal(source.iconSha256, hash)
  if (enemies.length) {
    assert.deepEqual(item.manualSourceSummary.grouped, [])
    assert.deepEqual(item.alluviumSourceSummary.grouped, [{
      area: '重度能量淤积点 - 旧水坝', rosterCompleteness: 'partial', note: dam.note,
      enemies: source.droppedBy.map(e => ({ id: e.enemyId, name: e.zhName, levels: [], count: null })),
    }])
  } else {
    assert.deepEqual(item.alluviumSourceSummary.grouped, [])
    assert.deepEqual(item.manualSourceSummary.grouped, source.manualSourceGroups)
    assert.equal(source.manualSourceGroups.length, 1)
    assert.equal(source.manualSourceGroups[0].area, '旧水坝')
    assert.equal(source.manualSourceGroups[0].sourceUrl, source.sourceUrl)
    assert.deepEqual(source.manualSourceGroups[0].enemies, [])
    assert.ok(item.obtainWays.some(w => w.desc.includes('采集')))
    assert.match(source.sourceNote, /Naturals.*本地表示.*枚举证据/)
  }
}
const groups = i => [...i.alluviumSourceSummary.grouped, ...i.mapSourceSummary.grouped, ...i.manualSourceSummary.grouped]
assert.deepEqual(data.items.filter(i => groups(i).some(g => g.area.includes('旧水坝'))).map(i => i.name), additions.map(i => i[0]))
assert.deepEqual(data.items.filter(i => groups(i).some(g => g.area === '重度能量淤积点 - 旧水坝')).map(i => i.name), additions.slice(1).map(i => i[0]))
for (const path of ['README.md', 'src/App.tsx', 'public/data/items.json', 'wiki-item-notes.json', 'energy-alluvium-notes.json', 'location-notes.json']) {
  assert.doesNotMatch(read(path).toString(), /\/home\/|\.hermes\/|img_a8a699c29fd3|discord(?:app)?\.com\/attachments\//i, path)
}
console.log('PASS: exact additions, screenshot milestones, gathering/drop separation, filter groups, real icon hashes and public provenance')

if (process.argv[2]) {
  const records = ['research-raw.json', 'research-raw-enemies.json', 'research-final-evidence.json', 'research-item-crosscheck.json'].flatMap(file => {
    const value = JSON.parse(readFileSync(join(process.argv[2], file), 'utf8'))
    return Array.isArray(value) ? value : value.results
  })
  const evidence = url => {
    const record = records.find(r => r.url === url && !r.error)
    assert.ok(record?.content, `Missing evidence: ${url}`)
    // Markdown transport escapes are not literal item/enemy IDs.
    return record.content.replace(/\\([_*])/g, '$1')
  }
  const raw = title => evidence(`https://endfield.wiki.gg/wiki/${title}?action=raw`)
  const field = (text, key) => text.match(new RegExp(`\\|${key}\\s*=\\s*([^|}]+)`))?.[1].trim()
  const tableText = raw('Energy_Alluvium')
  const table = [...tableText.matchAll(/\|\s*\[\[([^\]]+)\]\]\s*\|\s*((?:\{\{E\|[^}]+\}\}\s*)+)/g)].map(([, link, enemies]) => ({
    locationEn: link.split('|').at(-1),
    enemies: [...enemies.matchAll(/\{\{E\|([^|]+)\|([^|]+)\|g=1\}\}/g)].map(([, enName, count]) => {
      assert.match(count, /^(?:\d+|N|TBA)$/)
      return { enName, count: /^\d+$/.test(count) ? Number(count) : null }
    }),
  }))
  assert.equal(table.length, 13)
  assert.deepEqual(notes.rows.slice(0, 13).map(r => ({ locationEn: r.locationEn, enemies: r.enemies.map(({ enName, count }) => ({ enName, count })) })), table)
  assert.ok(!tableText.includes('[[Old Dam]]'))
  assert.ok(raw('Old_Dam').includes('|part = [[Wuling]]'))
  assert.ok(evidence('https://www.gcores.com/articles/222631').includes('旧水坝'))
  const manual = raw('Crafting/Crafting_Manual')
  for (const source of wiki.items.slice(8)) {
    const text = evidence(source.sourceUrl)
    assert.equal(field(text, 'filename'), source.id)
    assert.equal(field(text, 'cnname'), source.name)
    assert.equal(Number(field(text, 'rarity')), source.rarity)
    assert.equal(field(text, 'type'), source.droppedBy.length ? 'Gatherables' : 'Naturals')
    assert.ok(!manual.includes(`|item = ${source.enName}`), 'Do not claim handbook membership from the stale total table')
    assert.ok(records.some(r => r.url.startsWith('https://endfieldtools.dev/items/') && !r.error && r.content.includes(source.iconSourceUrl)))
    for (const enemy of source.droppedBy) {
      const enemyText = evidence(enemy.sourceUrl)
      assert.equal(field(enemyText, 'filename'), enemy.enemyId)
      assert.equal(field(enemyText, 'cnname'), enemy.zhName)
      assert.ok(enemyText.includes(`|drops = {{I|${source.enName}}}`))
      assert.match(enemyText, /\|location\s*=\s*\*\[\[Old Dam\]\]\s*\*\[\[Energy Alluvium: Old Dam\]\]/)
    }
  }
  assert.ok(raw('Loquacious_Shroom').includes('grows at the Old Dam. Can be used to make honey waffles.'))
  assert.ok(records.some(r => r.url.endsWith('Energy_Alluvium:_Old_Dam?action=raw') && r.error.includes('404')))
  console.log('PASS: all 13 raw table rows match; three item templates, four explicit alluvium enemy pages, gathering and actual icon URLs match independent cached evidence')
} else {
  console.log('NOTE: raw evidence comparison not run; pass the local research directory as argv[2] to include it')
}
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: join(root, '../AKEDatabase'), encoding: 'utf8' }).trim(), '597c249298efa3b6a2c67a9223009b1fc42d994a')
console.log(JSON.stringify({ items: data.items.length, tableRows: 13, partialSupplements: 1, alluvia: notes.rows.length, enemyMap: data.enemyCount, unknownCounts: 4, oldDamFullRoster: 'unconfirmed' }))
