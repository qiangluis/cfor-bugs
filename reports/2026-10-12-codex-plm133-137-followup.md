# 2026-10-12 Codex PLM 质量验证续测与实验编辑修复

## 结论

- 继续使用真实生产浏览器，新增 Bug 134–137；133 更新为“代码已修复，待发布”。
- Web 精准提交 `f902647b9ee224bed97546abe5b4cd82720e66bf`（项目关联）、`98dce0e26`（重复编辑备注）、`8373b488d`（仅名称旧关系兼容）；未 push 产品仓库、完整构建或发布生产。
- 生产验证、源码观察、内存模拟 API 的真实组件回归分层记录，未把本地通过写成生产已验证。
- 本轮是阶段性续测，不是 PLM 全流程验收。

## 环境与边界

- 生产 `https://jixu-ai.com`，沿用已登录 admin/超级管理员会话；品牌即序科技，未独立确认租户 ID，非管理员与新租户未实测。
- 生产浏览器默认 1280×720；只导航、查询/重置、表单空值校验、分类切换及取消。没有保存有效生产业务记录、导入、上传、设备同步、审批、库存/财务动作、SQL、Flyway 或配置修改。
- 未重启生产，也未重新核验本轮服务器 PID/JAR；不复用上轮只读健康检查作为本轮服务状态证明。
- Web 已 fetch，开始时 HEAD `3631bce6d`，完成时 HEAD `8373b488d`，ahead 4；现有采购退货、成本管理未提交改动保留。后端 ERP/MES/IoT 仍有其他会话联调内容，没有触碰其 JVM。

## 真实生产浏览器覆盖

| 页面 | 实际操作及结果 | 未验证 |
| --- | --- | --- |
| 检验方案 | 空列表、无选中详情；新增空名称提示“请填写模板名称”，取消 | 完整保存、指标矩阵、发布与设备映射 |
| 检验项目 | 三条列表；无匹配查询后列表为空但详情旧值残留；重置恢复；新增物性改尺寸仍 MPa，取消 | 生产保存、导入、持久化及引用计算 |
| 检测任务 | 空列表；进入 MES/同步/关联动作禁用；空名称保存提示必填，取消 | 正常新增、关联项目/样品、结果和自动判定 |
| 仪器数据接入 | 空列表及禁用绑定/验证；空表单三个主档字段显示必填，取消 | 保存、绑定、真实采集和设备回流 |
| 不合格/返修回流 | 质量反馈零记录；显示无记录提示，无错误下游对象 | 有数据复核、返修及回研闭环 |
| 质量问题库 | 空列表、详情/删除/检索禁用；新增空标题提示必填，取消 | 正常案例保存、反向检索及业务回流 |

几次菜单点击后只显示旧页面时，重新读当前 UI 再点击菜单文本，等待实际 URL/标题及列表变更；没有把过渡状态登记成路由故障。

## 133：项目关联修复

- 使用正式 `PlmRdmProjectApi.getProjectPage()` 完整分页，每页最多 100；去重并保留 Long ID 字符串，名称由选中正式对象产生。
- URL 项目上下文、空新租户、失败重试、旧请求、关闭/卸载、重复保存有测试。
- 原关联不在可选范围时保留旧 ID/名称作为禁用候选，允许不变的旧关系继续编辑；仅名称旧记录可保持原关系编辑其他字段或补选正式项目，详情也兼容。收尾审查补回归，防止新选择器阻断旧任务。
- 没有新增服务端项目必填或后台初始化，也没有用生产测试项目来填候选。
- 本地夹具挂载真实页面，仅替换内存 API；显式阻断所有未模拟 Axios 网络请求。新增选 Project B，编辑改 Project A，列表、工作区、详情、保存载荷 ID/名称一致。

本地首轮热更新触发未模拟本机接口和重新登录提示，随后在夹具增加网络阻断并整页重跑；重新验证的截图只含合成数据。不能称为生产 API 回归。

## 134：重复编辑兼容修复

