import { useState, useEffect, useMemo, useRef } from 'react'
import type { DataFile, Item, SourceGroup } from './types'

const STARS = '★'
const ALLUVIUM_PREFIX = '重度能量淤积点 - '

function sourceGroupsForItem(item: Item) {
  return [
    ...(item.alluviumSourceSummary?.grouped || []),
    ...(item.mapSourceSummary?.grouped || []),
    ...(item.manualSourceSummary?.grouped || []),
  ]
}

function cleanObtain(desc: string) {
  return desc.replace(/有概率/g, '概率').replace(/等地采集/g, '等地')
}

function SourceGroups({ title, groups, kind }: { title: string, groups: SourceGroup[], kind: string }) {
  if (groups.length === 0) return null
  return (
    <section className={`source-section ${kind}`} aria-label={title}>
      <h4 className="section-label">{title}</h4>
      {groups.map(group => (
        <div className="source-group" key={`${title}:${group.area}`}>
          <div className="area">{kind === 'alluvium' && group.area.startsWith(ALLUVIUM_PREFIX) ? group.area.slice(ALLUVIUM_PREFIX.length) : group.area}</div>
          <div className="enemy-list">
            {group.enemies.map(enemy => (
              <span className="enemy-pill" key={enemy.id}>
                {enemy.name}{enemy.count !== undefined ? (enemy.count === null ? ' ×?' : ` ×${enemy.count}`) : ''}{enemy.levels.length > 0 ? ` Lv.${enemy.levels.join('/')}` : ''}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function ItemCard({ item }: { item: Item }) {
  const alluviumGroups = item.alluviumSourceSummary?.grouped || []
  const mapGroups = item.mapSourceSummary?.grouped || []
  const manualGroups = item.manualSourceSummary?.grouped || []
  const hasAnySource = alluviumGroups.length > 0 || mapGroups.length > 0 || manualGroups.length > 0
  const hasDrops = item.droppedBy && item.droppedBy.length > 0
  const mergedDescription = [
    item.description,
    ...(item.obtainWays || []).map(w => cleanObtain(w.desc)),
  ].filter(Boolean)

  return (
    <article className={`card r${item.rarity}`}>
      <div className="card-top">
        <div className="icon-wrap">
          {item.icon ? <img className="item-icon" src={item.icon} alt="" loading="lazy" /> : <span className="icon-fallback">?</span>}
        </div>
        <div className="title-block">
          <div className="card-header">
            <h3 className="name">{item.name}</h3>
            <span className="rarity" aria-label={`${item.rarity} 星`}>{STARS.repeat(item.rarity)}</span>
          </div>
          <div className="item-id">{item.id}</div>
        </div>
      </div>

      {mergedDescription.length > 0 && (
        <div className="merged-desc">
          {mergedDescription.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <SourceGroups title="淤积点来源" groups={alluviumGroups} kind="alluvium" />
      <SourceGroups title="大地图刷新" groups={mapGroups} kind="open-world" />
      <SourceGroups title="手工补充" groups={manualGroups} kind="manual" />

      {hasDrops && !hasAnySource && (
        <>
          <div className="section-label primary">掉落怪（淤积点待补）</div>
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
    </article>
  )
}

export default function App() {
  const [data, setData] = useState<DataFile | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState(0)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showAbout, setShowAbout] = useState(false)
  const aboutRef = useRef<HTMLDialogElement>(null)
  const hasFilters = search !== '' || rarity !== 0 || sourceFilter !== 'all'
  const resetFilters = () => {
    setSearch('')
    setRarity(0)
    setSourceFilter('all')
  }

  useEffect(() => {
    if (!showAbout) return
    const dialog = aboutRef.current
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [showAbout])

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
        sourceGroupsForItem(it).some(g =>
          g.area.toLowerCase().includes(q) ||
          g.enemies.some(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
        )
      )
    }
    if (rarity > 0) list = list.filter(it => it.rarity === rarity)
    if (sourceFilter === 'source') list = list.filter(it => sourceGroupsForItem(it).length > 0)
    if (sourceFilter === 'gather') list = list.filter(it => it.obtainWays?.some(w => w.desc.includes('采集') || w.desc.includes('种植')))
    return list
  }, [data, search, rarity, sourceFilter])

  const areas = useMemo(() => {
    if (!data) return []
    const set = new Set<string>()
    for (const item of data.items) {
      for (const group of sourceGroupsForItem(item)) set.add(group.area)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'))
  }, [data])

  if (error) return <div className="app"><div className="error">{error}</div></div>
  if (!data) return <div className="app"><div className="loading">加载中…</div></div>

  return (
    <div className="app">
      <header className="operator-header">
        <div className="masthead">
          <div className="site-identity"><span className="identity-mark" aria-hidden="true">//</span> 终末地 <span className="masthead-label">FIELD GUIDE</span></div>
          <button className="about-button" onClick={() => setShowAbout(true)}>数据说明 <span aria-hidden="true">↗</span></button>
        </div>
        <div className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span aria-hidden="true">01 /</span> TALOS-II · MATERIAL INDEX</div>
            <h1><em>简制手册</em><span>材料来源查询</span></h1>
            <p className="subtitle">查找材料获取途径、淤积点掉落与大地图刷新。<br className="desktop-break" />按物品、怪物或地区检索，快速找到刷取位置。</p>
            <div className="hero-links">
              <a href="https://www.bilibili.com/video/BV1xhd5B9EFd" target="_blank" rel="noreferrer">挂机视频 ↗</a>
              <a href="https://opendfieldmap.cn/" target="_blank" rel="noreferrer">大地图 ↗</a>
            </div>
          </div>
          <div className="operator-roster" aria-label="终末地干员">
            <img className="roster-card tangtang-card" src="./operator-banners/tangtang.png" alt="唐唐" />
            <img className="roster-card gilberta-card" src="./operator-banners/gilberta.png" alt="Gilberta" />
            <img className="roster-card avywenna-card" src="./operator-banners/avywenna.png" alt="Avywenna" />
          </div>
        </div>
      </header>

      {showAbout && (
        <dialog ref={aboutRef} className="modal" aria-labelledby="about-title" onCancel={() => setShowAbout(false)} onClick={e => {
          if (e.target === e.currentTarget) {
            const bounds = e.currentTarget.getBoundingClientRect()
            if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) setShowAbout(false)
          }
        }}>
            <button className="modal-close" onClick={() => setShowAbout(false)} aria-label="关闭" autoFocus>×</button>
            <div className="eyebrow">FIELD NOTES / 数据与来源</div>
            <h2 id="about-title">数据处理说明</h2>
            <p>页面展示当前版本整理的简制手册材料条目。构建时从本地 AKEDatabase 缓存提取物品、图标、敌人和大地图刷怪配置，生成静态 JSON；浏览器运行时不会请求外部 wiki 或 API。</p>
            <ul>
              <li>物品描述 = <code>description</code> + <code>obtainWays.desc</code> 合并展示。</li>
              <li>淤积点来源 = 物品掉落怪 → wiki.gg Energy Alluvium 对比表 → 地图中文备注聚合。</li>
              <li>大地图 SpawnerConfig 只表示普通大地图刷怪，与淤积点来源分开展示。</li>
              <li>少量缺口使用人工备注修正，例如地图编号与「彪兽的长绒」位置。</li>
            </ul>
            {data.energyAlluviumRows && data.energyAlluviumRows.length > 0 && (
              <>
                <h3>淤积点地图与刷怪比对表</h3>
                <p>下表来自 wiki.gg Energy Alluvium；本地备注只补中文地图名、mapId 与来源说明，wiki 尚标为 TBA 的数量显示 ×?。</p>
                <div className="alluvium-table">
                  {data.energyAlluviumRows.map(row => (
                    <div className="alluvium-row" key={row.mapId}>
                      <div className="alluvium-place">
                        <strong>重度能量淤积点 - {row.locationZh || row.locationEn || row.mapId}</strong>
                        <span>{row.mapId.startsWith('wiki:') ? '地图编号待核验' : row.mapId}{row.locationEn ? ` · ${row.locationEn}` : ''}</span>
                        {row.status === 'partial' && <span className="pending-badge">数量待补</span>}
                        {row.status === 'pending_verification' && <span className="pending-badge">阵容待核验</span>}
                      </div>
                      {row.enemies.length > 0 ? (
                        <div className="enemy-list">
                          {row.enemies.map(enemy => (
                            <span className="enemy-pill" key={enemy.id} title={enemy.enName || enemy.id}>
                              {enemy.name}{enemy.count === null ? ' ×?' : ` ×${enemy.count}`}
                            </span>
                          ))}
                        </div>
                      ) : <p className="pending-note">{row.note || '敌人名称与数量待可靠数据源更新。'}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <h3>Credits</h3>
            <ul>
              <li><a href="https://github.com/nagiyume/AKEDatabase" target="_blank" rel="noreferrer">AKEDatabase</a>：物品、图标、敌人名称等本地静态数据。</li>
              <li><a href="https://wiki.biligame.com/zmd/%E7%89%A9%E5%93%81%E5%9B%BE%E9%89%B4" target="_blank" rel="noreferrer">Bilibili 游戏 Wiki · 物品图鉴</a>：少量物品掉落口径交叉校验。</li>
              <li><a href="https://endfield.wiki.gg/wiki/Energy_Alluvium" target="_blank" rel="noreferrer">wiki.gg · Energy Alluvium</a>：淤积点地图、刷怪阵容与数量。</li>
              <li>wiki.gg 物品页：<a href="https://endfield.wiki.gg/wiki/Blightshade_Bezoar" target="_blank" rel="noreferrer">影兽衔石</a>、<a href="https://endfield.wiki.gg/wiki/Shadow_Dew" target="_blank" rel="noreferrer">残影露滴</a>、<a href="https://endfield.wiki.gg/wiki/Glaive_Fragment" target="_blank" rel="noreferrer">破阵刀碎片</a>、<a href="https://endfield.wiki.gg/wiki/Tender_Moss" target="_blank" rel="noreferrer">柔嫩苔藓</a>、<a href="https://endfield.wiki.gg/wiki/Slug_Sprig" target="_blank" rel="noreferrer">虫角嫩枝</a>。</li>
              <li>角色立绘：<a href="https://endfield.wiki.gg/wiki/Gilberta" target="_blank" rel="noreferrer">Gilberta</a>、<a href="https://endfield.wiki.gg/wiki/Tangtang" target="_blank" rel="noreferrer">唐唐</a>、<a href="https://endfield.wiki.gg/wiki/Avywenna" target="_blank" rel="noreferrer">Avywenna</a>（wiki.gg）。</li>
              <li><a href="https://wiki.biligame.com/zmd/%E6%95%8C%E5%AF%B9%E5%9B%BE%E9%89%B4" target="_blank" rel="noreferrer">Bilibili 游戏 Wiki · 敌对图鉴</a>：少量敌人分布区域交叉校验。</li>
            </ul>
            <p className="copyright-note">游戏数据与图片版权归鹰角网络 / Gryphline 所有。本页面仅作个人整理与查询使用。</p>
        </dialog>
      )}

      <div className="summary" aria-label="收录概览">
        <div><strong>{data.items.length}</strong><span>手册物品</span></div>
        <div><strong>{areas.length}</strong><span>来源区域</span></div>
        <div><strong>{data.enemyCount}</strong><span>敌人映射</span></div>
      </div>

      {data.missing.length > 0 && (
        <div className="notice">未匹配：{data.missing.join('、')}</div>
      )}

      <main>
        <section className="browse-panel" aria-labelledby="materials-title">
          <div className="section-heading">
            <h2 id="materials-title"><span className="index-label" aria-hidden="true">02 /</span> 材料索引</h2>
            <span className="count" role="status" aria-live="polite">显示 <strong>{filtered.length}</strong> / {data.items.length} 项</span>
          </div>
          <div className="filters" role="search" aria-label="筛选材料">
            <label className="search-field">
              <span className="control-label">关键词查询</span>
              <span className="search-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
                <input type="search" placeholder="搜物品 / 怪物 / 地区 / 获取途径…" value={search} onChange={e => setSearch(e.target.value)} />
              </span>
            </label>
            <label>
              <span className="control-label">稀有度</span>
              <select value={rarity} onChange={e => setRarity(Number(e.target.value))}>
                <option value={0}>全部星级</option>
                {[1,2,3,4,5,6].map(r => <option key={r} value={r}>{STARS.repeat(r)}</option>)}
              </select>
            </label>
            <label>
              <span className="control-label">获取来源</span>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                <option value="all">全部来源</option>
                <option value="source">有来源区域</option>
                <option value="gather">采集/种植</option>
              </select>
            </label>
          </div>
          <div className="area-index">
            {[
              { title: '淤积点', alluvium: true },
              { title: '大地图', alluvium: false },
            ].map(group => (
              <div className="area-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="area-tags">
                  {areas.filter(area => area.startsWith(ALLUVIUM_PREFIX) === group.alluvium).map(area => (
                    <button key={area} className={search === area ? 'active' : undefined} aria-pressed={search === area} title={area} onClick={() => setSearch(search === area ? '' : area)}>
                      {group.alluvium ? area.slice(ALLUVIUM_PREFIX.length) : area}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {hasFilters && <div className="filter-actions"><span>已启用筛选{areas.includes(search) ? ` · ${search}` : ''}</span><button className="reset-button" onClick={resetFilters}>清除筛选 <span aria-hidden="true">×</span></button></div>}
        </section>

        <div className="cards-grid">
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
        {filtered.length === 0 && <div className="empty-state"><h3>未找到匹配材料</h3><p>试试其他物品、怪物或地区名称，或清除筛选重新查看。</p><button className="reset-button" onClick={resetFilters}>清除筛选</button></div>}
      </main>
      <footer className="footer"><span>终末地 / MATERIAL FIELD GUIDE</span><span>非官方整理 · 游戏数据与图片版权归鹰角网络 / Gryphline 所有</span></footer>
    </div>
  )
}
