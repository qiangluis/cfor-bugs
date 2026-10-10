# 修复日志

> Codex 维护，记录修复提交、生产验证证据和剩余复测项。
> 最终“已验证 / 打回”状态仍以 Muse 维护的 `BUG-LIST.md` 为准。

## 本次生产验证基线

- 环境：`https://jixu-ai.com`，生产主机 `root@aliCfor`
- 后端：`5e45f924c3f7fab01c0c54b6876cdfbf2b1d11b7`
- 前端：`a5aa0af8d593631539b62c1c968ff7c5d3c792b2`
- 生产后端包：`standard-20261010133843-erp-init-latest-5e45f924c/cfor-server-4.jar`
- JAR SHA256：`6ffecee402c484f07522a92eccee345f76fcba86793a10b9f908589890b3faac`
- 健康检查：`{"status":"UP"}`
- Flyway：`202610101800`、`202610101900` 均 `success=1`
- 编号规则：`mes_sys_fill_rule` 平台模板租户共 71 条；本次涉及的 4 条规则均已存在

验证说明：即序科技生产租户当前初始化状态仍是“第一页未确认”，业务路由会被引导中心接管。
本轮为了避免修改生产初始化状态，只在测试浏览器会话内覆盖 `get-permission-info` 的
`onboardingRequired/landingSource`，生产配置和业务数据未写入。单据取号会正常消耗流水号。

---

## 2026-10-10 23:30 生产浏览器复测

- 环境：`https://jixu-ai.com`，租户：即序科技；全程未执行保存、审核、弃审、出入库等生产写操作。
- Bug 10：存货档案新增表单可以打开，编号规则自动预填 `CH261010006`；保存动作未点击，原“保存按钮无响应”仍以既有证据为准。
- Bug 12：质检单新增表单的“单据类型”下拉打开后显示“暂无数据”，待检类型仍不可选，问题可复现。
- Bug 13：CRM → 私海客户页面已看到独立的“新增客户”按钮，未复现被“重置”遮挡的问题。
- Bug 14：财务 → 应收单列表工具栏仅有“搜索/重置/批量审核/批量弃审”，仍没有“新增”入口。
- Bug 15：财务 → 应付单列表工具栏仅有“搜索/重置/批量审核/批量弃审”，仍没有“新增”入口。
- Bug 16：员工档案新增表单仍展示“部门编号/岗位编号”数字步进器，字段中仍没有“入职状态”；本轮未点击保存。
- Bug 17：通过项目菜单进入“我的项目”后，“新建项目”表单可以打开；本轮未点击保存，因此不改变原待修复状态。
- Bug 18：直接访问待办“更多”目标 `https://jixu-ai.com/oa/bpm/task/todo`，生产页面显示“即序科技 - 404”。
- Bug 22：仓库 → 报表 → 现存量查询页面顶部和 3D 仓位仍显示库存数据，但“库存主表”加载后无明细、记录数为 0，并出现两次“系统异常”；控制台记录 Vue runtime error。已在 `BUG-LIST.md` 登记。
- 其他观察：生产前端控制台持续打印多个 `skip invalid backend menu component` 警告（`my-order`、`inspection-plan`、`item-topology`、`schedule`、`duty`、`my-inspection` 等维护菜单），本轮先作为发布质量风险记录，未单独新增 Bug，避免与菜单缺失问题重复计数。

---

## 2026-10-11 00:20 生产浏览器继续走查

- 环境：`https://jixu-ai.com`，租户：即序科技；全程未执行保存、审核、弃审、出入库等生产写操作。
- 已复现 Bug 12：质检单新增表单的“单据类型”下拉展开后仍显示“暂无数据”。
- 已复现 Bug 22：两条“现存量查询”入口均显示库存总量 150、可用数量 150，但“库存主表”始终无明细、共 0 条记录；第二条入口 `/reports/inventory/standingStock` 同样复现。
- 新增 Bug 23：全局菜单搜索“现存量查询”返回两个同名入口，路径分别为 `/wireSideWarehouse/reportForms/standingStock` 和 `/reports/inventory/standingStock`，已写入 `BUG-LIST.md`。
- 本轮抽查：销售订单、客户信息、员工档案、项目工作台、我的项目均能打开；员工新增表单可打开，仍保留“部门编号/岗位编号”数字步进器这一既有体验问题。
- 未执行任何生产保存、审核、出入库、删除或配置修改；本轮未修改 CFOR 产品代码，也未部署生产。

