# 2026-10-11 Codex 浏览器测试与修复记录

观察时间：2026-10-11 10:38-10:46，Asia/Shanghai。

## 环境与边界

- 生产网站：`https://jixu-ai.com`；沿用当前真实登录会话。
- 界面品牌显示“即序科技”；HR 工作台真实 GET 请求头确认 `tenant-id=1`，不能据品牌推断 tenant 140。
- 生产主站：`root@aliCfor`，本机名称解析确认 `47.115.223.70`。
- 后端服务 active，健康 `UP`；实际 JAR 仍为 `/www/server/jixu-ai/releases/standard-20261011070543-bug44-50fba370/cfor-server-4.jar`。
- 本轮只导航、查询、展开菜单、打开/取消表单、切换视图和读取请求/控制台。不保存、审核、删除、上传或计算工资，不修改生产数据库。
- 未输出或提交请求令牌、密码、AppSecret、生产环境文件内容。

## 新发现：Bug 52

HR 工作台 `/hrm/home`：

| 点击项 | 中国时间 | 实际结果 |
| --- | --- | --- |
| 正在招聘职位 | 10:38:01 | 停留原 URL，控制台 `resolve/push` 异常，调用栈 `HrmHomeRecruitSurvey` |
| 在职 | 10:38:33 | 停留原 URL，调用栈 `HrmHomeEmployeeSurvey` |
| 待核算薪资 | 10:38:45 | 停留原 URL，调用栈 `HrmHomeTodoSurvey` |

随后从正式菜单对照，`/hrm/recruit/post`、`/hrm/recruit/candidate`、`/hrm/employee`、`/hrm/salary/month-record` 均可打开。招聘职位新增表单可打开并取消，未保存。月度工资页为空态，未点击初始化。

[截图](../evidence/2026-10-11-codex/bug52-hr-workbench-shortcuts.jpg)

源码 `routerHelper.ts` 给有 ID 的动态菜单名追加 `Menu<ID>`，上述快捷卡片却依赖无后缀固定名称。这个原因也解释 Bug 51。

## 本轮修复

| Bug | Web 提交 | 行为 | 状态 |
| --- | --- | --- | --- |
| 51 | `dd53818e3` | 新增/详情返回使用列表路径；编辑返回静态详情；导航成功后删除原访问页签并重建缓存 | 代码已修复，待发布 |
| 52 | `5c7c87ebb` | HR/团队快捷入口使用正式路径，权限检查和查询筛选保留 | 代码已修复，待发布 |

验证命令：

```bash
node --test tests/hrmWorkbenchNavigation.test.mjs tests/hrmPerformancePlanNavigation.test.mjs tests/bpmWorkbenchNavigation.test.mjs
pnpm exec eslint src/views/hrm/performance/plan/form/index.vue src/views/hrm/performance/plan/detail/index.vue
pnpm exec eslint src/views/hrm/home/components/HrmHomeEmployeeSurvey.vue src/views/hrm/home/components/HrmHomeRecruitSurvey.vue src/views/hrm/home/components/HrmHomeTodoSurvey.vue src/views/hrm/home/team/components/HrmTeamOverview.vue
```

结果：21 项测试全部通过，两个定向 ESLint 命令退出 0。没有执行全量类型检查、生产构建或发布，不能把本地单元测试当作生产回归。

新旧租户：不依赖具体菜单主键，测试覆盖两种不同菜单名后缀；保留权限检查及员工状态、候选人状态、待办和领导筛选。生产未新增租户验证，不扩大证据结论。

## Bug 44 状态纠正

重新打开三页，最终列表均正常空态，没有“系统异常”。读取真实响应，不能只以 HTTP 200 认定成功：

| 页面 | 列表 API | HTTP | 业务码 |
| --- | --- | --- | --- |
| 调度计划 | `/admin-api/mes/schedule/list?pageNo=1&pageSize=10` | 200 | 200 |
| 值班管理 | `/admin-api/mes/duty/list?pageNo=1&pageSize=10` | 200 | 200 |
| 项目拓扑 | `/admin-api/mes/itemTopology/list` | 200 | 200 |

值班管理可切换到 2026 年 10 月日历，未增加值班安排。

- [调度](../evidence/2026-10-11-codex/bug44-schedule-retest.jpg)
- [值班日历](../evidence/2026-10-11-codex/bug44-duty-calendar-retest.jpg)
- [项目拓扑](../evidence/2026-10-11-codex/bug44-topology-retest.jpg)

原 07:10 发布记录已有后端 `bd670fdf6` 和正式 Flyway；本轮修正清单滞后状态为已验证。这里只验证查询故障解除，不代表运维增删改或完整巡检业务闭环通过。

## 其他只读覆盖

CRM工作台可查询摘要与 1 条跟进待办；点击“处理”可打开跟进表单，随后取消。没有保存跟进、完成任务或调用 AI。未将其认定为完整客户流程通过。

## 全量发布门禁

当前 Web HEAD 为 `5c7c87ebb`；其他会话仍有售后、委外、PMS、共享表单和路由等未提交改动。后端同样有多模块并发修改与未跟踪迁移。未清理、覆盖或整仓提交这些工作。

1. 前端售后变更新增 `/after-sales/asset/customer-profile/create|update`、评价读取等契约，不能在旧后端上直接发布完整前端。
2. 未提交 `V202610111800__restore_erp_home_menu_scope.sql` 会启用 ERP 菜单 `2702`、修改共享 `system_tenant_package.menu_ids`、增加 `super_admin/system/tenant_admin` 角色菜单；已确认初始化规范则要求只同步当前租户管理员，不改共享套餐或其他角色。
3. 发布范围涉及权限策略取舍，必须向用户确认。不能未经同意删掉该脚本、修改迁移加载路径、只发布模块补丁或另建 worktree 包。

本轮不部署、不重启后端。Bug 49/50 保持原状态；Bug 51/52 只标代码已修复、待发布。全量发布与生产复验仍未完成。

## 配置保护

10:42 左右只读检查：

- `jixu-ai.env` SHA-256：`65ab73b587c006f4b8df97c2cac16cede872f91eee33315f182c1569c853a1d4`
- `frontend-config.json` SHA-256：`bf176169574fde57761bcc3c12b0f24a9ff373a41477ad9ae07330ada651f800`

与前轮一致；本轮没有改文件或业务配置。哈希只证明这两个文件未变，不替代 AI、文件、第三方配置表的完整业务验证。
