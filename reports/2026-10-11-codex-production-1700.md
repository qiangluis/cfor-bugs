# 2026-10-11 17:00 行政、财务报表与项目浏览器续测

## 环境与边界

- 执行者为 Codex，在当前会话接替 Muse，复用 `https://jixu-ai.com` 的既有浏览器登录；前轮确认该会话为 admin、tenant-id=1，不以品牌“即序科技”推断数据库租户实名。
- 仅进行菜单导航、列表查询、候选人登记表单打开/取消、角色视角切换、浏览器刷新和响应/日志读取。
- 未保存业务记录、修改公式、初始化工资、核算、审批、结账、过账、删除、导出、上传或执行数据库写 SQL；未修改产品代码、生产配置，未重启、构建或部署。
- FMS 查询服务包含事务与按需报表初始化，不能将“没有点击保存”写成“数据库层零写入”；本轮未做查询前后数据库差分。
- 新账号权限、跨租户隔离和新增/编辑/审批闭环仍未验证，需要先确认专用测试租户。

## 结果

| 项目 | 实测结果 | 登记 |
| --- | --- | --- |
| HR 工作台 | 可以打开，异步加载后展示当前月份；不把中途 0 状态作为最终值 | 未发现新缺陷 |
| 社保表 | 当前年份列表加载为空，无新运行异常；未新建首月社保表 | 空态正常展示 |
| 月度工资表 | 当前月份、计薪人数等为空；未在线编辑、核算或建下月工资表 | 空态正常展示 |
| 薪资档案 | 列表及筛选可见；未批量调薪或导入 | 空态正常展示 |
| 员工设置 | 字段开关配置可以读取；未改变开关或保存 | 查询层未发现新缺陷 |
| 候选人 | 列表及登记表单可打开并取消；没有提交个人资料 | 未验证登记写侧 |
| FMS 首页 | 账套/期间可读取；未修改账套或期间 | 页面可打开 |
| 资产负债表 | 主表返回成功，检查自动查询和刷新均失败 | Bug 69、70 |
| 利润表 | 只有 4 个项目，成功检查仍报 10 个一级科目未纳入公式 | Bug 70 |
| 现金流量表 | 主表返回成功，检查业务 500 | Bug 69 |
| 项目工作台 | 初始日期正确，切换角色后日期详情回到七月，周历仍是十月 | Bug 25 打回 |
| 审核效率统计 | 页面配置异常，无统计页面 | Bug 71 |
| 开发日报 | 页面配置异常，无列表 | Bug 71 |
| 项目周报 | 页面配置异常，浏览器刷新后仍复现 | Bug 71 |

这些结果仅对应上述操作，不代表采购、销售、MES、WMS 或财务完整生命周期通过。

## Bug 69：FMS 检查循环

已观察的两种检查接口返回 HTTP 200、业务 500，不能只看 HTTP 状态判断成功。证据为[脱敏响应](../evidence/2026-10-11-codex-1700/fms-report-response-sanitized.json)。

从生产应用日志只读确认：

```text
2026-10-11 16:51:30.040 Handler dispatch failed: java.lang.StackOverflowError
2026-10-11 16:52:12.239 Handler dispatch failed: java.lang.StackOverflowError
2026-10-11 16:54:07.812 Handler dispatch failed: java.lang.StackOverflowError

FmsBalanceSheetServiceImpl.checkBalanceSheet:196
FmsBalanceSheetServiceImpl.isProfitLossTransferred:308
FmsClosingPeriodServiceImpl.getClosingOverview:165
FmsBalanceSheetServiceImpl.checkBalanceSheet:196
... repeats ...
```

对应源码：

- `FmsBalanceSheetServiceImpl.checkBalanceSheet()` 调用 `isProfitLossTransferred()`。
- `isProfitLossTransferred()` 为获取损益余额调用 `getClosingOverview()`。
- `getClosingOverview()` 又调用 `checkBalanceSheet()`，形成递归循环。
- 现金流量表检查也依赖资产负债表检查。

确认后停止重复调用；没有用新增凭证、修改会计配置或重启来试错。结账概况是源码确认的影响风险，本轮未再次打开结账页触发其查询。

[现金流量表截图](../evidence/2026-10-11-codex-1700/cash-flow-check-failed.jpg)只展示现场表格，不含已消失的错误 toast；以接口响应和生产异常堆栈证明失败。

## Bug 70：报表缺项

- 资产负债表实际响应为 4 个并排行、5 个项目，仅含标题、货币资金和两侧合计。
- 利润表实际为营业收入、销售费用、营业利润和净利润 4 行；检查告警列出 10 个缺公式的一级科目。
- 负债侧合计引用 `L51`，实际返回没有对应行次。利润表营业利润公式仅为 `L1-L2`。
- 当前未提交的初始化脚本也只有最小模板；尚未证明生产的缺项来自共享模板还是账套自有配置。
- 本轮没有非零凭证取数验证，不作金额损失判断；修复必须先确认适用会计制度，并保护现有自定义公式、新旧账套及历史迁移。

[利润表截图](../evidence/2026-10-11-codex-1700/income-template-missing-subjects.jpg)

## Bug 25：回归打回

原先初始日期与今天一致的通过证据仍保留。新增反例为：

1. 初始项目经理视角：`10-11 周日`。
2. 切换实施顾问：日期详情变为 `07-18 周六`。
3. 切换开发工程师：日期详情变为 `07-17 周五`。
4. 上方周历同时仍为 `10-05` 至 `10-11`。

源码 `changeWorkbenchRole()` 仍把选中日期重置为角色固定 `defaultCalendarDate`。当前状态改为“打回”，不是再次登记相同问题。

[实施视角](../evidence/2026-10-11-codex-1700/project-consultant-stale-date.jpg)、[开发视角](../evidence/2026-10-11-codex-1700/project-developer-stale-date.jpg)

## Bug 71：动态项目菜单缺页面标识

- 三个实测入口都指向 `project-management/generic-page/index.vue`，生产权限菜单响应没有用于选择配置的页面标识。
- 通用页面从 `route.meta.projectPageCode` 或 `route.meta.query.projectPageCode` 读取注册表；菜单转换只有 component 包含查询串时才填 `meta.query`。
- 审核效率统计还有动态 `statistics/dashboard` 与静态 `audit-efficiency/dashboard` 路径不一致。
- 真实权限响应只保留[三个菜单的脱敏投影](../evidence/2026-10-11-codex-1700/project-menu-sanitized.json)，不提交用户资料、权限列表、认证头或完整响应。
- 没有直接更新生产菜单；修复需要兼容新租户初始化和既有菜单，保留原授权。

[统计页](../evidence/2026-10-11-codex-1700/project-audit-efficiency-config-error.jpg)、[日报](../evidence/2026-10-11-codex-1700/project-dev-daily-config-error.jpg)、[周报](../evidence/2026-10-11-codex-1700/project-weekly-config-error.jpg)

## 本轮交付

新增 3 个 Bug，打回 1 个既有 Bug；仅修改 `cfor-bugs` 测试台账和证据。没有把登记、根因定位或产品源码现状标为“已修复”“已发布”。
