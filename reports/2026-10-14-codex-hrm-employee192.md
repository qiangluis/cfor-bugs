# 2026-10-14 员工契约修复与浏览器验证

## 结论

Bug 192 已修复并提交为 Web `631a29c35834d1d7e68793c5173ae60c3f39f595`。
状态为「代码已修复，待发布」，不是生产已验证。当前真实待发布完整修复为
165、166、167、168、170、190、191、192，共 8 项，仍按累计 20 项后的完整
前后端发布规则处理，不用重复登记和部分修复凑数。

## 生产复现

使用用户指定的福奇科技测试账号，在真实生产浏览器进入 `/hrm/employee`，
选择「在职」后搜索。旧页面向 `/admin-api/hrm/employee/page` 发送
`status=ACTIVE`，HTTP 为 200，但业务码为 400：

```text
请求参数不正确:Failed to convert property value of type 'java.lang.String'
to required type 'java.lang.Integer' for property 'status';
For input string: "ACTIVE"
```

截图已遮蔽员工表体，不记录账号密码、Token 或员工联系方式：
[生产状态筛选错误](../evidence/2026-10-14-codex-fuqi-hrm-oa/employee-status-filter-error.png)。
本轮再次只读核对，依旧复现；页面错误事件曾记录 `error`，
不宣称生产页面没有运行时错误。

## 根因与完整修复

- 后端正式分页契约将 `entryStatus`（入职状态）与 `status`（员工状态）分开，
  均为数字枚举；工号、职位、入职日期、绑定账号分别使用
  `jobNumber/postName/entryTime/userNickname`。旧入口使用字符串状态和旧字段。
- 列表与筛选接正式 API，使用两组既有字典和正式字段；单页最大 100。
  查询竞态和卸载后返回不会覆盖当前数据，失败清除旧列表，不吞异常。
- 复用现有正式员工表单、转正、调岗、晋升、降级、转全职及离职表单；
  确认入职、再入职使用已有专用模式，绑定账号复用正式编辑接口。
- 动作先查询当前员工，核对身份、最新状态及查询/修改/删除权限，
  防止陈旧记录或重复点击进入错误的状态流转；取消离职保留必填原因，
  删除保留二次确认和成功后刷新。
- 合同、教育/工作/培训经历和异动接现有正式组件，完整传入员工对象；
  换员工重建面板，异动成功刷新档案及列表。
  详情查询、经历 API 参数和相关组件入口保留字符串 Long ID，不转为 Number。
  不据此宣称所有历史 VO 的 ID 类型已全面迁移。
- HR/团队工作台的 `statusCategory/surveyType/todoType/leaderEmployeeId`
  继续传入正式查询。路由参数校验枚举和 Long 范围，支持关闭筛选和重置；
  手动选状态时清除后端优先级更高的状态分类，避免控件选值不生效。
- 员工页在 640px 以下不固定右侧操作列，允许表格横向滚动；
  分页按窄屏换行，保留所有控制，不裁切或遮住员工身份列。
  不修改共享 `ContentWrap/Pagination` 或全局样式。

## 新旧租户与初始化

这是共享组件和契约修复，不是只修福奇科技的数据。生产只读核对发现模板租户 0
已具备 `hrm_employee_entry_status` 4 项、`hrm_employee_status` 8 项和
`hrm_employee_type` 2 项。本次无需添加员工字典 Flyway，也未修改模板、租户配置、
授权、正式员工记录或招聘到员工的关联。新旧租户继续使用既有初始化与模板回退。

## 验证

1. 员工定向回归 30 项通过。与候选人 24、渠道 11、职位 10、
   CRM 合同产品身份 8、质检插槽 6、HR 工作台导航 10 合并，
   **99/99 通过，失败、跳过均 0**。
2. 18 个受影响 API、Vue 与夹具文件定向 ESLint 通过，
   本批 21 个文件 Prettier 检查和 `git diff --check` 通过。
3. Playwright 在真实组件夹具中验证入职状态请求为数字 1、
   编辑/绑定、五类人事动作、合同与四类经历入口、工作台筛选重置，
   以及精确 Long ID 的请求传递。所有请求仅进入内存 Axios adapter；
   未知请求抛错，浏览器阻断外部请求和后端地址。
   `pageErrors=[]`、`blockedRequests=[]`，全部记录均为 GET。
4. 在 1440px 流程视口及 1280×720、390×844 截图检查布局，
   排除加载遮罩和重排瞬态，检查筛选控件不重叠、分页不裁切和页面横向溢出。
   截图使用虚构员工，不是生产数据：
   [桌面列表](../evidence/2026-10-14-codex-employee192/employee-list-1280.png)、
   [窄屏列表](../evidence/2026-10-14-codex-employee192/employee-list-390.png)、
   [正式编辑表单](../evidence/2026-10-14-codex-employee192/employee-edit-desktop.png)、
   [经历及异动](../evidence/2026-10-14-codex-employee192/employee-experience-desktop.png)。
5. 缩小入口的 `vue-tsc` 使用 4096 MB 仍 OOM、退出 134；
   没有完整 Vue 类型验收。实际 API 文件的定向 TypeScript 语义检查通过，
   不能替代全项目类型检查。

本地 Vite 曾沿用其他会话的 `.vite-admin/.eslintcache` 并返回已修掉的旧 lint 错误。
使用独立 `/tmp` cacheDir 的临时 Vite 服务后完成验证，保持 sourceLint 门禁开启，
未删除共享缓存、修改正式 Vite 配置或停止其他会话的 9151/9152 服务。

## 发布与验收边界

2026-10-14 21:38 只读核对生产仍为后端 `020934a02`、Web `99b1e435b`：
服务 UP，Flyway 362 条、失败 0、最高版本 `202610141331`。
本轮没有替换 JAR/Web、重启服务、执行生产迁移或覆盖 AI、文件、
第三方登录、公众号、企微、数字员工配置。

本地 API 行为回归使用替身；生产新增/编辑保存、转正/调岗/离职实际生效、
合同经历持久化、新租户和非管理员权限仍须发布完整包后独立验收。
