# 终末地 · 简制手册来源表

一个用于整理《明日方舟：终末地》简制手册材料来源的静态页面，支持查询终末地素材、材料刷取、掉落怪、重度能量淤积点、大地图刷新与采集来源。

自制项目，快速查询简制手册的奖励需求与淤积点掉落以方便挂机，参考挂机视频：https://www.bilibili.com/video/BV1xhd5B9EFd

大地图采集和怪物分布参考：https://opendfieldmap.cn/

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

2. **wiki.gg · Energy Alluvium / 物品与敌人页**
   - 淤积点页面：https://endfield.wiki.gg/wiki/Energy_Alluvium
   - 物品页：`Blightshade_Bezoar`、`Shadow_Dew`、`Glaive_Fragment`
   - 本地缓存：`energy-alluvium-notes.json`、`wiki-item-notes.json`
   - 用途：淤积点阵容/数量，以及 AKEDatabase 尚未收录的《向渊行》物品、掉落怪和 ID。
   - 注：页面静态生成，不在浏览器运行时请求 wiki；wiki 标为 TBA 的数量保留为未知。
   - Credit: 感谢 wiki.gg 社区维护的数据（CC BY-SA 4.0）。

3. **OpenDField Map**
   - 页面：https://opendfieldmap.cn/
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
5. 读取 `energy-alluvium-notes.json` 中整理的 wiki.gg Energy Alluvium 表。
6. 对 AKEDatabase 尚未收录的新物品，读取 `wiki-item-notes.json` 中的 wiki.gg 物品/敌人数据作为构建期 fallback。
7. 将物品掉落怪分别与两类 scope 聚合：
   - 大地图刷新：AKEDatabase `SpawnerConfig`，表示怪物在某个大地图内出现。
   - 淤积点来源：wiki.gg Energy Alluvium 表，表示怪物在该大地图内的重度能量淤积点挑战中出现。
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
- `map02_lv007` = 应龙关（暂定 mapId，待 AKEDatabase 更新确认）
- `map02_lv008` = 北部禁区（暂定 mapId，待 AKEDatabase 更新确认）

## 手工补充

`energy-alluvium-notes.json` 当前按 wiki.gg Operational Manual / Energy Alluvium 的正式表维护；手工部分只补中文名、mapId 与来源说明，不用大地图 SpawnerConfig 推断淤积点组成。

- `map02_lv004` 首墩 / Marker Stone：wiki.gg 正式数量。
- `map02_lv005` 试验园区 / Test Area：wiki.gg 正式数量；中文名和 mapId 由 AKEDatabase / Soda 截图确认。
- `map02_lv006` 藏剑谷 / Sword Vault Dale：wiki.gg 正式数量；mapId 由 AKEDatabase `activity_map02_guide_006` / `distribution_map02_lv006` 确认。

新增简制手册物品：百年陈皮、尾尖金甲、影兽衔石（用户原称「影兽衍石」）、残影露滴、破阵刀碎片。

- 百年陈皮：AKEDatabase 与 wiki.gg 均确认掉落怪为山犼兽；当前 wiki.gg Energy Alluvium 的藏剑谷行确认数量为 12，数据完整。
- 影兽衔石：wiki.gg 简中名为「影兽衔石」，掉落怪为蚀影牙兽、蚀影球刺兽、蚀影彪兽。
- 残影露滴：掉落怪为蚀影应龙前锋、蚀影应龙尖兵。
- 破阵刀碎片：掉落怪为蚀影应龙破阵手、蚀影应龙队长。
- 应龙关：wiki.gg 已给出五种敌人的精确数量，标为已核验。
- 北部禁区：wiki.gg 已确认五种敌人，但数量仍全部标为 TBA；页面显示 `×?`，不作推断。
- `map02_lv007` / `map02_lv008` 仍是本地暂定映射，等待 AKEDatabase 更新确认。
