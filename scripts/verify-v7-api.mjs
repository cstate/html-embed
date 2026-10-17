import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const fixturePath = process.env.CSTATE_V7_FIXTURE
  || fileURLToPath(new URL('../../../cstate/test/fixtures/v7-index.json', import.meta.url));
const v7Payload = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

assert.equal(v7Payload.apiVersion, '2.1');
assert.equal(v7Payload.records.some((record) => record.recordType === 'experiment'), true);

async function runScript(file, contextOverrides = {}, payload = v7Payload) {
  const script = fs.readFileSync(file, 'utf-8');
  const context = vm.createContext({
    console,
    URL,
    document: {
      body: {
        html: '',
        insertAdjacentHTML(_position, html) {
          this.html += html;
        },
      },
      querySelector() {
        return {
          style: {},
          attributes: {},
          setAttribute(name, value) {
            this.attributes[name] = value;
          },
        };
      },
    },
    fetch() {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(payload),
      });
    },
    ...contextOverrides,
  });
  vm.runInContext(script, context, { filename: file });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return context;
}

const basic = await runScript('basic-v1.js');
assert.equal(basic.cStateAPIStatus, 'disrupted');

const dotTarget = {
  style: {},
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
};
const dot = await runScript('dot-indicator.js', {
  document: {
    querySelector() {
      return dotTarget;
    },
  },
});
assert.equal(dot.cStateAPIStatus, 'disrupted');
assert.equal(dotTarget.style.backgroundColor, '#ff9800');
assert.equal(dotTarget.attributes['aria-label'], 'Orange icon indicating disruptions');

const dialog = await runScript('dialog.js');
assert.equal(dialog.cStateAPIStatus, 'disrupted');
assert.match(dialog.document.body.html, /Service disruption/);
assert.match(dialog.document.body.html, /Experiment/);
assert.match(dialog.document.body.html, /Search rollout/);
assert.match(dialog.document.body.html, /Testing search ranking with a small traffic slice\./);
assert.match(dialog.document.body.html, /https:\/\/status\.example\.com\/experiments\/search-rollout\//);

const healthyPayload = structuredClone(v7Payload);
healthyPayload.summaryStatus = 'ok';
healthyPayload.systems[0].status = 'ok';
healthyPayload.systems[0].unresolvedIssues = [];

const quietHealthyDialog = await runScript('dialog.js', {}, healthyPayload);
assert.equal(quietHealthyDialog.document.body.html, '', 'healthy pages should remain quiet by default');

const optedInHealthyDialog = await runScript('dialog.js', { cStateShowRecordNotices: true }, healthyPayload);
assert.match(optedInHealthyDialog.document.body.html, /Search rollout/);
assert.match(optedInHealthyDialog.document.body.html, /Testing search ranking with a small traffic slice\./);
assert.match(optedInHealthyDialog.document.body.html, /https:\/\/status\.example\.com\/experiments\/search-rollout\//);

const priorityPayload = structuredClone(healthyPayload);
priorityPayload.records.push({
  ...priorityPayload.records[1],
  title: 'Urgent release notice',
  state: 'active',
  statusImpact: 'disrupted',
  severity: 'disrupted',
  permalink: 'https://status.example.com/release-notes/urgent/',
});
const priorityDialog = await runScript('dialog.js', { cStateShowRecordNotices: true }, priorityPayload);
assert.match(priorityDialog.document.body.html, /Urgent release notice/);
assert.doesNotMatch(priorityDialog.document.body.html, /Search rollout/);

const downPayload = structuredClone(v7Payload);
downPayload.summaryStatus = 'down';
const downDialog = await runScript('dialog.js', {}, downPayload);
assert.match(downDialog.document.body.html, /Service outage/);

const recordStates = [
  { title: 'Completed legacy record', state: 'completed', severity: 'ongoing' },
  { title: 'Archived legacy record', state: 'archived', severity: 'ongoing' },
  { title: 'Planned legacy record', state: 'planned', severity: 'ongoing' },
  { title: 'Legacy active record', severity: 'ongoing' },
  { title: 'Current record', state: 'active', severity: 'none' },
  { title: 'Running experiment', recordType: 'experiment', state: 'running', createdAt: '2000-01-01T00:00:00Z' },
  { title: 'Future experiment', recordType: 'experiment', state: 'active', createdAt: '9999-01-01T00:00:00Z' },
  { title: 'Future legacy experiment', is: 'experiment', severity: 'ongoing', createdAt: '9999-01-01T00:00:00Z' },
];
assert.deepEqual(
  Array.from(dialog.cStateActiveRecords({ records: recordStates }), (record) => record.title),
  ['Legacy active record', 'Current record', 'Running experiment'],
  'terminal and scheduled records must not be presented as running',
);

const hostileRecord = {
  ...healthyPayload.records[0],
  title: '<img src=x onerror="document.body.dataset.executed=\'yes\'"> & "title"',
  summary: '<svg onload="document.body.dataset.executed=\'yes\'"></svg> & \'summary\'',
  kind: '<iframe srcdoc="<script>document.body.dataset.executed=\'yes\'</script>"></iframe>',
  permalink: 'javascript:document.body.dataset.executed="yes"',
};
for (const status of ['ok', 'disrupted', 'down']) {
  const hostilePayload = { ...healthyPayload, summaryStatus: status, records: [hostileRecord] };
  const escaped = await runScript('dialog.js', { cStateShowRecordNotices: true }, hostilePayload);
  const html = escaped.document.body.html;
  assert.match(html, /&lt;img src=x onerror=&quot;/, 'record title is text');
  assert.match(html, /&lt;svg onload=&quot;/, 'record summary is text');
  assert.doesNotMatch(html, /<(img|svg|iframe|script)\b/i, 'API values must not create markup');
  assert.doesNotMatch(html, /href="javascript:/i, 'API values must not create script links');
  assert.match(html, /href="https:\/\/flamboyant-shirley-6bc75e\.netlify\.app"/, 'unsafe link falls back to configured root');
  if (status !== 'ok') assert.match(html, /&lt;Iframe Srcdoc=/, 'record kind is text');
}

for (const value of [
  'javascript:alert(1)', '\njAvAsCrIpT:alert(1)', 'java\tscript:alert(1)',
  'data:text/html,<svg onload=alert(1)>', 'file:///tmp/status',
  'https://user:password@status.example.com/', 'http://[invalid',
]) {
  assert.equal(dialog.cStateSafeURL(value), dialog.cStateRoot, `unsafe URL: ${JSON.stringify(value)}`);
}
assert.equal(dialog.cStateSafeURL('/issues/incident/?quoted="value"&other=1'),
  'https://flamboyant-shirley-6bc75e.netlify.app/issues/incident/?quoted=%22value%22&other=1');
assert.equal(dialog.cStateSafeURL('https://status.example.com/experiments/search-rollout/'),
  'https://status.example.com/experiments/search-rollout/');

const dialogDemo = fs.readFileSync('dialog.html', 'utf-8');
assert.match(dialogDemo, /<script src="dialog\.js"><\/script>/);
assert.doesNotMatch(dialogDemo, /data\.summaryStatus/);

const dotDemo = fs.readFileSync('dot-indicator.html', 'utf-8');
assert.match(dotDemo, /<script src="dot-indicator\.js"><\/script>/);
assert.doesNotMatch(dotDemo, /data\.summaryStatus/);

console.log('cstate html-embed v7 API verification passed.');
