const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start) + start.length));

// 후보 목록: 전체 검색은 publicItems(), 맵·팀 내 검색은 currentTeamItems() 재사용
const candidates = between('function searchDropdownCandidates', '\nfunction ');
assert.match(candidates, /inputId === 'globalTitleSearch' \? publicItems\(\) : currentTeamItems\(\)/);

// currentTeamItems()가 renderCards()와 동일하게 공유됨(중복 제거)
const currentTeamItemsFn = between('function currentTeamItems', '\nfunction renderCards');
assert.match(currentTeamItemsFn, /publicItems\(\)\.filter\(i => i\.map_id === currentMap\)/);
const renderCardsFn = between('function renderCards', '\nfunction ');
assert.match(renderCardsFn, /const teamItems = currentTeamItems\(\);/);

// 드롭다운 항목: XSS 방지를 위해 title/식별정보 escapeHtml 처리, 최대 6개 제한
const itemHtml = between('function searchDropdownItemHtml', '\nfunction ');
assert.match(itemHtml, /escapeHtml\(it\.title/);
assert.match(itemHtml, /escapeHtml\(sub\)/);

const renderDropdown = between('function renderSearchDropdown', '\nfunction closeSearchDropdown');
assert.match(renderDropdown, /matchesSearch\(\[it\.title, it\.channel_name, it\.note, it\.contributor_name\], query\)/);
assert.match(renderDropdown, /\.slice\(0, SEARCH_DROPDOWN_LIMIT\)/);
assert.match(renderDropdown, /value\.trim\(\)\.toLowerCase\(\)/);
assert.match(renderDropdown, /if\(!query\)\{ closeSearchDropdown\(inputId\); return; \}/);
assert.match(app, /const SEARCH_DROPDOWN_LIMIT = 6;/);
assert.match(app, /const SEARCH_DROPDOWN_DEBOUNCE_MS = 200;/);

// 디바운스: 빈 검색어는 즉시 닫고, 그 외엔 타이머로 지연
const onInput = between('function onSearchDropdownInput', '\nfunction ');
assert.match(onInput, /clearTimeout\(state\.timer\)/);
assert.match(onInput, /if\(!document\.getElementById\(inputId\)\.value\.trim\(\)\)\{ closeSearchDropdown\(inputId\); return; \}/);
assert.match(onInput, /setTimeout\(\(\) => renderSearchDropdown\(inputId\), SEARCH_DROPDOWN_DEBOUNCE_MS\)/);
// 디바운스 대기 중 이전 검색어의 매칭 결과로 Enter 선택이 되지 않도록 즉시 무효화(재검토 반영)
assert.match(onInput, /state\.matches = \[\];\s*state\.activeIndex = -1;/);
assert.match(onInput, /removeAttribute\('aria-activedescendant'\);\s*state\.timer = setTimeout/);

// 두 드롭다운(전체 검색/맵·팀 내 검색) 간 옵션 id가 겹치지 않도록 inputId 포함(재검토 반영)
assert.match(itemHtml, /id="searchDropdownOption-\$\{inputId\}-\$\{index\}"/);
assert.match(app, /aria-activedescendant', `searchDropdownOption-\$\{inputId\}-\$\{state\.activeIndex\}`\)/);

// 활성 항목이 초기화될 때(새 렌더링) aria-activedescendant도 함께 정리(재검토 반영)
assert.match(renderDropdown, /activeIndex = -1;\s*input\.removeAttribute\('aria-activedescendant'\);/);

// 드롭다운 닫기: 예약된 디바운스 타이머까지 취소, aria-activedescendant도 함께 정리(재검토 반영)
const closeFn = between('function closeSearchDropdown', '\nfunction closeAllSearchDropdowns');
assert.match(closeFn, /clearTimeout\(state\.timer\)/);
assert.match(closeFn, /input\.removeAttribute\('aria-activedescendant'\);/);

// 검색어 프로그래밍적 초기화(맵/팀/화면 전환) 시에도 드롭다운 정리
assert.match(app, /function clearTitleSearch\(\)\{ document\.getElementById\('titleSearch'\)\.value = ''; closeSearchDropdown\('titleSearch'\); \}/);
assert.match(app, /function clearGlobalTitleSearch\(\)\{ document\.getElementById\('globalTitleSearch'\)\.value = ''; closeSearchDropdown\('globalTitleSearch'\); \}/);

// 키보드: 방향키/Enter 기본 동작 방지, Esc는 결과 없어도 항상 닫힘
const keydown = between('function onSearchDropdownKeydown', '\nfunction selectSearchDropdownItem');
assert.match(keydown, /if\(e\.key === 'Escape'\)\{ closeSearchDropdown\(inputId\); return; \}/);
assert.match(keydown, /if\(!state\.matches\.length\) return;/);
assert.match(keydown, /e\.key === 'ArrowDown'\)\{ e\.preventDefault\(\); moveSearchDropdownActive\(inputId, 1\); \}/);
assert.match(keydown, /e\.key === 'ArrowUp'\)\{ e\.preventDefault\(\); moveSearchDropdownActive\(inputId, -1\); \}/);
assert.match(keydown, /e\.key === 'Enter' && state\.activeIndex >= 0\)\{ e\.preventDefault\(\); selectSearchDropdownItem/);

// 선택: 드롭다운 모두 닫고 기존 카드 클릭과 동일하게 openOverlay(id) 호출
const selectFn = between('function selectSearchDropdownItem', '\n\ndocument.addEventListener');
assert.match(selectFn, /closeAllSearchDropdowns\(\);/);
assert.match(selectFn, /openOverlay\(id\);/);

// 외부 클릭 시 닫기
assert.match(app, /document\.addEventListener\('click', e => \{\s*if\(!e\.target\.closest\('\.search-wrap'\)\) closeAllSearchDropdowns\(\);/);

console.log('SEARCH_AUTOCOMPLETE_CHECKS_OK');
