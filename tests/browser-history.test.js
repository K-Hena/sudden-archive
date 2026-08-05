const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start) + start.length));

// pushViewState: restoringFromHistory 중에는 아무것도 하지 않고, 같은 상태를 다시 push하지 않는다
const pushViewState = between('function pushViewState', '\nfunction showMapGrid');
assert.match(pushViewState, /if\(restoringFromHistory\) return;/);
assert.match(pushViewState, /JSON\.stringify\(cur\) === JSON\.stringify\(state\)/);
assert.match(pushViewState, /history\.pushState\(state, '', location\.href\)/);

// 5개 화면 진입 함수가 각각 올바른 상태 모양으로 pushViewState를 호출한다
const showMapGridFn = between('function showMapGrid', '\nfunction showHome');
assert.match(showMapGridFn, /pushViewState\(\{ view: 'grid' \}\)/);

const showHomeFn = between('function showHome', '\nfunction openMap');
assert.match(showHomeFn, /pushViewState\(\{ view: 'home' \}\)/);

const openMapFn = between('function openMap', '\nfunction openMaster');
assert.match(openMapFn, /pushViewState\(\{ view: 'detail', mapId: id, mapName: name, team: 'total' \}\)/);
// openMap()은 setTeam('total')보다 먼저 자신의 push를 실행해야, setTeam의 replaceState가 항상 이미 push된 detail 항목을 갱신한다
assert.ok(openMapFn.indexOf("pushViewState({ view: 'detail'") < openMapFn.indexOf("setTeam('total')"));

const openMasterFn = between('function openMaster', '\nfunction switchMasterTab');
assert.match(openMasterFn, /if\(!isAdminUser\) return;/);
assert.match(openMasterFn, /pushViewState\(\{ view: 'master' \}\)/);

// setTeam()은 새 항목을 push하지 않고 현재 맵 상세 항목만 replace한다(팀 전환은 범위 확정상 별도 단계가 아님)
const setTeamFn = between('function setTeam', '\nfunction clearTitleSearch');
assert.match(setTeamFn, /if\(!restoringFromHistory\) history\.replaceState\(\{ view: 'detail', mapId: currentMap, mapName: currentMapName, team: t \}, '', location\.href\);/);

// openOverlay()는 popstate 복원 시 조회 기록이 중복되지 않도록 trackView를 그대로 전달할 수 있어야 하고, 항상 pushViewState로 상태를 남긴다
const openOverlayFn = between('function openOverlay', '\nfunction ');
assert.match(openOverlayFn, /pushViewState\(\{ view: 'overlay', itemId: id \}\)/);

// isBaseViewAlreadyActive: 오버레이는 기본 화면 DOM을 건드리지 않으므로, 오버레이만 닫히는 경우(예: Master 안에서 연 오버레이) 그 아래
// 화면이 이미 그대로 표시 중이면 다시 열지 않는다(재검토 반영 — 안 그러면 Master가 항상 통계 탭으로 리셋됨)
const isBaseViewAlreadyActiveFn = between('function isBaseViewAlreadyActive', '\nwindow.addEventListener');
assert.match(isBaseViewAlreadyActiveFn, /document\.getElementById\('viewHome'\)\.classList\.contains\('active'\)/);
assert.match(isBaseViewAlreadyActiveFn, /document\.getElementById\('viewGrid'\)\.classList\.contains\('active'\)/);
assert.match(isBaseViewAlreadyActiveFn, /document\.getElementById\('viewMaster'\)\.classList\.contains\('active'\)/);
assert.match(isBaseViewAlreadyActiveFn, /document\.getElementById\('viewDetail'\)\.classList\.contains\('active'\) && currentMap === state\.mapId/);

// popstate 핸들러: 복원 플래그를 try/finally로 반드시 해제하고, 모달을 먼저 정리하고, overlay 복원 시 trackView=false로 호출한다
const popstateHandler = between("window.addEventListener('popstate'", '\n});');
assert.match(popstateHandler, /restoringFromHistory = true;/);
assert.match(popstateHandler, /try \{/);
// hasModalUnsavedInput()이 모달의 active 상태를 보지 않으므로, 실제로 열려 있을 때만 requestCloseModal()을 호출해야 한다(재검토 반영)
assert.match(popstateHandler, /if\(document\.getElementById\('addModal'\)\.classList\.contains\('active'\)\) requestCloseModal\(\);/);
assert.match(popstateHandler, /if\(state\.view !== 'overlay'\) closeOverlay\(\);/);
assert.match(popstateHandler, /if\(state\.view === 'overlay'\)\{ openOverlay\(state\.itemId, false\); return; \}/);
assert.match(popstateHandler, /if\(isBaseViewAlreadyActive\(state\)\) return;/);
assert.match(popstateHandler, /openMap\(state\.mapId, state\.mapName\); setTeam\(state\.team \|\| 'total'\);/);
assert.match(popstateHandler, /\} finally \{\s*restoringFromHistory = false;/);
// 권한 재확인은 "이미 표시 중"인지와 무관하게 항상 먼저 해야 한다 — 안 그러면 Master가 이미 열려 있을 때 권한을 잃어도 그대로 노출된다
const authFallback = between("if(state.view === 'master' && !isAdminUser)", '\n    if(isBaseViewAlreadyActive');
assert.match(authFallback, /showMapGrid\(\);/);
// showMapGrid()는 restoringFromHistory 중이라 pushViewState가 no-op이므로, 화면(grid)과 history.state('master')가 어긋나지 않게 직접 replaceState한다(재검토 반영)
assert.match(authFallback, /history\.replaceState\(\{ view: 'grid' \}, '', location\.href\);/);
assert.ok(
  popstateHandler.indexOf("state.view === 'master' && !isAdminUser") < popstateHandler.indexOf('isBaseViewAlreadyActive(state)'),
  '권한 재확인이 isBaseViewAlreadyActive 단축 반환보다 먼저 실행돼야 함'
);

// 최초 진입 시 홈 상태를 replaceState로 심어 popstate가 항상 유효한 이전 상태를 참조하게 한다
assert.match(app, /history\.replaceState\(\{ view: 'home' \}, '', location\.href\);/);

// 관리자 권한 상실로 Master에서 강제 이탈시키는 기존 안전장치는 새 항목을 쌓지 않고 현재 항목을 grid로 교체한다
const authRedirect = between("if(!isAdminUser && document.getElementById('viewMaster')", '\n  }');
assert.match(authRedirect, /restoringFromHistory = true;/);
assert.match(authRedirect, /showMapGrid\(\);/);
assert.match(authRedirect, /restoringFromHistory = false;/);
assert.match(authRedirect, /history\.replaceState\(\{ view: 'grid' \}, '', location\.href\);/);

// index.html: "뒤로가기류" 버튼은 화면 전환 함수를 직접 호출하지 않고 history.back()을 호출한다(스택 꼬임 방지)
const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /class="overlay-close" onclick="history\.back\(\)"/);
assert.match(html, /class="back-btn" onclick="history\.back\(\)">← 전체 맵으로/);
const masterBackButtons = html.match(/class="back-btn" onclick="history\.back\(\)">← 이전 화면으로/g) || [];
assert.strictEqual(masterBackButtons.length, 6, `Master back-btn 6개가 모두 history.back()+"← 이전 화면으로"여야 함 (실제: ${masterBackButtons.length}개)`);
// 헤더 로고는 "뒤로가기류"가 아니라 고정 목적지 유틸리티라 showHome() 직접 호출을 유지한다
assert.match(html, /class="brand-home" onclick="showHome\(\)"/);

console.log('BROWSER_HISTORY_CHECKS_OK');
