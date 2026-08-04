const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start) + start.length));

const homeAdd = between('function openHomeAdd', '\nfunction renderMyItems');
assert.match(homeAdd, /openAddModal\(null\)/);

const enterTarget = between('function enterAddTargetStep', '\nfunction confirmAddTarget');
assert.match(enterTarget, /isAdminUser \? tagOrder : tagOrder\.filter\(t => t !== '맵 지명'\)/);
assert.match(enterTarget, /modalType === 'vid'/);

const confirmTarget = between('function confirmAddTarget', '\nfunction showPasteFallback');
assert.match(confirmTarget, /'맵 지명' && !isAdminUser/);
assert.match(confirmTarget, /'맵 지명' && modalType === 'vid'/);

const addModal = between('function openAddModal', '\nfunction openEditModal');
const submit = between('async function submitItem', '\n\/\/ --- 컨텐츠 추가 임시저장');
[addModal, submit].forEach(source => assert.match(source, /'맵 지명' && !isAdminUser/));

const trash = between('async function moveItemToTrash', '\nasync function restoreItem');
assert.match(trash, /update\(\{ status:'trashed' \}\)/);
assert.doesNotMatch(trash, /\.delete\(\)/);

const restore = between('async function restoreItem', '\nlet pendingMapId');
assert.match(restore, /\['pending','published','rejected'\]\.includes\(restoreStatus\)/);
assert.match(restore, /update\(\{ status:restoreStatus \}\)/);

const masterItems = between('function renderMasterItemsTable', '\nfunction renderMasterMapsTable');
assert.match(masterItems, /it\.status !== 'trashed'/);
assert.match(masterItems, /it\.status === 'trashed'/);
assert.match(masterItems, /trashed_from_status/);

const approvals = between('function renderMasterApprovals', '\nasync function reviewItem');
assert.match(approvals, /!mapId \|\| item\.map_id === mapId/);
assert.match(approvals, /!tag \|\| item\.tag === tag/);
assert.match(approvals, /filtered\.length.*pending\.length/);

console.log('ITEM_OPERATIONS_CHECKS_OK');
