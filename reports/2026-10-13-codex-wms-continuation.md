# 2026-10-13 WMS 生产浏览器续测

## 环境与范围

- 环境：[https://jixu-ai.com](https://jixu-ai.com)
- 租户：即序科技
- 时间：2026-10-13 14:00–14:30（Asia/Shanghai）
- 操作范围：仓库工作台、到货通知、发货通知、装箱管理、借用归还、跨仓调拨、产品入库、综合报表
- 数据边界：只读查询、打开和关闭未保存表单、打开选择器；没有保存、审核、删除、导出、上传、数据库写入、配置修改、服务重启或生产部署

## 结论

- 现存量工作台、跨仓调拨和借用归还的空明细数量均为 0，未复现历史空行数量误计问题。
- 产品入库新增表单能打开并生成单号，明细加载完成后显示正常字段；本轮未保存。
- 到货通知、发货通知、装箱管理的新增表单要求手工填写采购订单、销售订单、通知单、客户、物料、仓库等内部 ID，没有业务选择器或选单入口，普通用户无法按业务单据完成录入。
- 到货通知新增弹窗在 1280×720 默认视口下内容高度 924px，取消/保存按钮位置超过视口底部；需要滚动后才能看到操作。
- 借用归还刷新后第一次点击明细“存货”不打开选择弹窗，第二次点击才打开并加载 3 条存货；复现于冷启动页面。

## 证据

- [到货通知手工 ID 表单](../evidence/2026-10-13-codex-wms-continuation/arrival-notice-raw-id-form.jpg)
- [发货通知手工 ID 表单](../evidence/2026-10-13-codex-wms-continuation/sales-notice-raw-id-form.jpg)
- [装箱管理手工 ID 表单](../evidence/2026-10-13-codex-wms-continuation/packing-raw-id-form.jpg)
- [借用归还首次点击不弹窗](../evidence/2026-10-13-codex-wms-continuation/borrow-material-cold-first-click-no-dialog.jpg)
- [借用归还第二次点击打开选择器](../evidence/2026-10-13-codex-wms-continuation/borrow-material-cold-second-click-open.jpg)

## 源码核对

- `cfor-admin-vue3/src/views/wms/arrivalNotice/index.vue` 的采购订单、供应商和明细物料字段均为普通输入框。
- `cfor-admin-vue3/src/views/wms/salesNotice/index.vue` 的销售订单、客户和物料字段均为普通输入框。
- `cfor-admin-vue3/src/views/wms/packing/index.vue` 的发货通知、销售订单、客户、物料和仓库字段均为普通输入框。
- `cfor-admin-vue3/src/components/MPopup/src/MPopup.vue` 使用异步组件，第一次点击只挂载组件并等待 `nextTick`，冷启动时 `popupModalRef` 仍可能为空，导致 `modal?.open()` 被跳过。
