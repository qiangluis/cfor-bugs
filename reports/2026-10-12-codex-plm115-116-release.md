# 2026-10-12 Bug 115/116 修复发布与生产回归

## 结论

- Bug 115、Bug 116 已随当前主线完整前端包发布到即序科技生产环境。
- 生产浏览器真实回归通过：零部件版本入口可达且保留上下文；产品台账图文档入口进入正式文档库并正常渲染。
- 本轮只修改前端路由逻辑，没有修改数据库、Flyway、后端、Nacos、AI、文件、第三方登录、公众号、企微、数字员工或运行时配置。

## 代码与构建

- Web 仓库：`cfor-admin-vue3`
- 分支：`dev/develop_5.0.1`
- 修复提交：`2cd4dbd4b fix(plm): route product and part links through public menus`
- Bug 115：`src/views/plm/core/part-master/index.vue` 使用公开菜单路径 `/plm/product-part/part-revision`，保留 `partId / partNo / partName`。
- Bug 116：`src/views/plm/core/product-ledger/index.vue` 使用公开菜单路径 `/plm/document-cad/document-library`，保留 `productId / productNo / productName`。
- 定向 ESLint 通过，`git diff --check` 通过。
- 使用当前工作目录执行 `pnpm build:prod:alicfor`，完整构建成功，耗时约 6 分 42 秒；生产加密 key embedding 校验通过。
- 构建阶段存在既有 Sass、esbuild 和 Vite chunk 警告，没有阻断构建，也与本次两处路由修改无关。

## 生产发布

- 目标：`root@aliCfor`，站点 `https://jixu-ai.com`。
- 生产包：`/www/server/jixu-ai/releases/cfor-web-plm115116-20261012074745-2cd4dbd4b.tgz`
- 包 SHA-256：`d10260b18439a8435171f5394b16826d5fb6117064ea756461aa9a1e10973907`
- 生产首页 SHA-256：`be5fb0d3e9b433175c9b4e52db648a9280a70dd400be55640e18cd3a942eb8a9`
- 发布时间：`2026-10-12 07:49:14 CST`
- 旧前端回退目录：`/www/wwwroot/jixu-ai-prod.previous-cfor-web-plm115116-20261012074745-2cd4dbd4b`
- 受保护配置备份：`/www/server/jixu-ai/backups/cfor-web-plm115116-20261012074745-2cd4dbd4b`
- 包排除 `config.json`，继续使用 Nginx alias 提供的 `/www/server/jixu-ai/frontend-config.json`。
- 发布前后配置指纹保持不变：
  - `frontend-config.json`：`bf176169574fde57761bcc3c12b0f24a9ff373a41477ad9ae07330ada651f800`
  - `jixu-ai.env`：`65ab73b587c006f4b8df97c2cac16cede872f91eee33315f182c1569c853a1d4`
  - `jixu-ai.com.conf`：`004e654d7fd627fb061f1ac11330aafab2427c981b4e58b2e112c7b4a5b3f9fd`
- 后端 `spring_cfor-server-4.service` 保持 active，PID `29507`、JAR 和启动时间未变化；`/actuator/health` 返回 `{"status":"UP"}`。
- 未重启后端、未 reload Nginx、未执行 SQL/Flyway。

## 生产浏览器回归

### Bug 115

1. 打开 `/plm/product-part/part-master`。
2. 点击 `MAT-ERP-RM-001 / 标准原材料` 行的“版本”。
3. 页面进入：
   `/plm/product-part/part-revision?partId=2&partNo=MAT-ERP-RM-001&partName=标准原材料`。
4. 页面标题为“零部件版本”，筛选条件保留主档 ID、部件编码和部件名称，列表返回 1 条版本记录。

### Bug 116

1. 打开 `/plm/product-part/product-ledger`。
2. 点击 `MES-PROD-ERP-FG-001 / 标准成品` 行的“图文档”。
3. 页面进入：
   `/plm/document-cad/document-library?productId=1&productNo=MES-PROD-ERP-FG-001&productName=标准成品`。
4. 页面标题为“文档库”，文档库菜单和文档列表正常渲染，返回 5 条文档。

## 验证边界

- 本轮验证的是生产管理员当前会话、当前已有菜单和只读导航入口。
- 未执行新建版本、签出、签入、发布、废止、上传、删除或文档修改。
- 未额外验证新租户、非管理员权限和没有图文档数据的产品；路由逻辑不依赖当前租户数据。
