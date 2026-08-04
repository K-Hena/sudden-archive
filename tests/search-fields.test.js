const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start) + start.length));

const globalSearch = between('function renderGlobalTitleSearch', '\nfunction ');
assert.match(globalSearch, /String\(it\.title \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(globalSearch, /String\(it\.channel_name \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(globalSearch, /String\(it\.note \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(globalSearch, /String\(it\.contributor_name \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);

const cardsSearch = between('function renderCards', '\nfunction ');
assert.match(cardsSearch, /String\(i\.title \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(cardsSearch, /String\(i\.channel_name \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(cardsSearch, /String\(i\.note \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);
assert.match(cardsSearch, /String\(i\.contributor_name \?\? ''\)\.toLowerCase\(\)\.includes\(query\)/);

console.log('SEARCH_FIELDS_CHECKS_OK');