- 修复前真实组件第二次保存的 remark 含两份完整前缀；编辑字段也没有解析原有非默认选项。
- 新 helper 只处理三个完整、已知值域的旧前缀块，以第一块为最近选择；保留自由文本及未知/损坏内容。无前缀旧记录继续使用现有默认推断。
- 保存仍使用原有格式，没有改数据库结构、接口或主动清洗历史记录。
- 实际本地编辑选 FLEXIBLE、形成样品/留样、进入样品留样追溯，写入自由说明；保存重开后选项和文本准确。第二次只改名称保存，remark 完全不增长。

## 135–137：检验项目问题

- 列表/设备/标准/引用数固定在 `quality-item/index.vue`，新增与导入只有内存 `unshift` 和成功提示，没有 API。未生产点击保存/导入；“刷新丢失”是源码推断而非本轮生产实测。
- 查询函数零结果回退 `itemRows[0]`，标准、设备、引用与影响不会清空，生产查询及滚动确认。
- 新增分类选择没有 change/watch；改尺寸后仍保留物性单位/编码/设备。提交又按新分类生成部分标准，却保留非空旧单位等字段，存在混合口径。
- 不能在未核对现有 MES 检验主数据与 PLM/LIMS 模板关系前创建平行事实源。归属、真实编码/标准/引用 API 需要确认后实施；本轮未改这些契约。

## 纠偏

上一轮将 DOE 项目下拉写成“真实项目选择控件”，表述过强。源码中候选只来自 linkedProject、已有 DOE 行及 query，不是完整项目台账加载。已更正原报告和 133 验收说明。
生产项目为空，没有证明已有正式项目会漏选，因此保留观察，不另添生产失败编号。
实验行按钮仍含多余 `>`，本地确认但本轮没有处理或单独计数。

## 检查与发布

- `node --test tests/plmExperimentProject.test.mjs tests/plmExperimentTaskRemark.test.mjs tests/plmBaselineCompare.test.mjs tests/searchCollapse.test.mjs tests/plmStageGateEmpty.test.mjs tests/plmEbomCompare.test.mjs`：64/64 通过。
- 实验页、备注 helper、夹具定向 ESLint 最终退出码 0；Prettier 最终通过；diff whitespace 通过。第一次 helper 格式检查失败后仅格式化该文件并重跑。
- 本地 SFC 模板编译包含在项目关联测试中；未跑全仓 vue-tsc、完整生产构建或真实 MySQL 持久化。
- 同一主工作目录仍含采购退货新增 API 和对应未发布后端，以及成本、MES、IoT 联调变更。完整包发布须确认共同可发布，不能以隔离 worktree/剔除代码/前端先发来绕过依赖。
- 本轮未发布，133、134 和上轮 126/130/132 均保留待发布。生产 AI、文件、第三方登录、公众号、企微、数字员工等配置未修改。

## 证据

- [本地项目编辑保存](../evidence/2026-10-12-codex-plm133-local/mock-edit-save-and-project-context.png)
- [本地详情项目名](../evidence/2026-10-12-codex-plm133-local/mock-detail-project-name.png)
- [本地备注选项回填](../evidence/2026-10-12-codex-plm133-local/mock-remark-choices-roundtrip.png)
- [本地第二次保存稳定](../evidence/2026-10-12-codex-plm133-local/mock-remark-second-save-stable.png)
- [生产检验项目列表](../evidence/2026-10-12-codex-plm-quality-followup/quality-item-demo-list.png)
- [生产零结果](../evidence/2026-10-12-codex-plm-quality-followup/quality-item-empty-stale-detail.png)
- [滚动后旧详情](../evidence/2026-10-12-codex-plm-quality-followup/quality-item-empty-stale-detail-scrolled.png)
- [尺寸分类仍 MPa](../evidence/2026-10-12-codex-plm-quality-followup/quality-item-size-category-wrong-unit.png)
- [脱敏观察摘要](../evidence/2026-10-12-codex-plm-quality-followup/observations.json)

以上截图已核对不含凭据、token、生产专有配置或个人中心敏感信息；生产截图里的默认标准和设备名称与前端固定样例一致。
