const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function favoriteRow');
const source = html.slice(start, html.indexOf('\nfunction parseYouTube', start));
const context = {
  favorites: [
    { item_id: 'old', created_at: '2026-01-01T00:00:00Z' },
    { item_id: 'new', created_at: '2026-02-01T00:00:00Z' }
  ],
  editMode: false,
  favoritePending: new Set(),
  currentSession: null,
  document: { getElementById: () => ({ classList: { contains: () => false } }) },
  renderCards() {},
  renderMapGrid() {},
  confirm: () => false,
  alert() {}
};

vm.createContext(context);
vm.runInContext(source, context);

const sorted = context.sortFavorites([{ id: 'plain1' }, { id: 'old' }, { id: 'plain2' }, { id: 'new' }]);
assert.deepStrictEqual(Array.from(sorted, item => item.id), ['new', 'old', 'plain1', 'plain2']);
assert.strictEqual(context.favoriteButton({ id: 'map', tag: '맵 지명' }), '');
assert.match(context.favoriteButton({ id: 'plain', tag: '팁' }), /즐겨찾기 추가.*☆/);
assert.match(context.favoriteButton({ id: 'new', tag: '위폭' }, true), /with-delete.*즐겨찾기 해제.*★/);

console.log('FAVORITES_CHECKS_OK');
