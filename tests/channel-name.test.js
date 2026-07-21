const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function parseYouTube');
const source = html.slice(start, html.indexOf('\nfunction ytThumb', start));
const calls = [];
const context = {
  console,
  fetch: async url => {
    calls.push(url);
    return { ok: true, json: async () => ({ author_name: '  Channel Name  ' }) };
  }
};

vm.createContext(context);
vm.runInContext(source, context);

(async () => {
  assert.strictEqual(await context.fetchYouTubeChannelName('not youtube'), null);
  assert.strictEqual(calls.length, 0);
  assert.strictEqual(await context.fetchYouTubeChannelName('https://youtu.be/abc123XYZ00'), 'Channel Name');
  assert.match(calls[0], /^https:\/\/www\.youtube\.com\/oembed\?/);
  assert.strictEqual(await context.fetchYouTubeChannelName('https://www.youtube.com/shorts/abc123XYZ00'), 'Channel Name');

  context.fetch = async () => ({ ok: false, json: async () => ({}) });
  assert.strictEqual(await context.fetchYouTubeChannelName('https://www.youtube.com/watch?v=abc123XYZ00'), null);

  assert.match(html, /const channelName = await fetchYouTubeChannelName\(url\);[\s\S]*channel_name: channelName/);
  assert.match(html, /const payload = \{ title, note: note \|\| null, team: savedTeam \};/);
  assert.match(html, /type: 'img'[\s\S]*clip_start: null, clip_end: null[\s\S]*\}\);/);
  console.log('CHANNEL_NAME_CHECKS_OK');
})();
