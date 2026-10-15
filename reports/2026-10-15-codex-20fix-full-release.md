# 20 项独立修复全量生产发布

正式完成：2026-10-15 08:48:26，Asia/Shanghai。

## 实际发布

生产目标 `root@aliCfor`（47.115.223.70），后端仍为 48083，
标准库 `cfor_admin_saas_standard`，未改 Nginx upstream。
发布 `standard-20261015-20fix-current`，包含完整后端、管理端、客户门户、
供应商门户；从当前主工作目录构建，不是 worktree 或局部包。

- 后端：`a02502c42b35a14d12e8e00561b69315cef55ce8`。
- Web：`ba28844732000c7b96299b4bfb65a13de9f6dc42`。
- 产品代码均推送 `bugfix/current-production-20fix-20261015`。
- 后端 active，PID 21933，真实 JAR 软链命中本次 release，48083 health UP。
- 公网 `/`、`/index`、新存货表单与生产文件和发布清单摘要一致。
- Web 首次 8GB 构建 OOM，按项目默认 16GB 完整构建成功；两个门户也重新构建。

| 产物 | SHA-256 |
| --- | --- |
| 后端 JAR | `cef101cf4e06dca8951f04636f3de5f735f9a0d057757fd06fe1aed0c9a7f4f1` |
| 管理端 index | `f1eb564e811e0f9d6934992945be1a2bcd32509a95867080a1f205559f44c043` |
| `BaseMaterialForm-qbYc6-0t.js` | `0bb212e59ad16275158742569c8d806f98e93a2a9c157740a3d88c3e4ff4e13c` |
| 客户门户 index | `3d95d7786c7ac4991f3be9e7f23b595151052ab19642639be6b48c15f187a7b0` |
| 供应商门户 index | `b08c94f6b65391eedde9d47a02bf4d7d7f38d6e0048c5087e441ada3413514d5` |

## 数据库与配置保护

完整备份标准库、旧库和运行文件，备份目录为
`/www/server/jixu-ai/backups/current-20261015-20fix`，gzip 及完成标记通过。
恢复副本按真实 `utf8mb4_unicode_ci` 和逐列排序规则核对，
从本次完整 JAR 解压真实 Flyway 及依赖后预演通过。
正式新增 12 项迁移：380 -> 392，失败 0，最高 `202610152300`。
380 条历史及 checksum 不变，未改历史 Flyway、合并、repair 或删除。
幂等临时表清理/插入有警告，最终均成功，未掩盖失败。

44 张现存关键配置表逐列稳定摘要一致，仅排除更新时间；
AI、文件、第三方、公众号、企业组织、数字员工、支付及 integration 配置保留。
env/config/Nginx 文件摘要不变，前端包排除 config，AES 沿用生产配置。
没有复制配置正文、密钥、密码或 token 到协作仓库。
只失效菜单/权限缓存，未清 Redis 或登录会话；旧 assets 保留。

## 只读浏览器证据

福奇科技账号分别打开 `/settings/erp/material` 和 `/systemModel/base/stock`，
均加载上述新资源，实测 1180px，包含单位组/方案和七个存货页签；
旧成品、组装件、齐套开关均移除。
建档人回显“系统初始化”，原 Bug 193 字典 500 与 `.find` 异常未复现。
两轮观察到的读请求业务码均为 0/200，页面异常和业务写请求均为 0。

- [业务设置入口结果](../evidence/2026-10-15-codex-20fix-full-release/material-settings-result.json)
- [基础建模入口结果](../evidence/2026-10-15-codex-20fix-full-release/material-legacy-route-result.json)
- [新版表单截图](../evidence/2026-10-15-codex-20fix-full-release/material-settings.png)

仅证明版本到达、两个入口与本条人员回显。未保存存货、请假、开通租户、
开票、审核、执行库存或进行财务写入，不将整批写侧业务判为已验证。

## 已发布、待验证清单

193、162、164、160、161、194、12/61、195、159、94、30、196、197、
119、124、26/27、123、121、10、199，共 20 项独立修复、22 个编号。
12/61 与 26/27 各计一项。全部更新为“已发布，待验证”，后续按各条实际范围复测。
本批清零，不重复计入下一批。

172 查询分页与 198 详情读取的部分改动已随包发布，但全景及正式交接写链
仍未完成，保留“部分修复”，不计入完整修复数量。

## 冻结后改动

Web `0773eaf80` 的 1280px/高度约束晚于本次冻结，线上仍为 1180px；
PMS 工作日报权限和系统启用服务的后续本地改动也未包含。
其他会话改动保留，未替其回退或提交。不能说本次已经部署这些后续代码。
后端项目部署文档已新增本轮记录并加入 sidebar，以发布 manifest 为版本依据。