---

## Bug 1：供应商新增 - 后端报编码不能为空

- 状态：Muse 已验证（2026-10-10 14:29）
- 修复 commit：
  - 后端：`f0ebf740aef65625d8e9813626c7914f293db185`
  - 前端：`ad07bf23e718507276732ae844079bb32f133278`
- 修复说明：供应商保存 VO 不再强制要求编码；生产表单补齐“编码”字段，并提示“不填则由系统自动生成”。
- 生产证据：以空编码调用供应商更新接口，返回“公共客商不存在”而非“供应商编码不能为空”，说明原后端校验已移除。
- Muse 复测：生产表单已有“编码”字段，`ZC-1010-供应商002` 新增成功。

## Bug 2：请购单 - 编号规则缺失

- 状态：Muse 已验证，已在 `BUG-LIST.md` 登记
- 修复 commit：`4bfd3f056c896f9f59bdb59fc0ef20f9f029b72d`
- 修复说明：补齐平台模板租户缺失的编号规则，租户已有规则不覆盖，新旧租户均可复用模板回退或初始化复制。
- 生产证据：Muse 复测生成单号 `CGSQ261010001`；本轮接口验证生成 `CGSQ261010001/002`，无规则缺失错误。

## Bug 3：请购单 - 存货行加不上

- 状态：修复完成，待 Muse 复测
- 修复 commit：`ad07bf23e718507276732ae844079bb32f133278`
- 修复说明：取号失败不再阻断弹窗初始化，避免表格列和增行/选单入口未渲染。
- 生产证据：真实浏览器打开请购单新增弹窗，点击“增行”后存货表格数据行由 20 行变为 21 行。
- 剩余验证：选单带回存货行由 Muse 按原操作路径复测。

## Bug 4：销售订单 - 编号规则缺失

- 状态：Muse 已验证（2026-10-10 14:29）
- 修复 commit：
  - 后端：`f0ebf740aef65625d8e9813626c7914f293db185`
  - 后端：`4bfd3f056c896f9f59bdb59fc0ef20f9f029b72d`
- 修复说明：补齐 `erp_sale_no`，并让前端取号失败不再阻断弹窗。
- 生产证据：真实浏览器打开销售订单新增弹窗，订单单号自动生成 `XSDD261010005`，无编号规则错误。
- Muse 复测：单号自动生成 `XSDD261010002`，无报错。

## Bug 5：销售订单 - 加行异常

- 状态：修复完成，待 Muse 复测
- 修复 commit：
  - 后端：`4bfd3f056c896f9f59bdb59fc0ef20f9f029b72d`
  - 前端：`9ab0822ba4040e7b007c06e717a44fd0973d2336`
- 修复说明：补齐销售订单及存货编码规则；“添加存货”改为销售存货选择器，不再打开存货主数据新增表单。
- 生产证据：点击“增行”后表格数据行由 20 行变为 21 行；点击“添加存货”弹出标题为“选择销售存货”的选择弹窗，未出现 `base_wms_stock_no` 编号规则错误。

## Bug 6：销售订单 - 保存静默失败

- 状态：修复完成，待 Muse 复测
- 修复 commit：`a5aa0af8d593631539b62c1c968ff7c5d3c792b2`
- 修复说明：保存异常改为显式错误提示，不再无提示停留。
- 生产证据：未选择客户直接点击保存，页面显示“请选择客户”，未发起创建请求，弹窗保持打开。
- 剩余验证：完整填写客户和存货后的保存链路由 Muse 复测。

## Bug 7：采购入库 - 编号规则缺失，表单打不开

