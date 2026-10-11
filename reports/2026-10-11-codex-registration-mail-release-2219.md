# 生产注册邮件修复发布记录

日期：2026-10-11。

## 发布

- 后端完整包：`standard-202610112210-mail95`
- 后端 JAR：`896c22b9f14545bbe0ae763edf97cf086b2a8120eac6a2ad71b1c8224cce39e1`
- 前端入口：`4df14a444695978711e97c92dab2eef88c9352bc0a9cad81aed79296d94cbeee`
- 生产服务：`spring_cfor-server-4.service=active`
- 健康检查：`http://127.0.0.1:48083/actuator/health` 返回 `{"status":"UP"}`
- Flyway：337 条已执行记录扩展为 341 条，失败数为 0；历史 checksum 无变化。
- 双库备份：`/www/server/jixu-ai/backups/standard-20261011215812/`，使用 MySQL 8.4.4
  容器内工具完成并通过压缩校验。

## 配置保护

发布前后 `jixu-ai.env`、`frontend-config.json`、Nginx 配置和 systemd 启动文件的 SHA-256
一致。AI、文件、第三方登录、公众号、企微和数字员工配置没有被覆盖。

## 邮件验证边界

生产账号 7 仍为 `ALIYUN_DIRECT_MAIL`。用新包中的同一 provider 发送无验证码诊断邮件，
阿里云 DirectMail 返回请求编号 `01A12B53-F529-51EF-8639-45C1CCC8B6EC`。
测试邮箱接口重新认证后收件箱仍为 0，所以当前只证明 API 受理，不证明收件箱投递。
Bug 95 状态更新为“已发布，待真实收信与注册复测”，Bug 93 更新为“已发布，待生产引导中心复测”。

