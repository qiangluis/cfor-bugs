# 2026-10-12 Codex 生产浏览器续测：PLM 产品与零部件入口

执行时间：2026-10-12，Asia/Shanghai。
生产地址：`https://jixu-ai.com`。使用当前生产登录会话，租户界面为“即序科技”。

## 本轮结论

- Bug 113（已有标签维护回显为空）继续复现：在分类 / 标签页打开 `TAG-RELEASE / 发布必选` 的“维护”，编码、名称、适用对象、权限范围、引用页面全部为空；已在总清单中登记，本轮未重复编号。
- 新增 Bug 115：零部件主数据的“版本”入口不跳转，直接打开版本页正常。
- 新增 Bug 116：产品台账的“图文档”入口只改变 URL，页面仍显示工程 BOM 旧内容，未渲染图文档页面。

## Bug 115：零部件版本入口

1. 打开 `/plm/product-part/part-master`，页面加载 `MAT-ERP-RM-001` 和 `MAT-ERP-FG-001` 两条零部件主数据。
2. 点击 `MAT-ERP-RM-001` 行的“版本”，页面仍为零部件主数据，URL 不变。
3. 直接打开 `/plm/product-part/part-revision`，页面正常加载 2 条版本记录：
   `MAT-ERP-RM-001 / A` 和 `MAT-ERP-FG-001 / A`。
4. 因此问题位于主数据页的入口路由，不是版本表无数据或权限导致。

源码复核显示 `goRevision()` 使用命名路由 `PlmCorePartRevisionPage`，但菜单包装页注册名为 `PlmMenu265112Page`。列表上方“版本列表”和详情抽屉复用同一错误目标，需一并修复。

## Bug 116：产品图文档入口

1. 打开 `/plm/product-part/product-ledger`，页面加载产品
   `MES-PROD-ERP-FG-001 / 标准成品`。
2. 点击行内“图文档”。
3. URL 变为：
   `/plm/core/document-cad?productId=1&productNo=MES-PROD-ERP-FG-001&productName=标准成品`。
4. 页面主体仍显示“工程 BOM”“暂无工程 BOM 数据”，没有文档库、文档列表或关联文档内容。
5. 直接打开 `/plm/document-cad/document-library` 可以进入实际文档库，因此当前入口存在内部组件路由与公开菜单路由不一致。

## 证据

- [Bug 115：版本入口无跳转](../evidence/2026-10-12-codex-plm-product-links/bug115-part-revision-no-navigation.jpg)
- [Bug 116：图文档入口保留工程 BOM](../evidence/2026-10-12-codex-plm-product-links/bug116-product-document-stale-ebom.jpg)
- [结构化观察](../evidence/2026-10-12-codex-plm-product-links/observations.json)

## 操作边界

- 本轮只做页面导航、点击只读入口和直接打开已存在页面。
- 未执行新增、编辑、保存、签出、签入、发布、废止、上传、删除、审批或状态流转。
- 未修改生产数据库、Flyway、AI、文件、第三方登录、公众号、企微、数字员工或密钥配置。
- 未修改产品源码、构建或部署。

## 修复验收

- 主数据页三个“版本”入口都能进入实际版本页，并保留部件上下文。
- 产品台账两个“图文档”入口都进入实际图文档页面，并显示产品筛选/关联上下文。
- 真实生产租户回归后，再补至少一次无数据产品和另一个可访问租户/权限范围验证。
