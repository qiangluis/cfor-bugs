# 2026-10-14 福奇科技招聘渠道契约复核

## 现场

- 租户：福奇科技
- 账号：admin
- 页面：行政 → 招聘管理 → 招聘渠道
- 路径：`/hrm/recruit/channel`
- 时间：2026-10-14

## 现象

生产页面展示并提交“渠道编码、渠道类型、启用”字段，列表也按这三个字段展示；页面提示渠道编码租户内唯一、类型必须取固定枚举。

当前后端正式契约 `HrmRecruitChannelSaveReqVO` 只有 `name`、`sort`、`remark`，渠道状态由独立的 `PUT /hrm/recruit/channel/update-status` 维护，删除需要提交 `transferChannelId`，用于把员工和候选人的渠道关联迁移到启用渠道。

因此生产页面与后端字段和动作契约不一致。当前租户列表为空，本轮未填写、提交或删除任何招聘渠道。

## 证据

- `evidence/2026-10-14-codex-fuqi-hrm-oa/recruit-channel-legacy-form-1829.png`
- 后端 `HrmRecruitChannelController`
- 后端 `HrmRecruitChannelSaveReqVO`
- 前端正式组件 `src/views/hrm/recruit/channel/RecruitChannelForm.vue`
- 前端正式组件 `src/views/hrm/recruit/channel/RecruitChannelDeleteForm.vue`

## 影响

- 普通用户会填写后端不接收的编码、类型和启用字段，无法准确理解保存结果。
- 旧页面没有使用正式的停用/启用接口。
- 旧页面删除动作没有承接渠道，不能安全迁移已有员工和候选人关联。

## 修复要求

列表改为使用正式 API 和字段，复用已有招聘渠道新增/编辑表单与带承接渠道的删除表单，状态操作调用 `update-status`；新租户和存量租户均使用同一契约，不修改渠道事实数据。

修复提交：Web `ebc1384ca`，已推 GitLab
`bugfix/quality-recruitment-batch-20261014`。11 项真实组件编译/行为回归通过，
含排序 0、数值状态筛选、启停、保存失败保留草稿、只读字段剔除、承接渠道删除
和系统内置渠道保护。尚未在生产提交渠道或执行删除。

登记为 Bug 190。状态：代码已修复，待发布；不视为生产维护动作已验证。
