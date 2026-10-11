# 2026-10-12 Codex 生产浏览器续测（05:00）

观察时间：2026-10-12 05:00，Asia/Shanghai。  
生产地址：`https://jixu-ai.com`。浏览器会话租户界面为“即序科技”。

## 测试边界

- 使用当前生产浏览器真实登录会话，新开页签直接访问目标路由。
- 只做页面导航、等待加载、打开未保存表单、展开下拉和读取列表。
- 没有保存、审核、弃审、删除、导出、上传、修改配置、写入生产数据库、重启服务或部署。

## 复测结果

### Bug 12：标准质检单单据类型为空

- 路径：`/quality/order` → 新增质检单。
- 新表单生成单号 `ZJD-261012-006`；展开“单据类型”后仍只有“暂无数据”。
- 未保存该表单。
- 证据：[标准质检单单据类型为空](../evidence/2026-10-12-codex-browser-followup-0500/quality-order-document-type-empty.png)。

### Bug 61：MSA 检验单单据类型为空

- 路径：`/quality/msa-order` → 新增 MSA 检验单。
- 新表单生成单号 `ZJD-261012-007`；展开“单据类型”后仍只有“暂无数据”。
- 未保存该表单。
- 证据：[MSA 单据类型为空](../evidence/2026-10-12-codex-browser-followup-0500/msa-document-type-empty.png)。

### Bug 14/15：应收、应付列表没有新增入口

- `/finance/receivableManage/receivable` 可以加载 2 条已有应收记录，但工具栏没有“新增”。
- `/finance/payableManage/payable` 可以加载空态，但工具栏同样没有“新增”。
- 本轮未执行任何财务写操作。

### Bug 81：CRM 商机预计金额仍为零

- 路径：`/crm/jixu/chance?tab=opportunity`。
- 商机 `3612 / ZC-1010-商机001` 阶段为“需求确认”，列表预计金额仍显示 `¥0.00`。
- 本轮未进入编辑或保存。
- 证据：[CRM 商机预计金额为零](../evidence/2026-10-12-codex-browser-followup-0500/crm-opportunity-amount-zero.png)。

### Bug 82：CRM 私海客户列表与统计为空

- 路径：`/crm/menu/customer-operation/private-pool`。
- 私海档案、意向档案、保有档案、全部客户均为 `0`，列表显示“暂无数据”。
- 与商机台账中可见的客户 `ZC-1010-客户001` 不一致。
- 证据：[CRM 私海列表为空](../evidence/2026-10-12-codex-browser-followup-0500/crm-private-pool-empty.png)。

### Bug 83：CRM 报价来源商机无可选项

- 路径：`/crm/jixu/quote` → 新增报价。
- 弹窗可以打开，但“来源商机”下拉没有可选项；客户、商机编号和预计金额均未带入。
- 本轮未保存报价。
- 证据：[报价来源商机为空](../evidence/2026-10-12-codex-browser-followup-0500/crm-quote-source-opportunity-empty.png)。

### Bug 18：历史待办路径仍为 404（入口结论已更正）

- `/oa/bpm/task/todo` 仍显示“即序科技 - 404”。
- 同一登录会话打开正确入口 `/oa/todo` 可以加载“待办任务”页面、筛选栏和空数据表格。
- 证据：[待办更多 404](../evidence/2026-10-12-codex-browser-followup-0500/todo-more-404.png)。
- 后续更正：本节直接访问历史路径的结果不足以判断当前工作台入口；05:14 从工作台实际点击“更多”已进入 `/oa/todo`，入口问题已验证恢复。见[后续真实入口复测](2026-10-12-codex-browser-0510.md)。旧路径 404 的观察保留，但撤回“当前更多入口仍为 404”的推断。

### Bug 86：通知公告入口仍为 404

- `/system/notice` 仍显示“即序科技 - 404”，正文为空。
- 本轮未执行公告新增、发布或修改。
- 证据：[通知公告 404](../evidence/2026-10-12-codex-browser-followup-0500/notice-404.png)。

## 结论

- 本轮没有新增独立 Bug 编号，以上问题均已存在于 `BUG-LIST.md`，本轮补充生产复测证据。
- 待修复问题继续保持待修复；没有因页面可打开或显示空态而把业务链路标记为通过。
