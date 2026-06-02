# Import and Export Parameters

本文档说明前端 JSON 导入导出、MAA `custom_infrast` 导入，以及 demo 路由 URL 参数。代码侧类型以 `src/domain/types.ts` 为准，导入入口为 `src/export/importJson.ts`。

## ScheduleDocument v2

导出的 JSON 根对象是 `ScheduleDocument`，核心字段如下：

| Field | Type | Description |
| --- | --- | --- |
| `version` | `2` | 文档版本号。当前导出固定为 `2`。 |
| `title` / `subtitle` / `authorText` | `string` | 海报标题、副标题和作者信息。 |
| `layoutId` | `string` | 基建布局，如 `153`、`243`、`252`、`333`、`342`。 |
| `queueCount` | `number` | 班次数量。当前 MAA 导入最多生成 `3` 个班次。 |
| `activeQueueId` | `string` | 编辑器当前选中的班次。海报矩阵会渲染全部班次。 |
| `posterTemplateId` | `auto \| matrix \| splitPanel \| card \| combo` | 海报模板请求值，缺省为自动选择。 |
| `posterMode` | `normal \| autoRotation \| dailyRotation \| combo` | 海报展示模式。 |
| `canvas.rooms` | `BentoRoomNode[]` | Bento 画布里的房间节点、房间类型、位置、槽位数和产物。 |
| `queues` | `ScheduleQueue[]` | 每个班次的房间分配、干员槽位、效率文本和备注。 |
| `posterCanvas` | `PosterCanvasState` | 可编辑海报组件画布。缺省时会按当前排班重新生成默认组件。 |
| `productionSummary` | `ProductionSummary` | 订单、赤金、作战记录、源石碎片等产出摘要。 |
| `droneSummary` | `DroneSummary` | 无人机启用状态、目标房间和说明文本。 |
| `notes` | `string[]` | 海报备注。 |
| `updatedAt` | `string` | ISO 时间字符串。 |

`posterCanvas.components` 支持 `infrastructure`、`laneLabel`、`metric`、`note`、`divider`。完整排班矩阵由带 `sectionId` 的 `infrastructure` section 渲染；手动拖入的单个房间使用 `roomNodeId` / `roomType`，渲染为 compact room card。

## JSON Import

`importScheduleJson(file, operators)` 接收以下结构：

| Input | Result |
| --- | --- |
| `ScheduleDocument v2` | 通过校验后直接导入；若包含旧版 `posterCanvas` 字段，会归一化为当前组件结构。 |
| legacy `ScheduleDocument v1` | 迁移为 v2 Bento canvas，再导入。 |
| MAA `custom_infrast` | 转换为 `ScheduleDocument v2`，并返回导入提示 `message`。 |

返回结构固定为：

```ts
interface ImportScheduleResult {
  document: ScheduleDocument;
  message?: string;
}
```

非法 JSON 结构会抛出错误：既不是 `ScheduleDocument v2/v1`，也不是 MAA `custom_infrast`。

## MAA Custom Infrast

MAA 导入入口为 `maaCustomInfrastToScheduleImport(value, operators)`，返回 `MaaImportReport`：

```ts
interface MaaImportReport {
  document: ScheduleDocument;
  unmatchedOperatorNames: string[];
  importedPlanCount: number;
  skippedPlanCount: number;
  dronePlanCount: number;
}
```

支持的 MAA 参数：

| Field | Description |
| --- | --- |
| `title` | 导入后作为 `document.title`。 |
| `author` | 导入后作为 `document.authorText`。 |
| `description` | 按换行拆分，最多写入 3 条 `notes`。 |
| `plans` | 班次数组，最多导入前 3 个 plan。 |
| `plans[].rooms` | 房间排班，支持 `control`、`trading`、`manufacture`、`power`、`meeting`、`hire`。 |
| `plans[].rooms[].operators` | 干员名称数组，按槽位顺序写入。 |
| `plans[].rooms[].product` | 产物。`LMD` 映射为 `Money`，`Pure Gold` 映射为 `PureGold`，`Battle Record` 映射为 `CombatRecord`，`Origin Stone` 映射为 `OriginStone`。 |
| `plans[].drones` | 无人机配置，写入 `droneSummary`。 |

导入规则：

- 最多导入 `3` 个 plan，额外 plan 计入 `skippedPlanCount`。
- `layoutId` 从所有 plan 的最大贸易站、制造站、发电站数量推断；无法匹配预设时回退到 `243`。
- 干员按 `id`、`name`、`aliases` 匹配。匹配失败时保留原名为 `overrideName`，并写入 `unmatchedOperatorNames`。
- `trading` 默认产物为 `Money`；`manufacture` 使用 MAA `product` 推断产物。
- `dormitory`、`training` 当前不会进入 Bento canvas，也不会生成房间卡片。

## Demo URL

示例路由：

```txt
/sample/:sampleId?queues=&mode=&template=&strategy=
```

| Parameter | Description |
| --- | --- |
| `sampleId` | 布局或特殊样例。支持 `153`、`243`、`252`、`333`、`342`、`long`、`missing`。 |
| `queues` | 班次数量，例如 `/sample/153?queues=4`。 |
| `mode` | 海报模式，使用 `normal`、`autoRotation`、`dailyRotation`、`combo`。 |
| `template` | 海报模板，使用 `auto`、`matrix`、`splitPanel`、`card`、`combo`。 |
| `strategy` | 示例策略。目前支持 `origin-stone`，用于把最后一个制造站切到源石碎片。 |
