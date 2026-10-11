# 2026-10-12 Codex 生产浏览器续测补充

观察时间：2026-10-12 03:37–03:40，Asia/Shanghai。
生产地址：`https://jixu-ai.com`。浏览器租户界面为“即序科技”。

## 测试边界

- 本轮只做生产页面导航、等待异步数据、打开/关闭未保存表单和读取页面/控制台状态。
- 未执行保存、审核、弃审、删除、导出、上传、配置修改、数据库写入、服务重启或生产部署。

## 新发现

### Bug 105：生产计划详情空占位行

- 页面：生产 → 生产计划 → `JH1002` 详情。
- 真实成品明细为 1 行：`ERP-FG-001 / 标准成品 / 数量 100`。
- 页面详情成品表固定渲染 10 行，其中 9 行为空；序号表和操作表也渲染 1–10，空行显示禁用“删除”。
- DOM 结构化观察见 [production-plan-detail-empty-rows.json](../evidence/2026-10-12-codex-browser/production-plan-detail-empty-rows.json)；截图见 [production-plan-detail-empty-rows.jpg](../evidence/2026-10-12-codex-browser/production-plan-detail-empty-rows.jpg)。

## 既有问题复测

### Bug 82：CRM 私海列表与工作台统计不一致

- CRM 工作台等待异步请求完成后显示“私有客户总数 2”“商机总数 1”。
- 稳定打开 `/crm/menu/customer-operation/private-pool` 并等待列表完成后，私海档案总数、全部客户和列表记录均为 0。
- 证据见 [crm-dashboard-private-count.jpg](../evidence/2026-10-12-codex-browser/crm-dashboard-private-count.jpg)、[crm-private-pool-zero.jpg](../evidence/2026-10-12-codex-browser/crm-private-pool-zero.jpg) 和 [crm-dashboard-private-count.json](../evidence/2026-10-12-codex-browser/crm-dashboard-private-count.json)。

## 正常抽查

- 生产工作台、生产计划列表/详情：可打开，计划 `JH1002` 详情真实字段和 BOM 信息可见。
- 项目工作台：项目经理切换到实施顾问后，当前日期仍为 `10-12 周一`，未复现旧日期回退。
- 协作项目：新建表单空提交能显示项目编号、名称和负责人必填校验，随后取消，未保存。
- 质检工作台/质检单新增：页面和表单可打开，单号 `ZJD-261012-001` 自动生成；单据类型下拉为空，与既有 Bug 12 一致。
- 仓库工作台/跨仓调拨新增：页面和表单可打开，单据日期默认值仍为带时间的 `2026-10-12 03:37:44`，与既有 Bug 30 一致；未保存。
- HR 工作台/员工新增/考勤：员工入职信息包含“入职状态”“聘用形式”，考勤组和打卡概况/明细可加载，未执行新增、删除或打卡写入。