- 状态：Muse 已验证（2026-10-10 14:29）
- 修复 commit：
  - 后端：`f0ebf740aef65625d8e9813626c7914f293db185`
  - 后端：`4bfd3f056c896f9f59bdb59fc0ef20f9f029b72d`
- 修复说明：补齐 `batch_no` 等采购入库链路编号规则。
- 生产证据：真实浏览器打开采购入库新增，单号自动生成 `CGRK-261010-001`，未出现 `batch_no` 规则错误。
- Muse 复测：表单正常打开，单号 `CGRK-261010-001` 自动生成。

## Bug 8：存货档案 - 保存静默失败

- 状态：部分修复，保存问题转 Bug 9
- 修复 commit：
  - 后端：`f0ebf740aef65625d8e9813626c7914f293db185`
  - 后端：`4bfd3f056c896f9f59bdb59fc0ef20f9f029b72d`
- 修复说明：补齐 `base_wms_stock_no`，存货新增弹窗不再因取号失败初始化中断。
- 生产证据：真实浏览器可正常打开存货新增弹窗，未出现 `base_wms_stock_no` 错误；直接保存显示“请输入名称”，未发起创建请求。
- Muse 复测：编号规则已生效，自动预填 `CH261010001～005`；填完整表单后保存按钮仍无响应。

## Bug 9：存货档案 - 保存按钮无响应

- 状态：待 Codex 定位
- 来源：Muse 于 2026-10-10 14:29 新增
- 复现：新增存货，填编码 `ZC-1010-002`、名称“走查存货002”、分类原材料、单位件，点击“确定”或“保存并复制”。
- 现象：对话框无响应，无报错、不关闭，刷新搜索无记录。
- 当前判断：编号规则已修复；保存无响应是独立问题，下一步需要抓取保存请求、前端校验状态和后端响应。

## 非阻断瑕疵 1：客户新增排序显示与校验不一致

- 状态：修复完成，待 Muse 复测
- 修复 commit：`9ab0822ba4040e7b007c06e717a44fd0973d2336`
- 修复说明：客户新增/重置时排序默认值由 `undefined` 改为 `0`。
- 验证边界：当前生产自动化账号没有客户信息页入口，本轮仅完成代码复核，待 Muse 页面复测。

---

## 协作结论

## 2026-10-10 23:50 继续生产浏览器复测

- 环境：`https://jixu-ai.com`，租户：即序科技；本轮仅执行页面导航、下拉展开和只读查询，没有保存、审核、弃审、出入库或其他生产写操作。
- Bug 12：质检单新增表单的“单据类型”下拉仍显示“暂无数据”；表单已打开，未提交。
- Bug 18：工作台“待办中心 → 更多”仍跳转 `/oa/bpm/task/todo` 并显示 404；从“行政 → 协同办公 → 待办任务”进入 `/oa/todo` 可正常显示待办任务列表。确认是工作台快捷入口路径错误，不是 BPM 待办功能整体不可用。
- Bug 22：通过仓库 → 报表 → 现存量查询进入，仓库布局、库存总量 150、可用数量 150 可以显示；“库存主表”仍为“暂无数据 / 共 0 条记录”，加载后弹出 3 次“系统异常”。
- 生产浏览器控制台仍反复出现无效后端菜单组件警告：`my-order`、`inspection-plan`、`item-topology`、`schedule`、`duty`、`my-inspection`。本轮作为发布质量风险保留观察，未单独新建重复 Bug。

## Bug 13：CRM 私海客户 - 新增按钮被遮挡

