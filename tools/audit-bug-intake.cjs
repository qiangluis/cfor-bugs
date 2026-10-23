'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const localIdPattern = /\bBUG-local-\d{14}-[a-f0-9]{8}\b/i;
const fieldPattern = /^\s*[-*]\s+\*\*([^*]+)\*\*\s*[：:]\s*(.*)$/;

function sections(markdown) {
  const result = [];
  let section = {title: '', line: 1, fields: new Map()};
  let fence = null;
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) {
      result.push(section);
      section = {title: heading[1], line: index + 1, fields: new Map()};
      continue;
    }
    const field = fieldPattern.exec(line);
    if (field) {
      const values = section.fields.get(field[1]) || [];
      values.push(field[2].trim());
      section.fields.set(field[1], values);
    }
  }
  result.push(section);
  return result;
}

function statusKind(status) {
  if (/^待修复/.test(status || '')) return 'pending';
  if (/^打回/.test(status || '')) return 'returned';
  if (/^已验证/.test(status || '')) return 'verified';
  if (/^已发布/.test(status || '')) return 'published';
  if (/^(代码已修复|修复完成)/.test(status || '')) return 'unreleased';
  return 'review';
}

function auditReports(sources) {
  const index = sections(sources.get('BUG-LIST.md') || '');
  const indexed = new Map();
  for (const section of index) {
    const id = localIdPattern.exec((section.fields.get('编号') || []).join(' '))?.[0];
    if (!id) continue;
    const entries = indexed.get(id) || [];
    entries.push(section);
    indexed.set(id, entries);
  }

  const standalone = new Map();
  for (const file of sources.keys()) {
    if (/^BUG-local-\d{14}-[a-f0-9]{8}\.md$/i.test(file)) {
      standalone.set(file.slice(0, -3), file);
    }
  }

  const localReports = [...new Set([...indexed.keys(), ...standalone.keys()])].sort().map(id => {
    const indexEntries = indexed.get(id) || [];
    const file = standalone.get(id);
    const report = file ? sections(sources.get(file)) : [];
    const indexStatuses = indexEntries.flatMap(entry => entry.fields.get('状态') || []);
    const reportStatuses = report.flatMap(entry => entry.fields.get('状态') || []);
    const indexKinds = new Set(indexStatuses.map(statusKind));
    // The current ledger is authoritative; a stale report must not reopen a verified issue.
    const status = indexKinds.size > 1 ? null : indexStatuses[0] || reportStatuses[0] || null;
    const kind = statusKind(status);
    const warnings = [];
    if (!indexEntries.length) warnings.push('未登记到主清单，需按完整标识归队');
    if (!file) warnings.push('主清单引用的独立报告未找到');
    if (indexEntries.length > 1) warnings.push('主清单中有重复完整标识，需核对来源和状态');
    if (!status || kind === 'review') warnings.push('状态不明确，需人工核对，不自动计入发布门槛');
    if (indexKinds.size > 1 || reportStatuses.some(value => statusKind(value) !== kind)) {
      warnings.push('清单与报告存在状态冲突，保留原文并核对最新回归');
    }
    return {
      id,
      title: indexEntries[0]?.title || report.find(entry => entry.title)?.title || id,
      status,
      kind,
      pending: kind === 'pending' || kind === 'returned',
      indexLocations: indexEntries.map(entry => `BUG-LIST.md:${entry.line}`),
      report: file || null,
      reportStatuses,
      warnings
    };
  });

  const supplementalReports = [...sources].filter(([file]) =>
    /^(BUG-DELTA-|REGRESSION-).+\.md$/.test(file)
  ).sort(([a], [b]) => a.localeCompare(b)).map(([file, markdown]) => ({
    file,
    headings: sections(markdown).filter(section => section.title).map(section => ({
      title: section.title,
      location: `${file}:${section.line}`
    }))
  }));

  return {
    scope: '人工报告完整标识去重及增量文件发现；不是全仓待处理总数或自动发布授权',
    localReportCount: localReports.length,
    pendingLocalCount: localReports.filter(report => report.pending).length,
    localReports,
    supplementalReports
  };
}

function main() {
  const repo = path.resolve(__dirname, '..');
  const files = execFileSync('git', [
    '-C', repo, 'ls-files', '-z', '--',
    'BUG-LIST.md', 'BUG-local-*.md', 'BUG-DELTA-*.md', 'REGRESSION-*.md'
  ], {encoding: 'utf8'}).split('\0').filter(Boolean);
  if (!files.includes('BUG-LIST.md')) throw new Error('未找到已跟踪的 BUG-LIST.md');
  const sources = new Map(files.map(file => [file, fs.readFileSync(path.join(repo, file), 'utf8')]));
  const result = auditReports(sources);
  result.collaborationCommit = execFileSync('git', [
    '-C', repo, 'rev-parse', 'HEAD'
  ], {encoding: 'utf8'}).trim();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

if (require.main === module) main();
module.exports = {auditReports};
