const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const app = fs.readFileSync('app.js', 'utf8');
const start = app.indexOf('function stopClipPreviewTimer');
const source = app.slice(start, app.indexOf('\nfunction loadClipPlayer', start));
let current = 0;
let state = 2;
let timerCallback;
const calls = [];
const context = {
  clipStart: 5,
  clipEnd: 9,
  clipEndMarkGraceUntil: 0,
  clipPreviewTimer: null,
  clipScrubbing: false,
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
calls.length = 0;
context.clipScrubbing = true;
current = 10;
timerCallback();
assert.deepStrictEqual(calls, []);
assert.match(app, /onStateChange:[\s\S]*?if\(!clipScrubbing && !clipPreviewTimer && modalType === 'vid'[\s\S]*?YT\.PlayerState\.PLAYING,[\s\S]*?syncClipPreviewTimer\(\);/);

// 슬라이더로 끝 프레임을 확인할 때 감시 타이머가 즉시 시작점으로 되돌리지 않아야 한다.
const scrubStart = app.indexOf('function onClipScrubStart');
const scrubSource = app.slice(scrubStart, app.indexOf('\nfunction onClipStartInput', scrubStart));
const scrubCalls = [];
const scrubContext = {
  clipYtPlayer: {
    pauseVideo: () => scrubCalls.push(['pause']),
    seekTo: value => scrubCalls.push(['seek', value])
  },
  clipScrubbing: false,
  clipScrubLastSeek: 0,
  stopClipPreviewTimer: () => scrubCalls.push(['stop']),
  Date
};
vm.createContext(scrubContext);
vm.runInContext(scrubSource, scrubContext);
scrubContext.scrubClipPreview(9);
assert.deepStrictEqual(scrubCalls, [['stop'], ['pause'], ['seek', 9]]);
assert.strictEqual(scrubContext.clipScrubbing, true);

const startInputSource = app.slice(app.indexOf('function onClipStartInput'), app.indexOf('\nfunction onClipStartChange'));
const endInputSource = app.slice(app.indexOf('function onClipEndInput'), app.indexOf('\nfunction onClipEndChange'));
assert.doesNotMatch(startInputSource, /syncClipPreviewTimer/);
assert.doesNotMatch(endInputSource, /syncClipPreviewTimer/);
assert.match(app, /function onClipEndChange\(\)\{[\s\S]*?onClipScrubStart\(\);[\s\S]*?seekTo\(clipEnd, true\);/);
assert.match(app, /onStateChange:[\s\S]*?if\(e\.data === YT\.PlayerState\.PLAYING\) clipScrubbing = false;[\s\S]*?if\(!clipScrubbing && !clipPreviewTimer/);
console.log('CLIP_PREVIEW_CHECKS_OK');
