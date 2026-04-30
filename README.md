# 终末地 · 简制手册来源表

本项目是一个本地静态预览页，只展示 Soda 截图里《简制手册》出现的物品，不做全量物品库。

## 使用方法

```bash
npm install
npm run extract   # 从本地 AKEDatabase 提取简制手册条目
npm run dev       # 启动本地预览 (Vite)
npm run build     # 构建静态文件到 dist/
```

## 数据范围

- 仅包含 `scripts/extract.mjs` 里的 `MANUAL_ITEM_NAMES`
- 物品顺序按 Soda 截图从上到下、从左到右排列
- 来源全部来自本地缓存：`../AKEDatabase/`
- 不访问 wiki.gg / Warfarin / 其他线上 API

## 数据来源

- 物品数据：`../AKEDatabase/public/CH/item/*.json`
- 敌人名称：`../AKEDatabase/public/CH/enemy/*.json`
- 刷怪配置：`../AKEDatabase/public/Json/SpawnerConfig/**/sc_*.json`
- 地图备注：`../location-notes.json`

## 页面展示逻辑

- 优先展示「出现地图」：物品掉落怪 → SpawnerConfig 大地图配置 → 地区聚合
- 不使用 `forbidDrop` 字段过滤，因为它和实际物品掉落口径存在歧义；只过滤测试图、活动副本、未开放地图
- 如果只有掉落怪但没有可用地图，显示「掉落怪（地图待补）」
- 采集/种植类物品展示 `obtainWays` 文本
- 不编造地图；缺失数据只标缺口

## 已知校正

截图/OCR 容易误读的名字已按 AKEDatabase 校正：

- 清淡竹铃 → 清波竹铃
- 蓬草锦草 → 蓬茸锦草
- 荧壳虫 → 萤壳虫
- 虎兽的长绒 → 彪兽的长绒
- 齿眼柑实 → 黯银柑实
