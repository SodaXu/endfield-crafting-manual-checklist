# 终末地 · 简制手册来源表

一个用于整理《明日方舟：终末地》简制手册材料来源的静态页面。

自制项目，快速查询简制手册的奖励需求与淤积点掉落以方便挂机，参考挂机视频：https://www.bilibili.com/video/BV1xhd5B9EFd

## 使用方法

```bash
npm install
npm run extract   # 从本地 AKEDatabase 提取简制手册条目
npm run dev       # 启动本地预览 (Vite)
npm run build     # 构建静态文件到 dist/
npm run deploy    # 发布到 GitHub Pages
```

## 数据处理目标

- 展示当前版本整理的简制手册物品。
- 页面运行时使用静态 JSON，不在浏览器里动态请求外部 wiki 或 API。
- 数据更新时先更新本地缓存，再重新执行抽取脚本。
- 卡片顺序按当前整理清单排列。

## 数据来源与 Credits

实际使用的数据来源：

1. **AKEDatabase**
   - GitHub: https://github.com/nagiyume/AKEDatabase
   - 本地缓存路径：`../AKEDatabase/`
   - 用途：物品基础信息、物品图标、敌人名称、掉落怪 ID、大地图 SpawnerConfig 刷新来源。
   - Credit: 数据与静态资源整理来自 AKEDatabase 项目；游戏数据与图片版权归鹰角网络 / Gryphline 所有。

2. **wiki.gg · Operational Manual / Energy Alluvium**
   - 页面：https://endfield.wiki.gg/wiki/Operational_Manual#Energy_Alluvium
   - 本地备注文件：`energy-alluvium-notes.json`
   - 用途：淤积点区域与刷怪对比表，是页面「淤积点来源」的主要依据；不要与同名大地图刷新混用。
   - 注：wiki.gg 表暂缺「首墩」；该行由 Soda 游戏内手动补充，数量未知时显示 `×?`。
   - Credit: 感谢 wiki.gg 社区维护的数据。

3. **Bilibili 游戏 Wiki（明日方舟终末地 WIKI_BWIKI）**
   - 物品图鉴：https://wiki.biligame.com/zmd/物品图鉴
   - 敌对图鉴：https://wiki.biligame.com/zmd/敌对图鉴
   - 用途：少量交叉校验物品掉落口径、敌人分布区域。
   - Credit: 感谢 Bilibili 游戏 Wiki 社区维护的数据。

4. **人工备注**
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
5. 读取 `energy-alluvium-notes.json` 中整理的 wiki.gg Energy Alluvium 表。
6. 将物品掉落怪分别与两类 scope 聚合：
   - 大地图刷新：AKEDatabase `SpawnerConfig`，表示怪物在某个大地图内出现。
   - 淤积点来源：wiki.gg Energy Alluvium 表，表示怪物在该大地图内的重度能量淤积点挑战中出现。
7. 写出 `public/data/items.json`。

## 页面展示逻辑

每个物品展示：

- icon
- 名称
- 星级
- 物品 ID
- `description` + `obtainWays.desc` 合并后的描述文本
- 淤积点来源与对应敌人数量
- 大地图刷新来源与对应敌人等级

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
- `map02_lv004` = 首墩
- `map02_lv005` = 未开放

## 特殊 override

`彪兽的长绒` 当前在 Energy Alluvium 表中没有对应淤积点来源。交叉检索玩家攻略后，暂时手工补充：

- 武陵城 · 岸边石窟
- 百眼彪兽 / 怒目彪兽

该 override 写在 `scripts/extract.mjs` 的 `MANUAL_SOURCE_OVERRIDES` 中。后续若 AKEDatabase 数据补全，应优先改回结构化来源。
