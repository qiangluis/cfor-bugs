# 2026-10-12 Codex 生产浏览器续测与 Bug 106 发布回归（04:50–04:51）

观察时间：2026-10-12 04:50–04:51，Asia/Shanghai。  
生产地址：`https://jixu-ai.com`。浏览器租户界面为“即序科技”。

## 发布范围

- Web 源码修复提交：`24117585b`。
- 修复内容：在公共 ERP 退货计算文件
  `cfor-admin-vue3/src/views/erp/mixin/index.ts` 补充导入
  `computeValue`，避免采购退货选单联动时出现运行时未定义错误。
- 从当前主目录完整执行 `pnpm build:prod:alicfor`，生产加密 key 校验通过。
- 前端发布包 SHA-256：
  `78fe315e3a33131f710c58e27bffc1fa4719f87908289f92d011d306cb505776`
- 生产前端发布目录：
  `/www/server/jixu-ai/releases/web-standard-return-fix-20261012044929`
- 发布前备份目录：
  `/www/server/jixu-ai/backups/frontend-return-fix-20261012044814`

本次只发布前端，不重启后端、不执行 Flyway、不修改生产数据库。发布包排除了
`config.json`，生产 `/www/server/jixu-ai/frontend-config.json` 保留，哈希仍为：
`bf176169574fde57761bcc3c12b0f24a9ff373a41477ad9ae07330ada651f800`。

## Bug 106：采购退货选单联动触发 `computeValue is not defined`

- 路径：供应链 → 采购退货 → 新增 → 选单。
- 回归操作：选择可退货采购订单 `CGDD261010005`，再确认
  `ERP-FG-001` 明细。
- 结果：
  - 选单弹窗正常打开并展示 1 条可退货采购订单；
  - 订单选择后显示可退货数量 `10`；
  - 确认后供应商 `ZC-1010-供应商002`、关联订单、仓库“不良品仓”、
    存货编码 `ERP-FG-001`、数量 `10`、未税单价 `8.85`、含税单价 `10`、
    税率 `13`、金额 `88.5/100` 均正常回填；
  - 本轮未出现 `ReferenceError: computeValue is not defined`；
  - 未保存退货单，未产生业务数据变更。

结论：Bug 106 已发布，生产浏览器回归通过。该结论只覆盖采购退货选单及公共退货
数量计算链路，不扩大为采购退货保存、审核和库存扣减全流程通过。

## 继续保留的问题

- Bug 105：生产计划 `JH1002` 详情真实 1 行仍渲染 10 行，9 行为空。
- Bug 12：标准质检单新增时“单据类型”下拉仍无选项。

本轮没有新增独立 Bug；未保存、审核、弃审、删除、导出、上传或修改生产配置。
