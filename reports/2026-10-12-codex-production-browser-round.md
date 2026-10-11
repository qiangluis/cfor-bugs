# 2026-10-12 Codex 生产浏览器续测

观察时间：2026-10-12 03:23，Asia/Shanghai。
生产地址：`https://jixu-ai.com`。复用当前已登录的生产浏览器会话，界面租户品牌为“即序科技”。

## 测试边界

- 本轮只做页面导航、刷新、搜索、打开详情和打开未保存表单。
- 未执行保存、审核、弃审、删除、导出、上传、配置修改、数据库写入或服务重启。
- 销售订单新增表单仅验证默认单号/日期、存货选择弹窗和选单带入，随后关闭表单；没有创建新销售订单。

## 结果

| 范围 | 结果 | 台账 |
| --- | --- | --- |
| 销售订单新增 | 单号和日期完整可读；“添加存货”打开“选择销售存货”；勾选 `ERP-FG-001` 后带入存货清单；未保存 | 历史 Bug 4/5/6 本轮未复现写侧问题 |
| 销售订单列表 | 刷新后固定列 footer 的 DOM 起点与主表均为 `y=571.1796875`，本轮不重复登记 Bug 101；详情日期、单号和价税合计可读，不重复登记 Bug 102 | Bug 101/102 保持已验证 |
| 工作台待办更多 | `/oa/bpm/task/todo` 仍为“即序科技 - 404”；正确 `/oa/todo` 可打开待办列表 | Bug 18 仍待修复 |
| 通知公告 | `/system/notice` 仍为“即序科技 - 404” | Bug 86 仍待修复 |
| 菜单搜索 | 搜索“现存量查询”仍返回两个同名入口：`/wireSideWarehouse/reportForms/standingStock`、`/reports/inventory/standingStock` | Bug 23 仍待修复 |
| 项目工作台日期 | `/project/workbench` 显示本周 `12` 至 `18`，当天为 `10-12 周一`，与当前日期一致 | Bug 25 已验证 |
| 物联运维路由 | `my-order`、`inspection-plan`、`item-topology`、`schedule`、`duty`、`my-inspection` 均能加载对应页面；巡检计划和我的巡检显示业务内容及空数据态 | Bug 24 已验证，仅限路由/组件加载 |

## 证据

- [待办更多 404](../evidence/2026-10-12-codex-browser/todo-more-404.png)
- [通知公告 404](../evidence/2026-10-12-codex-browser/notice-404.png)
- [重复现存量查询入口](../evidence/2026-10-12-codex-browser/duplicate-standing-stock-search.png)
- [项目工作台当前日期](../evidence/2026-10-12-codex-browser/project-workbench-current-date.png)
- [巡检计划页面已加载](../evidence/2026-10-12-codex-browser/inspection-plan-loaded.png)

## 后续修复提示

- Bug 18：生产包仍未包含待办“更多”路径修复，需发布包含 `4fba2c23f3` 的当前完整前端包后再回归。
- Bug 86：需要补齐公告页面实际路由/组件及工作台入口，不能只在菜单注册表中保留启用记录。
- Bug 23：需要明确两个现存量入口的唯一正式事实源，再处理菜单、权限和旧链接兼容，不能只删除其中一个菜单记录。
- Bug 24/25：本轮生产浏览器已验证对应展示/路由恢复，不应继续作为待修复项重复开发；新增问题需要单独复现。
