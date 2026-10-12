# 2026-10-12 Codex 生产前端发布与 PLM 续测

## 环境与发布

- 环境：`https://jixu-ai.com`
- 浏览器：Codex 生产浏览器，视口 `1280x720`
- 租户界面：即序科技
- 前端提交：Web `6b5e7673d53576089d32ff4e0dff3662977d8545`
- 发布包：`web-plm108-20261012122522-94256ec57`
- 目录名沿用旧发布脚本的标识，不作为源码版本依据；本次实际代码提交及包 SHA-256 分别为上面的 `6b5e7673d` 和 `f641a78f01b2424f2039d495cc471d68477cb34135a138c8b0306d7efd7ca82a`。
- 发布完成：2026-10-12 12:25:24 CST
- 前端入口 SHA-256：`0e3ddff21f6cc1d0020a4612a753643578f435fdf99e93f2eee1600d74b20a23`
- 后端 `spring_cfor-server-4.service` 未重启，`MainPID=29507`、JAR 和健康状态未改变。
- `frontend-config.json`、`jixu-ai.env`、Nginx 配置均通过发布前后指纹校验，未覆盖生产运行时配置。
- 本轮未执行 Flyway，未修改生产数据库、AI、文件、第三方登录、公众号、企微、数字员工或其他生产专有配置。

## 已验证修复

### Bug 125

从真实产品基线 `BL-MES-ERP-FG-001 / 标准成品 MES反推基线` 进入对比页后，基准上下文正确；目标设为同一基线后显示差异 0，未再出现“标准控制柜”固定差异。

### Bug 127

文档基线输入不存在的关键字后，主列表、文档快照、版本差异和引用对象均为空，“冻结文档基线”禁用。

### Bug 128

适用性输入不存在的关键字后，零部件版本、EBOM、已关联产品和下游影响均为 0，右侧要求先选择边界对象，查看详情按钮禁用。

### Bug 129

发布包输入不存在的关键字后，发布包、内容集合和审批下发信息均为空，“内容校验”和“下发”禁用。

证据集中在 [2026-10-12-codex-plm-baseline-release](../evidence/2026-10-12-codex-plm-baseline-release/)，包含[相同基线与适用性空结果 DOM 观察](../evidence/2026-10-12-codex-plm-baseline-release/observations.json)。

## 仍未通过与新增问题

### Bug 126：产品基线操作区仍重叠

发布后在 1280px 视口再次测量：

- `搜索`：`x=1009..1090`
- `刷新`：`x=1039..1120`
- `重置`：`x=1102..1183`
- `基线对比`：`x=1140..1249`

搜索与刷新重叠 51px，重置与基线对比重叠 43px。状态打回，证据为
[product-baseline-overlap-after-production.jpg](../evidence/2026-10-12-codex-plm-baseline-followup/product-baseline-overlap-after-production.jpg)。

截图还确认文档基线、适用性和发布包都有同类查询操作覆盖标题操作的现象，合并到 Bug 126 扩大影响范围，不新建重复编号。零结果详情已清空不代表操作区布局通过。

### Bug 130：未取得有效基线对象时静默显示零差异

在基线对比页输入基准 `999`、目标 `888` 并点击“开始对比”后：

- 没有显示基线不存在、无权限或不可比较的错误；
- 两侧对象显示 `-`；
- 差异、新增、变更、移除、阻塞全部显示 `0`；
- 页面只有自由文本 ID 输入，没有当前租户有效基线候选选择。

这会把输入错误或无效对象误导成“两个基线没有差异”。状态待修复，证据为
[baseline-compare-invalid-id-empty.jpg](../evidence/2026-10-12-codex-plm-baseline-followup/baseline-compare-invalid-id-empty.jpg)。

本轮没有数据库查询或完整接口响应证据，不能据此断言 `999/888` 在数据库中不存在，也不判断服务端具体返回状态。缺陷以页面未取得有效对象却不解释零差异为依据。

## 继续复测的旧问题

- Bug 117 仍存在：切换到 `ERP-FG-001_gearbox_assembly.dwg` 后，右侧仍显示同一组固定批注；点击“新增批注”无表单、无提示、无导航。证据：[preview-annotation-static-after-release.jpg](../evidence/2026-10-12-codex-plm117-119/preview-annotation-static-after-release.jpg)。
- Bug 123 仍存在：产品台账“产品族 / 型号”继续显示内部 ID `2104856930414133251 / FG-001`。证据：[product-ledger-family-id-followup.jpg](../evidence/2026-10-12-codex-plm-followup/product-ledger-family-id-followup.jpg)。

## 测试边界

本轮只做真实生产页面导航、筛选、对比查询和截图取证；没有冻结、发布、内容校验、下发、上传、签入/签出、审批、删除或保存业务数据。

Bug 125 只验证当前已有同一基线的对比；两个不同基线、请求竞态、新租户及非管理员仍未验证。文档基线、发布包仍含页面内示例数据，Bug 127/129 的“已验证”只指本条零结果残留缺陷，不代表业务持久化通过。
