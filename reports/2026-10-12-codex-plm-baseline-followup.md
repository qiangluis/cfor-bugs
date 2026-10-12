# 2026-10-12 Codex 生产浏览器续测：PLM 配置与基线

## 环境与边界

- 环境：`https://jixu-ai.com`
- 浏览器：Codex In-app Browser，视口 `1280x720`
- 租户界面：即序科技
- 本轮仅做导航、筛选、下拉切换、详情查看和截图取证。
- 未执行冻结、发布、内容校验、下发、上传、签入/签出、审批、删除、数据库写入或生产配置修改。

## 新增问题

### Bug 125：产品基线进入对比后显示其他基线的固定差异

- 页面：`/plm/configuration-baseline/product-baseline` → 产品基线 `BL-MES-ERP-FG-001 / 标准成品` → `对比`
- 预期：从当前基线进入差异页后，应以当前基线作为基准，并加载当前租户可比较的目标基线和真实差异。
- 实际：
  - 进入地址带有 `baseBaselineId=1`，但差异页显示基准 `BL-P-202604-017 / 标准控制柜`、目标 `BL-P-202605-001 / 标准控制柜`。
  - 页面固定展示 `PART-PWR-220`、`DWG-CAB-220`、`CAD-CAB-LAYOUT` 等标准控制柜差异，与入口的“标准成品”无关。
  - 将目标基线切换为与基准相同的 `BL-P-202604-017` 后，仍显示相同 5 条差异。
- 源码线索：`src/views/plm/configuration-baseline/baseline-compare/index.vue` 使用固定 `baselineOptions`、`diffRows`、`diffTree`，`resetCompare()` 固定回到 `B-001/B-002`，未按 URL 的 `baseBaselineId` 加载正式基线和差异接口。
- 影响：评审人员可能把其他产品的差异当成当前产品基线的差异，属于 P1 结果可信性问题。
- 证据：
  - [入口后错误上下文](../evidence/2026-10-12-codex-plm-baseline-followup/baseline-compare-wrong-context.png)
  - [相同基线仍显示固定差异](../evidence/2026-10-12-codex-plm-baseline-followup/baseline-compare-identical-still-different.png)
- 状态：待修复。

### Bug 126：产品基线标题操作与筛选操作在 1280px 视口重叠

- 页面：`/plm/configuration-baseline/product-baseline`
- 实际 DOM 边界（视口宽度 1280）：
  - 刷新：`x=1039..1120`
  - 基线对比：`x=1140..1249`
  - 搜索：`x=1009..1090`
  - 重置：`x=1102..1183`
  - 搜索与刷新重叠 `41px`，重置与基线对比重叠 `43px`。
- 截图中右上角按钮挤在同一行，用户无法可靠区分筛选操作和页面操作。
- 影响：P2，默认桌面视口下出现误点击和可用性问题。
- 证据：[产品基线工具栏重叠](../evidence/2026-10-12-codex-plm-baseline-followup/baseline-search-actions-overlap.png)
- 状态：待修复。

### Bug 127：文档基线无结果时仍保留旧快照和冻结对象

- 页面：`/plm/configuration-baseline/document-baseline`
- 复现：记录初始选择 `DBL-202605-006 / 标准控制柜 V3.2`，关键字输入 `CODEX-NO-SUCH-BASELINE-20261012`，点击查询。
- 实际：
  - 主列表显示“暂无数据”。
  - 右侧仍显示旧的 `DBL-202605-006` 详情、42 个文档、`DWG-CAB-220` 和 `SPEC-CAB-QA` 快照。
  - 顶部“冻结文档基线”仍可用，操作目标与当前零结果不一致。
- 影响：P1，零结果时仍可能对不可见的旧基线执行冻结操作，且详情会误导用户。
- 证据：
  - [初始固定详情](../evidence/2026-10-12-codex-plm-baseline-followup/document-baseline-static-list.png)
  - [零结果仍保留旧详情](../evidence/2026-10-12-codex-plm-baseline-followup/document-baseline-empty-stale-detail.png)
- 状态：待修复。

### Bug 128：适用性查询无结果时仍保留旧命中范围和下游影响

- 页面：`/plm/configuration-baseline/effectivity`
- 复现：关键字输入 `CODEX-NO-SUCH-EFFECTIVITY-20261012`，点击查询。
- 实际：
  - 零部件版本和 EBOM 列表都显示 `0`，并展示“暂无零部件生效边界 / 暂无 EBOM 生效条件”。
  - 右侧“命中范围”仍保留旧的 `MAT-ERP-RM-001 / 标准原材料`、`RELEASED`、EBOM-MAT-ERP-FG-001-A 和下游处理建议。
- 影响：P1，筛选条件与详情不一致，配置管理员可能误把旧对象当作当前查询命中对象。
- 证据：[适用性零结果仍保留旧详情](../evidence/2026-10-12-codex-plm-baseline-followup/effectivity-empty-stale-detail.png)
- 状态：待修复。

### Bug 129：发布包查询无结果时仍保留旧发布包内容和下发信息

- 页面：`/plm/configuration-baseline/release-package`
- 复现：关键字输入 `CODEX-NO-SUCH-PACK-20261012`，点击查询。
- 实际：
  - 发布包主列表显示“暂无数据”。
  - 右侧仍显示旧发布包 `PKG-202605-004`、内容校验“通过”、审批“已批准”、基线/文档/BOM/工艺内容和 `MES, ERP` 下发目标。
  - “内容校验”和“下发”按钮仍可用，操作目标不是当前查询结果。
- 影响：P1，零结果时存在误校验或误下发不可见发布包的风险。
- 证据：[发布包零结果仍保留旧详情](../evidence/2026-10-12-codex-plm-baseline-followup/release-package-empty-stale-detail.png)
- 状态：待修复。

## 正常项与未覆盖项

- 产品配置页面使用不存在的产品编号查询后，列表和统计均清空，未发现同类旧详情残留。
- 本轮没有将固定演示数据本身全部升级为独立 Bug；只有在筛选、入口上下文或操作目标与页面结果发生可复现不一致时登记。
- 真实生产新建、冻结、发布、内容校验、下发、非管理员权限和新租户初始化仍未验证。
