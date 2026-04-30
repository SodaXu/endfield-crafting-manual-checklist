import { useState, useEffect, useMemo } from 'react'
import type { DataFile, Item } from './types'

const STARS = '★'

function cleanObtain(desc: string) {
  return desc.replace(/有概率/g, '概率').replace(/等地采集/g, '等地')
}

function ItemCard({ item }: { item: Item }) {
  const groups = item.sourceSummary?.grouped || []
  const hasDrops = item.droppedBy && item.droppedBy.length > 0
  const mergedDescription = [
    item.description,
    ...(item.obtainWays || []).map(w => cleanObtain(w.desc)),
  ].filter(Boolean)

  return (
    <div className={`card r${item.rarity}`}>
      <div className="card-top">
        <div className="icon-wrap">
          {item.icon ? <img className="item-icon" src={item.icon} alt="" loading="lazy" /> : <span className="icon-fallback">?</span>}
        </div>
        <div className="title-block">
          <div className="card-header">
            <span className="name">{item.name}</span>
            <span className="rarity">{STARS.repeat(item.rarity)}</span>
          </div>
          <div className="item-id">{item.id}</div>
        </div>
      </div>

      {mergedDescription.length > 0 && (
        <div className="merged-desc">
          {mergedDescription.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="section-label primary">出现地图</div>
          {groups.map(group => (
            <div className="source-group" key={group.area}>
              <div className="area">{group.area}</div>
              <div className="enemy-list">
                {group.enemies.map(enemy => (
                  <span className="enemy-pill" key={enemy.id}>
                    {enemy.name}{enemy.levels.length > 0 ? ` Lv.${enemy.levels.join('/')}` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {hasDrops && groups.length === 0 && (
        <>
          <div className="section-label primary">掉落怪（地图待补）</div>
          <div className="enemy-list">
            {item.droppedBy!.map(enemy => (
              <span className="enemy-pill muted" key={enemy.id}>{enemy.name || enemy.id}</span>
            ))}
          </div>
        </>
      )}

      {item.craft && (
        <>
          <div className="section-label">合成</div>
          <div className="craft-info">
            {item.craft.blueprint && <div>蓝图: {item.craft.blueprint}</div>}
            {item.craft.blackbox && <div>设备: {item.craft.blackbox}</div>}
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<DataFile | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState(0)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    fetch('./data/items.json')
      .then(r => r.json())
      .then(setData)
      .catch(() => setError('加载数据失败，请先运行 npm run extract'))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data.items
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(it =>
        it.name.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.obtainWays?.some(w => w.desc.toLowerCase().includes(q)) ||
        it.droppedBy?.some(d => (d.name || d.id).toLowerCase().includes(q)) ||
        it.sourceSummary?.grouped.some(g => g.area.toLowerCase().includes(q))
      )
    }
    if (rarity > 0) list = list.filter(it => it.rarity === rarity)
    if (sourceFilter === 'farm') list = list.filter(it => (it.sourceSummary?.grouped.length || 0) > 0)
    if (sourceFilter === 'gather') list = list.filter(it => it.obtainWays?.some(w => w.desc.includes('采集') || w.desc.includes('种植')))
    return list
  }, [data, search, rarity, sourceFilter])

  const areas = useMemo(() => {
    if (!data) return []
    const set = new Set<string>()
    for (const item of data.items) {
      for (const group of item.sourceSummary?.grouped || []) set.add(group.area)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'))
  }, [data])

  if (error) return <div className="app"><div className="error">{error}</div></div>
  if (!data) return <div className="app"><div className="loading">加载中…</div></div>

  return (
    <div className="app">
      <header>
        <div className="hero">
          <div>
            <h1>明日方舟终末地 简制手册来源掉落查询</h1>
            <p className="subtitle">自制项目，快速查询简制手册的奖励需求与淤积点掉落以方便挂机，挂机视频：<a href="https://www.bilibili.com/video/BV1xhd5B9EFd" target="_blank" rel="noreferrer">BV1xhd5B9EFd</a></p>
          </div>
          <button className="about-button" onClick={() => setShowAbout(true)}>数据说明</button>
        </div>
      </header>

      {showAbout && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowAbout(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="数据说明" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAbout(false)} aria-label="关闭">×</button>
            <h2>数据处理说明</h2>
            <p>页面展示当前版本整理的简制手册材料条目。构建时从本地 AKEDatabase 缓存提取物品、图标、敌人和大地图刷怪配置，生成静态 JSON；浏览器运行时不会请求外部 wiki 或 API。</p>
            <ul>
              <li>物品描述 = <code>description</code> + <code>obtainWays.desc</code> 合并展示。</li>
              <li>地图来源 = 物品掉落怪 → 大地图 SpawnerConfig → 地图中文备注聚合。</li>
              <li>不使用 <code>forbidDrop</code> 过滤；该字段和实际掉落口径存在歧义。</li>
              <li>少量缺口使用人工备注修正，例如地图编号与「彪兽的长绒」位置。</li>
            </ul>
            <h3>Credits</h3>
            <ul>
              <li><a href="https://github.com/nagiyume/AKEDatabase" target="_blank" rel="noreferrer">AKEDatabase</a>：物品、图标、敌人名称、SpawnerConfig 等本地静态数据。</li>
              <li><a href="https://wiki.biligame.com/zmd/%E7%89%A9%E5%93%81%E5%9B%BE%E9%89%B4" target="_blank" rel="noreferrer">Bilibili 游戏 Wiki · 物品图鉴</a>：少量物品掉落口径交叉校验。</li>
              <li><a href="https://wiki.biligame.com/zmd/%E6%95%8C%E5%AF%B9%E5%9B%BE%E9%89%B4" target="_blank" rel="noreferrer">Bilibili 游戏 Wiki · 敌对图鉴</a>：少量敌人分布区域交叉校验。</li>
            </ul>
            <p className="copyright-note">游戏数据与图片版权归鹰角网络 / Gryphline 所有。本页面仅作个人整理与查询使用。</p>
          </div>
        </div>
      )}

      <div className="summary">
        <div><strong>{data.items.length}</strong><span>手册物品</span></div>
        <div><strong>{areas.length}</strong><span>出现地图区域</span></div>
        <div><strong>{data.enemyCount}</strong><span>敌人映射</span></div>
      </div>

      {data.missing.length > 0 && (
        <div className="notice">未匹配：{data.missing.join('、')}</div>
      )}

      <div className="filters">
        <input
          placeholder="搜物品 / 怪物 / 地区 / 获取途径…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={rarity} onChange={e => setRarity(Number(e.target.value))}>
          <option value={0}>全部星级</option>
          {[1,2,3,4,5,6].map(r => <option key={r} value={r}>{STARS.repeat(r)}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="all">全部来源</option>
          <option value="farm">有地图来源</option>
          <option value="gather">采集/种植</option>
        </select>
      </div>

      <div className="area-tags">
        {areas.map(area => (
          <button key={area} onClick={() => setSearch(area)}>{area}</button>
        ))}
      </div>

      <div className="count">显示 {filtered.length} / {data.items.length} 项</div>

      <div className="cards-grid">
        {filtered.map(item => <ItemCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}
