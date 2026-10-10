# CFOR Bugs

Muse 走查发现 bug → 更新到本仓库 → Codex 读取修复 → Muse 复测验证。

## 文件说明

- `BUG-LIST.md` - Bug 清单（Muse 维护，Codex 只读）
- `TEST-PLAN.md` - 测试计划
- `FIX-LOG.md` - 修复日志（Codex 维护，记录每个 bug 的修复 commit/说明）

## 协作流程

1. Muse 发现 bug → 更新 `BUG-LIST.md` → push
2. Codex 定时 `git pull` → 读 `BUG-LIST.md` 中"待修复"的 bug → 修复
3. Codex 修复后 → 更新 `FIX-LOG.md` → push
4. Muse 看到 FIX-LOG 更新 → 在 jixu-ai.com 复测 → 更新 BUG-LIST 状态为"已验证"或打回

## 状态说明

- 待修复：已报告，等待 Codex 修复
- 已验证：Muse 复测通过
- 打回：复测未通过，需继续修
