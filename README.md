# 终末地 · 简制手册来源表

一个用于整理《明日方舟：终末地》简制手册材料来源的静态页面，支持查询终末地素材、材料刷取、掉落怪、重度能量淤积点、大地图刷新与采集来源。

自制项目，快速查询简制手册的奖励需求与淤积点掉落以方便挂机，参考挂机视频：https://www.bilibili.com/video/BV1xhd5B9EFd

大地图采集和怪物分布参考：https://opendfieldmap.org/

## 视觉设计与图片来源

- 页面为**非官方材料查询手册**，视觉参考 [《明日方舟：终末地》官网](https://endfield.gryphline.com/en-us#home) 的亮黄 `#fffa00`、黑色主视觉、浅灰分区、技术细线和方形控件，不代表官方制作或背书。
- 首页主视觉：[祀 / Si Splash Art](https://endfield.wiki.gg/wiki/File:Si_Splash_Art.png)，使用本地压缩副本 `public/official-inspired/si-splash.webp`（1600 × 1600，747,224 字节）。桌面图文分栏，手机纵向排列，完整展示立绘。
- 页面仅加载本地图像，未引入远程字体、视频或新依赖。图片原始来源与版权说明见 [SOURCES.md](public/official-inspired/SOURCES.md)。
- 桌面左侧导航与移动端顶部导航提供概览、材料索引、工具 / Wiki 和数据说明入口；保留关键词、星级、来源与可切换区域筛选、清除筛选、空结果提示及原生数据说明弹窗。
- 常驻「实用工具与 Wiki」模块提供 [Open Endfield Map](https://opendfieldmap.org/)、[CEP 终末地规划器](https://end.canmoe.com/zh-CN)、[超级玩家](https://ef.exgamer.top/)、[MaaEnd](https://maaend.com/)，以及 wiki.gg、BWIKI、AKEDatabase 与具体参考条目。
- 游戏数据与图片 © 鹰角网络 / Gryphline。官网视觉参考不构成图片授权声明。

## 使用方法

```bash
npm install
npm run extract   # 从本地 AKEDatabase 提取简制手册条目
npm run dev       # 启动本地预览 (Vite)
npm run build     # 构建静态文件到 dist/
npm run deploy    # 本地抽取 / 构建，更新 gh-pages 后排队 Pages 工作流
```

### GitHub Pages 发布

- 一次性前置条件：将 `.github/workflows/pages.yml` 提交并推送到 `main`，由维护者将仓库 Pages 的 Source 从分支发布切换为 **GitHub Actions**，并预先确认 `github-pages` environment 的部署分支策略允许 `main`（工作流从 `main` 调度，站点内容取自 `gh-pages`）。
- 本地需要现有 Node/npm 构建环境、推送 `gh-pages` 的 Git 权限，以及已安装并通过 `gh auth login` 登录、具备工作流调度权限的 GitHub CLI（`gh`）。
- `npm run deploy` 依次执行 `npm run extract`、`npm run build`、`gh-pages -d dist`，最后执行 `gh workflow run pages.yml --ref main`。保留本地构建与 `gh-pages` 预构建产物分支，不在 CI 中安装依赖或重新构建。
- 工作流仅支持 `workflow_dispatch`，且只在 `main` 上运行；仅 push `main` 或更新 `gh-pages` 不会自动部署（须先完成上述 Pages Source 切换）。工作流检出 `gh-pages` 到 `site/`，上传并部署；使用 Node24 兼容的 checkout / upload-pages-artifact / deploy-pages，无警告屏蔽或运行时环境覆盖。
- 命令成功只表示工作流已排队，不代表站点已发布。用 `gh run list --workflow pages.yml --branch main --event workflow_dispatch --limit 5` 找到本次 run ID，再执行 `gh run watch <run-id> --exit-status` 检查最终结果；必要时用 `gh run view <run-id> --log-failed` 查看失败日志。若调度失败，修复权限或配置后可直接重新执行调度命令，无需重复构建。


## 数据处理目标

- 展示当前版本整理的简制手册物品。
- 页面运行时使用静态 JSON，不在浏览器里动态请求外部 wiki 或 API。
- 数据更新时维护已核验的本地缓存与 wiki fallback，再重新执行抽取脚本；不要盲目拉取 AKEDatabase 上游。
- 卡片顺序按当前整理清单排列。

## 数据来源与 Credits

实际使用的数据来源：

1. **AKEDatabase**
   - GitHub: https://github.com/nagiyume/AKEDatabase
   - 本地缓存路径：`../AKEDatabase/`，保持固定在 `597c2492`。已知最新上游 `d1b571cb` 切换加载器后移除了 `CH/item`、`CH/enemy`、`Json` 与图片目录，直接拉取会破坏现有抽取流程；新版本缺口继续维护 wiki fallback，待适配加载器后再升级缓存。
   - 用途：物品基础信息、物品图标、敌人名称、掉落怪 ID、大地图 SpawnerConfig 刷新来源。
   - Credit: 数据与静态资源整理来自 AKEDatabase 项目；游戏数据与图片版权归鹰角网络 / Gryphline 所有。

2. **wiki.gg · Energy Alluvium / 物品与敌人页**
   - 淤积点页面：https://endfield.wiki.gg/wiki/Energy_Alluvium
   - 物品页：`Blightshade_Bezoar`、`Shadow_Dew`、`Glaive_Fragment`、[Tender Moss / 柔嫩苔藓](https://endfield.wiki.gg/wiki/Tender_Moss)、[Slug Sprig / 虫角嫩枝](https://endfield.wiki.gg/wiki/Slug_Sprig)
   - 十月手册表：[Crafting/Crafting Manual](https://endfield.wiki.gg/wiki/Crafting/Crafting_Manual)；新增物品：[Ink Droplet / 小墨团](https://endfield.wiki.gg/wiki/Ink_Droplet)、[Calamity's Raindew / 降劫雨露](https://endfield.wiki.gg/wiki/Calamity%27s_Raindew)、[Edified Jade Orb / 敕律玉球](https://endfield.wiki.gg/wiki/Edified_Jade_Orb)。敌人页 URL 与原图 URL、SHA-256、核验时间逐项记录于 `wiki-item-notes.json`。
   - 九月敌人与地图页：[Woodcraft Wanderer](https://endfield.wiki.gg/wiki/Woodcraft_Wanderer)、[Woodcraft Slug](https://endfield.wiki.gg/wiki/Woodcraft_Slug)、[Snowy Forest](https://endfield.wiki.gg/wiki/Snowy_Forest)
   - 本地缓存：`energy-alluvium-notes.json`、`wiki-item-notes.json`
   - 用途：淤积点阵容/数量，以及固定 AKEDatabase 缓存尚未收录的新版本物品、图标、掉落怪和 ID。
   - 注：页面静态生成，不在浏览器运行时请求 wiki；wiki 标为 TBA / N 的数量保留为未知。
   - Credit: 感谢 wiki.gg 社区维护的数据（CC BY-SA 4.0）。

3. **OpenDField Map**
   - 页面：https://opendfieldmap.org/
   - 用途：大地图采集点与怪物分布的外部参考入口；页面 header 中提供直达链接。
   - Credit: 感谢 OpenDField Map 维护者整理的大地图数据。

4. **Bilibili 游戏 Wiki（明日方舟终末地 WIKI_BWIKI）**
   - 物品图鉴：https://wiki.biligame.com/zmd/物品图鉴
   - 敌对图鉴：https://wiki.biligame.com/zmd/敌对图鉴
   - 用途：少量交叉校验物品掉落口径、敌人分布区域。
   - Credit: 感谢 Bilibili 游戏 Wiki 社区维护的数据。

5. **人工备注**
   - 文件：`location-notes.json`
   - 用途：补充 AKEDatabase 中未直接展开的地图编号中文名，以及少量手工来源。

## 抽取流程

执行：

```bash
npm run extract
```

脚本：`scripts/extract.mjs`

流程：

1. 读取 `MANUAL_ITEM_NAMES`，生成当前版本整理的简制手册物品。
2. 从 `AKEDatabase/public/CH/item/*.json` 读取物品：
   - `id`
   - `name`
   - `rarity`
   - `type`
   - `description`
   - `obtainWays.desc`
   - `droppedBy`
   - `icon`
3. 复制物品图标到 `public/icons/`，避免页面直接引用整个 AKEDatabase 图片目录。
4. 从 `AKEDatabase/public/CH/enemy/*.json` 建立敌人 ID → 中文名映射。
5. 读取 `energy-alluvium-notes.json` 中整理的 wiki.gg Energy Alluvium 表，以及有明确淤积点位置证据的敌人页补充（旧水坝完整阵容未确认）。
6. 对 AKEDatabase 尚未收录的新物品，读取 `wiki-item-notes.json` 中的 wiki.gg 物品/敌人数据作为构建期 fallback。
7. 将物品掉落怪分别与两类 scope 聚合：
   - 大地图刷新：AKEDatabase `SpawnerConfig`，表示怪物在某个大地图内出现。
   - 淤积点来源：wiki.gg Energy Alluvium 表或明确标注淤积点的敌人页。数据保留 `rosterCompleteness: "partial"` 与来源备注；页面只展示已知地点、敌人和数量，未知数量显示 `×?`。
   - 手工采集来源：物品页确认的采集区域写入 `manualSourceGroups`，沿用 `manualSourceSummary` 展示与区域检索；不伪造掉落怪或 SpawnerConfig。
8. 写出 `public/data/items.json`。

## 页面展示逻辑

每个物品展示：

- icon
- 名称
- 星级
- 物品 ID
- `description` + `obtainWays.desc` 合并后的描述文本
- 淤积点来源与对应敌人数量
- 大地图刷新来源与对应敌人等级
- 数据说明弹窗内的淤积点地图与刷怪比对表（来自 Energy Alluvium 表与手工补充）

这两个 scope 分开展示：`源石研究园` 是大地图，`重度能量淤积点 - 源石研究园` 是该大地图里的淤积点挑战区域。若两类来源都没有，只展示掉落怪并标为淤积点待补。

## 地图编号补充

- `map01_lv001` = 枢纽区
- `map01_lv002` = 谷地通道
- `map01_lv003` = 阿伯莉采石场
- `map01_lv005` = 源石研究园
- `map01_lv006` = 矿脉源区
- `map01_lv007` = 供能高地
- `map02_lv001` = 景玉谷
- `map02_lv002` = 武陵城
- `map02_lv003` = 清波寨
- `map02_lv004` = 首墩 / Marker Stone
- `map02_lv005` = 试验园区 / Test Area
- `map02_lv006` = 藏剑谷 / Sword Vault Dale
- `wiki:yinglung_pass` = 应龙关 / Yinglung Pass
- `wiki:north_wuling_ez` = 北部禁区 / North Wuling EZ
- `wiki:snowy_forest` = 雪松林 / Snowy Forest
- `wiki:sis_painting` = 祀的画 / Si's Painting（中文名由用户于 2026-10-23 明确确认；游戏地图编号仍待核验）
- `wiki:old_dam` = 旧水坝 / Old Dam（武陵；游戏地图编号未知）
- 以上 `wiki:` 均仅为本地分组键，不是游戏 mapId；数据说明显示「地图编号待核验」。十月复核移除了此前未经证实的 `map02_lv007` / `map02_lv008` 暂定编号。

## 手工补充

`energy-alluvium-notes.json` 保留 wiki.gg Energy Alluvium 总表的 13 行；另以四个敌人页明确的淤积点位置补充第 14 个本地分组旧水坝（不是总表新增行）。手工部分记录中文名、本地分组键与来源说明，不用大地图 SpawnerConfig 或普通地图分布数量推断淤积点组成。

- `map02_lv004` 首墩 / Marker Stone：wiki.gg 正式数量。
- `map02_lv005` 试验园区 / Test Area：wiki.gg 正式数量；中文名和 mapId 由 AKEDatabase / Soda 截图确认。
- `map02_lv006` 藏剑谷 / Sword Vault Dale：wiki.gg 正式数量；mapId 由 AKEDatabase `activity_map02_guide_006` / `distribution_map02_lv006` 确认。

新增简制手册物品：百年陈皮、尾尖金甲、影兽衔石（用户原称「影兽衍石」）、残影露滴、破阵刀碎片。

- 百年陈皮：AKEDatabase 与 wiki.gg 均确认掉落怪为山犼兽；当前 wiki.gg Energy Alluvium 的藏剑谷行确认数量为 12，数据完整。
- 影兽衔石：wiki.gg 简中名为「影兽衔石」，掉落怪为蚀影牙兽、蚀影球刺兽、蚀影彪兽。
- 残影露滴：掉落怪为蚀影应龙前锋、蚀影应龙尖兵。
- 破阵刀碎片：掉落怪为蚀影应龙破阵手、蚀影应龙队长。
- 应龙关：wiki.gg 已给出五种敌人的精确数量，标为已核验。
- 北部禁区：十月 wiki.gg 已补齐五种敌人的数量，依次为 12/9/6/1/1。
- 未知地图编号统一使用 `wiki:` 分组键，不用猜测的游戏 mapId。

## 2026-09-06 更新与复核（历史快照）

- 在原 45 项之后追加柔嫩苔藓、虫角嫩枝，共 47 项。前者由徘徊树傀掉落，用于仓储节点装箱运送；后者由虫体树傀掉落，用于精制食药制作。
- 两张图标直接下载自 wiki.gg 原图，保存在 `public/icons/item_drop_babyents_1.png`、`public/icons/item_drop_slwood_1.png`；来源 URL 和核验日期记录于 `wiki-item-notes.json`。
- 通过 MediaWiki parse API 核验全量 Energy Alluvium 表，共 12 行；原 11 行敌人与数量不变，应龙关仍为 8/2/1/6/6，北部禁区仍为五项 TBA。
- 新增武陵雪松林（中文名由用户提供）：潜地虬兽、酸液源石虫、酸液源石虫·α、徘徊树傀、虫体树傀，五项数量全部保留 `null` / `×?`。虬兽的须、虫肉通过敌人匹配自动获得该淤积点来源。
- 普通雪松林分布只在获取描述中注明 wiki 证据；没有新敌人的 SpawnerConfig 点位、数量或等级证据，不生成大地图刷新数据。不新增奖励状态功能。

更新清单、wiki 备注与真实图标后运行（无需新增依赖）：

```bash
npm run extract
node scripts/check-november.mjs  # 当前快照，基线 6769780；九月/十月检查含历史固定数量，不适用于十一月数据
npm run build
./node_modules/.bin/tsc --noEmit
```

复核页面后才执行 `npm run deploy` 发布；仅 push main 不会部署。

## 2026-10-23 更新与复核（历史快照）

- 保留原 47 项及顺序，追加小墨团（1 星，存禄 / 用奇）、降劫雨露（2 星，解燥）、敕律玉球（4 星，行度），共 50 项。三项均由 wiki.gg 简制手册表确认，里程碑均为 1/10/50；前两项另有用户截图确认。不新增奖励进度功能。
- 三张图标为 wiki.gg 原始 PNG，保存在 `public/icons/item_drop_ink{biter,kirin,lion}_1.png`。物品、敌人中文名来自 wiki `cnname`，获取说明是来源摘要，不冒充官方中文原文。
- 全量 Energy Alluvium 表 13 行：原前 10 行阵容与数量不变；北部禁区更新为 12/9/6/1/1，雪松林为 2/4/4/3/16。新增祀的画 / Si's Painting（中文名由用户明确确认）：存禄、用奇、解燥数量均为 `N`（保存 `null`，显示 `×?`），行度为 1。
- 新地图与四种敌人页均有独立淤积点证据，不从普通地图分布推断阵容；缺少 SpawnerConfig 证据，三项不生成大地图刷新点位、等级或数量。
- `node scripts/check-october.mjs [证据目录]` 检查原 47 项保留、全量阵容/数量、未知编号、掉落与图标哈希；提供本次缓存目录时，额外逐项比对原始 API wikitext。原始任务证据与报告保留在维护者本地，不随站点发布。核验日期按 Asia/Shanghai（UTC 抓取时间为 2026-10-22）。

## 2026-11-26 更新与复核（Asia/Shanghai）

- 原 50 项 ID 与顺序保留，末尾仅追加 **健谈的蘑菇、菌王之尘、异彩菌块**，共 **53 项**。三项手册收录与里程碑来自**用户游戏截图/2026-11-26**，不是尚未更新的 wiki 手册总表。未扩展奖励清单；未添加其他未经批准的新条目。
- 物品名、filename、稀有度、获取用途来自 wiki.gg 物品 `?action=raw` 模板；敌人名、filename、掉落和地点来自敌人模板。缓存抽取中的 `\_` 是 Markdown 转义，实际 ID 使用 `_`。描述为来源摘要，不冒充官方中文原文。
- [旧水坝 / Old Dam](https://endfield.wiki.gg/wiki/Old_Dam?action=raw) 属武陵；英文名交叉核验 [官方英文指南](https://x.com/AKEndfield/status/2124352177325949278)，中文名来自 [机核前瞻报道](https://www.gcores.com/articles/222631) 与 [官方指南转载](https://www.233leyuan.com/post-detail/2124681708271755264)（后者是第三方转载，不冒充官方直发）。使用 `wiki:old_dam`，不猜游戏 mapId。

| 新物品（wiki 原始模板） | 稀有度 | 获取与用途 | 截图里程碑 |
|---|---|---|---|
| [健谈的蘑菇 / Loquacious Shroom](https://endfield.wiki.gg/wiki/Loquacious_Shroom?action=raw) | 1 | 旧水坝采集，制作蜂蜜华夫饼；不是敌人掉落 | 1/50/100 |
| [菌王之尘 / Fungal King's Dust](https://endfield.wiki.gg/wiki/Fungal_King%27s_Dust?action=raw) | 4 | 储菌、碾菇虬兽概率掉落，精制食药 | 1/10/50 |
| [异彩菌块 / Shiny Mycelial Mass](https://endfield.wiki.gg/wiki/Shiny_Mycelial_Mass?action=raw) | 4 | 碾菇破城者、碾菇先锋概率掉落，装箱运送 | 1/10/50 |

### 淤积点与采集证据边界

- 本次缓存的 [Energy Alluvium 原始总表](https://endfield.wiki.gg/wiki/Energy_Alluvium?action=raw) 仍有 **13 行**。逐行比对后，前 12 行全部不变；祀的画的存禄、用奇、解燥从 `N/N/N` 更新为 **12/12/3**，行度仍为 **1**。这是原 50 项唯一数据变化（对应卡片计数及两项原「数量待补」描述同步修正）。保留此前核验记录，新核验另记于备注。
- 旧水坝是第 **14 个本地分组**，仅由 [储菌](https://endfield.wiki.gg/wiki/Bolete_Prince?action=raw)、[碾菇虬兽](https://endfield.wiki.gg/wiki/Shroomkrusher_Nidwyrm?action=raw)、[碾菇破城者](https://endfield.wiki.gg/wiki/Shroomkrusher_Sporeknuckles?action=raw)、[碾菇先锋](https://endfield.wiki.gg/wiki/Shroomkrusher_Sporeguard?action=raw) 四个敌人页的 `Energy Alluvium: Old Dam` 位置证据支持。**已确认部分敌人，完整阵容及数量待核验**；四项数量全部 `null` / `×?`。总表没有旧水坝行，独立淤积点页尚缺失，不能宣称四种敌人就是完整阵容。
- 来源与完整性说明保留在数据备注中；材料卡片和弹窗采用简洁展示，列出已知地点、敌人及数量，后续版本再补齐缺口。普通地图分布与淤积点位置分别举证，不补造刷新点、等级或计数。
- 健谈的蘑菇用已有手工来源路径记录旧水坝采集区域及物品页链接，敌人列表为空，可按区域与「采集/种植」筛选。wiki 分类为 **Naturals**；项目 `type:8` 沿用固定缓存中锦草等植物的本地表示，并非本次取得了新物品的游戏枚举证据。
- 未知：旧水坝游戏 mapId、完整淤积点阵容及数量、首档配方的未核验名称、异彩菌块被截图遮挡的首档奖励数量。不猜补、不新增奖励进度功能。

### 三张真实图标

图标来自 **EndfieldTools 对应物品页引用的原始 PNG**（254×254），不是 wiki File 页（本次返回 404），未生成或借用图标。实际下载 URL 与 SHA-256 同时记于 `wiki-item-notes.json`，本地文件为 `public/icons/<物品ID>.png`。游戏图片版权仍归原权利人。

| 实际原图 URL（文件名即物品 ID） | SHA-256 |
|---|---|
| [item_plant_grass_spmushroom_1.png](https://endfieldtools.dev/assets/images/endfield/itemiconbig/item_plant_grass_spmushroom_1.png) | `089e280aae4eda2c224117ff962cf25ed4b36c895588013edc6584e0d044d8ca` |
| [item_drop_mushbug_1.png](https://endfieldtools.dev/assets/images/endfield/itemiconbig/item_drop_mushbug_1.png) | `425e4a458ed4c2c509f4e75ec1eae84b69d8519e3e44b25c62ed8394ccba7b7c` |
| [item_drop_mushro_1.png](https://endfieldtools.dev/assets/images/endfield/itemiconbig/item_drop_mushro_1.png) | `3449404fcf6e2dce31137d993f1ad5f85feaa6d1c5c23ab24e662f9d6eb87903` |

复核命令（不需要新依赖、不更新固定 AKEDatabase 缓存）：

```bash
npm run extract
node scripts/check-november.mjs /path/to/local-evidence
npm run build
./node_modules/.bin/tsc --noEmit
```

新检查以 `6769780` 为基线验证原 50 项仅有上述明确变化、53 个唯一 ID/PNG、三张图标哈希、手工采集与掉落/刷怪 scope 分离、14 个本地淤积点分组与四个未知计数；传入本地证据目录时，额外逐行比对全部 13 行原始表、三物品与四敌人模板及实际图标 URL。证据目录包含本次 `research-raw.json`、`research-raw-enemies.json`、`research-final-evidence.json`、`research-item-crosscheck.json`，不传目录则明确跳过原始证据比对。原始研究日志及用户截图不随站点发布。
