# Learnings
## [LRN-20260430-001] correction

**Logged**: 2026-04-30T08:12:00Z
**Priority**: high
**Status**: pending
**Area**: data

### Summary
Do not conflate Endfield overworld map names with Severe Energy Alluvium challenge areas.

### Details
Soda corrected that `map01_lv005` / `map02_lv002` are large map names. `重度能量淤积点 - <地图名>` is a separate challenge area inside that map. A monster can appear in the overworld map via AKEDatabase `SpawnerConfig`, and independently appear or not appear inside the Energy Alluvium challenge via wiki.gg Operational Manual. These are separate scopes and must be modeled/displayed separately.

### Suggested Action
Keep `mapSourceSummary` (AKEDatabase SpawnerConfig) separate from `alluviumSourceSummary` (wiki.gg Energy Alluvium table). Never add the `重度能量淤积点 -` prefix to plain overworld map labels.

### Metadata
- Source: user_feedback
- Related Files: scripts/extract.mjs, src/App.tsx, src/types.ts, README.md
- Tags: endfield, data-modeling, scope-separation

---
