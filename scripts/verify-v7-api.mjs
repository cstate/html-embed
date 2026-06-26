import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const v7Payload = {
  apiVersion: '2.1',
  summaryStatus: 'disrupted',
  records: [
    {
      is: 'experiment',
      recordType: 'experiment',
      state: 'active',
      title: 'Search rollout',
    },
  ],
};

async function runScript(file, contextOverrides = {}) {
  const script = fs.readFileSync(file, 'utf-8');
  const context = vm.createContext({
    console,
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
        json: () => Promise.resolve(v7Payload),
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
assert.match(dialog.document.body.html, /active experiments/);

const dialogDemo = fs.readFileSync('dialog.html', 'utf-8');
assert.match(dialogDemo, /<script src="dialog\.js"><\/script>/);
assert.doesNotMatch(dialogDemo, /data\.summaryStatus/);

const dotDemo = fs.readFileSync('dot-indicator.html', 'utf-8');
assert.match(dotDemo, /<script src="dot-indicator\.js"><\/script>/);
assert.doesNotMatch(dotDemo, /data\.summaryStatus/);

console.log('cstate html-embed v7 API verification passed.');
