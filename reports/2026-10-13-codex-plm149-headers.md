# 2026-10-13 PLM 配置面板标题修复与回归

## 结论

- Bug 149 已代码修复，Web 提交 `6aec3cfc8`，尚未完整构建或发布生产。
- 12 个复用入口的真实组件渲染回归通过，本地浏览器验证标题恢复且不重复；长说明在窄屏自然换行，没有页头横向溢出。
- 本轮远端缺陷仓库没有 Muse 新提交。生产标签仍未登录，业务模块续测需用户恢复测试登录态。

## 根因与范围

`ConfigBoundaryPage.vue` 主面板和侧栏仅声明 header 插槽，没有给 `ContentWrap` 传 `title`。真实 `ContentWrap` 的页头由 `v-if="title"` 控制，因此标题和副标题根本不渲染，不是权限过滤。

修复按现有文档库用法处理：主面板显式传 `panelTitle`，插槽只保留副标题；侧栏显式传入“联动动作”。不改变全局包装组件，不新增接口或权限，不修改加载、保存、授权或通知逻辑。

覆盖 12 个入口：共享协作、订阅通知，旧配置分组下的 CAD、协同、文件转换、集成映射、开放 API、流程模型，以及新集成分组下的 CAD、ERP/MES 映射、文件转换、WebHook/API。

## 验证证据

- `node --test tests/plmConfigHeaders.test.mjs tests/searchCollapse.test.mjs`：19/19 通过，其中新增 13 项（入口覆盖检查和 12 个实际页面渲染）。
- 测试编译真实页面、配置组件、`ContentWrap` 脚本与模板，使用 Vue 和 Element Plus 渲染；检查每页两个页头、单一主标题、副标题和“联动动作”，没有运行时告警。图标仅为未使用的装饰占位，不参与页头断言。
- 红灯基线 `CFOR_CONFIG_BOUNDARY_BASELINE=7c9625734 node --test tests/plmConfigHeaders.test.mjs`：入口覆盖检查通过，12 个页面均因页头数 `0 != 2` 失败。使用只读 `git show`，没有改写或回滚工作区。
- 定向 ESLint、新增测试/夹具 Prettier、差异检查通过。未重复全量 `vue-tsc`，此前默认堆和 8GB 堆均 OOM；没有完整生产构建证据。
- 本地回归页 `http://127.0.0.1:9151/tests/fixtures/config-headers.html` 使用真实共享、通知和 CAD 页面；axios adapter 主动拒绝所有后端请求，没有联系生产 API 或持久化配置。
- 共享和通知页在 1280×720 下两个页头均显示；主面板页头宽 804，侧栏宽 358，均 `scrollWidth = clientWidth`。
- CAD 页在 1024×720 下两个页头宽 1014，在 390×844 下宽 380，均无页头横向溢出；窄屏主标题和说明自然换行。页面采用原有纵向滚动，未宣称侧栏首屏可见。浏览器临时尺寸已恢复。

截图：

- [共享页 1280](../evidence/2026-10-13-codex-plm149-headers/sharing-1280.jpg)
- [通知页 1280](../evidence/2026-10-13-codex-plm149-headers/notifications-1280.jpg)
- [CAD 页 1024](../evidence/2026-10-13-codex-plm149-headers/cad-1024.jpg)
- [CAD 页 390](../evidence/2026-10-13-codex-plm149-headers/cad-390.jpg)
- [结构化观察](../evidence/2026-10-13-codex-plm149-headers/observations.json)

## 未验证与安全边界

- 本地请求被阻断造成的加载失败提示是夹具行为，不是生产故障；空结果只用于渲染验证。
- 共享授权和通知维护、投递的功能缺口仍由 Bug 147/148 跟踪，不能因标题显示就视为已完成。
- 未验证生产回归、配置读写闭环、新租户初始化或非管理员权限。生产浏览器仍在登录页，没有尝试密码、验证码绕过或 token 注入。
- 保留全部并发工作区改动；只精准提交本轮四个文件。产品仓库未 push，没有部署或重启任何服务；复用的 9151 服务未停止。
- 没有生产数据库写入、历史 Flyway 修改、AI/文件/第三方登录/公众号/企微/数字员工等配置变更，没有共享授权或通知订阅操作。
