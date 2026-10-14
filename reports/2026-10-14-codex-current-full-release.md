# 2026-10-14 22:44 当前主目录全量生产发布

## 结论

用户指出的旧存货档案页面属实，14:29 的包不包含之后的主目录改造。
2026-10-14 22:44:43（北京时间），完整后端、管理端、客户门户和供应商门户
已在 `root@aliCfor`（47.115.223.70）启用，继续使用原数据库、48083 和 Nginx。
这是用户明确授权的手动发布，不等自动任务累计 20 个 Bug。

Bug 165、166、167、168、170、190、191、192 已包含在完整产物中，
更新“已发布，待验证”；请重新加载后按原业务链验证。
Bug 169 的会计口径风险和 Bug 172 的未完成范围仍保留。

## 版本及实物

全部来自 `/Users/liuqiang/code/cfor-standard/cfor/` 当前主目录，未使用 worktree。
后端 `c77a4f534823d8bfb857ed2c4c2c0de921f0c9f4`，
Web `89f562734ea54fa0f21bd6a75f8a645aff459b11`，
已推产品仓库 `bugfix/current-production-release-20261014-2205`。
后端 22:29:58 构建完毕；其他会话 22:32 后的权限改动保留在工作区，
不声称已进入本次发布包。

| 实物 | SHA-256 |
| --- | --- |
| 完整 JAR | `8f97829441a524605d6312ffe7f8c4ebb2e6b9edb866d71e5124c0dbcf80b882` |
| 管理端 index | `ca994e5c3a27f3bdf403465bbb534ae7f61fb3b947a705fb1516aa14ae45a4eb` |
| 客户门户 index | `3d95d7786c7ac4991f3be9e7f23b595151052ab19642639be6b48c15f187a7b0` |
| 供应商门户 index | `b08c94f6b65391eedde9d47a02bf4d7d7f38d6e0048c5087e441ada3413514d5` |
| 存货 BaseMaterialForm-BQvJRDiE.js | `81446cfe8b1c839df556cbe5f342a6251dadcdf1791377af215e8ed636a2bd09` |

公网 index 和新存货表单摘要与本地产物及生产文件一致。
实际软链为 `/www/server/jixu-ai/releases/standard-20261014-2205-current/cfor-server-4.jar`，
systemd active、48083 `/actuator/health` 返回 `UP`。
公网 `/actuator/health` 返回前端 HTML，不能用于后端健康检查。

## 数据及配置保护

标准库与旧库完整备份在 `/www/server/jixu-ai/backups/current-20261014-2205`；
恢复副本复制生产 utf8mb4 / utf8mb4_unicode_ci 和逐字段排序规则。
真实 JAR 预演通过后再停服务正式迁移；新增 18 项，
最终 380 条、失败 0、最高 `202610142300`，validate 通过。
原 362 条成功历史逐行保持，没有修改 / 合并历史 Flyway 或执行 repair。

生产 env、frontend-config 和 Nginx 摘要不变。27 张关键配置表迁移后完全一致；
启动时 AI 工具自动同步仅改变 update_time，排除这个字段逐列比较仍一致。
其他 26 张表启动后保持不变，含模型 / 密钥 / 文件 / 第三方 /
公众号 / 企微 / 数字员工及企业资料。品牌历史键按原值受控保留。

## 浏览器证据与残余问题

独立浏览器使用福奇科技测试账号只读打开已有存货编辑。
表单为 900px，显示“单位组/方案”，不再显示旧成品、组装件和齐套属性。
单位方案、存货详情和其他正常读取接口成功，不保存任何业务数据。

同时确认初始化存货建档人 `system-init` 回显有独立缺陷：
人员组件发 `(id=system-init)` 的动态字典查询，后端业务码 500、
MySQL SQL 语法错误，前端随之对未定义列表调用 `.find`。
已登记 Bug 193 待修复；本次结果为 `PAGE_VERSION_CONFIRMED_WITH_ERRORS`，
不能将新页面版本生效描述成页面无异常或存货保存验收通过。
没有给生产记录替换建档人，也没有隐藏真实请求失败。

初次脚本过严阻断了一个 POST 只读字段含义查询；核对 Controller 和 Service
确认该接口仅读取后加入允许名单，再次执行没有任何被阻断业务写请求，
`system-init` 的真实字典 / 前端错误仍存在，排除测试拦截的影响。

- [实际页面](../evidence/2026-10-14-codex-current-full-release/material-form.png)
- [脱敏结构化观察](../evidence/2026-10-14-codex-current-full-release/result.json)

64 项前端定向检查、新排序规则迁移契约测试及三端构建通过。
未执行生产业务写侧完整验收，未声称全量 vue-tsc 通过。
验证 Bug 165～168、170、190～192 时继续按各项原边界执行，
不以管理员、健康检查或本次只读存货证据替代新旧租户、非管理员和业务闭环验收。
