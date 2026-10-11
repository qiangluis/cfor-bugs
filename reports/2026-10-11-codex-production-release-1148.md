# 2026-10-11 Codex 前端修复发布与生产浏览器复测

## 范围与状态

- 环境：`https://jixu-ai.com`，主站 `root@aliCfor`，不是局域网 Docker 部署机。
- 目标：Bug 51、52、53、54、56。Bug 55 的批次累计口径另行核对，本轮不修改实物库存余额。
- 当前状态：完整前端于 `2026-10-11 11:56:22 CST` 发布，Bug 51、52、53 的只读导航回归通过，Bug 54 的路由与 Bug 56 的指标取值通过。新增 Bug 57、58 为独立布局缺陷，待修复；库存页面整体可见性/普通鼠标操作尚不合格。
- 生产浏览器沿用已登录会话。既有请求确认 `tenant-id=1`；界面品牌“即序科技”不是租户实名的确认依据。
- 本轮只进行导航、打开并取消表单、查询和筛选。没有生产测试数据写入、审核、弃审、删除、上传或配置修改。

## 代码与检查

| Bug | Web 提交 | 修复 |
| --- | --- | --- |
| 51 | `dd53818e3` | KPI 新增/详情返回正式列表路径，成功导航后再清理页签；保留编辑详情契约和取消导航行为 |
| 52 | `5c7c87ebb` | HR/团队工作台改用动态菜单实际路径，保留权限及状态、待办、直属领导筛选 |
| 53 | `f1c946cb1` | MES 两个工作台的实时库存指向 `/reports/inventory/standingStock` |
| 54 | `e7a1793b7e09600561ccb962f588dbde90bd958f` | 现存量三个快捷按钮统一到正式台账、批次、仓库工作台路径 |
| 56 | `e7a1793b7e09600561ccb962f588dbde90bd958f` | 按全仓实时库位汇总计算有库存/空库位；不取档案默认占用值，不受前 100 行或焦点明细影响 |

- 定向仓储/HR 测试 31/31 通过；本轮新增仓储指标测试 8 项、库存快捷路由测试 5 项。
- `node --test tests/*.test.mjs`：55/55 通过。其中包含当前工作目录其他变更的测试，不代表这些变更全部由本轮开发。
- 最初两项既有 APS 测试缺少主资源，触发当前有效资源校验。对照《APS计划排产关系梳理》的“工序必须有主资源”约束后，仅补齐测试样例，并新增缺资源阻断测试；没有修改或削弱生产排产逻辑。
- 两个仓储 Vue 文件定向 ESLint 和本轮 `git diff --check` 通过。未执行全仓 `vue-tsc`。
- 新/旧租户菜单后缀、无菜单、空库存、零启用数、负数/孤立记录、超过 100 个库位和响应清空均有单元测试。没有创建生产新租户或声称完成新租户真实业务闭环。

## 发布准备

- 使用当前主工作目录构建完整前端，不使用 worktree 或单个生产资源补丁。
- 源码 HEAD 为 `e7a1793b7e09600561ccb962f588dbde90bd958f`。工作目录包含其他会话的未提交改动，因此不能只凭该 SHA 重建全部产物；另存当前源码文件哈希清单。
- 构建前与最终检查的 4,893 个输入文件无变化；清单指纹 `79fac3d890085b62dca5180966ffdf0f564940208b0a087fc71eb3e6b491bacb`。
- 构建入口为 `pnpm build:prod:alicfor`，沿用生产已有 AES 配置，不打印密钥、不改环境文件。
- 已核对实际运行售后模块 JAR 包含评价、客户资产档案创建/更新、评价项删除和自动化扫描接口；没有仅凭源码未提交就断言接口缺失。
- 生产配置备份目录：`/www/server/jixu-ai/backups/web-20261011-1148-e7a1793b7`；配置、环境文件和 Nginx 文件备份/哈希校验通过，备份不提交 Git。
- 当前后端 PID `12376`，启动时间 `2026-10-11 07:05:52 CST`，健康状态 `UP`。
- 当前 JAR：`/www/server/jixu-ai/releases/standard-20261011070543-bug44-50fba370/cfor-server-4.jar`。
- 本轮仅前端修复，不需要新增、合并或执行 Flyway，不重启后端。生产 AI、文件、第三方登录、公众号、企微及数字员工配置不在修改范围。

## 生产浏览器复测

