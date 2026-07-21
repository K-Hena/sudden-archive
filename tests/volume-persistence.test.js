const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function getEffectiveClipRange');
const source = html.slice(start, html.indexOf('\nfunction updateVolumeUI', start));

function makeContext(initial){
  const store = { ...initial };
  return {
    localStorage: {
      getItem: key => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = String(value); }
    }
  };
}

// getEffectiveClipRange
let context = makeContext({});
vm.createContext(context);
vm.runInContext(source, context);
assert.deepStrictEqual({ ...context.getEffectiveClipRange({ clip_start: 5, clip_end: 20 }, 999) }, { start: 5, end: 20 });
assert.deepStrictEqual({ ...context.getEffectiveClipRange({ clip_start: 5, clip_end: null }, 100) }, { start: 5, end: 100 });
assert.deepStrictEqual({ ...context.getEffectiveClipRange({ clip_start: null, clip_end: 20 }, 100) }, { start: 0, end: 20 });
assert.deepStrictEqual({ ...context.getEffectiveClipRange({ clip_start: null, clip_end: null }, 100) }, { start: 0, end: 100 });

// loadSavedVolume: 정상값
context = makeContext({ 'sa-volume': '30' });
vm.createContext(context);
vm.runInContext(source, context);
assert.strictEqual(context.loadSavedVolume(), 30);

// loadSavedVolume: 0은 "값 없음"으로 오인하지 않고 그대로 유지
context = makeContext({ 'sa-volume': '0' });
vm.createContext(context);
vm.runInContext(source, context);
assert.strictEqual(context.loadSavedVolume(), 0);

// loadSavedVolume: 잘못된 값(문자열/음수/100 초과/없음) → 기본값 50
for(const bad of ['abc', '-5', '150', undefined]){
  context = makeContext(bad === undefined ? {} : { 'sa-volume': bad });
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.strictEqual(context.loadSavedVolume(), 50, `bad value ${bad} should fall back to 50`);
}

// loadSavedMuted
context = makeContext({ 'sa-muted': '1' });
vm.createContext(context);
vm.runInContext(source, context);
assert.strictEqual(context.loadSavedMuted(), true);

context = makeContext({ 'sa-muted': '0' });
vm.createContext(context);
vm.runInContext(source, context);
assert.strictEqual(context.loadSavedMuted(), false);

context = makeContext({});
vm.createContext(context);
vm.runInContext(source, context);
assert.strictEqual(context.loadSavedMuted(), false);

console.log('VOLUME_PERSISTENCE_CHECKS_OK');
