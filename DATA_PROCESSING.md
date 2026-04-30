# 数据处理说明

这个页面用于整理《明日方舟：终末地》简制手册截图里的材料来源。

## 目标

- 只展示截图中出现的简制手册条目。
- 页面本身使用静态 JSON，不在浏览器里动态请求外部 wiki 或 API。
- 数据更新时先更新本地缓存，再重新执行抽取脚本。

## 数据来源与 Credits

实际使用的数据来源：

1. **AKEDatabase**
   - GitHub: https://github.com/nagiyume/AKEDatabase
   - 本地缓存路径：`../AKEDatabase/`
   - 用途：物品基础信息、物品图标、敌人名称、掉落怪 ID、SpawnerConfig 地图刷怪配置。
   - Credit: 数据与静态资源整理来自 AKEDatabase 项目；游戏数据与图片版权归鹰角网络 / Gryphline 所有。

2. **Bilibili 游戏 Wiki（明日方舟终末地 WIKI_BWIKI）**
   - 物品图鉴：https://wiki.biligame.com/zmd/物品图鉴
   - 敌对图鉴：https://wiki.biligame.com/zmd/敌对图鉴
   - 用途：少量交叉校验物品掉落口径、敌人分布区域。
   - Credit: 感谢 Bilibili 游戏 Wiki 社区维护的数据。

3. **人工备注**
   - 文件：`../location-notes.json`
   - 用途：补充 AKEDatabase 中未直接展开的地图编号中文名，以及少量截图/OCR 校正。

## 抽取流程

执行：

```bash
npm run extract
```

脚本：`scripts/extract.mjs`

流程：

1. 读取 `MANUAL_ITEM_NAMES`，只保留截图里的 39 个手册条目。
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
5. 从 `AKEDatabase/public/Json/SpawnerConfig/**/sc_*.json` 读取大地图刷怪配置：
   - 只保留 `mapXX_lvXXX` 形式的大地图目录。
   - 过滤测试图、活动副本、独立副本图。
   - 过滤 `location-notes.json` 中标记为 `not_released_yet` 的地图。
   - 不使用 `settings.forbidDrop` 过滤；该字段和实际掉落口径存在歧义。
6. 将物品掉落怪与地图刷怪配置聚合，生成「出现地图」。
7. 写出 `public/data/items.json`。

## 页面展示逻辑

- 卡片顺序：按截图从上到下、从左到右排列。
- 每个物品展示：
  - icon
  - 名称
  - 星级
  - 物品 ID
  - `description` + `obtainWays.desc` 合并后的描述文本
  - 出现地图与对应敌人
- 若没有地图来源，只展示掉落怪并标为地图待补。

## 已知人工校正

截图/OCR 容易误读的名字已按 AKEDatabase 校正：

- 清淡竹铃 → 清波竹铃
- 蓬草锦草 → 蓬茸锦草
- 荧壳虫 → 萤壳虫
- 虎兽的长绒 → 彪兽的长绒
- 齿眼柑实 → 黯银柑实

地图编号补充：

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

`彪兽的长绒` 当前在本地 SpawnerConfig 中只在未开放地图或副本配置里出现。交叉检索玩家攻略后，暂时手工补充：

- 武陵城 · 岸边石窟
- 百眼彪兽 / 怒目彪兽

该 override 写在 `scripts/extract.mjs` 的 `MANUAL_SOURCE_OVERRIDES` 中，后续若 AKEDatabase 数据补全，应优先改回结构化来源。