- 状态：已发布（2026-10-10 16:47）
- 根因：CRM 客户列表搜索栏的操作按钮共用一个未约束的行内表单项，按钮在窄布局下发生挤压，导致“新增”按钮被“重置”区域遮挡。
- 修复说明：为客户列表操作组增加可换行的 flex 布局并清除按钮默认左间距，保证搜索、重置、新增、导入、导出和 AI 分析按钮不重叠。
- 产品仓库：`cfor/cfor-admin-vue3`
- 关键文件：`src/views/crm/customer/index.vue`
- 代码 commit：`ddad160fe155b6db025ebe2151f7b59cdb88ca0b`
- 发布版本/时间：前端标准版，2026-10-10 16:47（`/www/wwwroot/jixu-ai-prod`）
- 构建/部署命令与结果：`NODE_OPTIONS='--max-old-space-size=12288' pnpm exec vite build --mode prod` 成功；按《即序 AI 标准版生产部署手册》打包并发布前端，排除 `config.json`，保留 `/www/server/jixu-ai/frontend-config.json` 和 Nginx `/config.json` alias；生产 `https://jixu-ai.com/` 与 `/config.json` 均返回成功。
- 验证结论：由 Muse 负责复测，Codex 不登记“已验证”。

- Codex 已拉取 Muse 的 `BUG-LIST.md`，并登记全部修复及复测结果。
- Muse 已验证：Bug 1、2、4、7。
- Codex 生产实测待 Muse 确认：Bug 3、5、6。
- Bug 8 的编号规则已修复，保存无响应已转为 Bug 9，等待下一轮定位。
- 本轮仅将 Bug 13 状态登记为“已发布”；Bug 10、11、12 仍待修复。

## 2026-10-10 23:04 本轮处理（未发布）

- 用户已澄清：20 个阈值只限制生产部署，低于阈值仍应修复并提交安全可推进的产品代码。
- 开始时待处理 Bug 11 个；同步 Muse 新增 Bug 21 后为 12 个，仍未达到发布阈值。
- 本轮未构建生产包、未部署、未执行生产健康检查，未修改 `BUG-LIST.md` 或 Muse 的复测结论。

### Bug 14：FMS 应收单 - 无新增按钮

- 状态：阻塞/未发布
- 定位结果：应收单列表没有新增入口，但已有 `receivableForm.vue` 的客户、金额、日期等字段全部禁用，且 `add-row=false`；只增加按钮无法完成手工新增。
- 阻塞原因：当前页面围绕来源单据展示应收，手工新增的单据类型、明细来源及金额口径尚未明确，不能仅凭新增接口存在就开放财务写入。需要先确认手工新增应走普通应收、其他应收还是来源单据生成链路。
- 处理说明：`2468182ce` 中试接的新增入口及初始化修改已通过后续提交 `ca999a746` 完整撤回，最终应收相关文件相对本轮开始没有变更；不计为修复完成。
- 产品仓库：`cfor/cfor-admin-vue3`
- 关键文件：`src/views/erp/finance/receivableManage/receivable/index.vue`、`src/views/erp/finance/receivableManage/receivable/receivableForm.vue`
- 代码 commit：尝试 `2468182ce`，撤回 `ca999a746`，均已 push。
- 检查结果：撤回后定向 ESLint 和 `git diff --check` 通过；未执行业务写入。
- 发布版本/时间：无，未部署生产。

### Bug 15：FMS 应付单 - 无新增按钮

- 状态：阻塞/未发布
- 定位结果：应付单列表没有新增入口，但已有 `payableForm.vue` 的供应商、金额、日期等字段禁用，且 `add-row=false`；只增加按钮无法完成手工新增。
- 阻塞原因：`FinPayableServiceImpl.beforePersistAdd` 按来源明细汇总金额，并对 `201*` 类型校验唯一来源单据；在未明确手工新增的类型和来源规则前，不能自行改变财务口径。
- 处理说明：`2468182ce` 中试接的新增入口已通过后续提交 `ca999a746` 撤回，最终应付相关文件相对本轮开始没有变更；不计为修复完成。
- 产品仓库：`cfor/cfor-admin-vue3`
- 关键文件：`src/views/erp/finance/payableManage/payable/index.vue`
- 代码 commit：尝试 `2468182ce`，撤回 `ca999a746`，均已 push。
- 检查结果：撤回后定向 ESLint 和 `git diff --check` 通过；未执行业务写入。
- 发布版本/时间：无，未部署生产。

### Bug 16：HRM 员工档案 - 保存报错字段不匹配

