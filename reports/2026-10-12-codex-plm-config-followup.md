# 2026-10-12 PLM 集成配置页续测

## 结论

生产浏览器沿用 admin 会话，在研发 → 集成与配置下继续检查 ERP / MES 映射、CAD 集成配置、文件转换服务、WebHook / 开放接口、自定义属性、信创适配检查和数据字典。

- ERP / MES 映射、CAD 集成配置、文件转换服务、WebHook / 开放接口均能打开，生产页面未发现 404、加载失败或浏览器 error/warn。
- 自定义属性和数据字典的维护表单会提示“已保存”，但没有正式 API，新增对象不进入主表，刷新后消失。
- 信创适配检查的“确认复检”只关闭弹窗，没有提交请求、追加检查记录或成功/失败反馈。
- 没有修改产品仓库、生产数据库、Flyway、运行时配置、权限或 Nginx。

## Bug 152：自定义属性和数据字典保存只改浏览器内存

### 生产复现

路径：

- `/plm/integration-config/custom-attribute`
- `/plm/integration-config/dict`

在自定义属性页填写临时编码 `CODEX-TEMP-20261012-ATTR`、名称和必填影响范围，点击“确定”：

- 页面提示“自定义属性已保存”；
- 右侧上下文切换到临时属性，但主表仍只有原来的三条属性；
- 刷新页面后临时属性消失。

在数据字典页用 `CODEX-TEMP-20261012-DICT` 做同样验证：

- 页面提示“字典配置已保存”；
- 主表仍只有原来的三条字典；
- 刷新页面后临时字典消失。

这里的临时编号只进入当前浏览器页面内存，没有写入生产数据库。

### 源码证据

- `src/views/plm/integration-config/custom-attribute/index.vue`
  - `attrRows` 是普通数组；
  - `submitAttrForm()` 直接 `attrRows.unshift(...)` 并提示成功；
  - 没有 API、请求状态、服务端错误处理或保存后重新查询。
- `src/views/plm/integration-config/dict/index.vue`
  - `dictRows` 是普通数组；
  - `submitDictForm()` 直接 `dictRows.unshift(...)` 并提示成功；
  - 没有 API、请求状态、服务端错误处理或保存后重新查询。

由于数组不是响应式 `ref/reactive`，即使当前页面内部追加了对象，主表也不会按预期刷新；两个页面刷新后都会恢复固定演示数组。

### 影响与预期

这两个页面的标题、按钮和提示都表达了正式维护/发布语义，但实际不能保存当前租户的配置。用户会误以为属性和字典已经生效，随后产品、零部件、图文档和流程页仍然使用旧口径。

应先核对 PLM 属性/字典的正式事实源、字段、版本与租户隔离，再接入分页、保存、发布、审计和回读链路。不能只把数组改成响应式，也不能用 localStorage 或当前生产数据补丁代替正式持久化。新租户初始化和存量租户兼容需要一起验收。

### 证据

- [自定义属性保存后主表未出现临时记录](../evidence/2026-10-12-codex-plm-config-followup/custom-attribute-local-save-not-in-list.png)
- [自定义属性刷新后临时记录消失](../evidence/2026-10-12-codex-plm-config-followup/custom-attribute-after-reload-lost.png)
- [数据字典保存后主表未出现临时记录](../evidence/2026-10-12-codex-plm-config-followup/dict-local-save-not-in-list.png)
- [数据字典刷新后临时记录消失](../evidence/2026-10-12-codex-plm-config-followup/dict-after-reload-lost.png)

**状态**：待修复；正式事实源和版本发布契约待核对，本轮未写入生产数据。

## Bug 153：信创适配检查确认复检没有提交处理

### 生产复现

路径：`/plm/integration-config/xinchuang-check`

操作：

1. 点击“发起复检”；
2. 保留页面预填的验证环境和复检说明；
3. 点击“确认复检”。

实际结果：

- 弹窗直接关闭；
- 没有成功、失败或提交中的提示；
- 检查记录没有新增；
- 页面没有刷新复检结论。

### 源码证据

`src/views/plm/integration-config/xinchuang-check/index.vue` 的 `submitRecheck()` 只有：

```ts
const submitRecheck = () => {
  recheckDialogVisible.value = false
}
```

没有 API、参数校验、loading、错误处理、日志写入或回读。

### 影响与预期

用户无法留下复检审计，也无法让整改中的对象进入真实复检结果；关闭弹窗会让用户误以为复检已经提交。

应先确认信创检查记录的正式事实源、责任人、环境、结论和审计字段，再实现有权限和租户校验的提交接口，成功后刷新当前对象及检查记录，失败时保留表单并明确提示。不能只在前端追加一条演示日志。

### 证据

- [复检表单](../evidence/2026-10-12-codex-plm-config-followup/xinchuang-recheck-dialog.png)
- [点击确认后无反馈](../evidence/2026-10-12-codex-plm-config-followup/xinchuang-recheck-after-confirm.png)

**状态**：待修复；本轮未写入生产数据。

## 其他页面

本轮下列页面只做了只读打开和 DOM/控制台检查，未发现页面级错误：

- `/plm/integration-config/erp-mes-mapping`
- `/plm/integration-config/cad-integration`
- `/plm/integration-config/file-conversion`
- `/plm/integration-config/webhook-api`

这些页面的“查看”区域当前是说明性标签，不是可点击的业务入口；配置维护和正式外部服务接入能力仍需结合既有 PLM 配置事实源单独评估，未在本轮扩大为新的 Bug。
