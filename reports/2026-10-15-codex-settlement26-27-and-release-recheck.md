# 生产存货版本复核与财务结算编码修复

日期：2026-10-15，Asia/Shanghai。

## 当前生产实物

`root@aliCfor`（47.115.223.70）仍运行 2026-10-14 22:44 的完整发布，
后端 `c77a4f534`，Web `89f562734`。22:44 之后的修复尚未上线，
不能将“生产已发布过”表述成“当前全部源码已发布”。

实际 JAR 为
`/www/server/jixu-ai/releases/standard-20261014-2205-current/cfor-server-4.jar`，
服务启动于 2026-10-14 22:38:57，48083 health 为 UP。
Nginx Web 根为 `/www/wwwroot/jixu-ai-prod`，接口 upstream 仍为 48083。

| 实物 | SHA-256 |
| --- | --- |
| 实际 JAR | `8f97829441a524605d6312ffe7f8c4ebb2e6b9edb866d71e5124c0dbcf80b882` |
| 公网及磁盘 index | `ca994e5c3a27f3bdf403465bbb534ae7f61fb3b947a705fb1516aa14ae45a4eb` |
| 公网、磁盘及浏览器存货表单 | `81446cfe8b1c839df556cbe5f342a6251dadcdf1791377af215e8ed636a2bd09` |

生产 `flyway_schema_history` 共 380 条、失败 0、最高版本 `202610142300`。
前端 HTML 响应 Last-Modified 以 GMT 展示；14:14 GMT 即北京时间 22:14，
不能误认为下午包。静态 `version.json` 仍是 2025 年历史版本说明，
不将其作为本次真实 Git 发布版本证据。

06:35 使用福奇科技授权测试账号在全新浏览器中只读打开
`/settings/erp/material` 和 `/systemModel/base/stock`，两处均加载
`BaseMaterialForm-BQvJRDiE.js`。存在“单位组/方案”，七页签为
存货属性、存货控制、包装、质量、存货描述、自定义项、附件信息；
旧“是否成品 / 是否组装件 / 参与齐套计算”不存在。
已有存货编码成功回显，未保存、修改或生成新编号。

该确认不代表表单已无错误：两个入口仍触发
`/admin-api/mes/dictCode/getData` 业务码 500 和
`Cannot read properties of undefined (reading 'find')`。
这是已登记 Bug 193，修复提交晚于发布截止点，仍待部署。
用户原浏览器标签页的脚本状态未取证，不猜测其旧页面反馈由缓存造成。

- [浏览器脱敏记录](../evidence/2026-10-15-codex-settlement-release/material-result.json)
- [设置入口实际表单](../evidence/2026-10-15-codex-settlement-release/settings-form.png)
- [系统建模入口实际表单](../evidence/2026-10-15-codex-settlement-release/legacy-form.png)

## Bug 26 / 27 的确认根因

生产只读元数据表明，以下四列均为
`varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL`：

- `fin_receipt_entry.settle_method`
- `fin_payment_entry.settle_method`
- `fin_receivable_check_entry.settle_method`
- `fin_payable_check_entry.settle_method`

字典 `x_settle_method` 的“银行转账”值为 `BANK_TRANSFER`，长度 13。
收款 `receiptForm.vue` 和付款 `paymentForm.vue` 的正式表单使用该字典，
保存时将 `formData.settleMethod` 原值赋给明细。
最初报告推测“中文显示名被写入”不成立，应修字段容量，保留稳定编码。
PB-064 已确认仍以该字典为唯一结算方式主档，未重新定义会计或核销口径。

后端提交 `3079d81a1` 新增
`V202610152200__expand_fin_settlement_method_codes.sql`：
仅将四表不足 64 位的 varchar 列扩容至 64 位，
按元数据保留字符集、排序规则、可空、默认值和注释；
已更宽列不缩短，不更新历史结算值、金额、租户或审计字段。
主表已为 100 位，保持原结构。新建库和旧库均通过主线迁移生效，
不按生产某个租户补数据。

仅提交该迁移、测试及已在侧栏登记的 PB-064 开发文档，
保留其他会话的未提交代码；推送分支
`bugfix/finance-settlement-codes-20261015`。

## 实际验证

以 Java 17 在独立输出目录编译 `FinSettlementMethodMigrationContractTest`，
使用 JUnit Console 1.11.4、本机临时 MySQL 8.4 容器和发布依赖中的
Flyway 10.20.1 执行两项测试，2 成功、0 失败、0 跳过：

1. 四表 10 位列均先重现 SQLState 22001；迁移后接受
   `BANK_TRANSFER` 和 64 位编码，两个租户的旧值、金额、审计标记保持一致。
2. 四表已有 128 位列与 80 位旧值均不缩短；两种排序规则、
   可空/非空默认值和带引号注释保留。

两种情形均验证 Flyway 再跑零新增，以及使用独立历史表重放实际 SQL
仍不改变原数据和列属性。没有复用本地业务库或连接生产执行测试 SQL。
首次独立 JUnit 启动因 XML 报告依赖缺失未运行用例，
移除 XML 输出参数后成功执行；不作为产品代码或 SQL 失败。
未执行完整后端打包、全量前端构建或生产财务保存、核销和审批闭环。

- [实际 JUnit / MySQL 结果](../evidence/2026-10-15-codex-settlement-release/mysql-regression.log)

## 发布计数和边界

完整、已提交、待发布独立修复：
193、162、164、160、161、194、12/61、195、159、94、30、196、197、
119、124、26/27，共 **16 项**；12/61 和 26/27 各按一项共同根因计，
172/198 的部分修复不计数。

未达到用户要求的 20 项门槛，本轮没有部署、重启、执行生产 Flyway，
未修改生产业务数据、AI、文件、第三方登录、公众号、企微、数字员工、
加密配置或 Nginx。后续全量发布仍从当前主工作目录构建，
生产库先备份并在恢复库预演，不改写已提交历史迁移。