- 状态：修复完成，待批量发布/未发布
- 根因：员工列表页使用旧版内联表单及旧字段 `employeeNo/employmentType/entryDate`，与当前 HRM 员工接口要求的 `jobNumber/entryStatus/type/entryTime` 不一致。
- 修复说明：移除旧版内联表单，复用仓库已有的 `EmployeeForm.vue`，由其按当前 HRM 契约完成入职状态、聘用形式、入职时间等校验和提交。
- 产品仓库：`cfor/cfor-admin-vue3`
- 关键文件：`src/views/hrm/employee/index.vue`、`src/views/hrm/employee/EmployeeForm.vue`（复用，未改动）
- 代码 commit：`2468182cea7c6df2a9750642018ef2541d804258`，已 push；后续 `ca999a746` 只撤回应收/应付尝试，保留本项修复。
- 检查命令与结果：`pnpm exec eslint src/views/hrm/employee/index.vue`（含本轮财务目标文件的定向检查）退出 0；`git diff --check` 退出 0；通过 `vue/compiler-sfc` 对员工列表和 `EmployeeForm.vue` 解析、脚本编译及模板编译，均返回 `SFC_COMPILE_PASS`。
- 检查边界：`pnpm ts:check`（`vue-tsc --noEmit`）受项目全量类型检查内存限制失败（Node heap OOM，约 4GB，退出 134）；未执行生产构建及业务页面复测，不据此宣称完整业务验证通过。
- 发布版本/时间：无。当前待处理 Bug 12 个，未达到 20 个发布阈值，未部署生产。

### 本轮阻塞项

- Bug 10、11、12、19、20：对应后端调用链被其他会话的大量未提交改动占用，无法安全区分和提交。
- Bug 14、15：手工新增的财务来源及金额口径待确认，尝试性入口已撤回，不计为完成。
- Bug 17：`/pms/pm/project` 与旧 `/pms/project` 两套项目模型及归属未明确，暂不擅自修改。
- Bug 13、18：本轮未修改，继续保留待处理状态。
- Bug 21：Muse 于本轮收尾同步时新增，留待后续定位。

## 2026-10-10 23:55 本轮处理（未发布）

- 初始协作基线：`a5ff274a6e5e930c3736059b2e70b35ca1435df1`，本轮 `git pull --rebase` 均成功；收尾确认共享仓库已包含另一会话的 `c22f9fea73364dcb08c80e42983d38eb782a5286` 生产观察补充，其中 `/oa/todo` 可打开的记录与本轮代码定位一致。本轮仅提交自己的 `FIX-LOG.md` 增量，保留该会话的 Bug 清单和复测记录。
- 数量统计：状态为“待修复/打回”的条目共 13 个（Bug 10–22），未达到 20 个生产发布阈值；本轮只完成 Bug 18 的产品修复。
- 来源门禁：后端、Web 均成功执行 `git fetch origin dev/develop_5.0.1`；修改前本地与远端分别一致于后端 `5e45f924c3f7fab01c0c54b6876cdfbf2b1d11b7`、Web `ca999a7461c7459cee4f99946e1e8bd32886f371`。
- 上轮 Bug 16 的 `2468182cea7c6df2a9750642018ef2541d804258` 修复仍保留在 Web 主线，继续待批量发布；不因生产页面仍显示旧表单而重复提交或登记为已发布。
- 未执行生产构建、部署、数据库写入、配置修改、小程序上传或生产健康检查；本轮未修改 `BUG-LIST.md`、Bug 状态或其他会话的复测内容。

### Bug 18：BPM 待办列表 - 页面 404

