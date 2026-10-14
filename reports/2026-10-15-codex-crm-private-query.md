# 私海客户查询续测与修复（2026-10-15）

## 结论

Bug 172 的私海分页、过期查询及失败反馈已修复，尚未发布；客户全景仍未完成，
不得标为完整修复。Bug 82 的原 0 条现象在当前福奇科技账号未复现，
没有执行新增客户或原租户的创建后查询验证。

| 范围 | 提交 |
| --- | --- |
| Web 私海查询、行为与浏览器回归 | `21acf7059` |
| 后端销售协同文档及验证边界 | `f308effb6` |

产品分支为 `bugfix/crm-private-query-20261015`，只提交本会话文件，
未推受保护 develop，其他会话未提交改动保留。
独立待发布修复仍为 13 项，部分 Bug 172 不计数；未满 20，不部署、不重启。

## 需求与真实生产读取

原需求《平台功能梳理1008.xlsx》“功能梳理”：
`A189:G189` 的 PB-186 要求本人/团队权限及经营状态分离；
`A196:G198` 的 PB-193～195 要求联系人真实归属、原单据业务全景及只读历史。

使用指定福奇科技测试账号，密码仅通过环境变量注入。
浏览器仅放行 GET、登录/刷新、只读字段含义和培育 active-list POST。
后者已查 Controller，正式实现是查询，不能误拦后把空列表报成产品缺陷。
本轮没有保存客户、合同、商机、联系人或财务单据，业务写请求为 0。

工作台本人及私海请求均为 `pool=false / sceneType=1`，总数和实际列表均为 8，
客户都归当前用户。所选客户的正式商机查询业务码 0、总数 1，
私海详情只请求经营历史，未读商机等业务全景；需求缺口仍成立。
直接查询使用真实浏览器成功请求的授权头，仅驻留内存，
报告不保存 token、个人姓名、客户 ID 或商机明细。

8 个客户 `dealStatus=false`，页面却都显示保有。
去重确认与历史台账“Bug 74：同一客户的形态在私海与商机详情不一致”同源，
该条仍有“成交事实推导还是独立维护”的人工口径门禁。
本轮撤回尚未提交的推导改动，保留现有映射，不新增重复编号、不计修复数量，
不把现有详情页的另一种显示方式当已确认业务定义。

[生产观察](../evidence/2026-10-15-codex-crm-private-query/production/result.json)、
[工作台](../evidence/2026-10-15-codex-crm-private-query/production/workbench.png)、
[私海](../evidence/2026-10-15-codex-crm-private-query/production/private-pool.png)、
[脱敏详情](../evidence/2026-10-15-codex-crm-private-query/production/customer-detail.png)。

## 实施范围

私海原实现只取前 100 条客户、前 100 个培育 ID，再本地筛选及分页，
无法完整处理第 100 条之后的本人客户，也没有过期响应保护。

现在复用真实分页 helper，所有请求每页最多 100；培育查询每批最多 100 个 ID。
保留本人场景、租户、数据权限及全部原业务事实，不扩大权限或生成测试数据。
分页结构、总数、空/重复记录及完整结果数需一致；
后续页或培育批次失败不显示部分结果为完整结果。
当前请求失败清除旧结果和旧详情，错误可见，统计显示 `-`，真实空列表仍是 0。
请求序号、基础租户、访问租户和用户快照防止迟到回填；
范围变化或卸载后停止后续培育批次，旧错误不清空新查询结果。
客户创建成功后，列表刷新返回 false 或抛错均单独警告，
不重新发创建请求或伪称客户创建失败。

## 验证

22 项真实 SFC AST 函数行为回归全部通过，覆盖 201 条三页、100/100/1 培育批次、
后续页筛选、全量页签、并发/旧错误、租户与用户切换、缺失/重复/变化的页、
明确失败与恢复，以及创建成功后的刷新失败。
同五项定向回归对线上源码 `89f562734` 为 1 通过、4 失败、0 取消；
通过项只是现有客户事实及未确认分类保持不变，不计为修复证据。

```sh
node --test scripts/tests/crm-private-pool-query.test.mjs scripts/tests/project-customer-save.test.mjs
CFOR_CUSTOMER_SOURCE_REV=89f562734 node --test --test-name-pattern='loads every authorized|local form filters|API failures|empty, incomplete|pagination preserves' scripts/tests/crm-private-pool-query.test.mjs
node scripts/tests/crm-private-pool.browser.mjs
```

实际 Element Plus / Router 组件使用内存 API，阻断所有外部业务网络；
三页、三批、第 201 条筛选、明确查询失败、统计未知及刷新恢复均通过，
页面异常和外部业务网络为 0。首次回放超时是测试把无 href 的 el-link
当作链接角色定位，截图已有正确结果；修正定位后重跑通过，不登记产品 Bug。

定向 ESLint、夹具和测试格式、SFC 脚本/模板、scoped Sass 和 diff 检查通过。
未执行全项目 vue-tsc 或完整构建。1440/390 截图已检查；
窄屏页签仍有历史裁切，不能以查询测试通过替代移动端布局验收。

[22 项回归](../evidence/2026-10-15-codex-crm-private-query/regression/behavior-results.tap)、
[生产源码对照](../evidence/2026-10-15-codex-crm-private-query/regression/production-source-baseline.tap)、
[实际组件结果](../evidence/2026-10-15-codex-crm-private-query/regression/result.json)、
[桌面](../evidence/2026-10-15-codex-crm-private-query/regression/desktop.png)、
[错误状态](../evidence/2026-10-15-codex-crm-private-query/regression/query-error.png)、
[窄屏](../evidence/2026-10-15-codex-crm-private-query/regression/narrow.png)。

## 发布与后续范围

本轮仍未构建、部署、重启或执行 Flyway，生产是 2026-10-14 22:44 全量包。
生产 AI、文件、第三方登录、公众号、企微、数字员工及其他配置均未修改。
无后端业务或初始化脚本改动，不用给生产租户补数据来通过测试。

Bug 172 未完成：工作台各范围和大数据统计的完整核对、PB-193 联系人、
PB-194 跟进/线索/商机/报价/合同及 ERP 正式应收回款全景、
PB-195 操作与归属历史和返回上下文。
财务必须沿用 ERP 事实源，不能挂载旧 CRM 财务写组件后宣称完成。
普通角色、新旧租户及正式生产持久化未验证；分类门禁单独等待人工确认，
不影响继续处理其他已有 Bug。
