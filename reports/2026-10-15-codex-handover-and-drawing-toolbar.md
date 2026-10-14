# 2026-10-15 项目交接及图纸对比工具栏续测

## 环境与发布

- 生产固定主机 `root@aliCfor`，业务站点 `https://jixu-ai.com`，
  账号租户为福奇科技。只读打开列表、详情及文件，不创建测试业务数据。
- 当前仍为 2026-10-14 22:44 全量包：后端 `c77a4f534`、Web `89f562734`。
  本轮产品源码来自主工作目录，不使用 worktree，不覆盖其他会话改动。
- 完整待发布修复为 14 项，Bug 198 仍不计数，未触发满 20 项发布门槛。
  未执行 Flyway、服务重启或 AI、文件、认证、公众号、企微、数字员工配置修改。

## Bug 198 的实际进度

原始需求重新读取《平台功能梳理1008.xlsx》“功能梳理”A251:G255：
PB-248 四个触发条件和同合同唯一有效交接；PB-249 完整只读来源；
PB-250 必填及附件；PB-251 风险辅助与人工审核；PB-252 幂等建项与失败重试。

生产菜单可见，但实际列表和空发起弹窗没有请求正式交接 API。
当前列表、保存、审核、分派和变更仍为前端内存操作；
原详情及风险 getter 返回 undefined，且缺省 ID 为 1。

本轮 Web `ba4baf584` 仅完成正式读取部分：

- 兼容详情、风险页共享真实 `GET /pm/handover/get`；
  ID 无效、权限不足、空或错记录均明确失败，不请求种子编号。
- DTO 和关联 ID 保留 Long 精度，写侧 ID 规范化及查询分页上限沿正式接口；
  API 不修改传入对象。此项不证明旧写侧页面已接通。
- 按当前租户、访问租户、用户和权限校验响应范围，丢弃迟到成功或失败；
  KeepAlive 失活清数据，激活重新读取。
- 显示真实来源快照、附件引用、保存的检查结果和最近审核；
  缺损数据不生成评分、结论、审核历史或下载地址。后台当前检查是规则检查，
  不宣称已经调用模型。已建项目只使用正式项目编码和权限进入工作区。
- 标签 104px，长项目链接换行，390px 页面无横向溢出。

26 项定向测试与 25 项既有工作区测试合计 51 项通过；
新增隔离 TypeScript 语义检查使用真实 API、helper 和 SFC script，
外围网络/认证等依赖按声明边界隔离。没有运行全项目 vue-tsc 或完整构建。
真实 Element Plus / Router 组件回放的页面异常与外部业务网络为 0。

未完成范围仍包括实际列表、发起、提交、退回、升级、建项、分派和原工作台入口。
合同快照缺完整联系人、商机/报价、付款节点和产品服务范围；
没有正式项目化交付字段，防重按合同及版本不足以证明同合同唯一有效交接。
已在后端现有开发文档用 `e1852796b` 标注主线不足；不自动补生产合同默认值、
不虚构已签合同的交付类别，不将历史切片说明当作当前代码完成。

证据：

- [生产菜单](../evidence/2026-10-15-codex-handover198/production/handover-menu.png)
- [生产空发起表单](../evidence/2026-10-15-codex-handover198/production/handover-empty-draft.png)
- [组件回放](../evidence/2026-10-15-codex-handover198/regression/result.json)
- [51 项回归](../evidence/2026-10-15-codex-handover198/regression/cfor-handover-record-combined-20261015.tap)
- [桌面](../evidence/2026-10-15-codex-handover198/regression/formal-detail-desktop.png)
- [窄屏](../evidence/2026-10-15-codex-handover198/regression/formal-detail-mobile.png)

## Bug 119

生产 1280px 视口重新测得导出按钮右边界 1309px，
实际按钮文本为 `>生成差异` / `>导出报告`。没有点击生成或下载，
不写业务数据或生成生产文件。

Web `7b621f800` 移除页面 1080px 最小宽度，标题和操作区允许换行，
选择器限制为容器可用宽度，预览采用 minmax 网格；
按钮模板移除多余字符，原权限和业务处理器保持不变。

真实页面组件在 1280/1440/1920/768/390px 验证：
按钮和两个选择器都在页面及视口内，页面横向宽度与视口一致，
1280px 导出按钮右边界为 1249px。恢复原最小宽度后同一边界检查失败；
使用原权限指令并撤销权限重新挂载，两按钮仍隐藏。
ESLint、Prettier、SFC/Sass 编译与 diff 检查通过。

Bug 118 的固定版本候选、差异数组和导出内容未修，不能把工具栏验收扩大为
图纸对比或下载业务已经正常。本条只登记代码已修复，待生产完整包发布。

证据：

- [生产观察](../evidence/2026-10-15-codex-drawing-toolbar119/production/result.json)
- [生产截图](../evidence/2026-10-15-codex-drawing-toolbar119/production/drawing-toolbar-1280.png)
- [五视口与权限检查](../evidence/2026-10-15-codex-drawing-toolbar119/regression/result.json)
- [1280px](../evidence/2026-10-15-codex-drawing-toolbar119/regression/drawing-toolbar-1280.png)
- [390px](../evidence/2026-10-15-codex-drawing-toolbar119/regression/drawing-toolbar-390.png)
