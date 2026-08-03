const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');

assert.match(styles, /\.map-label-card \.thumb\{height:auto;aspect-ratio:4\/5;\}/);
assert.match(styles, /\.map-label-card \.thumb>img\{object-fit:contain;\}/);

const homeCard = app.slice(app.indexOf('function renderHomeItemCard'), app.indexOf('\nfunction renderHome', app.indexOf('function renderHomeItemCard') + 1));
const globalSearch = app.slice(app.indexOf('function renderGlobalTitleSearch'), app.indexOf('\nasync function addMap'));
const detailCards = app.slice(app.indexOf('function renderCards'), app.indexOf('\nfunction getEffectiveClipRange'));

[homeCard, globalSearch, detailCards].forEach(source => {
  assert.match(source, /map-label-card/);
  assert.match(source, /isMapLabel \? '' :/);
});

console.log('MAP_LABEL_CARD_CHECKS_OK');
