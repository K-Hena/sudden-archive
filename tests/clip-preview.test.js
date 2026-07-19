const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function stopClipPreviewTimer');
const source = html.slice(start, html.indexOf('\nfunction loadClipPlayer', start));
let current = 0;
let state = 2;
let timerCallback;
const calls = [];
const context = {
  clipStart: 5,
  clipEnd: 9,
  clipEndMarkGraceUntil: 0,
  clipPreviewTimer: null,
  clipYtPlayer: {
    getCurrentTime: () => current,
    getPlayerState: () => state,
    seekTo: value => { current = value; calls.push(['seek', value]); },
    playVideo: () => calls.push(['play']),
    pauseVideo: () => calls.push(['pause'])
  },
  YT: { PlayerState: { PLAYING: 1, PAUSED: 2, BUFFERING: 3, ENDED: 0 } },
  Date,
  setInterval: callback => { timerCallback = callback; return 1; },
  clearInterval: () => {}
};

vm.createContext(context);
vm.runInContext(source, context);
context.syncClipPreviewTimer();
current = 10;
timerCallback();
assert.deepStrictEqual(calls, [['seek', 5], ['pause']]);
assert.match(html, /onStateChange:[\s\S]*?if\(!clipPreviewTimer && modalType === 'vid'[\s\S]*?YT\.PlayerState\.PLAYING,[\s\S]*?syncClipPreviewTimer\(\);/);
console.log('CLIP_PREVIEW_CHECKS_OK');
