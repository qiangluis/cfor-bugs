# 2026-10-13 WMS Bug 157 修复记录

## 问题

到货通知新增弹窗在 1280×720 视口下内容高度超过可视区域，底部“取消/保存”操作栏被推出视口，需要用户滚动后才能操作。

## 修复

- Web 提交：`aaaaf0937`。
- `src/views/wms/arrivalNotice/index.vue` 的新增、明细和收货开单弹窗统一启用居中布局。
- 弹窗外框使用视口最大高度，标题和底部操作栏保持固定，内容区独立滚动。
- 保留原有字段、保存校验、权限指令、明细表格和收货接口，不改变业务状态或数据口径。
- 新增网络阻断的真实组件回归夹具：`cfor-admin-vue3/tests/fixtures/arrival-notice.{html,ts}`。

## 验证

在本地真实 Vue 组件、1280×720 浏览器视口验证：

- 新增到货通知：弹窗 `top=20`、`bottom=700`，底部按钮 `y=640–672`，内容区 `overflow:auto`。
- 到货通知明细：弹窗 `top=20`、`bottom=700`，20 条明细在内容区滚动，底部无操作栏。
- 收货开单：弹窗 `top=20`、`bottom=700`，底部“生成采购入库单”按钮 `y=640–672`，内容区 `overflow:auto`。
- 页面定向 ESLint、回归夹具 Prettier 和 `git diff --check` 通过。

证据：

- [修复前](../evidence/2026-10-13-codex-wms-dialog-157/arrival-dialog-before.png)
- [修复后](../evidence/2026-10-13-codex-wms-dialog-157/arrival-dialog-after.png)

## 边界

当前只有本地组件验证，尚未构建、发布生产或进行生产浏览器回归；未修改生产数据库、Flyway、运行配置、AI、文件、第三方登录、公众号、企微或数字员工配置。
