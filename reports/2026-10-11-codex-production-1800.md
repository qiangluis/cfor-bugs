# 2026-10-11 18:00 轮次生产浏览器续测

执行者：Codex，接续当前生产浏览器会话。环境：`https://jixu-ai.com`；主站固定为 `root@aliCfor`，不涉及局域网部署机。此报告不是全功能验收通过或生产发布报告。

## 结论

新增 Bug 77（经营报表菜单错页）、Bug 78（共用经营报表未接正式取数）；Bug 31 仍可复现。Bug 31 和 77 已提交本地修复，未发布，Bug 78 待审查来源后整合。补充 Bug 74 分类事实源门禁、Bug 76 同源报价弹窗修复。

## 实际浏览器操作

| 页面与操作 | 观察 | 边界 |
| --- | --- | --- |
| 新增合同，展开客户下拉 | 客户显示 0、下拉无数据；本次客户接口业务码 0、返回 2 条 | 截图、脱敏观察已保存；关闭取消，未保存 |
| 收款管理列表 | 表头、统计、筛选及 0 行空态正常显示 | 没有可用应收明细，未创建/确认收款；不能判全流程通过 |
| 侧栏进入私有池报表 | 页签/URL 为私有池，正文为销售计划 | Bug 77，截图保存 |
| 侧栏进入合同及回款报表 | 页签/URL 正确，正文仍是销售计划 | Bug 77，同源入口合并登记 |
| 在合同及回款报表点击刷新 | 提示“销售计划报表已重新计算” | 操作窗口网络观察无请求；Bug 78，不等于证明全站无请求 |
| 侧栏进入公共池报表 | 页签/URL 为公共池，正文仍是销售计划 | Bug 77，截图保存；当前页保留供后续续测 |

所有导航均来自已显示的侧栏，不凭猜测路径宣称路由存在。未修改浏览器页面内容或运行时业务状态。

## Bug 31 源码与修复

API 引用写入 `sharedCustomers`，而每次新增调用 `syncSharedContractContext()` 后，空跨页缓存覆盖了它。另有数字与字符串严格比较、空表单用 0 两个问题。

Web `861d57f5d` 将 API 引用与缓存分开保存；引用去重，接口名称优先；ID 使用字符串，兼容数字上下文及大字符串 ID；新租户空选择为 `''`。保留合同金额、保存请求、审批及签署规则，不改数据库或 Flyway。8 项测试覆盖异步先后、缓存重置、去重、名称优先、新租户空态、上下文、编辑及来源报价。

## Bug 77 和 78 分开处理

Bug 77 的 `activeKey` 只读取静态/显式标识，动态菜单未传标识时默认为销售计划。Web `4c2be5483` 从已登记的经营报表路径补解析，不扩大授权、不新增菜单；显式标识与历史别名保持优先。5 项测试覆盖九类报表的动态、旧菜单及静态路径、尾斜杠、优先级、切页、独立权限。

Bug 78 则是独立取数缺失：

- 当前 `rawDetailRows` 两个分支的长度均固定为 0；部门、人员、产品使用演示数组；查询只重置页码，刷新只显示提示，没有正式查询。
- 浏览器 CDP 的刷新窗口从操作前 cursor 读取请求和响应事件，投影请求方法/路径/状态；结果 `requests=[]`、`responses=[]`、`hasMore=false`、`truncated=false`。没有保存请求头或认证信息，也没有直接调用未观察到的接口。
- PB-257～261 文档记录后端 `fc9acf5fd` / Web `5c5ba7c50`。`git cat-file -t` 均为 commit；`git branch --contains` 只列 CRM 功能分支，分别包含 `codex/crm-customer-pb170-200` / `codex/crm-customer-pb170-200-web`；`git merge-base --is-ancestor <commit> HEAD` 均退出 1。
- 当前主目录未包含正式报表 Controller/Mapper 或 Web `businessReport.ts`。未读取或切换这些功能分支的工作树，不覆盖它们未提交内容。
- 下一步须核对来源实现与当前业务表、权限、合同签署、核销/冲销及统计口径后定向整合。不能只修标题、增加 mock 行数或重打当前主线包就认为取数已恢复。

## 其他补充

- Bug 74：私海 `buildFallbackCustomerRow()` 固定写保有客户，新增客户请求未传表单形态，不能以私海显示值纠正所有商机。成交事实推导或独立维护的选择未确认，暂停该项。
- Bug 76：Web `818007481` 覆盖商机报价弹窗空白行，保留主动选品与参考价/金额计算；5 项测试通过。本轮没有该入口的额外生产保存证据。

## 验证分层

代码位于当前 `dev/develop_5.0.1` 主工作目录的定向提交。Web 已 fetch，远端无领先提交；不改已有历史 Flyway，不提交其他会话的代码或构建产物。

以下 7 个测试文件共 34 项通过：`crmContractCustomerReferences`、`crmOpportunityQuoteBlankLines`、`crmQuoteBlankLines`、`crmProductionCopy`、`crmReportRouteKey`、`projectGenericPageRouting`、`projectWorkbenchRoleCalendar`。合同和报表页 ESLint 通过，两页 SFC 脚本及模板编译通过。未执行全量 vue-tsc、生产构建、发布后客户端验证或生产写侧验证。

四张 `1327×1190` 截图已逐张目视检查；不含密码、token、认证头、手机号、联系人、密钥或完整业务响应：

- [合同空下拉](../evidence/2026-10-11-codex-1800/contract-empty-customers.jpg)
- [私有池报表错页](../evidence/2026-10-11-codex-1800/private-pool-wrong-report.jpg)
- [合同及回款报表错页](../evidence/2026-10-11-codex-1800/contract-receipt-wrong-report.jpg)
- [公共池报表错页](../evidence/2026-10-11-codex-1800/public-pool-wrong-report.jpg)
- [脱敏客户引用观察](../evidence/2026-10-11-codex-1800/customer-reference-observation.json)

## 生产保护与剩余门禁

本轮未保存、新建、审批、删除、结账、导出、上传、SQL 写入、重启或部署，没有修改 AI、文件、第三方、公众号、企微、数字员工和密钥配置；未做数据库前后差分，不宣称全库零副作用。

专用测试租户/账号及 `V202610111800` 共享套餐、多角色授权变更的全量发布范围仍待用户确认。后端/Web 当前主目录仍有大量其他会话未提交内容；不能换隔离 worktree、临时排除迁移或单发局部补丁。产品提交未 push 长分支，台账则推送 `cfor-bugs/main`，状态严格区分待修复、代码已修复、已发布和已验证。
