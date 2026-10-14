# 质量类型与 MSA 数量续测（2026-10-15）

## 结论

生产复现 Bug 12、61 的空单据类型查询，并新增 Bug 195：MSA 数量 `5`
失焦后清空。Web `8c495b62d` 已提交并推送，均为代码已修复、待发布；
没有修改生产配置、数据或迁移历史，没有重启服务。

两个空类型入口为同一共享根因，只计一个修复。当前覆盖 9 条待发布台账，
去重后共 8 项独立修复，未达到 20 项发布门槛。

## 需求与源码依据

- 只读核对《平台功能梳理1008.xlsx》“功能梳理”第 98～101 行，
  PB-095～098 要求四种标准质检类型、企业自定义、类型关联方案、存货关联方案。
  第 316 行 PB-313 要求统一引用质量基础并保留来源与重复生成门禁。
- 开发文档《CFOR-PB-095至PB-110质量与设备基础深化改造方案-20260929.md》
  §3.1 固定核心编码 `101/104/201/300`，企业自定义为核心场景下子类型；
  不以新增核心状态、平行主档或当前租户数据补丁修复页面问题。
- `QualityOrderForm.vue` 原表单展示 `documentTypeId`，查询 `system_document_type`
  的 ZJD 子项；生产真实响应为空数组。后端 `MesQualityInspection` 保存 `type`
  和独立的 `qualitySceneSubTypeCode` 等字段，没有 `documentTypeId`。
- 普通列表 `index.vue` 按四个核心类型页签传入 `defaultType`；
  MSA 列表通过 `scene=msa` 明确固定 `type=MSA`。方案查找原本使用 `type`。
- MSA 数量回调原本接收公共控件 change 和 blur 两种参数，
  `Number(FocusEvent)` 成为 NaN，不是后端库存、模型或配置故障。

## 生产证据与安全边界

生产 Web 为 `89f562734`，后端为 `c77a4f534`，使用福奇科技测试账号。
在当前浏览器上下文新建自己的页面，结束后只关闭该页面并断开 CDP；
没有关闭其他会话页面或停止已有本地 Vite。

- 普通入口 `/quality/order` 和真实 MSA 入口 `/quality/msa-order`
  各收到一次 ZJD 类型查询，业务码 200，返回选项数为 0，DOM 显示“暂无数据”。
- MSA 检验数量输入后 DOM 为 `5`，按 Tab 后为 `""`。
- 阻断所有业务写请求，包括编号生成；本次记录的两个 PUT 均为
  `/admin-api/mes/fillRule/executeRuleByCode/qc_zjd_bill_no`，没有消耗编号或保存质检单。
- 生产截图中的“操作失败，系统异常”来自上述主动拦截，
  不作为新后端 Bug 的证据。页面运行错误列表为空。
- 首轮脚本使用旧的 `/mes/quality/msa-order` 无法定位新增按钮，
  核对当前源码的实际导航后改用真实入口，再成功复现；脚本问题不登记为产品 Bug。

证据：
[生产响应与 DOM](../evidence/2026-10-15-codex-quality-type-msa/production/result.json)、
[普通空类型](../evidence/2026-10-15-codex-quality-type-msa/production/standard-empty-document-type.png)、
[MSA 空类型](../evidence/2026-10-15-codex-quality-type-msa/production/msa-empty-document-type.png)、
[MSA 数量失焦](../evidence/2026-10-15-codex-quality-type-msa/production/msa-quantity-after-blur.png)。

## 修改与回归

Web `8c495b62d`，仅包含本会话 5 个文件。
后续 `0dda23757` 仅调整测试断言输出，避免负向回归把整份源码打印进共享日志，
不改变产品行为或修复计数：

- `src/views/quality/order/QualityOrderForm.vue`
- `scripts/tests/quality-order-type.test.mjs`
- `scripts/tests/quality-order-type.browser.mjs`
- `tests/fixtures/quality-order-type.ts`
- `tests/fixtures/quality-order-type.html`

普通/MSA 表单改为只读展示真实 `type`，没有改核心编码、状态机、企业规则或
历史快照；400 为既有样品化验显示值，不新增核心业务分支。MSA 数量回调接受
有限数字或明确清空，忽略失焦事件和非有限数值，仍同步表头、明细及项目数量。

新增 14 项回归覆盖四核心类型、普通默认、MSA 固定类型、历史字段不变、
既有样品值显示、方案请求、数量联动、失焦、非有限值、清空及 SFC 编译。
另有 10 项既有质量表格/插槽回归，组合销售发票 19 项，共 43 项通过。
对生产源码 `89f562734` 运行同一新增回归，14 项中 8 项失败、6 项通过。

真实 Element Plus/VXE 浏览器回归通过：

- 普通四场景及 MSA 都显示正确类型，不再查询 ZJD 主档。
- 从真实 MPopup 弹窗单次点击选择存货，回填存货名称、编码、单位。
- 请求方案时材料 ID 正确，`type=MSA`。
- 输入数量 `5` 后按 Tab，表头与存货行数量均为 5。
- 页面运行错误和发送至后端的网络请求均为 0，所有业务响应来自内存适配器。

本夹具故意返回无方案，确认已有维护提示仍在；没有伪造生产可用方案，
也没有通过关闭“未匹配到方案”校验让正式检验保存通过。

定向 ESLint、新文件 Prettier、diff 检查通过。没有执行全项目 vue-tsc，
不宣称已完整构建或质量持久化通过。没有保存、认领、审核、检验放行、
写库存、MSA 研究或报告交付的生产闭环证据。

证据：
[43 项回归](../evidence/2026-10-15-codex-quality-type-msa/regression/regression-results.tap)、
[线上源码反证](../evidence/2026-10-15-codex-quality-type-msa/regression/production-baseline-regression.tap)、
[真实组件结果](../evidence/2026-10-15-codex-quality-type-msa/regression/result.json)、
[采购入库类型](../evidence/2026-10-15-codex-quality-type-msa/regression/purchase-inspection-core-type.png)、
[MSA 类型、存货与数量](../evidence/2026-10-15-codex-quality-type-msa/regression/msa-type-and-material.png)。

Bug 194 同轮重新执行真实组件回归，最新结果与开票资料输入/校验保存参数一致，
补齐此前 19 项回归缺少持久日志的问题；它已在此前修复计数内，不重复计数。

## 发布计数

| 独立修复 | Bug 条目 | Web 提交 |
| --- | --- | --- |
| 非数字审计身份回显 | 193 | `8a01b87fe` |
| 工单交期摘要契约 | 162 | `9866a7197` |
| 生产追溯查询上下文 | 164 | `15ff82afb` |
| 发票类型重选 | 160 | `fa1abc5c1` |
| 发票部分金额失焦 | 161 | `fa1abc5c1` |
| 发票开票资料输入 | 194 | `fd6c4464e` |
| 质检核心类型字段 | 12、61，同源合计一项 | `8c495b62d` |
| MSA 数量失焦 | 195 | `8c495b62d` |

累计 8 项。生产已发布的旧修复、其他会话未提交修改、重复页面证据、
未确认数据事实源和会计口径的条目均不用于凑满 20。

后续继续对照需求与开发文档测试、同步远端问题，达到门槛后从当前主目录
完整构建发布前后端，保护生产独有配置；发布后继续真实客户端验证。
