# 2026-10-12 Codex 前端修复生产发布与回归

## 发布范围

- 目标：即序科技主站生产 `https://jixu-ai.com`。
- 生产主机：`root@aliCfor`，公网地址 `47.115.223.70`。
- 前端源码仓库：`cfor-admin-vue3`，提交 `dd8686fcb`。
- 本轮修复：
  - CAD 文件库行级“状态”操作与当前行、预览、详情及顶部操作目标统一，并增加异步旧响应保护。
  - 生产计划详情模式只展示持久化成品明细；新增/编辑模式继续保留录入占位行。
- 未修改后端、数据库、Flyway、Nacos、生产运行时配置或租户数据。

## 构建与发布证据

- 定向回归测试：`30/30` 通过，覆盖 CAD 选择同步、异步旧响应保护、仓储详情行数和生产计划详情行数。
- 受影响 Vue 文件 ESLint：通过。
- `git diff --check`：通过。
- `pnpm build:prod:alicfor`：成功，构建耗时约 6 分 40 秒。
- 生产加密 key 校验：通过；构建从生产机读取 key，未在报告中记录明文。
- 本地全量产物 `dist-prod/index.html` SHA-256：
  `92acb3ade13c3979b538fca2dd62580a8ad89f5a923a26f1b087890d470c76de`
- 生产 `/www/wwwroot/jixu-ai-prod/index.html` SHA-256 与本地一致。
- 前端发布目录：`/www/wwwroot/jixu-ai-prod`。
- 发布前回退目录：`/www/wwwroot/jixu-ai-prod.previous-20261012070108`。
- 发布包排除了 `config.json`；生产仍使用 `/www/server/jixu-ai/frontend-config.json`，公网 `https://jixu-ai.com/config.json` 与生产运行时配置一致。
- 后端未重启：`spring_cfor-server-4.service` 仍为 `active`，`http://127.0.0.1:48083/actuator/health` 返回 `{"status":"UP"}`，运行 JAR 未变化。

## 生产浏览器回归

### Bug 114：CAD 行级状态按钮切换预览，却保留另一文件为操作目标

- 刷新最新前端后进入 `/plm/document-cad/cad-file`，生产列表稳定显示 2 条 CAD 文件。
- 点击第二行“状态”后，当前行切换为第二份装配文件，右侧文件详情显示：
  `ERP-FG-001_gearbox_assembly.dwg`。
- 同时预览状态、转换状态、预览产物和顶部/底部操作均绑定第二份文件；没有回到第一份工装文件。
- 结论：已验证。

### Bug 105：生产计划详情固定展示空的成品明细行

- 进入生产计划 `/mes/produce/order`，打开 `JH1002` 详情。
- 详情成品表只显示 1 条真实明细：
  `标准成品 / ERP-FG-001 / 数量 100 / 交货日期 2026-10-20`。
- 序号表和操作表也只显示真实的第 1 行，不再渲染 9 行空占位行。
- 结论：已验证。

## 未覆盖范围

- 本轮没有执行 CAD 转换、下载、上传、签入、签出等写侧动作。
- 没有执行新租户、非管理员角色和生产数据写入回归。