- 状态：修复完成，待批量发布/未发布
- 根因：首页待办“更多”、企业 AI 首页及全局 AI 引导硬编码 `/oa/bpm/task/todo`；现有菜单中待办、已办、抄送和我的流程直接归属 `/oa`，实际路径为 `/oa/todo`、`/oa/done`、`/oa/copy`、`/oa/my`。
- 调用链与证据：`Home/index.vue` 加载 `PersonalWorkbench.vue`，`openTodoList` 使用当前标签的路径；`routerHelper.generateRoute` 按父子菜单路径生成路由。基线 Flyway 中菜单 1207/1208/2713/1201 的父级均为 40738，一级路径为 `/oa`；`V202610031600__rebuild_system_menu_navigation_tree.sql` 调整 OA 归属时保留绝对 `/oa`，未给这些页面增加 `bpm/task` 层级。待办页继续使用既有 `TaskApi.getTaskTodoPage`，不改变后端接口或权限。
- 修复说明：将个人工作台与旧首页四个流程标签统一到现有绝对路径，同步企业 AI 首页快捷入口、风险项、查看全部及全局 AI 待办入口；补充导航路径回归检查。不修改共享路由、菜单、权限或历史 Flyway，新旧租户均继续沿用已有菜单授权。
- 产品仓库：`/Users/liuqiang/code/cfor-standard/cfor/cfor-admin-vue3`
- 关键文件：`src/views/Home/components/PersonalWorkbench.vue`、`src/views/Home/Index_copy.vue`、`src/views/workbench/EnterpriseAiHome.vue`、`src/views/workbench/enterpriseAiHomeData.ts`、`src/layout/components/globalAiProactiveSources.ts`、对应测试及 `tests/bpmWorkbenchNavigation.test.mjs`。
- 代码 commit：`4fba2c23f3e308d18e826c6b518d8774c191e48e`，已 push 至 `origin/dev/develop_5.0.1`；提交仅包含本项 8 个文件，其他会话的路由、售后、委外、项目页面和构建配置改动未纳入。
- 检查命令与结果：`node --experimental-strip-types --test tests/bpmWorkbenchNavigation.test.mjs src/layout/components/globalAiProactiveSources.test.ts src/views/workbench/enterpriseAiHomeData.test.ts`，11 项通过，退出 0；目标 7 个 Vue/TS 文件及新增测试的定向 `pnpm exec eslint` 均退出 0；`pnpm exec tsc --noEmit --skipLibCheck --module nodenext --moduleResolution nodenext --allowImportingTsExtensions --target ES2022` 对本项 4 个 TS 源码/测试文件检查退出 0；通过 `vue/compiler-sfc` 对上述三个 Vue 页面执行解析、脚本及模板编译，均返回 `SFC_COMPILE_PASS`；`git diff --cached --check` 退出 0。
- 检查边界：未执行全量 `vue-tsc`、生产打包或真实业务页面复测，以上是代码级检查证据，不是生产发布或业务闭环证据。
- 发布版本/时间、实际部署目标：无，未部署；待达到 20 个阈值并完成正式发布门禁后再交 Muse 生产复测。

### Bug 21：销售出库 - 被销售 BOM 校验阻断

- 状态：阻塞/未发布
- 定位结果：`src/views/wms/stock/out/sell/components/formDialog.vue` 的 `loadSaleOrderForOutbound` 加载订单与 BOM 快照，`buildSaleBomEntryRows` 对无 BOM 明细直接抛出“无法整套出库”；`formDialogBom.vue` 也保留同一阻断逻辑。后端 `StkIoServiceImpl` 对销售出库存在有 BOM/无 BOM 的不同回写分支，不能仅删除前端报错就推断普通成品的扣库与订单回写已正确闭环。
- 阻塞原因：该项需要明确非套件识别、上下表明细及来源回写的现有契约；销售订单详情链路的 `ErpSaleOrderServiceImpl`、`ErpStockServiceImpl` 及 WMS 查询 API 已被其他会话未提交改动占用。未放开 BOM 校验、未改库存事实源、未执行业务写入。
- 产品代码 commit、发布版本/时间：无。

### Bug 22：现存量查询 - 明细主表加载系统异常

