# Bug 30：跨仓调拨日期契约修复

## 结论和发布计数

2026-10-15 完成 Bug 30 的前端日期链路修复，状态为“代码已修复，待发布”。
本轮没有部署、重启生产后端、修改生产数据库或执行历史 Flyway。

| 仓库 | 提交 | 推送分支 |
| --- | --- | --- |
| Web | `5cf2d1ae5` | `bugfix/production-followup-20261014` |
| 后端测试与开发记录 | `7e2f1d792` | `bugfix/wms-transfer-date-contract-20261015` |

此前为 10 项独立待发布修复；本项计入后为 **11 项**。
对应 Bug 193、162、164、160、161、194、12/61、195、159、94、30，
其中 Bug 12/61 为同一根因，不能重复计数。达到 20 项后再全量发布当前主目录
前后端，发布前仍须核对并发修改、产物、Flyway 和生产配置保护。

## 需求和边界

只读核对原需求工作簿 `平台功能梳理1008.xlsx` 的“功能梳理”第 296 行 PB-293，
以及后端 `docs/02_模块设计/CFOR-PB-283至PB-302仓库协同深化改造方案-20260930.md`
第 4.10 节。继续保留跨仓调拨、批号/SN、在途、两段库存执行、取消反向处理、
幂等与版本保护，不引入新库存事实源。

本轮不是 Yudao 能力移植，不读取或修改 Yudao 参考仓库，不修改独立 framework、
授权策略或生产配置。日期修复位于统一页面和 API，对新旧租户一致，
不依赖当前测试租户的数据修正，也不新增初始化或 Flyway 脚本。

## 根因证据

### JSON 保存与 GET 查询是不同契约

- SaveReqVO 的 `billDate` 和 `expectedArrivalTime` 是 `LocalDateTime`。
- 生产 JAR 内 `cfor-common-4.0.3-SNAPSHOT.jar` 的 SHA-256 为
  `072e406fe71f8750081566b95a8b5b02b32896aa3dd9923d025de4094a37c1bd`，
  与本地提取依赖一致。反汇编及源码均确认既有解码器按 epoch milliseconds 处理。
- 旧页面发送 `YYYY-MM-DD HH:mm:ss` 显示文本，不能按预期保留日期。
  现有解码器对非数字文本还存在转换为错误日期的风险，不能把“当前解析未抛错”
  当成保存日期正确；本轮没有在生产提交此类写请求。
- PageReqVO 的范围为 `LocalDateTime`，没有自定义格式，现有 GET 接收 ISO 参数。
  实际生产只读请求：空格格式为 HTTP 200 / 业务码 400，ISO 为 HTTP 200 /
  业务码 0；列表 total 为 0，不将空列表当成业务写侧验证。

### 日期范围末日遗漏

真实 Element Plus 组件手工输入结束日期后，绑定值为末日零点，
不能仅依赖 date-picker 的 `default-time` 保证整日查询。
本轮在 `getList()` 明确规范开始日零点、结束日 `23:59:59`，
未通过改变回归期望来绕过这一问题。

## 实现

1. 新增默认单据日期为毫秒时间戳；两个 datetime 选择器使用 `value-format="x"`。
2. 创建和修改 API 均转换成数值毫秒时间戳；无效或缺失单据日期在请求前拒绝，
   不将 NaN 或无效字符串交给后端兜底。
3. 修改/详情将数值时间、数字字符串、历史 Date 字符串规范化回显，
   不清空业务日期或抹去时间精度。
4. 可选计划到达时间清空为 `null`，未提供时保持省略，不凭空产生 epoch zero。
5. 日期范围使用 ISO GET 字符串，覆盖起止日期全天，重置清除两个边界。
6. 列表创建时间与调出/调入时间显示为可读日期，不直接输出毫秒整数。

没有改写调拨 Service、Mapper、主从表、库存余额、审批、租户和权限逻辑；
没有修改库存数量、单据版本、明细批号或 SN，也没有覆盖其他会话未提交文件。

## 验证

| 层级 | 实际证据 | 边界 |
| --- | --- | --- |
| Java 定向构建与回归 | 7 项 Controller/JSON/GET 绑定 + 8 项既有 Service，共 15 项通过 | 不是完整后端打包或生产审批/库存执行 |
| 实际 Web SFC/API | 12 项通过；组合 Bug 159/94 共 38 项通过 | 使用实际 SFC/API 源码，依赖以本地测试替身隔离 |
| 线上源码负向对照 | `89f562734` 下 1 pass / 11 fail / 0 cancelled | 证明旧契约与预期不同，不代表重新执行生产保存 |
| 真实 Element Plus | 新增日期、到达时间、编辑回显、清空、整日查询、重置通过 | 所有 API 响应在本地内存；物料通过实际选择回调注入夹具，未验证物料弹窗全流程 |
| 生产真实浏览器与只读 API | 登录后打开原调拨页面；旧范围码 400，ISO 范围码 0；业务写请求 0 | 没有创建、保存、提审、调出、调入或修改生产配置 |
| 代码质量 | 受影响文件 ESLint、Prettier、diff-check 通过；隔离 API 类型检查 0 diagnostics | 未执行全项目 vue-tsc，不宣称全项目类型检查通过 |

Java 命令（Java 17、Maven 3.9.9）：

```bash
mvn -o -pl cfor-module-wms/cfor-module-wms-biz -am \
  -Dtest=WmsTransferBillDateContractTest,WmsTransferBillServiceImplTest \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

Web 命令：

```bash
node --test scripts/tests/transfer-date-contract.test.mjs \
  scripts/tests/tenant-create-feedback.test.mjs scripts/tests/stock-take-scope.test.mjs
node scripts/tests/transfer-date-contract.browser.mjs
CFOR_TRANSFER_SOURCE_REV=89f562734 node --test scripts/tests/transfer-date-contract.test.mjs
```

生产只读脚本为 `scripts/tests/transfer-date-production.browser.mjs`，
口令只由本机环境变量注入，不写入源码、报告或证据。

## 证据文件

- [生产日期表单](../evidence/2026-10-15-codex-transfer30/production-date-form.png)
- [生产只读请求结果](../evidence/2026-10-15-codex-transfer30/production-result.json)
- [本地新增日期输入](../evidence/2026-10-15-codex-transfer30/create-date-values.png)
- [编辑清空计划到达](../evidence/2026-10-15-codex-transfer30/edit-arrival-cleared.png)
- [整日 ISO 范围查询](../evidence/2026-10-15-codex-transfer30/iso-date-range.png)
- [真实组件回放结果](../evidence/2026-10-15-codex-transfer30/result.json)
- [组合前端检查](../evidence/2026-10-15-codex-transfer30/cfor-transfer-date-combined-20261015.tap)
- [线上源码负向对照](../evidence/2026-10-15-codex-transfer30/cfor-transfer-date-baseline-20261015.tap)
- [Java 构建与测试](../evidence/2026-10-15-codex-transfer30/cfor-transfer-date-contract-java-20261015.log)

## 发布后待验证

发布后使用已授权的测试环境或获准的测试业务单据确认新增与修改持久化日期、
计划到达清空、日期末日筛选，然后继续验证审批、调出在途、调入和取消链路。
不能以本轮绑定测试、夹具保存成功、登录、空分页或 HTTP 200 代替生产写侧业务验收。
