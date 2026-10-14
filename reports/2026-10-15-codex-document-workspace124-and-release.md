# 生产版本复核与 PLM 工作区修复

日期：2026-10-15，Asia/Shanghai。

## 结论

- 生产仍是 2026-10-14 22:44 完成的完整发布，不是当前最新源码。
- 昨天的统一存货表单改造已包含在该包；独立生产浏览器能看到单位组/方案和七个页签。
  不能据此判断用户当前页面为何不同，也不能直接归因于缓存。
- Bug 124 已独立修复、提交和推送，状态为代码已修复、待发布。
  完整未发布修复累计 15 项，未到 20 项门槛，本轮不发布。

## 生产实物核验

本轮 SSH 只读核对固定目标 `root@aliCfor`，服务
`spring_cfor-server-4.service` 为 active/running，启动时间为
2026-10-14 22:38:57 CST；48083 内网健康检查为 UP。
实际 JAR 为：

```text
/www/server/jixu-ai/releases/standard-20261014-2205-current/cfor-server-4.jar
```

| 核验项 | 结果 |
| --- | --- |
| 后端发布提交 | `c77a4f534` |
| Web 发布提交 | `89f562734` |
| JAR SHA-256 | `8f97829441a524605d6312ffe7f8c4ebb2e6b9edb866d71e5124c0dbcf80b882` |
| index SHA-256 | `ca994e5c3a27f3bdf403465bbb534ae7f61fb3b947a705fb1516aa14ae45a4eb` |
| 存货表单 SHA-256 | `81446cfe8b1c839df556cbe5f342a6251dadcdf1791377af215e8ed636a2bd09` |

公网 `/index`、`/assets/BaseMaterialForm-BQvJRDiE.js` 返回 200，
内容摘要与生产文件及已登记发布包一致。当前 `base/material` 与 ERP 兼容
入口源码对发布提交没有差异，ERP 新入口也复用统一存货表单。

全新浏览器使用已授权测试账号只读打开 `/settings/erp/material` 的已有存货。
实际加载上述表单资源，单位组/方案存在，七页签为存货属性、存货控制、
包装、质量、存货描述、自定义项、附件信息；旧成品/组装件/齐套属性不再展示。
没有保存数据或触发新增编号。

但初始化存货的建档人回显仍返回业务码 500，页面仍有
`Cannot read properties of undefined (reading 'find')`。
这是 Bug 193 的待发布修复，不把页面版本确认说成整个业务无错误。
证据中的 `roleContainerWidth` 是弹层外部容器宽度，不冒称实际表单宽度；
字典读取原始返回码保留在 `dictionaryResponses`，其中 200 不计为失败。

- [存货实测记录](../evidence/2026-10-15-codex-document-workspace124/material-release/result.json)
- [本轮存货截图](../evidence/2026-10-15-codex-document-workspace124/material-release/material-form.png)

## Bug 124 的生产事实

测试账号：福奇科技。只读打开两条既有路由；阻止非登录、非明确只读的业务写请求。

| 页面 | 1280px 生产测量 |
| --- | --- |
| 在线预览与批注 | 页面及右侧批注面板右边界 1400px，新增批注按钮右边界 1389px |
| 版本与迭代 | 页面右边界 1320px，修订面板右边界 1372px，顶部上传按钮右边界 1309px |

外层被裁切时，文档滚动宽度仍可能为 1280px，不能仅以
`documentElement.scrollWidth === clientWidth` 排除右侧内容不可见。
本轮同时测量面板与按钮实际边界。

生产迭代列表在该账号下为空，没有补充测试图文档或进行签出、签入、上传。

- [生产测量 JSON](../evidence/2026-10-15-codex-document-workspace124/production/result.json)
- [生产预览页](../evidence/2026-10-15-codex-document-workspace124/production/preview-1280.png)
- [生产迭代页](../evidence/2026-10-15-codex-document-workspace124/production/iteration-1280.png)

## 代码与回归

Web 提交：`a0a051989`。
推送分支：`bugfix/production-handover-plm-20261015`。
只提交两个页面、一个局部 SCSS mixin、一个浏览器脚本和两份夹具，
未夹带其他会话的权限、初始化、打印、ERP 等未提交改动。

主要变更：

- 两页移除 1160/1080px 的最小宽度，内容区允许收缩；按实际容器宽度堆叠面板。
- 保留桌面预览三列和迭代主表/修订面板；表格内部水平滚动仍用于访问所有字段。
- 面板调用补充 `ContentWrap` 的 title 参数，恢复此前未渲染的面板标题和刷新预览入口。
  没有修改全局 ContentWrap 的标题契约。
- 修订详情使用固定标签的单列布局，长值换行；窄屏分页换行，保留每页数量、页码和跳页。
- 没有改变 API、修订上传、签入签出和批注业务逻辑；
  Bug 117 的固定演示批注与无新增功能仍未修复，不并入本项结果。

验证命令：

```bash
node scripts/tests/plm-document-workspace.browser.mjs
node --test tests/plmDocumentSelection.test.mjs tests/plmEbomCompare.test.mjs scripts/tests/project-handover-record.test.mjs
```

真实页面组件、正式 API 客户端和 Element Plus 在本地 Vite 9151 的隔离夹具运行，
只使用合成内存数据，拒绝非 GET 请求和业务后端/外部网络。
两页分别检查 1280、1440、1920、768、390px：面板、标题、主要按钮、
分页控件均在内容区内；1280px 时两页右边界均为 1260px。
文件 A/B 切换能更新预览/修订详情，上传修订弹窗可打开并取消，没有写请求。
重新注入原最小宽度后，两页都再次越过视口，负向检查通过。

56 项相关回归、定向 ESLint、Prettier、真实 SFC/Sass 编译及 diff 检查通过。
这些相关测试包含交接和其他共享组件，并非 56 项 Bug 124 专属测试。
本轮未执行全项目 vue-tsc 或完整生产构建，未完成生产修复后业务验收。

- [本地浏览器结果](../evidence/2026-10-15-codex-document-workspace124/regression/result.json)
- [56 项相关测试](../evidence/2026-10-15-codex-document-workspace124/regression/related-tests.tap)
- [1280px 预览页](../evidence/2026-10-15-codex-document-workspace124/regression/preview-1280.png)
- [1280px 迭代页](../evidence/2026-10-15-codex-document-workspace124/regression/iteration-1280.png)
- [390px 迭代页](../evidence/2026-10-15-codex-document-workspace124/regression/iteration-390.png)

## 发布与保护

当前完整、已提交的待发布独立修复：
193、162、164、160、161、194、12/61、195、159、94、30、196、197、119、124，
合计 15 项。12/61 同根只计一项，172/198 的部分结果不计数。

本轮未部署、未重启、未运行 Flyway，未修改生产业务数据、Nginx、加密配置，
或 AI、文件、第三方登录、公众号、企微、数字员工配置。
达到 20 项后仍需从当前主工作目录执行完整前后端构建、备份、
历史迁移核对和恢复库预演，再登记实际已发布范围；不能提前写已发布。
