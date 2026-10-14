# 正式项目工作区续测与修复（2026-10-15）

## 结论

新增 Bug 196（项目上下文）和 Bug 197（项目筛选宽度），均为“代码已修复，待发布”。
原 Bug 182 的两个快捷入口本轮在福奇科技生产账号下正常导航，不重复计数，
也不据此宣称原租户的确认/审核业务闭环已通过。

| 范围 | 提交 |
| --- | --- |
| Web 项目上下文、行为/浏览器回归 | `a8756050e` |
| Web 选择器尺寸、两视口/生产测量 | `690ec4f49` |
| 后端项目开发文档验证边界 | `393984c79` |

产品提交已推 `bugfix/production-project-context-20261015`，未推受保护 develop。
本轮前独立待发布修复为 11 项；加入 196/197 后为 **13 项**：
193、162、164、160、161、194、12/61、195、159、94、30、196、197。
12/61 同根只计一项，182 不计本轮新修复。未满 20，不发布、不重启。

## 需求与生产观察

原始《平台功能梳理1008.xlsx》“功能梳理”`A439:G440`：
PB-923 为里程碑确认与阶段计划，PB-925 为实施/研发/测试计划和审核，
查询、详情、统计、导出和下钻使用同一企业、组织、项目成员及角色范围。
不修改审批、授权策略或 `pm_* / pms_*` 事实源归属。

生产使用福奇科技指定测试账号，密码仅通过环境变量注入，报告不保存凭据。
只允许登录/刷新、只读字段含义和 GET，业务写请求全部阻断。
“确认里程碑”进入 `/project/milestones`，
“审核实施计划”进入 `/project/implementation-plans`；
无页面/API 异常，正式项目接口业务码 0、总数 0。
项目选择器实测 55px。不存在可用于生产多项目切换的正式对象，
没有换租户或新建项目凑测试。

[生产观察 JSON](../evidence/2026-10-15-codex-project-context/production/result.json)、
[里程碑入口](../evidence/2026-10-15-codex-project-context/production/milestone.png)、
[计划入口](../evidence/2026-10-15-codex-project-context/production/plan-review.png)。

## 修复与证据

Bug 196 的线上源码仅挂载时解析 projectCode，同页换码不重选；
无效码可能回退其他项目/无范围请求。共享页面现在监听规范化编码，
完整读取授权项目且保持 Long ID 精度；显式编码不可解析时清空结果并提示，
初始化未完成不发无范围请求，无编码保留原默认。
上下文变化关闭旧弹窗、废弃过期响应和旧确认提交，合法手工选择可恢复。

25 项实际 SFC 行为回归通过，加已有项目菜单/报表/客户保存回归共 38 项。
同一新增回归针对线上源码 `89f562734` 为 8 通过、17 失败、0 取消，
负向对照能捕获旧缺陷，而不是仅验证文件中出现某段文本。
实际 Element Plus/Router 内存响应浏览器验证 A/B、无效码、计划类型及延迟响应，
页面错误和外部业务网络为 0。

Bug 197 只补共享选择器 240px 和窄屏最大宽度，不改全局样式。
原样式真实组件为 55px，宽度断言失败；修复后 1440/390 视口均为 240px、
右边界 315px，选择前后尺寸稳定。两尺寸截图已检查。
定向 ESLint、scoped Sass 编译、格式和差异检查通过，未执行全项目 vue-tsc。

[组件结果](../evidence/2026-10-15-codex-project-context/regression/result.json)、
[38 项测试](../evidence/2026-10-15-codex-project-context/regression/combined-results.tap)、
[25 项负向对照](../evidence/2026-10-15-codex-project-context/regression/production-source-baseline.tap)、
[原样式结果](../evidence/2026-10-15-codex-project-context/regression/filter-baseline.json)、
[桌面筛选](../evidence/2026-10-15-codex-project-context/regression/project-filter-1440.png)、
[窄屏筛选](../evidence/2026-10-15-codex-project-context/regression/project-filter-390.png)。

## 发布与未验证范围

生产仍为 2026-10-14 22:44 全量包，后端 `c77a4f534`、Web `89f562734`。
10 月 15 日再次 SSH 核对实际 JAR/index 摘要、48083 health UP、
标准库 Flyway 380 条/失败 0；全新浏览器的两个存货菜单加载同一新表单，
建档人异常仍为已登记的 Bug 193，不新增重复问题。
这些核验不是本轮发布证据，也不是业务全流程验收。

本轮无后端业务修改或 Flyway；未构建发布、保存业务对象、确认里程碑、
审核计划、发任务或改生产配置。AI、文件、第三方登录、公众号、企微、
数字员工配置未改。普通角色、新旧租户、正式持久化和原项目任务/审批全链
仍待真实验证；窄屏截图只证明筛选控件，没有扩大为整个移动数据表验收。
