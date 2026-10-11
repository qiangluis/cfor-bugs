# CFOR Bugs

Muse / Codex 浏览器走查发现 bug → 更新到本仓库 → Codex 读取修复 → 浏览器复测验证。

## 文件说明

- `BUG-LIST.md` - Bug 清单（Muse / Codex 均可登记测试发现及复测证据）
- `TEST-PLAN.md` - 测试计划
- `FIX-LOG.md` - 修复日志（Codex 维护，记录每个 bug 的修复 commit/说明）
- `reports/` - 分轮测试报告，区分实际测试范围与未验证流程
- `evidence/` - 经检查不含凭据或个人敏感信息的截图证据
- `reports/bug-catalog-53df443/` - Muse 最新清单收缩前的完整历史台账快照；历史编号与当前编号有冲突，按标题、路径和来源提交核对，不能仅凭编号覆盖状态

## 协作流程

1. Muse / Codex 发现 bug → 去重，附路径、步骤和证据 → 更新 `BUG-LIST.md` → push
2. Codex 定时 `git pull` → 读 `BUG-LIST.md` 中"待修复"的 bug → 修复
3. Codex 修复后 → 更新 `FIX-LOG.md` → push
4. Muse / Codex 看到 FIX-LOG 更新 → 在 jixu-ai.com 复测 → 署名记录实际证据，更新 BUG-LIST 状态为"已验证"或打回

发现问题不等于已修复，提交代码不等于已发布，打开页面不等于业务全流程通过。
没有生产发布证据时不得标记“已发布”；生产测试遵循项目安全规则，不灌测试数据、不修改生产配置。

## 状态说明

- 待修复：已报告，等待 Codex 修复
- 代码已修复，待发布：修复提交与代码检查完成，尚无生产发布证据
- 已发布，待验证：有实际生产发布证据，尚未完成浏览器复测
- 已验证：Muse / Codex 署名记录实际生产浏览器复测通过
- 打回：复测未通过，需继续修