| Bug | 实际结果 | 证据 |
| --- | --- | --- |
| 51 | 从 KPI 列表新增、不保存，稳定页面点击“返回”两次均回到 `/hrm/performance/plan`，新增页签移除，列表渲染；没有新增路由错误 | [返回后的列表](../evidence/2026-10-11-codex-release-1148/bug51-kpi-return.jpg) |
| 52 | “在职”进入 `/hrm/employee?statusCategory=11`；“正在招聘职位”进入 `/hrm/recruit/post`；实际“1 待核算薪资”进入 `/hrm/salary/month-record`，未点击初始化/计算 | [员工](../evidence/2026-10-11-codex-release-1148/bug52-employee-shortcut.jpg)、[招聘](../evidence/2026-10-11-codex-release-1148/bug52-recruit-shortcut.jpg)、[薪资入口](../evidence/2026-10-11-codex-release-1148/bug52-salary-shortcut-header.jpg) |
| 53 | 从 MES 制造工作台点击“实时库存”，实际进入 `/reports/inventory/standingStock`，查询条件、库存主表和库存总量 145 渲染 | [库存查询](../evidence/2026-10-11-codex-release-1148/bug53-mes-stock-shortcut.jpg) |
| 54 | 从现存量页用 AX 按钮操作可进入正式台账、批次、工作台；无 404 空壳。但按钮被裁剪，普通鼠标点击不可达另见 Bug 58，本项仅证明路由修复 | [台账](../evidence/2026-10-11-codex-release-1148/bug54-ledger-shortcut.jpg)、[批次](../evidence/2026-10-11-codex-release-1148/bug54-batch-shortcut.jpg)、[工作台](../evidence/2026-10-11-codex-release-1148/bug54-workbench-shortcut.jpg) |
| 56 | 实时响应后 DOM 指标“现存量 145、在用库位 45、2 个有库存、空库位 43”；布局仍返回旧占用默认值 0/45，证明页面不再误用档案值 | [截图](../evidence/2026-10-11-codex-release-1148/bug56-workbench-metrics.jpg)、[响应与界面取值](../evidence/2026-10-11-codex-release-1148/bug56-workbench-metrics-sanitized.json) |

- 本轮生产复测窗口约 `11:57–12:04 CST`，本轮新增控制台错误 0。
- Bug 51 第二轮曾在切换页面后立即尝试按钮操作，未完成返回；观察稳定表单后实际点击可正常返回。未将过渡态操作当作修复失败或新的业务 Bug。
- 保存后的回退、工资核算、有员工数据的团队工作台和生产新租户真实业务流程未验证，不以只读打开页面替代通过。
- Bug 55 仍显示累计入/出 0，保持待修复。
- 新增 Bug 57：默认 `1280×720` 浏览器、工作台内容宽 `1020px`，标题容器实际仅 `448px`，内部网格最小轨道为 `180+32+240+32+180=664px`，右侧指标位于 `x=1031/1125`，超出标题容器右边界 `974px` 且被 `overflow:hidden` 裁剪。现存量标签也被挤成多行，标题与操作区相互挤压。数据取值正确不代表布局合格，详见独立 Bug 57。
- 新增 Bug 58：默认窗口下现存量右侧列 flex 容器把统计/快捷子区块压成 `29.55–54.23px`，内容却为 `76–219.19px`；子区块 `overflow:hidden`。四个快捷按钮中心点的命中测试全部失败，说明 AX 操作可验证路由，但普通用户不可见、不可点击。见[生产截图](../evidence/2026-10-11-codex-release-1148/bug58-stock-side-layout.jpg)和[尺寸/命中证据](../evidence/2026-10-11-codex-release-1148/bug58-stock-side-layout.json)。

## 已发布产物与保护校验

- 构建：`pnpm build:prod:alicfor` 退出码 0，耗时 `11m26s`；既有 duplicate-key、ASI、依赖 eval 和大 chunk 等警告保留，未以构建通过声明无全仓风险。
- 生产 AES key embedding 校验通过，不输出密钥。
- 完整发布包 SHA-256：`c09b406852f3626e1c2bb9b0839fd6441f173bd16a2afad80d3b09f28a714339`。
- 本机、服务器和公网首页 SHA-256 一致：`71d4e7bc59c116937a9112fc683de4652c5ccb0ff63add5c9acfb37c80d596e2`。
- 前端目录：`/www/wwwroot/jixu-ai-prod`；旧前端回滚目录：`/www/wwwroot/jixu-ai-prod.previous-20261011115618-e7a1793b7`。
- 打包排除 `config.json` 和 `.DS_Store`；公网 `config.json` 与生产外置配置哈希一致。
- 运行时配置、生产环境文件和 Nginx 文件在切换前后 SHA-256 全部一致。
- 后端 JAR 目标、PID 和启动时间完全未变，健康状态 `UP`；没有重启后端、改端口、改 Nginx 或运行 Flyway。
- 首次发布前检查因旧版 systemd 不支持 `systemctl --value` 中止，未切换目录；改用已验证的属性输出后完成检查和发布。GNU tar 忽略 macOS provenance 扩展属性告警，但文件校验通过。
