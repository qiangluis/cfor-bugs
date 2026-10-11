# 生产公共注册验证码邮件诊断

日期：2026-10-11。执行者：Codex。关联：Bug 95，Bug 93。

## 结论

失败发生在生产发信阶段，尚无测试邮箱域名拒收证据。数据库保留阿里云 API 发信配置，但当前标准版运行包不识别 provider，也没有对应 API 发送分支，将其当作 SMTP 账户使用，最终连接超时。

前轮“邮箱能正常收信”“验证码请求没有进入发送接口”的判断均缺少证据，现明确更正。邮箱只验证了认证和读取接口；前端倒计时和业务成功响应都不是投递成功证明。

## 可核对证据

- 主站：`root@aliCfor`，服务 `spring_cfor-server-4.service` active/running；本轮没有重启。
- 实际运行 JAR：`/www/server/jixu-ai/releases/standard-20261011135455-wms59/cfor-server-4.jar`。
- 公共注册发送接口：HTTP 200，`{"code":0,"data":true,"msg":""}`。
- 只读查询标准库中本次独立测试邮箱的发送日志，不查询正文、模板参数、发件密码、API 密钥或验证码表。

| 邮件日志 | 创建时间 | 发送结束时间 | 状态 | 根异常 |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-11 21:04:41 | 2026-10-11 21:06:48 | 20，失败 | ConnectException: Connection timed out |
| 2 | 2026-10-11 21:06:05 | 2026-10-11 21:08:12 | 20，失败 | ConnectException: Connection timed out |
| 3 | 2026-10-11 21:08:48 | 2026-10-11 21:10:55 | 20，失败 | ConnectException: Connection timed out |
| 4 | 2026-10-11 21:13:55 | 2026-10-11 21:16:02 | 20，失败 | ConnectException: Connection timed out |

上表保留数据库原始时间，不作为独立时区换算证据。

模板 `tenant-register-apply-email` 编号 16，状态 0（启用），关联账户 7。provider 为 `ALIYUN_DIRECT_MAIL`，SMTP 槽位 host/port 为 `dm.aliyuncs.com:465`，凭据存在性检查为真；实际值没有输出或复制。

## 运行包与源码

只读提取生产 JAR 内的 `BOOT-INF/lib/cfor-module-system-4.0.3-SNAPSHOT.jar`，使用本机 `javap -c -p` 检查，不替换或执行生产组件：

- `MailSendServiceImpl.doSendMail()` 调用 `buildMailAccount()` 后直接执行 Hutool `MailUtil.send()`。
- 没有 `sendByProvider`、`sendByAliyunDirectMail` 或 `SingleSendMail`。
- `MailAccountDO` 没有 `getProvider()`。
- 修复前主工作目录源码与上述发送行为一致。
- 历史提交 `703599327` 中存在 provider 分流和阿里云 API 实现；来源在已获取的 `origin/dev/develop_4.0.4`、`origin/feature/develop_4.0.3_dean` 历史，不代表已完成对最新远端或移植安全性的验证。

## 修复与验收边界

保留现有账户、发信地址和密钥，补齐标准版账号契约及 API 分流；不是更换测试邮箱或把 API 配置改成 SMTP。已有 SMTP 发送需保持兼容，异常不能泄露签名、密钥、验证码和邮件正文。只有真实收信、正常提交、审核开通及登录完成后才能宣称注册闭环。

没有结构修改、Flyway、生产 SQL 写入、生产配置变更、部署或重启。当前主工作区有其他会话未完成变更，完整发布仍需协调范围。本轮仅诊断并登记，不能标“已修复”或“已发布”。

安全验证由用户手动完成，没有破解或绕过。邮箱凭据保存在本机私密文件、未提交；注册申请尚未提交，租户尚未创建，引导中心尚未开始。

## 后续修复提交

用户要求直接修复后，已在当前主目录定向提交后端 `c746235f2`、Web `51afec6c5`：

- 补齐账号 provider 和阿里云字段，使用官方 SDK 调 `SingleSendMail`，保留空 provider 的历史 SMTP 行为。
- 明确 HTTPS、超时和不自动重试，不将 API 失败回退 SMTP；空响应记失败，发送结果沿用现有审计。
- 密钥不回显，详情/分页只返回配置状态，编辑空密钥不覆盖原值；错误不保存 SDK 原始内容。
- 前端按发送通道显示/校验/提交字段，不提交另一通道字段、空密钥或配置状态标志。
- 既有基线结构已含全部字段，不新增/修改 Flyway，不修改生产账号、发信地址或密钥。

51 项后端回归通过，1 项原有真实发信演示禁用；Web 5 项回归、ESLint、
组件脚本/模板编译及实际表单类型校验通过。H2 账号测试只补自身 Jackson 初始化，
没有修改生产或框架配置。未执行全量 vue-tsc 或完整生产构建。

当前主工作区还有其他会话未提交业务代码和 9 个迁移，包含共享套餐111、
多租户 ERP 套餐与角色变更，已请求用户确认完整包范围。没有发布、重启、
排除迁移、使用独立 worktree 或注入 class。生产只读复核仍 active/UP、原软链目标。

上线需受控失效旧 `mail_account` 缓存，不能清空 Redis、打印凭据或读取数据库验证码。
生产实际投递与收信、注册提交审核及引导中心仍未验证，Bug 95 只能标“代码已修复，待发布”。
