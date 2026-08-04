const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const app = fs.readFileSync('app.js', 'utf8');
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start) + start.length));

const globalSearch = between('function renderGlobalTitleSearch', '\nfunction ');
assert.match(globalSearch, /matchesSearch\(\[it\.title, it\.channel_name, it\.note, it\.contributor_name\], query\)/);

const cardsSearch = between('function renderCards', '\nfunction ');
assert.match(cardsSearch, /matchesSearch\(\[i\.title, i\.channel_name, i\.note, i\.contributor_name\], query\)/);

const source = between('const CHOSUNG_LIST', '\nfunction renderGlobalTitleSearch');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(context.toChosung('홍익맵'), 'ㅎㅇㅁ');
assert.strictEqual(context.toChosung('Sudden Attack'), 'Sudden Attack');
assert.strictEqual(context.toChosung('ㅎ익맵'), 'ㅎㅇㅁ');

assert.strictEqual(context.isPureChosung('ㅎㅇㅁ'), true);
assert.strictEqual(context.isPureChosung('ㅎ익맵'), false);
assert.strictEqual(context.isPureChosung('홍익맵'), false);
assert.strictEqual(context.isPureChosung('abc'), false);
assert.strictEqual(context.isPureChosung('123'), false);
assert.strictEqual(context.isPureChosung(''), false);

assert.strictEqual(context.matchesSearch(['홍익맵', null, null, null], 'ㅎㅇㅁ'), true);
assert.strictEqual(context.matchesSearch(['잠실맵', null, null, null], 'ㅎㅇㅁ'), false);
assert.strictEqual(context.matchesSearch([null, null, '희귀 위치 설명', null], 'ㅎㄱ'), true);
assert.strictEqual(context.matchesSearch([null, null, null, '홍길동'], 'ㅎㄱㄷ'), true);
assert.strictEqual(context.matchesSearch(['Title', null, null, null], 'tit'), true);
assert.strictEqual(context.matchesSearch([null, null, null, null], 'ㅎㅇㅁ'), false);
assert.strictEqual(context.matchesSearch([null, null, null, null], 'zzz'), false);

console.log('SEARCH_FIELDS_CHECKS_OK');
