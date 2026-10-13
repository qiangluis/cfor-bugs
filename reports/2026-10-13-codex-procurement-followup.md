# 供应链续测报告

日期：2026-10-13；执行者：Codex。

## 结论

本轮在生产环境继续走查采购退货、供应商和采购发票入口。采购退货选单回填正常，供应商新增表单已包含编码字段；采购发票发现新增 Bug 154：重复选单后抬头、明细和金额不一致。源码修复已提交，状态为“代码已修复，待发布”，不以定向测试替代生产保存验证。

## Bug 154 生产复现

环境：`https://jixu-ai.com`，界面品牌“即序科技”，已登录 admin 会话；品牌文案不作为数据库租户名称证据。

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

## 本轮入口与回填结果

- 采购退货新增打开后自动生成 `CGTH261013001`，编号规则可用。
- 采购退货“选单”可加载可退货采购订单 `CGDD261010005`，确认后供应商、关联订单、存货、数量、未税单价、含税单价、税率和金额均能回填；浏览器错误日志未出现 `computeValue is not defined`。
- 供应商新增表单已展示“编码”字段，排序默认显示 `0`；本轮未提交供应商数据。

退货和供应商截图仅作为本轮验证证据保存：

- [采购退货选单回填](../evidence/2026-10-13-codex-procurement-followup/purchase-return-selection-ok.jpg)
- [供应商新增编码字段](../evidence/2026-10-13-codex-procurement-followup/supplier-create-code-visible.jpg)

## 数据安全边界

生产浏览器仅验证入口和草稿回填，未保存、审核、删除、导出或修改生产业务记录。打开单据表单可能消耗编号，本轮未做数据库前后差分，不能声称数据库完全零副作用。生产服务与配置未修改。

## 源码修复与验证

Web 提交：`be2109aaa3d9676049f1b81c4208e92f0444ae61`。

变更文件：

- `src/views/erp/purchase/invoice/formDialogTable.vue`
- `src/views/erp/purchase/invoice/invoiceSelection.ts`
- `scripts/tests/purchase-invoice-selection.test.mjs`

既有选择器禁用已选订单，因此保留追加语义；后端按来源订单汇总开票金额，不能按同一订单每条物料重复累计。统一处理追加、移除、金额调整及保存前同步；保留用户选择的发票类型和税率，包括类型 `0`；过滤空占位行、重复来源，保留已有金额调整。

覆盖采购订单、期初入库和委外应付来源；混合来源按后端现有门禁提前拒绝并保留草稿，兼容 `ERP_PURCHASE_ORDER` 与旧 `PurOrder`。不放宽对账开关或审批状态，不改会计和金额事实源。

验证命令：

```sh
node --test scripts/tests/purchase-invoice-selection.test.mjs scripts/tests/init-access-paths.test.mjs scripts/tests/system-safety-defaults.test.mjs
node node_modules/eslint/bin/eslint.js src/views/erp/purchase/invoice/formDialogTable.vue src/views/erp/purchase/invoice/invoiceSelection.ts
node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler src/views/erp/purchase/invoice/invoiceSelection.ts
git diff --check
```

结果：17/17 通过（10 项发票、7 项初始化/安全）；其余命令退出码均为 0。发票测试执行真实 SFC 脚本及模板编译，但 API 为内存替身，不连接生产数据库。

## 发布与剩余边界

- 未执行本轮完整构建或生产发布；不能将此修复登记为“已发布”。
- 当前主目录有另一会话未验收的成本、采购退货、IoT、MES 和后端迁移改动；未覆盖、整体提交或夹带上线，没有换 worktree 发局部包。
- 只读检查生产后端仍为 `standard-202610112210-mail95`，服务 active、health UP；该结果仅代表运行包和健康，不证明业务闭环。
- 没有修改后端、菜单、权限、字典、编号规则、Flyway，或 AI、文件、第三方登录、公众号、企微、数字员工及密钥配置。
- 新租户、非管理员、真实新增/编辑保存与详情回读仍待验证。未确认专用生产测试租户/账号，不在 admin 正式财务或库存数据上执行写入测试。
