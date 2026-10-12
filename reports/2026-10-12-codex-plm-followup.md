# 2026-10-12 Codex 生产浏览器续测：PLM 产品族与单位字段

观察时间：2026-10-12 09:20–09:42，Asia/Shanghai。
生产地址：`https://jixu-ai.com`。复用当前已登录生产浏览器；页面品牌为“即序科技”，不据此推断租户实名或权限范围。

## 结论

- Bug 121 复核成立，且影响不只设计 BOM：零部件主数据也把单位内部 ID 直接展示给用户；本报告补充页面证据。
- 新增 Bug 123：产品台账列表和产品概览把产品族内部 ID 展示为产品族，用户无法看到可读的产品族名称。
- 本轮只做页面导航和只读 DOM/截图取证，没有保存、上传、下载、审批、删除、配置修改、数据库写入或生产部署。

## Bug 121 补充：单位内部 ID 在多个 PLM 页面暴露

- **页面**：
  - `/plm/product-part/part-master`
  - `/plm/engineering-bom/ebom`
  - `/plm/engineering-bom/product-structure`
  - `/plm/engineering-bom/ebom-to-mbom`
  - `/plm/engineering-bom/release-production-bom`
- **生产观察**：
  - 零部件主数据 `MAT-ERP-RM-001 / 标准原材料` 的单位显示 `2104856930405744642`。
  - 零部件主数据 `MAT-ERP-FG-001 / 标准成品` 的单位显示 `2104856930384773121`。
  - 设计 BOM `EBOM-MAT-ERP-FG-001-A` 的结构行 `MAT-ERP-RM-001` 单位显示 `2104856930405744642`，详情用量文本为 `1 2104856930405744642`。
  - 其余 EBOM 转 MBOM、下发生产 BOM 和产品结构树页面复现同一类单位 ID 暴露，详见上一轮观察报告和本轮截图。
- **证据**：
  - [零部件主数据单位 ID](../evidence/2026-10-12-codex-plm-followup/part-master-unit-id.jpg)
  - [设计 BOM 单位 ID](../evidence/2026-10-12-codex-plm-followup/ebom-unit-id.jpg)
  - [上一轮结构化观察](../evidence/2026-10-12-codex-plm120-122/observations.json)
- **修复边界**：修复应统一使用单位字典/名称映射，不应把主键作为展示值；同时核对 Job 初始化、现有 PLM API 以及新租户初始化，避免只在当前页面做格式化。不要用生产数据库补丁替代代码修复。

## Bug 123：产品族展示内部 ID

- **级别**：P1，产品主数据的分类信息不可读，影响产品检索、结构追溯和工程人员判断。
- **页面**：`/plm/product-part/product-ledger`
- **复现步骤**：
  1. 打开“研发 → 产品与零部件 → 产品台账”。
  2. 查看产品 `MES-PROD-ERP-FG-001 / 标准成品`。
  3. 查看列表“产品族 / 型号”和点击“概览”后的“产品族”。
  4. 刷新页面后再次查看。
- **实际结果**：
  - 列表“产品族 / 型号”显示 `2104856930414133251 / FG-001`。
  - 产品概览“产品族”显示 `2104856930414133251`。
  - 页面没有显示可读的产品族名称；刷新后仍复现。
- **预期**：
  - 产品族应显示产品族名称，型号单独显示型号；内部数据库 ID 不应直接出现在用户界面。
  - 列表、概览、筛选条件、产品结构及下游页面应使用一致的名称映射。
  - 修复应覆盖生产同步/初始化 Job、后端 DTO 和前端展示，且只修复错误来源数据，不覆盖用户手工维护的产品族。
- **源码线索（非生产运行证明）**：
  - 本地后端 `PlmCoreDataFlowGenerateJob` 和 `BusinessSimulationPlmStageService` 的 `categoryName()` 会把物料 `categoryId` 原样作为产品族写入。
  - `MesBasMaterial.categoryId` 关联 `mes_bas_material_category.name`，应核对该名称映射及更新分支。
- **证据**：
  - [产品台账列表产品族 ID](../evidence/2026-10-12-codex-plm-followup/product-ledger-family-id.jpg)
  - [产品概览产品族 ID](../evidence/2026-10-12-codex-plm-followup/product-family-id.jpg)
- **状态**：待修复。

## 验证边界

- 本轮未修改生产数据库、Flyway、Nacos、AI、文件、第三方登录、公众号、企微、数字员工或运行时配置。
- 本轮未执行任何新增、编辑、删除、审核、发布、上传或下载操作。
