'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {auditReports} = require('./audit-bug-intake.cjs');

const id = 'BUG-local-20261022143021-e9ee68aa';
const entry = (status, title = '生产 BOM 保存报错') =>
  `### ${title}\n- **编号**：${id}\n- **状态**：${status}\n`;
const report = status => `# 生产 BOM 保存报错\n- **状态**：${status}\n`;
const audit = (ledger, extra = []) => auditReports(new Map([['BUG-LIST.md', ledger], ...extra]));

test('discovers a manual issue after the historical appendix without a numeric heading', () => {
  const result = audit('# 主清单\n# 附录：远端原文补录\n' + entry('待修复'),
    [[`${id}.md`, report('待修复')]]);
  assert.equal(result.pendingLocalCount, 1);
  assert.equal(result.localReportCount, 1);
  assert.deepEqual(result.localReports[0].indexLocations, ['BUG-LIST.md:3']);
});

test('does not count the ledger and standalone report twice', () => {
  const result = audit(entry('待修复（用户回归未通过）'), [[`${id}.md`, report('待修复')]]);
  assert.equal(result.pendingLocalCount, 1);
  assert.deepEqual(result.localReports[0].warnings, []);
});

test('finds a standalone pending issue missing from the ledger', () => {
  const result = audit('# 主清单\n', [[`${id}.md`, report('打回（回归未通过）')]]);
  assert.equal(result.pendingLocalCount, 1);
  assert.match(result.localReports[0].warnings.join(' '), /未登记到主清单/);
});

test('a stale standalone pending status cannot reopen a verified ledger entry', () => {
  const result = audit(entry('已验证（用户回归通过）'), [[`${id}.md`, report('待修复')]]);
  assert.equal(result.pendingLocalCount, 0);
  assert.equal(result.localReports[0].kind, 'verified');
  assert.match(result.localReports[0].warnings.join(' '), /状态冲突/);
});

test('does not treat old status notes or fenced examples as current issues', () => {
  const ledger = '# 主清单\n```markdown\n' + entry('待修复') + '```\n'
    + `### 正式条目\n- **编号**：${id}\n- **原状态备注**：待修复\n- **状态**：已验证\n`;
  const result = audit(ledger, [[`${id}.md`, report('已验证')]]);
  assert.equal(result.pendingLocalCount, 0);
  assert.equal(result.localReportCount, 1);
});

test('does not merge a reused numeric bug number with a different manual issue', () => {
  const result = audit('### Bug 147：另一个问题\n- **状态**：已验证\n' + entry('待修复'),
    [[`${id}.md`, report('待修复')]]);
  assert.equal(result.pendingLocalCount, 1);
});

test('conflicting duplicate ledger entries require review instead of an automatic status choice', () => {
  const result = audit(entry('已验证') + entry('待修复'), [[`${id}.md`, report('待修复')]]);
  assert.equal(result.localReportCount, 1);
  assert.equal(result.pendingLocalCount, 0);
  assert.equal(result.localReports[0].status, null);
  assert.match(result.localReports[0].warnings.join(' '), /重复完整标识/);
});

test('lists delta and regression sources for semantic review without guessing duplicates by number', () => {
  const result = audit('', [
    ['BUG-DELTA-local-232-233.md', '# 本轮增量\n### Bug 232：报价明细为空\n'],
    ['REGRESSION-20261023.md', '# 用户回归\n'],
    ['reports/history/BUG-LIST.md', entry('待修复')]
  ]);
  assert.equal(result.supplementalReports.length, 2);
  assert.equal(result.localReportCount, 0);
  assert.equal(result.supplementalReports[0].headings[1].title, 'Bug 232：报价明细为空');
});

test('missing report files and missing statuses remain visible for reconciliation', () => {
  const result = audit(entry(''));
  assert.equal(result.localReportCount, 1);
  assert.equal(result.pendingLocalCount, 0);
  assert.match(result.localReports[0].warnings.join(' '), /独立报告未找到/);
  assert.match(result.localReports[0].warnings.join(' '), /状态不明确/);
});