- 状态：阻塞/未发布
- 定位结果：`standingStock/index.vue#getList` 先请求 `StkInventoryApi.standingStock`，再请求两次统计，全部成功后才填表；查询接口为 `/mes/stkIo/queryStockQty`，调用链为 `MesStkIoController.queryStockQty` → `StkIoServiceImpl.queryStockQty` → `MesStkInventoryMapper.selectInventoryPage`。任一请求失败都会清空明细和汇总；仓位概览由独立的 `WarehouseWorkbenchApi` 获取，因而概览有数据不代表主表查询成功。
- 阻塞原因：目标 `MesStkInventoryMapper.xml` 已有其他会话对 `selectInventoryPage` 的未提交改动（`available_qty` 从 `MAX(iol.available_qty)` 改为 `SUM(msi.available_qty)`），对应映射测试也被占用；当前证据不足以判断生产“系统异常”的具体 SQL/运行时根因。未覆盖该文件，未把回归线索标成修复完成。
- 产品代码 commit、发布版本/时间：无。

### 延续阻塞与发布边界

- Bug 10、11、12、19、20：既有后端调用链仍有其他会话未提交工作，本轮未硬改或混入提交。
- Bug 14、15：财务手工新增类型、来源与金额口径仍待确认，维持上轮“阻塞/未发布”，不计为修复完成。
- Bug 17：项目页面及后端项目链路有其他会话未提交改动，未修改。
- Bug 13：仍以 Muse 清单“待修复”为准；未复用旧发布记录登记新的已发布状态。
- 本轮仅新增 Bug 18 修复，后端和小程序无本轮产品变更；Bug 16、18 均未发布，后续批次须以届时最新代码重新构建并通过全部生产门禁。

## 2026-10-11 00:42 继续生产浏览器走查（未发布）

- 环境：`https://jixu-ai.com`，租户：即序科技；本轮只执行页面访问、菜单展开和控制台/数据库只读核对，没有保存、审核、弃审、出入库、删除或配置修改。
- Bug 12：质检单新增表单的“单据类型”仍无可选项，打开下拉后没有任何选项。
- Bug 14：应收单列表仍只有搜索、重置、批量审核、批量弃审，没有新增入口。
- Bug 15：应付单列表仍只有搜索、重置、批量审核、批量弃审，没有新增入口。
- Bug 22：仓库报表的两条现存量入口均可打开，库存概览显示总量 150、可用 150，但“库存主表”仍为“暂无数据 / 共 0 条记录”，页面仍出现系统异常。
- Bug 23：`/wireSideWarehouse/reportForms/standingStock` 与 `/reports/inventory/standingStock` 两条同名现存量入口均可直接访问，导航歧义仍存在。
- Bug 24：新增运维菜单路由问题。生产控制台反复输出 `skip invalid backend menu component`，涉及 `my-order`、`inspection-plan`、`item-topology`、`schedule`、`duty`、`my-inspection`；标准生产库 `cfor_admin_saas_standard` 中对应菜单挂在 `system_menu.parent_id=100004`，其中 5 条为可见菜单。抽查 `/iot/maintenance/inspection-plan`、`/iot/maintenance/schedule`、`/iot/maintenance/duty` 均只有应用壳，无业务内容。
- 本轮未修改产品代码、未构建、未部署生产；待后续按菜单事实源核对后统一修复，不能只删除前端告警或直接删除生产菜单。

## 2026-10-11 01:05 继续生产浏览器走查（未发布）

- 环境：`https://jixu-ai.com`，租户：即序科技；本轮继续只读访问项目、客户、销售、质检、仓库、研发、财务和设置入口，没有执行保存、审核、弃审、出入库、删除或配置修改。
- 已复现 Bug 25：项目管理工作台 `/project/workbench` 的“时间窗口”显示 `07-28`，当天详情为 `07-28 周二`，但生产首页当前日期为 `2026-10-11`。
- 代码证据：`cfor-admin-vue3/src/views/project-management/projectTimeWindowData.ts` 中 `PROJECT_WORKBENCH_TODAY` 固定为 `2026-07-28`，且演示事件使用同一过期日期。
- 同轮复测：生产、销售、客户、研发产品台账、财务录凭证和仓库工作台均可打开；质检单新增的“单据类型”仍无选项，仓库工作台概览和库位明细可显示库存数据。
- 本轮未修改产品代码、未构建、未部署生产；Bug 25 待修复。
