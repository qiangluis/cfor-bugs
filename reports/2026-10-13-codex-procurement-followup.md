# 供应链续测报告

日期：2026-10-13；执行者：Codex。

## 结论

本轮在生产环境继续走查采购退货、供应商和采购发票入口。采购退货选单回填正常，供应商新增表单已包含编码字段；采购发票发现新增 Bug 154：重复选单后抬头、明细和金额不一致。

## Bug 154 生产复现

环境：`https://jixu-ai.com`，租户“即序科技”，已登录 admin 会话。

1. 打开供应链 → 采购发票 → 新增。
2. 第一次选单选择 `CGDD261010005`，选择发票类型“普通发票”。
3. 再次打开“选单”，追加同一供应商的 `CGDD261010004`。
4. 页面出现两行有效明细：
   - `CGDD261010005`，开票金额 100.00；
   - `CGDD261010004`，开票金额 100.00。
5. 但抬头采购单号只有 `CGDD261010004`，抬头开票金额仍为 100，发票类型清空；同时存在空白占位行。
6. 点击取消关闭草稿，未提交任何发票。

证据：

- [追加选单后抬头与明细不一致](../evidence/2026-10-13-codex-procurement-followup/invoice-reselection-header-mismatch.jpg)
- [再次选单前已选择普通发票](../evidence/2026-10-13-codex-procurement-followup/invoice-type-before-reselection.jpg)

## 已验证正常

- 采购退货新增打开后自动生成 `CGTH261013001`，编号规则可用。
- 采购退货“选单”可加载可退货采购订单 `CGDD261010005`，确认后供应商、关联订单、存货、数量、未税单价、含税单价、税率和金额均能回填；浏览器错误日志未出现 `computeValue is not defined`。
- 供应商新增表单已展示“编码”字段，排序默认显示 `0`；本轮未提交供应商数据。

退货和供应商截图仅作为本轮验证证据保存：

- [采购退货选单回填](../evidence/2026-10-13-codex-procurement-followup/purchase-return-selection-ok.jpg)
- [供应商新增编码字段](../evidence/2026-10-13-codex-procurement-followup/supplier-create-code-visible.jpg)

## 数据安全边界

本轮只读验证和草稿回填，未保存、审核、删除、导出或修改任何生产业务数据。产品仓库和生产服务未修改。
