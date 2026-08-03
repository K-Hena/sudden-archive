// ============================================================
// TODO: 여기 두 줄만 채우면 됨
// Supabase 프로젝트 대시보드 > Project Settings > API 에서 복사
// ============================================================
const SUPABASE_URL = 'https://mvyepqqstaipxqfesalv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ig7a3XgfX1xpJbblRiol9A_lMbNXzs5';

let sb;
try {
  if(!window.supabase){
    throw new Error('supabase-js 라이브러리를 못 불러왔어요 (CDN 차단/네트워크 문제일 수 있어요)');
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e){
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('mapGrid');
    grid.className = 'map-grid';
    grid.innerHTML = `<div class="loading">초기화 실패: ${e.message}</div>`;
  });
}

let maps = [];
let items = [];
let currentMap = null;   // 맵 id
let currentMapName = '';
let currentTeam = 'total';
let currentSession = null;
let favorites = [];
let isAdminUser = false;
let masterComments = [];
let lastDataLoadedAt = 0;
const favoritePending = new Set();
const tagOrder = ['맵 지명', '위폭', '팁'];
const PUBLIC_REFRESH_MS = 5 * 60 * 1000;

function publicItems(){ return items.filter(item => !item.status || item.status === 'published'); }
function contributorBadge(item){
  if(!item.contributor_name) return '';
  const avatar = item.contributor_avatar ? `<img src="${escapeHtml(item.contributor_avatar)}" alt="" referrerpolicy="no-referrer">` : '';
  return `<span class="contributor-badge">${avatar}<span>${escapeHtml(item.contributor_name)}</span></span>`;
}

async function loadAll(){
  if(!sb) return; // 위에서 초기화 실패한 경우 여기서 중단
  try {
    const { data: mapRows, error: mapErr } = await sb
      .from('maps').select('*').order('sort_order', { ascending: true });
    const { data: itemRows, error: itemErr } = await sb
      .from('items').select('*');

    if(mapErr || itemErr){
      const grid = document.getElementById('mapGrid');
      grid.className = 'map-grid';
      grid.innerHTML = `<div class="loading">데이터를 불러오지 못했어요.<br>${(mapErr||itemErr).message}</div>`;
      return;
    }
    maps = mapRows;
    items = itemRows;
    document.getElementById('clipCount').textContent = publicItems().filter(i=>i.type==='vid').length;
    document.getElementById('tipCount').textContent = publicItems().filter(i=>i.tag==='팁').length;
    lastDataLoadedAt = Date.now();
    renderMapGrid();
    if(document.getElementById('viewHome').classList.contains('active')) renderHome();
    if(document.getElementById('viewMaster').classList.contains('active')){
      const activeTab = document.querySelector('.master-tab.active')?.dataset.tab;
      if(activeTab === 'items') renderMasterItemsTable();
      else if(activeTab === 'maps') renderMasterMapsTable();
      else if(activeTab === 'stats') loadMasterStats();
      else if(activeTab === 'comments') loadMasterComments();
      else if(activeTab === 'approvals') renderMasterApprovals();
    }
  } catch(e){
    const grid = document.getElementById('mapGrid');
    grid.className = 'map-grid';
    grid.innerHTML = `<div class="loading">요청 중 오류가 발생했어요.<br>${e.message}</div>`;
  }
}

function recentItemsKey(){ return currentSession ? `sa-recent-items:${currentSession.user.id}` : null; }
function loadRecentItems(){
  const key = recentItemsKey();
  if(!key) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch(error){ return []; }
}
function recordRecentItem(itemId){
  const key = recentItemsKey();
  if(!key) return;
  const recent = loadRecentItems().filter(entry => entry && entry.itemId !== itemId);
  recent.unshift({ itemId, viewedAt: new Date().toISOString() });
  try { localStorage.setItem(key, JSON.stringify(recent.slice(0, 20))); } catch(error){}
}
function clearRecentItems(){
  const key = recentItemsKey();
  if(key) localStorage.removeItem(key);
  renderHome();
}
function renderHomeItemCard(it){
  const p = it.type === 'vid' ? parseYouTube(it.video_url) : null;
  const thumbUrl = it.type === 'vid' ? ytThumb(it.video_url) : it.img_url;
  const mapName = maps.find(m => m.id === it.map_id)?.name || '알 수 없는 맵';
  return `
    <div class="card" onclick="openOverlay('${it.id}')">
      ${favoriteButton(it)}
      <div class="thumb">
        ${thumbUrl ? `<img loading="lazy" src="${escapeHtml(thumbUrl)}" alt="">` : ''}
        <div class="badge ${it.type}">${it.type === 'vid' ? '영상' : '이미지'}</div>
        ${(p && p.isShort) ? '<div class="badge short" style="left:auto;right:8px;">쇼츠</div>' : ''}
        ${channelBadge(it)}
        ${thumbUrl ? (it.type === 'vid' ? '<div class="playicon"></div>' : '') : '<span class="mono" style="font-size:10px;color:#3A4048;">미리보기 없음</span>'}
      </div>
      <div class="meta">
        <div class="title">${escapeHtml(it.title || '제목 없음')}</div>
        <div class="note">${escapeHtml(it.note || mapName)}</div>
        ${contributorBadge(it)}
      </div>
    </div>`;
}
function renderHome(){
  const favoriteAccess = document.getElementById('homeFavoriteAccess');
  const addAccess = document.getElementById('homeAddAccess');
  const personal = document.getElementById('homePersonal');
  if(!currentSession){
    favoriteAccess.innerHTML = `<div><h3>☆ 내 즐겨찾기</h3><p>자주 보는 위폭과 팁을 모으려면 Discord 로그인이 필요해요.</p></div><button type="button" class="btn-ghost" onclick="discordLogin()">Discord 로그인</button>`;
    addAccess.innerHTML = `<div><h3>＋ 컨텐츠 추가</h3><p>영상과 이미지를 등록하려면 Discord 로그인이 필요해요.</p></div><button type="button" class="btn-ghost" onclick="discordLogin()">Discord 로그인</button>`;
    personal.style.display = 'none';
    return;
  }

  const nickname = currentSession.user.user_metadata.full_name || currentSession.user.user_metadata.name || '사용자';
  favoriteAccess.innerHTML = `<div><h3>☆ ${escapeHtml(nickname)}님의 즐겨찾기</h3><p>저장한 컨텐츠 ${favorites.length}개를 홈에서 바로 이어보세요.</p></div><span class="home-lock">${favorites.length} SAVED</span>`;
  addAccess.innerHTML = isAdminUser
    ? `<div><h3>＋ 컨텐츠 추가</h3><p>관리자 컨텐츠는 등록 즉시 공개됩니다.</p></div><button type="button" class="btn-primary" onclick="openHomeAdd()">등록 시작</button>`
    : `<div><h3>＋ 컨텐츠 추가</h3><p>등록한 컨텐츠는 관리자 승인 후 전체 맵에 공개됩니다.</p></div><button type="button" class="btn-primary" onclick="openHomeAdd()">등록 시작</button>`;
  personal.style.display = 'block';

  renderMyItems();
  renderContentDraftsList();
  const favoriteItems = favorites.map(row => publicItems().find(it => it.id === row.item_id)).filter(Boolean).slice(0, 4);
  document.getElementById('homeFavorites').innerHTML = favoriteItems.map(renderHomeItemCard).join('') || '<div class="home-empty">아직 저장한 컨텐츠가 없어요.<br>전체 맵에서 별을 눌러 자주 보는 자료를 모아보세요.</div>';
  const recentItems = loadRecentItems().map(entry => publicItems().find(it => it.id === entry.itemId)).filter(Boolean).slice(0, 4);
  document.getElementById('homeRecent').innerHTML = recentItems.map(renderHomeItemCard).join('') || '<div class="home-empty">최근 본 컨텐츠가 없어요.<br>전체 맵에서 자료를 열면 여기에 기록됩니다.</div>';
}
function openHomeAdd(){
  if(!currentSession){ discordLogin(); return; }
  const mapName = prompt('맵 이름을 입력해주세요.\n' + maps.map(m => m.name).join(', '));
  const map = maps.find(m => m.name === String(mapName || '').trim());
  if(!map){ if(mapName) alert('목록에 있는 맵 이름을 정확히 입력해주세요.'); return; }
  const tag = prompt('태그를 입력해주세요.\n' + tagOrder.join(', '));
  if(!tagOrder.includes(tag)){ if(tag) alert('목록에 있는 태그를 정확히 입력해주세요.'); return; }
  currentMap = map.id;
  currentMapName = map.name;
  openAddModal(tag);
}

function renderMyItems(){
  const wrap = document.getElementById('homeMyItems');
  const mine = items.filter(item => item.created_by === currentSession.user.id && item.status !== 'trashed');
  const labels = { pending:'승인 대기', published:'공개됨', rejected:'반려됨' };
  wrap.className = 'submission-list';
  wrap.innerHTML = mine.map(item => `<div class="submission-row">
    <div><b>${escapeHtml(item.title || '제목 없음')}</b><br><span class="status-pill">${labels[item.status] || item.status}</span>${item.rejection_reason ? ` <small>${escapeHtml(item.rejection_reason)}</small>` : ''}</div>
    <div class="actions">
      ${item.status !== 'published' ? `<button class="btn-ghost" onclick="openEditModal(event,'${item.id}')">수정</button><button class="btn-ghost" onclick="hideOwnItem('${item.id}')">숨기기</button>` : '<small>승인 후에는 관리자만 삭제할 수 있습니다.</small>'}
    </div>
  </div>`).join('') || '<div class="home-empty">아직 추가한 컨텐츠가 없습니다.</div>';
}

async function hideOwnItem(id){
  if(!confirm('승인 전 컨텐츠를 숨길까요? 숨긴 항목은 목록에서 사라집니다.')) return;
  const { error } = await sb.from('items').update({ status:'trashed', deleted_at:new Date().toISOString() }).eq('id', id);
  if(error){ alert('숨기기 실패: ' + error.message); return; }
  await loadAll();
}
function refreshPublicDataIfStale(force){
  if(force || Date.now() - lastDataLoadedAt >= PUBLIC_REFRESH_MS) return loadAll();
}

function renderMapGrid(){
  if(document.getElementById('globalTitleSearch').value.trim()){ renderGlobalTitleSearch(); return; }
  const grid = document.getElementById('mapGrid');
  grid.className = 'map-grid';
  const tilesHtml = maps.map(m => {
    const count = publicItems().filter(i => i.map_id === m.id).length;
    const safe = m.name.replace(/'/g,"\\'");
    return `
    <div class="map-tile cut-sm" onclick="openMap('${m.id}','${safe}')">
      <div class="map-thumb">
        ${m.img ? `<img loading="lazy" src="${m.img}" alt="">` : '<span class="no-img">이미지 없음</span>'}
      </div>
      <div class="info">
        <div class="name">${m.name}</div>
        <div class="count mono">${count} ITEMS</div>
      </div>
    </div>
  `;}).join('');
  grid.innerHTML = tilesHtml || `<div class="loading">등록된 맵이 없어요.</div>`;
}

function renderGlobalTitleSearch(){
  const query = document.getElementById('globalTitleSearch').value.trim().toLowerCase();
  if(!query){ renderMapGrid(); return; }
  const filtered = sortFavorites(publicItems().filter(it => String(it.title ?? '').toLowerCase().includes(query) || String(it.channel_name ?? '').toLowerCase().includes(query)));
  const grid = document.getElementById('mapGrid');
  grid.className = 'card-grid-inner';
  grid.innerHTML = filtered.map(it => {
    const p = it.type === 'vid' ? parseYouTube(it.video_url) : null;
    const thumbUrl = it.type === 'vid' ? ytThumb(it.video_url) : it.img_url;
    const mapName = maps.find(m => m.id === it.map_id)?.name || '알 수 없는 맵';
    return `
    <div class="card" onclick="openOverlay('${it.id}')">
      ${favoriteButton(it)}
      <div class="thumb">
        ${thumbUrl ? `<img loading="lazy" src="${thumbUrl}" alt="">` : ''}
        <div class="badge ${it.type}">${it.type==='vid' ? '영상' : '이미지'}</div>
        ${(p && p.isShort) ? '<div class="badge short" style="left:auto;right:8px;">쇼츠</div>' : ''}
        ${channelBadge(it)}
        ${thumbUrl
          ? (it.type==='vid' ? '<div class="playicon"></div>' : '')
          : `<span class="mono" style="font-size:10px;color:#3A4048;">${it.type==='vid' ? '아직 등록된 영상 없음' : '아직 등록된 이미지 없음'}</span>`}
      </div>
      <div class="meta">
        <div class="title">${it.title}</div>
        ${it.note ? `<div class="note">${it.note}</div>` : ''}
        <div class="note">${mapName} · ${teamLabel(it.team) || String(it.team || '').toUpperCase()}</div>
        ${contributorBadge(it)}
      </div>
    </div>`;
  }).join('') || `<div class="mono" style="color:var(--muted);font-size:12px;">일치하는 제목 또는 채널이 없어요.</div>`;
}

async function addMap(){
  const name = prompt('추가할 맵 이름을 입력하세요');
  if(!name || !name.trim()) return;
  if(maps.some(m => m.name === name.trim())){ alert('이미 있는 맵 이름이에요.'); return; }
  const maxOrder = maps.reduce((mx,m) => Math.max(mx, m.sort_order||0), 0);
  const { error } = await sb.from('maps').insert({ name: name.trim(), sort_order: maxOrder+1 });
  if(error){ alert('추가 실패: ' + error.message); return; }
  await loadAll();
}
async function renameMap(e,id,oldName){
  e.stopPropagation();
  const name = prompt('새 맵 이름', oldName);
  if(!name || !name.trim() || name.trim() === oldName) return;
  const { error } = await sb.from('maps').update({ name: name.trim() }).eq('id', id);
  if(error){ alert('변경 실패: ' + error.message); return; }
  await loadAll();
}
async function deleteMap(e,id,name){
  e.stopPropagation();
  const count = items.filter(i => i.map_id === id).length;
  const warn = count > 0
    ? `⚠️ "${name}" 맵을 삭제하면 이 맵에 등록된 ${count}개 항목(영상·이미지)도 함께 영구 삭제됩니다.\n\n정말 삭제하시겠어요? 되돌릴 수 없어요.`
    : `⚠️ "${name}" 맵을 삭제하시겠어요? 되돌릴 수 없어요.`;
  if(!confirm(warn)) return;
  const { error } = await sb.from('maps').delete().eq('id', id);
  if(error){ alert('삭제 실패: ' + error.message); return; }
  await loadAll();
}

async function deleteItem(e,id){
  e.stopPropagation();
  if(!confirm('이 항목을 삭제하시겠어요? 되돌릴 수 없어요.')) return;
  const { error } = await sb.from('items').delete().eq('id', id);
  if(error){ alert('삭제 실패: ' + error.message); return; }
  await loadAll();
  renderCards();
}

let pendingMapId = null;
function pickMapImage(e,id){ e.stopPropagation(); pendingMapId = id; document.getElementById('mapImgInput').click(); }
document.getElementById('mapImgInput').addEventListener('change', async function(e){
  const file = e.target.files[0]; if(!file || !pendingMapId) return;
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^A-Za-z0-9]/g,'').toLowerCase() || 'jpg';
  const path = `maps/${pendingMapId}-${Date.now()}.${ext}`;
  const { error: up } = await sb.storage.from('media').upload(path, file);
  if(up){ alert('업로드 실패: ' + up.message); return; }
  const { data: pub } = sb.storage.from('media').getPublicUrl(path);
  const { error: upd } = await sb.from('maps').update({ img: pub.publicUrl }).eq('id', pendingMapId);
  if(upd){ alert('저장 실패: ' + upd.message); return; }
  pendingMapId = null; e.target.value = ''; await loadAll();
});

function showMapGrid(){
  clearTitleSearch();
  clearGlobalTitleSearch();
  document.getElementById('viewHome').classList.remove('active');
  document.getElementById('viewGrid').classList.add('active');
  document.getElementById('viewDetail').classList.remove('active');
  document.getElementById('viewMaster').classList.remove('active');
  document.getElementById('masterBtn').classList.remove('active');
  document.getElementById('crumbMap').style.display = 'none';
  document.getElementById('crumbSep').style.display = 'none';
  renderMapGrid();
  void refreshPublicDataIfStale(false);
}

function showHome(){
  clearTitleSearch();
  clearGlobalTitleSearch();
  document.getElementById('viewHome').classList.add('active');
  document.getElementById('viewGrid').classList.remove('active');
  document.getElementById('viewDetail').classList.remove('active');
  document.getElementById('viewMaster').classList.remove('active');
  document.getElementById('masterBtn').classList.remove('active');
  document.getElementById('crumbMap').style.display = 'none';
  document.getElementById('crumbSep').style.display = 'none';
  renderHome();
  void refreshPublicDataIfStale(false);
}

function openMap(id, name){
  clearGlobalTitleSearch();
  currentMap = id;
  currentMapName = name;
  document.getElementById('viewHome').classList.remove('active');
  document.getElementById('viewGrid').classList.remove('active');
  document.getElementById('viewDetail').classList.add('active');
  document.getElementById('viewMaster').classList.remove('active');
  document.getElementById('masterBtn').classList.remove('active');
  document.getElementById('crumbMap').style.display = 'inline';
  document.getElementById('crumbSep').style.display = 'inline';
  document.getElementById('crumbMap').textContent = name;
  document.getElementById('detailTitle').innerHTML = name + ' <span id="detailCount"></span>';
  setTeam('total');
}

function openMaster(){
  if(!isAdminUser) return;
  clearTitleSearch();
  clearGlobalTitleSearch();
  document.getElementById('viewHome').classList.remove('active');
  document.getElementById('viewGrid').classList.remove('active');
  document.getElementById('viewDetail').classList.remove('active');
  document.getElementById('viewMaster').classList.add('active');
  document.getElementById('masterBtn').classList.add('active');
  document.getElementById('crumbMap').style.display = 'none';
  document.getElementById('crumbSep').style.display = 'none';
  switchMasterTab('stats');
}

function switchMasterTab(tab){
  document.querySelectorAll('.master-tab[data-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.getElementById('masterPaneStats').classList.toggle('active', tab === 'stats');
  document.getElementById('masterPaneItems').classList.toggle('active', tab === 'items');
  document.getElementById('masterPaneMaps').classList.toggle('active', tab === 'maps');
  document.getElementById('masterPaneComments').classList.toggle('active', tab === 'comments');
  document.getElementById('masterPaneApprovals').classList.toggle('active', tab === 'approvals');
  if(tab === 'stats') loadMasterStats();
  if(tab === 'items') renderMasterItemsTab();
  if(tab === 'maps') renderMasterMapsTable();
  if(tab === 'comments') loadMasterComments();
  if(tab === 'approvals') renderMasterApprovals();
}

function renderMasterApprovals(){
  const wrap = document.getElementById('masterApprovalsTableWrap');
  const pending = items.filter(item => item.status === 'pending');
  wrap.innerHTML = pending.length ? `<table class="master-table"><thead><tr><th>작성자</th><th>제목</th><th>맵</th><th>미리보기</th><th>처리</th></tr></thead><tbody>${pending.map(item => `<tr>
    <td>${contributorBadge(item) || '-'}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(maps.find(m => m.id === item.map_id)?.name || '-')}</td>
    <td><button class="btn-ghost" onclick="openOverlay('${item.id}',false)">보기</button></td>
    <td><button class="btn-primary" onclick="reviewItem('${item.id}',true)">승인</button> <button class="btn-ghost" onclick="reviewItem('${item.id}',false)">반려</button></td>
  </tr>`).join('')}</tbody></table>` : '<div class="loading">승인 대기 컨텐츠가 없습니다.</div>';
}

async function reviewItem(id, approve){
  const reason = approve ? null : prompt('반려 사유를 입력해주세요.');
  if(!approve && reason === null) return;
  const payload = { status: approve ? 'published' : 'rejected', reviewed_at:new Date().toISOString(), reviewed_by:currentSession.user.id, rejection_reason:reason || null };
  const { error } = await sb.from('items').update(payload).eq('id', id);
  if(error){ alert('처리 실패: ' + error.message); return; }
  await loadAll();
  renderMasterApprovals();
}

function renderMasterItemsTab(){
  const mapSel = document.getElementById('masterItemsMapFilter');
  const prevMap = mapSel.value;
  mapSel.innerHTML = '<option value="">맵 전체</option>' +
    maps.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  mapSel.value = prevMap;

  const tagSel = document.getElementById('masterItemsTagFilter');
  const prevTag = tagSel.value;
  tagSel.innerHTML = '<option value="">태그 전체</option>' +
    tagOrder.map(t => `<option value="${t}">${t}</option>`).join('');
  tagSel.value = prevTag;

  renderMasterItemsTable();
}

function renderMasterItemsTable(){
  const wrap = document.getElementById('masterItemsTableWrap');
  if(items.length === 0){
    wrap.innerHTML = '<div class="loading">등록된 항목이 없어요.</div>';
    return;
  }
  const mapId = document.getElementById('masterItemsMapFilter').value;
  const tag = document.getElementById('masterItemsTagFilter').value;
  const team = document.getElementById('masterItemsTeamFilter').value;
  const query = document.getElementById('masterItemsSearch').value.trim().toLowerCase();
  const filtered = items.filter(it =>
    (!mapId || it.map_id === mapId) &&
    (!tag || it.tag === tag) &&
    (!team || it.team === team) &&
    (!query || String(it.title ?? '').toLowerCase().includes(query))
  );
  if(filtered.length === 0){
    wrap.innerHTML = '<div class="loading">조건에 맞는 항목이 없어요.</div>';
    return;
  }
  const rows = filtered.map(it => {
    const mapName = maps.find(m => m.id === it.map_id)?.name || '알 수 없는 맵';
    const thumbUrl = it.type === 'vid' ? ytThumb(it.video_url) : it.img_url;
    return `<tr>
      <td class="thumb-cell">${thumbUrl ? `<img loading="lazy" src="${thumbUrl}" alt="">` : ''}</td>
      <td>${escapeHtml(it.title)}</td>
      <td>${escapeHtml(mapName)}</td>
      <td>${escapeHtml(it.tag||'')}</td>
      <td>${escapeHtml(teamLabel(it.team) || '')}</td>
      <td><span class="icon-btn" onclick="openEditModal(event,'${it.id}')" title="수정">⚙</span></td>
      <td><span class="icon-btn del" onclick="deleteItem(event,'${it.id}')" title="삭제">✕</span></td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `
    <table class="master-table">
      <thead><tr><th>미리보기</th><th>제목</th><th>맵</th><th>태그</th><th>진영</th><th>수정</th><th>삭제</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderMasterMapsTable(){
  const wrap = document.getElementById('masterMapsTableWrap');
  if(maps.length === 0){
    wrap.innerHTML = '<div class="loading">등록된 맵이 없어요.</div>';
    return;
  }
  const rows = maps.map(m => {
    const count = items.filter(i => i.map_id === m.id).length;
    const safe = m.name.replace(/'/g,"\\'");
    return `<tr>
      <td class="thumb-cell">${m.img ? `<img loading="lazy" src="${m.img}" alt="">` : ''}</td>
      <td>${escapeHtml(m.name)}</td>
      <td class="num">${count}</td>
      <td><span class="icon-btn" onclick="pickMapImage(event,'${m.id}')" title="이미지 변경">🖼</span></td>
      <td><span class="icon-btn" onclick="renameMap(event,'${m.id}','${safe}')" title="이름 변경">✎</span></td>
      <td><span class="icon-btn del" onclick="deleteMap(event,'${m.id}','${safe}')" title="삭제">✕</span></td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `
    <table class="master-table">
      <thead><tr><th>썸네일</th><th>맵 이름</th><th>항목 수</th><th>이미지 변경</th><th>이름 변경</th><th>삭제</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function loadMasterComments(){
  const wrap = document.getElementById('masterCommentsTableWrap');
  const mapSel = document.getElementById('masterCommentsMapFilter');
  const prevMap = mapSel.value;
  mapSel.innerHTML = '<option value="">맵 전체</option>' +
    maps.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  mapSel.value = prevMap;
  wrap.innerHTML = '<div class="loading">불러오는 중...</div>';
  // ponytail: 전체 댓글을 한 번에 내려받아 클라이언트에서 필터링. 댓글 수가 커져 PostgREST 기본 행 제한이나 렌더 성능 문제가 실제로 발생하면 서버 페이지네이션으로 전환.
  const { data, error } = await sb.from('comments')
    .select('id, item_id, user_id, author_name, body, created_at')
    .order('created_at', { ascending: false });
  if(error){
    wrap.innerHTML = `<div class="loading">댓글을 불러오지 못했어요.<br>${escapeHtml(error.message)}</div>`;
    document.getElementById('masterCommentsCount').textContent = '';
    return;
  }
  masterComments = data || [];
  renderMasterCommentsTable();
}

function renderMasterCommentsTable(){
  const wrap = document.getElementById('masterCommentsTableWrap');
  const countEl = document.getElementById('masterCommentsCount');
  const mapId = document.getElementById('masterCommentsMapFilter').value;
  const query = document.getElementById('masterCommentsSearch').value.trim().toLowerCase();
  // 항목이 삭제되어 items[]에 없으면 '삭제된 항목'으로 표시(정상 FK/ON DELETE CASCADE에서는 드문 방어 경로)
  const rows_ = masterComments.map(c => {
    const it = items.find(i => i.id === c.item_id);
    const map = it ? maps.find(m => m.id === it.map_id) : null;
    return {
      c, it,
      title: it ? it.title : '삭제된 항목',
      mapName: it ? (map ? map.name : '알 수 없는 맵') : '삭제된 항목',
      mapId: it ? it.map_id : null
    };
  });
  const filtered = rows_.filter(r =>
    (!mapId || r.mapId === mapId) &&
    (!query ||
      r.c.body.toLowerCase().includes(query) ||
      r.c.author_name.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query))
  );
  countEl.textContent = `${filtered.length} / ${masterComments.length}개`;
  if(masterComments.length === 0){
    wrap.innerHTML = '<div class="loading">아직 댓글이 없어요.</div>';
    return;
  }
  if(filtered.length === 0){
    wrap.innerHTML = '<div class="loading">조건에 맞는 댓글이 없어요.</div>';
    return;
  }
  const rows = filtered.map(r => {
    const c = r.c;
    const abs = escapeHtml(new Date(c.created_at).toLocaleString());
    return `<tr>
      <td>${escapeHtml(c.author_name)}</td>
      <td>${escapeHtml(c.body)}</td>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.mapName)}</td>
      <td class="num" title="${abs}">${formatRelativeTime(c.created_at)}</td>
      <td>${r.it ? `<span class="icon-btn" onclick="openOverlay('${r.it.id}', false)" title="항목 보기">🔍</span>` : ''}</td>
      <td><span class="icon-btn del" onclick="masterDeleteComment('${c.id}')" title="삭제">✕</span></td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `
    <table class="master-table">
      <thead><tr><th>작성자</th><th>내용</th><th>항목</th><th>맵</th><th>작성 시각</th><th>보기</th><th>삭제</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function masterDeleteComment(commentId){
  const ok = await deleteComment(commentId);
  if(!ok) return;
  masterComments = masterComments.filter(c => c.id !== commentId);
  renderMasterCommentsTable();
}

async function loadMasterStats(){
  const wrap = document.getElementById('masterTableWrap');
  wrap.innerHTML = '<div class="loading">불러오는 중...</div>';
  // ponytail: item_clicks/favorites 전체 행을 내려받아 클라이언트에서 집계(items가 아직 소수라 1단계엔 충분). 항목 수가 크게 늘면 서버 집계(RPC/뷰)로 전환.
  const [{ data: clickRows, error: clickErr }, { data: favRows, error: favErr }] = await Promise.all([
    sb.from('item_clicks').select('item_id'),
    sb.from('favorites').select('item_id')
  ]);
  if(clickErr || favErr){
    document.getElementById('statTotalClicks').textContent = '-';
    document.getElementById('statTotalFavorites').textContent = '-';
    document.getElementById('statTotalItems').textContent = '-';
    wrap.innerHTML = `<div class="loading">조회 실패: ${(clickErr||favErr).message}</div>`;
    return;
  }
  const clickCountByItem = new Map();
  clickRows.forEach(r => clickCountByItem.set(r.item_id, (clickCountByItem.get(r.item_id)||0) + 1));
  const favCountByItem = new Map();
  favRows.forEach(r => favCountByItem.set(r.item_id, (favCountByItem.get(r.item_id)||0) + 1));

  document.getElementById('statTotalClicks').textContent = clickRows.length;
  document.getElementById('statTotalFavorites').textContent = favRows.length;
  document.getElementById('statTotalItems').textContent = items.length;

  if(items.length === 0){
    wrap.innerHTML = '<div class="loading">등록된 항목이 없어요.</div>';
    return;
  }
  const rows = [...items]
    .sort((a,b) => (clickCountByItem.get(b.id)||0) - (clickCountByItem.get(a.id)||0))
    .map(it => {
      const mapName = maps.find(m => m.id === it.map_id)?.name || '알 수 없는 맵';
      return `<tr>
        <td>${escapeHtml(it.title)}</td>
        <td>${escapeHtml(mapName)}</td>
        <td>${escapeHtml(it.tag||'')}</td>
        <td class="num">${clickCountByItem.get(it.id)||0}</td>
        <td class="num">${favCountByItem.get(it.id)||0}</td>
      </tr>`;
    }).join('');
  wrap.innerHTML = `
    <table class="master-table">
      <thead><tr><th>제목</th><th>맵</th><th>태그</th><th>클릭</th><th>즐찾</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function setTeam(t){
  if(t === 'favorite' && !currentSession){
    if(confirm('즐겨찾기 보기는 Discord 로그인이 필요합니다. 로그인할까요?')) discordLogin();
    return;
  }
  currentTeam = t;
  clearTitleSearch();
  document.getElementById('btnTotal').className = t==='total' ? 'on-total' : '';
  document.getElementById('btnRed').className = t==='red' ? 'on-red' : '';
  document.getElementById('btnBlue').className = t==='blue' ? 'on-blue' : '';
  document.getElementById('btnFavorite').className = t==='favorite' ? 'on-favorite' : '';
  renderCards();
}

function clearTitleSearch(){ document.getElementById('titleSearch').value = ''; }
function clearGlobalTitleSearch(){ document.getElementById('globalTitleSearch').value = ''; }

function favoriteRow(id){ return favorites.find(f => f.item_id === id); }
function sortFavorites(list){
  return [...list].sort((a, b) => {
    const af = favoriteRow(a.id), bf = favoriteRow(b.id);
    if(af && bf) return new Date(bf.created_at) - new Date(af.created_at);
    return af ? -1 : (bf ? 1 : 0);
  });
}
function favoriteButton(it){
  if(it.tag !== '위폭' && it.tag !== '팁') return '';
  const active = !!favoriteRow(it.id);
  return `<button type="button" class="card-fav${active ? ' on' : ''}" aria-label="즐겨찾기 ${active ? '해제' : '추가'}" onclick="toggleFavorite(event,'${it.id}')">${active ? '★' : '☆'}</button>`;
}
function rerenderCurrentView(){
  if(document.getElementById('viewHome').classList.contains('active')) renderHome();
  else if(document.getElementById('viewDetail').classList.contains('active')) renderCards();
  else renderMapGrid();
}
async function discordLogin(){
  const { error } = await sb.auth.signInWithOAuth({ provider: 'discord' });
  if(error) alert('로그인 실패: ' + error.message);
}
async function loadFavorites(){
  const userId = currentSession && currentSession.user.id;
  if(!userId){ favorites = []; return; }
  const { data, error } = await sb.from('favorites').select('item_id, created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if(currentSession && currentSession.user.id === userId){
    favorites = error ? [] : (data || []);
    if(error) alert('즐겨찾기를 불러오지 못했어요: ' + error.message);
  }
}
async function toggleFavorite(e, itemId){
  e.stopPropagation();
  if(!currentSession){
    if(confirm('Discord 로그인이 필요한 기능입니다. 로그인할까요?')) discordLogin();
    return;
  }
  const userId = currentSession.user.id;
  if(favoritePending.has(itemId)) return;
  favoritePending.add(itemId);
  try {
    const existing = favoriteRow(itemId);
    if(existing){
      const { error } = await sb.from('favorites').delete().eq('user_id', userId).eq('item_id', itemId);
      if(error) throw error;
      if(!currentSession || currentSession.user.id !== userId) return;
      favorites = favorites.filter(f => f.item_id !== itemId);
    } else {
      const { data, error } = await sb.from('favorites').insert({ user_id: userId, item_id: itemId }).select('item_id, created_at').single();
      if(error) throw error;
      if(!currentSession || currentSession.user.id !== userId) return;
      favorites = [data, ...favorites];
    }
    rerenderCurrentView();
  } catch(error){
    alert('즐겨찾기 변경 실패: ' + error.message);
  } finally {
    favoritePending.delete(itemId);
  }
}

async function trackClick(itemId){
  try {
    const { error } = await sb.from('item_clicks').insert({
      item_id: itemId,
      user_id: currentSession?.user?.id || null
    });
    if(error) console.warn('클릭 기록 실패:', error.message);
  } catch(error){
    console.warn('클릭 기록 실패:', error);
  }
}

function parseYouTube(url){
  if(!url) return null;
  const short = url.match(/shorts\/([A-Za-z0-9_-]{6,})/);
  if(short) return { id: short[1], isShort: true };
  const normal = url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{6,})/);
  if(normal) return { id: normal[1], isShort: false };
  return null;
}
async function fetchYouTubeChannelName(videoUrl){
  if(!parseYouTube(videoUrl)) return null;
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(endpoint);
    if(!res.ok) return null;
    const data = await res.json();
    const name = typeof data.author_name === 'string' ? data.author_name.trim() : '';
    return name || null;
  } catch(error){
    console.warn('YouTube channel name fetch failed:', error);
    return null;
  }
}
function ytThumb(url){
  const p = parseYouTube(url);
  return p ? `https://img.youtube.com/vi/${p.id}/hqdefault.jpg` : '';
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function teamLabel(team){
  if(team === 'red') return 'RED';
  if(team === 'blue') return 'BLUE';
  if(team === 'none') return '공통';
  console.warn('알 수 없는 team 값:', team);
  return null;
}
function teamBadge(it){
  if(currentTeam !== 'total' && currentTeam !== 'favorite') return '';
  const label = teamLabel(it.team);
  if(!label) return '';
  const bg = it.team === 'red' ? 'var(--red)' : it.team === 'blue' ? 'var(--blue)' : 'var(--muted)';
  const color = it.team === 'none' ? 'var(--bg)' : '#fff';
  return `<div class="badge" style="top:28px;left:8px;background:${bg};color:${color};">${label}</div>`;
}
function channelBadge(it){
  if(it.type !== 'vid' || !it.channel_name) return '';
  return `<div class="channel-badge">${escapeHtml(it.channel_name)}</div>`;
}

// 유튜브 IFrame API 로드 (클립 구간 제어용)
let ytReady = false, ytPlayer = null;
(function(){
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();
window.onYouTubeIframeAPIReady = function(){ ytReady = true; };

function renderCards(){
  const query = document.getElementById('titleSearch').value.trim().toLowerCase();
  const mapItems = publicItems().filter(i => i.map_id === currentMap);
  const teamItems = currentTeam === 'total' ? mapItems
    : currentTeam === 'favorite' ? mapItems.filter(i => favoriteRow(i.id))
    : mapItems.filter(i => i.team === currentTeam);
  const filtered = query ? teamItems.filter(i => String(i.title ?? '').toLowerCase().includes(query) || String(i.channel_name ?? '').toLowerCase().includes(query)) : teamItems;
  document.getElementById('detailCount').textContent = '(' + filtered.length + ')';

  const groups = {};
  filtered.forEach(it => {
    if(!groups[it.tag]) groups[it.tag] = [];
    groups[it.tag].push(it);
  });
  tagOrder.forEach(t => { if(!groups[t]) groups[t] = []; });

  const sortedTags = Object.keys(groups)
    .filter(t => groups[t].length > 0)
    .sort((a, b) => {
      const ai = tagOrder.indexOf(a), bi = tagOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const container = document.getElementById('cardGrid');
  container.innerHTML = sortedTags.map(tag => {
    const list = sortFavorites(groups[tag]);
    const isMapLabel = tag === '맵 지명';
    return `
    <div class="tag-section">
      <div class="section-label"><b>${tag}</b></div>
      <div class="card-grid-inner">
        ${list.map(it => {
          const p = it.type === 'vid' ? parseYouTube(it.video_url) : null;
          const thumbUrl = it.type === 'vid' ? ytThumb(it.video_url) : it.img_url;
          const shortBadge = (p && p.isShort) ? '<div class="badge short" style="left:auto;right:8px;">쇼츠</div>' : '';
          return `
          <div class="card" onclick="openOverlay('${it.id}')">
            ${favoriteButton(it)}
            <div class="thumb">
              ${thumbUrl ? `<img loading="lazy" src="${thumbUrl}" alt="">` : ''}
              <div class="badge ${it.type}">${it.type==='vid' ? '영상' : '이미지'}</div>
              ${shortBadge}
              ${teamBadge(it)}
              ${channelBadge(it)}
              ${thumbUrl
                ? (it.type==='vid' ? '<div class="playicon"></div>' : '')
                : `<span class="mono" style="font-size:10px;color:#3A4048;">${it.type==='vid' ? '아직 등록된 영상 없음' : '아직 등록된 이미지 없음'}</span>`
              }
            </div>
            ${isMapLabel ? `<div class="meta">${contributorBadge(it)}</div>` : `
            <div class="meta">
              <div class="title">${it.title}</div>
              ${it.note ? `<div class="note">${it.note}</div>` : ''}
              ${contributorBadge(it)}
            </div>`}
          </div>
        `;}).join('')}
      </div>
    </div>
  `;
  }).join('') || `<div class="mono" style="color:var(--muted);font-size:12px;">${query ? '일치하는 제목 또는 채널이 없어요.' : '이 진영에 등록된 항목이 없어요.'}</div>`;
}

function getEffectiveClipRange(it, duration){
  const start = it.clip_start != null ? it.clip_start : 0;
  const end = it.clip_end != null ? it.clip_end : duration;
  return { start, end };
}
function loadSavedVolume(){
  const raw = localStorage.getItem('sa-volume');
  const num = Number(raw);
  return (raw !== null && Number.isFinite(num) && num >= 0 && num <= 100) ? num : 50;
}
function loadSavedMuted(){
  return localStorage.getItem('sa-muted') === '1';
}

let overlayTimer = null;
let overlayVideoId = null;
let overlayHasClip = false;
let overlayClipRange = null; // 클립 재생 중일 때만 {start,end}, 전체 영상 모드에서는 null(커스텀 시크바 없음)
let overlaySeeking = false;
let lastPolledVolume = null;
let lastPolledMuted = null;
let overlaySession = 0; // 오버레이를 열거나 모드를 바꿀 때마다 증가 — 지연된 build()/onReady가 낡은 세션에 뒤늦게 적용되는 것을 막음
let overlayBuildTimer = null; // YT.Player API 로드 대기용 폴링(ytReady가 아직 false일 때만 사용)
let overlayCommentItemId = null; // 현재 오버레이가 열려 있는 항목의 id, 댓글 로딩 응답이 늦게 와도 이 값과 다르면 무시
let overlayImgZoomEnabled = false; // 현재 열린 항목이 이미지 타입일 때만 true(영상 타입에는 확대/이동 로직이 전혀 동작하지 않음)
let overlayImgScale = 1;
let overlayImgTx = 0;
let overlayImgTy = 0;
let overlayImgDragging = false;
let overlayImgDragStart = null; // {x, y, tx, ty} — 마우스/한 손가락 드래그 시작 시점 스냅샷
let overlayImgPinch = null; // {distance, scale} — 핀치 제스처 시작 시점 스냅샷
let overlayImgLastTapTime = 0; // 모바일 더블탭 리셋 판정용
let overlayComments = [];
function waitForYT(session, build){
  if(ytReady && window.YT && YT.Player){ build(); return; }
  if(overlayBuildTimer) clearInterval(overlayBuildTimer);
  overlayBuildTimer = setInterval(() => {
    if(window.YT && YT.Player){
      clearInterval(overlayBuildTimer); overlayBuildTimer = null; ytReady = true;
      if(session === overlaySession) build();
    }
  }, 200);
}

function updateVolumeUI(volume, muted){
  const btn = document.getElementById('overlayVolumeBtn');
  const slider = document.getElementById('overlayVolumeSlider');
  if(btn){
    btn.textContent = (muted || volume === 0) ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? '음소거 해제' : '음소거');
  }
  if(slider && document.activeElement !== slider) slider.value = volume;
}
function pollOverlayPlayer(){
  if(!ytPlayer || !ytPlayer.getVolume || !ytPlayer.isMuted) return;
  const volume = ytPlayer.getVolume();
  const muted = ytPlayer.isMuted();
  if(volume !== lastPolledVolume){ lastPolledVolume = volume; localStorage.setItem('sa-volume', String(volume)); }
  if(muted !== lastPolledMuted){ lastPolledMuted = muted; localStorage.setItem('sa-muted', muted ? '1' : '0'); }
  updateVolumeUI(volume, muted);

  if(overlayClipRange && ytPlayer.getCurrentTime){
    const t = ytPlayer.getCurrentTime();
    if(t >= overlayClipRange.end){ ytPlayer.seekTo(overlayClipRange.start, true); } // 구간 반복
    const seekbar = document.getElementById('overlaySeekbar');
    if(seekbar && !overlaySeeking){
      seekbar.value = Math.min(Math.max(t - overlayClipRange.start, 0), overlayClipRange.end - overlayClipRange.start);
    }
  }
}
function startOverlayTimer(){
  if(overlayTimer) clearInterval(overlayTimer);
  overlayTimer = setInterval(pollOverlayPlayer, 250);
}
function onOverlaySeekbarInput(value){
  if(!ytPlayer || !overlayClipRange || !ytPlayer.seekTo) return;
  const wasPaused = ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PAUSED;
  ytPlayer.seekTo(overlayClipRange.start + Number(value), true);
  if(wasPaused && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
}
function onOverlayVolumeInput(value){
  if(!ytPlayer || !ytPlayer.setVolume) return;
  const v = Number(value);
  ytPlayer.setVolume(v);
  // ytPlayer.isMuted()는 postMessage 왕복 지연으로 방금 mute()/unMute() 호출 직후엔 값이
  // 아직 갱신 안 됐을 수 있어(비동기), 우리가 직접 추적하는 lastPolledMuted를 기준으로 판단한다
  if(v > 0 && lastPolledMuted && ytPlayer.unMute){ ytPlayer.unMute(); lastPolledMuted = false; localStorage.setItem('sa-muted', '0'); }
  lastPolledVolume = v;
  localStorage.setItem('sa-volume', String(v));
  updateVolumeUI(v, lastPolledMuted);
}
function toggleOverlayMute(){
  if(!ytPlayer || !ytPlayer.mute || !ytPlayer.unMute) return;
  const nextMuted = !lastPolledMuted;
  if(nextMuted) ytPlayer.mute(); else ytPlayer.unMute();
  lastPolledMuted = nextMuted;
  localStorage.setItem('sa-muted', nextMuted ? '1' : '0');
  const slider = document.getElementById('overlayVolumeSlider');
  if(slider) slider.style.display = slider.style.display === 'block' ? 'none' : 'block';
  updateVolumeUI(lastPolledVolume != null ? lastPolledVolume : 50, nextMuted);
}

function openOverlay(id, trackView){
  const it = items.find(i => i.id === id);
  if(!it) return;
  if(trackView !== false){ void trackClick(id); recordRecentItem(id); }
  const media = document.getElementById('overlayMediaContent');
  const playPauseBtn = document.getElementById('overlayPlayPause');
  const fullBtn = document.getElementById('overlayFullBtn');
  const volumeBtn = document.getElementById('overlayVolumeBtn');
  const volumeSlider = document.getElementById('overlayVolumeSlider');
  const seekbar = document.getElementById('overlaySeekbar');

  // 이전 플레이어/타이머 정리
  overlaySession += 1;
  const session = overlaySession;
  if(overlayBuildTimer){ clearInterval(overlayBuildTimer); overlayBuildTimer = null; }
  if(overlayTimer){ clearInterval(overlayTimer); overlayTimer = null; }
  if(ytPlayer && ytPlayer.destroy){ ytPlayer.destroy(); ytPlayer = null; }
  playPauseBtn.style.display = 'none';
  fullBtn.style.display = 'none';
  volumeBtn.style.display = 'none';
  volumeSlider.style.display = 'none';
  seekbar.style.display = 'none';
  overlayVideoId = null;
  overlayHasClip = false;
  overlayClipRange = null;
  overlaySeeking = false;
  overlayImgZoomEnabled = false;
  resetImageZoomState();
  document.getElementById('overlayZoomReset').style.display = 'none';
  media.style.touchAction = '';

  if(it.type === 'vid' && it.video_url){
    const p = parseYouTube(it.video_url);
    if(p){
      document.getElementById('overlayMedia').className = 'overlay-media ' + (p.isShort ? 'tall' : 'wide');
      const hasClip = (it.clip_start != null || it.clip_end != null);
      overlayHasClip = hasClip;
      overlayVideoId = p.id;

      if(hasClip){
        // 클립 구간이 있으면 JS 플레이어로 제어 (쇼츠도 구간 적용됨), 컨트롤바는 숨겨서 구간 밖으로 못 나가게 함
        const mount = document.createElement('div');
        media.innerHTML = '';
        media.appendChild(mount);
        const build = () => {
          ytPlayer = new YT.Player(mount, {
            videoId: p.id,
            playerVars: { autoplay:1, playsinline:1, controls:0, rel:0, start: it.clip_start != null ? it.clip_start : 0, origin:location.origin, cc_load_policy:0 },
            events: {
              onReady: (e) => {
                if(session !== overlaySession) return; // 그 사이 오버레이가 닫히거나 다른 항목으로 바뀌었으면 무시
                const range = getEffectiveClipRange(it, e.target.getDuration());
                overlayClipRange = range;
                const savedVolume = loadSavedVolume();
                const savedMuted = loadSavedMuted();
                e.target.setVolume(savedVolume);
                if(savedMuted) e.target.mute();
                lastPolledVolume = savedVolume;
                lastPolledMuted = savedMuted;
                updateVolumeUI(savedVolume, savedMuted);
                seekbar.max = range.end - range.start;
                seekbar.value = 0;
                seekbar.style.display = 'block';
                volumeBtn.style.display = 'flex';
                e.target.seekTo(range.start, true);
                e.target.playVideo();
                startOverlayTimer();
              },
              onStateChange: (e) => {
                if(session !== overlaySession) return; // 낡은 세션의 지연된 상태 이벤트가 현재 버튼을 건드리지 않게 함
                if(e.data === YT.PlayerState.PLAYING){
                  playPauseBtn.textContent = '⏸';
                } else if(e.data === YT.PlayerState.PAUSED){
                  playPauseBtn.textContent = '▶';
                }
              }
            }
          });
        };
        waitForYT(session, build);

        playPauseBtn.textContent = '⏸';
        playPauseBtn.style.display = 'flex';
        fullBtn.style.display = 'inline-block';
      } else {
        // 구간 없으면 일반 임베드(iframe이라 JS API로 제어 불가 — 볼륨 기억/시크바는 이 범위 밖)
        media.innerHTML = `<iframe src="https://www.youtube.com/embed/${p.id}?rel=0&autoplay=1&playsinline=1&cc_load_policy=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      }
    } else {
      document.getElementById('overlayMedia').className = 'overlay-media wide';
      media.innerHTML = `<span>유튜브 링크 형식을 확인해주세요</span>`;
    }
  } else if(it.type === 'img' && it.img_url){
    document.getElementById('overlayMedia').className = 'overlay-media wide';
    media.innerHTML = `<img src="${it.img_url}">`;
    overlayImgZoomEnabled = true;
    media.style.touchAction = 'none'; // 브라우저 기본 핀치줌/스크롤과 충돌하지 않도록(직접 구현한 핀치·팬으로 대체)
    applyImageZoomTransform();
  } else {
    document.getElementById('overlayMedia').className = 'overlay-media wide';
    media.innerHTML = it.type==='vid' ? '<span>아직 등록된 영상이 없어요</span>' : '<span>아직 등록된 이미지가 없어요</span>';
  }
  document.getElementById('overlayNote').innerHTML = `${escapeHtml(it.note ? it.title + ' — ' + it.note : it.title)}<br>${contributorBadge(it)}`;
  renderCommentsSection(it);
  document.getElementById('overlay').classList.add('active');
}
function toggleOverlayPlay(){
  if(!ytPlayer || !ytPlayer.getPlayerState) return;
  if(ytPlayer.getPlayerState() === YT.PlayerState.PLAYING){
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}
function showFullVideo(){
  if(!overlayVideoId || !overlayHasClip) return;
  const resumeAt = (ytPlayer && ytPlayer.getCurrentTime) ? ytPlayer.getCurrentTime() : 0;
  overlaySession += 1;
  const session = overlaySession;
  if(overlayBuildTimer){ clearInterval(overlayBuildTimer); overlayBuildTimer = null; }
  if(overlayTimer){ clearInterval(overlayTimer); overlayTimer = null; }
  if(ytPlayer && ytPlayer.destroy){ ytPlayer.destroy(); ytPlayer = null; }
  overlayClipRange = null; // 전체 영상 모드는 네이티브 컨트롤 사용, 커스텀 시크바 없음
  overlaySeeking = false;

  const media = document.getElementById('overlayMediaContent');
  const mount = document.createElement('div');
  media.innerHTML = '';
  media.appendChild(mount);

  const videoId = overlayVideoId;
  const build = () => {
    ytPlayer = new YT.Player(mount, {
      videoId: videoId,
      playerVars: { autoplay:1, playsinline:1, controls:1, rel:0, start: Math.floor(resumeAt), origin: location.origin, cc_load_policy:0 },
      events: {
        onReady: (e) => {
          if(session !== overlaySession) return; // 그 사이 오버레이가 닫히거나 다시 전환됐으면 무시
          const savedVolume = loadSavedVolume();
          const savedMuted = loadSavedMuted();
          e.target.setVolume(savedVolume);
          if(savedMuted) e.target.mute();
          lastPolledVolume = savedVolume;
          lastPolledMuted = savedMuted;
          e.target.seekTo(resumeAt, true);
          e.target.playVideo();
          startOverlayTimer(); // 네이티브 컨트롤로 조절해도 볼륨은 계속 저장됨
        }
      }
    });
  };
  waitForYT(session, build);

  overlayHasClip = false;
  document.getElementById('overlayPlayPause').style.display = 'none';
  document.getElementById('overlayFullBtn').style.display = 'none';
  document.getElementById('overlayVolumeBtn').style.display = 'none';
  document.getElementById('overlayVolumeSlider').style.display = 'none';
  document.getElementById('overlaySeekbar').style.display = 'none';
}
function closeOverlay(){
  overlaySession += 1;
  if(overlayBuildTimer){ clearInterval(overlayBuildTimer); overlayBuildTimer = null; }
  if(overlayTimer){ clearInterval(overlayTimer); overlayTimer = null; }
  if(ytPlayer && ytPlayer.destroy){ ytPlayer.destroy(); ytPlayer = null; }
  document.getElementById('overlayMediaContent').innerHTML = '';
  document.getElementById('overlayPlayPause').style.display = 'none';
  document.getElementById('overlayFullBtn').style.display = 'none';
  document.getElementById('overlayVolumeBtn').style.display = 'none';
  document.getElementById('overlayVolumeSlider').style.display = 'none';
  document.getElementById('overlaySeekbar').style.display = 'none';
  overlayCommentItemId = null;
  overlayComments = [];
  document.getElementById('overlayComments').style.display = 'none';
  document.getElementById('overlayCommentsList').innerHTML = '';
  document.getElementById('overlayCommentInput').value = '';
  overlayVideoId = null;
  overlayHasClip = false;
  overlayClipRange = null;
  overlaySeeking = false;
  overlayImgZoomEnabled = false;
  resetImageZoomState();
  document.getElementById('overlayZoomReset').style.display = 'none';
  document.getElementById('overlay').classList.remove('active');
}

// --- 이미지 오버레이 확대/축소 + 드래그 이동 (포토샵 스타일) ---
// transform-origin:0 0 기준으로 <img> 요소 자체(letterbox 포함 100%x100% 박스)를 확대·이동 대상으로 삼는다.
// 배율 범위 1~4배. 팬 범위는 <img> 요소 박스 기준으로 clamp(실제 표시 픽셀이 아닌 요소 박스 기준 — object-fit:contain의
// 레터박스도 이미지와 함께 확대되지만, "박스 밖으로 완전히 벗어나 빈 공간만 보이는" 상태는 이 기준으로도 정확히 방지된다).

function resetImageZoomState(){
  overlayImgScale = 1;
  overlayImgTx = 0;
  overlayImgTy = 0;
  overlayImgDragging = false;
  overlayImgDragStart = null;
  overlayImgPinch = null;
}

function applyImageZoomTransform(){
  const img = document.querySelector('#overlayMediaContent img');
  if(!img) return;
  img.style.transform = `translate(${overlayImgTx}px, ${overlayImgTy}px) scale(${overlayImgScale})`;
  img.style.cursor = overlayImgScale > 1 ? (overlayImgDragging ? 'grabbing' : 'grab') : 'default';
  document.getElementById('overlayZoomReset').style.display = overlayImgScale > 1 ? 'flex' : 'none';
}

function resetImageZoom(e){
  if(e) e.stopPropagation();
  resetImageZoomState();
  applyImageZoomTransform();
}

function clampImageTranslate(tx, ty, scale, boxW, boxH){
  if(scale <= 1) return { tx: 0, ty: 0 };
  const minTx = boxW * (1 - scale); // scale>1이면 음수 — 왼쪽/위로 이동 가능한 최대치
  const minTy = boxH * (1 - scale);
  return {
    tx: Math.min(0, Math.max(minTx, tx)),
    ty: Math.min(0, Math.max(minTy, ty))
  };
}

function zoomImageAt(mx, my, targetScale){
  const rect = document.getElementById('overlayMediaContent').getBoundingClientRect();
  const newScale = Math.min(4, Math.max(1, targetScale));
  const ix = (mx - overlayImgTx) / overlayImgScale; // 커서 아래 지점의 확대 전(scale=1 기준) 좌표
  const iy = (my - overlayImgTy) / overlayImgScale;
  const rawTx = mx - ix * newScale; // 그 지점이 확대 후에도 같은 화면 위치(mx,my)에 남도록 역산
  const rawTy = my - iy * newScale;
  overlayImgScale = newScale;
  const clamped = clampImageTranslate(rawTx, rawTy, newScale, rect.width, rect.height);
  overlayImgTx = clamped.tx;
  overlayImgTy = clamped.ty;
  applyImageZoomTransform();
}

function onImageWheel(e){
  if(!overlayImgZoomEnabled) return;
  e.preventDefault(); // 페이지 스크롤과 충돌 방지
  const rect = document.getElementById('overlayMediaContent').getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  zoomImageAt(mx, my, overlayImgScale * factor);
}

function onImageDblClick(e){
  if(!overlayImgZoomEnabled) return;
  resetImageZoom(e);
}

function onImageMouseDown(e){
  if(!overlayImgZoomEnabled || overlayImgScale <= 1) return; // 1배에서는 드래그해도 이동하지 않음
  e.preventDefault();
  overlayImgDragging = true;
  overlayImgDragStart = { x: e.clientX, y: e.clientY, tx: overlayImgTx, ty: overlayImgTy };
  applyImageZoomTransform();
  window.addEventListener('mousemove', onImageMouseMove);
  window.addEventListener('mouseup', onImageMouseUp);
}
function onImageMouseMove(e){
  if(!overlayImgDragging || !overlayImgDragStart) return;
  const rect = document.getElementById('overlayMediaContent').getBoundingClientRect();
  const dx = e.clientX - overlayImgDragStart.x;
  const dy = e.clientY - overlayImgDragStart.y;
  const clamped = clampImageTranslate(overlayImgDragStart.tx + dx, overlayImgDragStart.ty + dy, overlayImgScale, rect.width, rect.height);
  overlayImgTx = clamped.tx;
  overlayImgTy = clamped.ty;
  applyImageZoomTransform();
}
function onImageMouseUp(){
  overlayImgDragging = false;
  overlayImgDragStart = null;
  applyImageZoomTransform();
  window.removeEventListener('mousemove', onImageMouseMove);
  window.removeEventListener('mouseup', onImageMouseUp);
}

function touchDistance(t1, t2){
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}
function touchCenter(t1, t2, rect){
  return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
}
function onImageTouchStart(e){
  if(!overlayImgZoomEnabled) return;
  if(e.touches.length === 2){
    e.preventDefault();
    overlayImgDragging = false;
    overlayImgDragStart = null;
    overlayImgPinch = { distance: touchDistance(e.touches[0], e.touches[1]), scale: overlayImgScale };
  } else if(e.touches.length === 1){
    const now = Date.now();
    if(now - overlayImgLastTapTime < 300){ // 더블탭 → 리셋
      overlayImgLastTapTime = 0;
      resetImageZoom(e);
      return;
    }
    overlayImgLastTapTime = now;
    if(overlayImgScale > 1){
      e.preventDefault();
      overlayImgDragging = true;
      overlayImgDragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: overlayImgTx, ty: overlayImgTy };
    }
  }
}
function onImageTouchMove(e){
  if(!overlayImgZoomEnabled) return;
  const rect = document.getElementById('overlayMediaContent').getBoundingClientRect();
  if(e.touches.length === 2 && overlayImgPinch){
    e.preventDefault();
    const dist = touchDistance(e.touches[0], e.touches[1]);
    const center = touchCenter(e.touches[0], e.touches[1], rect);
    zoomImageAt(center.x, center.y, overlayImgPinch.scale * (dist / overlayImgPinch.distance));
  } else if(e.touches.length === 1 && overlayImgDragging && overlayImgDragStart){
    e.preventDefault();
    const dx = e.touches[0].clientX - overlayImgDragStart.x;
    const dy = e.touches[0].clientY - overlayImgDragStart.y;
    const clamped = clampImageTranslate(overlayImgDragStart.tx + dx, overlayImgDragStart.ty + dy, overlayImgScale, rect.width, rect.height);
    overlayImgTx = clamped.tx;
    overlayImgTy = clamped.ty;
    applyImageZoomTransform();
  }
}
function onImageTouchEnd(e){
  if(e.touches.length === 1 && overlayImgPinch){
    // 핀치 중 손가락 하나를 뗀 경우, 남은 손가락으로 팬 제스처를 이어감(다시 터치할 필요 없이)
    overlayImgPinch = null;
    if(overlayImgScale > 1){
      overlayImgDragging = true;
      overlayImgDragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: overlayImgTx, ty: overlayImgTy };
    }
  } else if(e.touches.length < 2){
    overlayImgPinch = null;
  }
  if(e.touches.length === 0){
    overlayImgDragging = false;
    overlayImgDragStart = null;
    applyImageZoomTransform();
  }
}

function initImageZoomPan(){
  const container = document.getElementById('overlayMediaContent');
  container.addEventListener('wheel', onImageWheel, { passive: false });
  container.addEventListener('mousedown', onImageMouseDown);
  container.addEventListener('dblclick', onImageDblClick);
  container.addEventListener('touchstart', onImageTouchStart, { passive: false });
  container.addEventListener('touchmove', onImageTouchMove, { passive: false });
  container.addEventListener('touchend', onImageTouchEnd);
  container.addEventListener('touchcancel', onImageTouchEnd);
}

function formatRelativeTime(iso){
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if(sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if(min < 60) return min + '분 전';
  const hour = Math.floor(min / 60);
  if(hour < 24) return hour + '시간 전';
  const day = Math.floor(hour / 24);
  if(day < 7) return day + '일 전';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function renderCommentsSection(it){
  const wrap = document.getElementById('overlayComments');
  const list = document.getElementById('overlayCommentsList');
  if(it.tag === '맵 지명'){
    wrap.style.display = 'none';
    overlayCommentItemId = null;
    overlayComments = [];
    list.innerHTML = '';
    return;
  }
  wrap.style.display = 'block';
  overlayCommentItemId = it.id;
  overlayComments = [];
  list.innerHTML = '';
  document.getElementById('overlayCommentsCount').textContent = '댓글 0';
  document.getElementById('overlayCommentInput').value = '';
  refreshCommentAuthUI();
  loadComments(it.id);
}

function refreshCommentAuthUI(){
  if(!overlayCommentItemId) return; // 댓글 영역이 없는 항목(맵 지명)이거나 오버레이가 닫힌 상태면 아무것도 하지 않음
  const input = document.getElementById('overlayCommentInput');
  const submitBtn = document.getElementById('overlayCommentSubmit');
  const loginMsg = document.getElementById('overlayCommentsLoginMsg');
  const loggedIn = !!currentSession;
  input.disabled = !loggedIn;
  submitBtn.disabled = !loggedIn;
  loginMsg.style.display = loggedIn ? 'none' : 'block';
  renderCommentsList(); // 로그인/로그아웃으로 본인 소유·관리자 여부가 바뀌면 삭제 아이콘도 다시 계산
}

async function loadComments(itemId){
  const { data, error } = await sb.from('comments').select('id, user_id, author_name, body, created_at').eq('item_id', itemId).order('created_at', { ascending: true });
  if(overlayCommentItemId !== itemId) return; // 그 사이 오버레이가 닫히거나 다른 항목으로 바뀐 응답은 무시
  if(error){ alert('댓글을 불러오지 못했어요: ' + error.message); return; }
  overlayComments = data || [];
  renderCommentsList();
}

function renderCommentsList(){
  document.getElementById('overlayCommentsCount').textContent = `댓글 ${overlayComments.length}`;
  const list = document.getElementById('overlayCommentsList');
  list.innerHTML = overlayComments.map(c => {
    const canDelete = currentSession && (currentSession.user.id === c.user_id || isAdminUser);
    return `
      <div class="overlay-comment" data-id="${c.id}">
        <div class="overlay-comment-head">
          <span class="overlay-comment-author">${escapeHtml(c.author_name)}</span>
          <span class="overlay-comment-time">${formatRelativeTime(c.created_at)}</span>
          ${canDelete ? `<span class="overlay-comment-del" title="삭제" onclick="deleteComment('${c.id}')">🗑</span>` : ''}
        </div>
        <div class="overlay-comment-body">${escapeHtml(c.body)}</div>
      </div>
    `;
  }).join('') || '<div class="overlay-comments-empty">아직 댓글이 없어요</div>';
}

async function submitComment(){
  if(!currentSession || !overlayCommentItemId) return;
  const itemId = overlayCommentItemId;
  const input = document.getElementById('overlayCommentInput');
  const body = input.value.trim();
  if(!body) return;
  const nickname = currentSession.user.user_metadata.full_name || currentSession.user.user_metadata.name || '사용자';
  const submitBtn = document.getElementById('overlayCommentSubmit');
  submitBtn.disabled = true;
  try {
    const { data, error } = await sb.from('comments').insert({
      item_id: itemId,
      user_id: currentSession.user.id,
      author_name: nickname,
      body
    }).select('id, user_id, author_name, body, created_at').single();
    if(error) throw error;
    if(overlayCommentItemId !== itemId) return; // 등록 응답이 오는 사이 다른 항목으로 전환된 경우 무시
    overlayComments.push(data);
    renderCommentsList();
    input.value = '';
  } catch(error){
    alert('댓글 등록 실패: ' + error.message);
  } finally {
    submitBtn.disabled = !currentSession;
  }
}

async function deleteComment(commentId){
  if(!confirm('이 댓글을 삭제할까요?')) return false;
  try {
    const { error } = await sb.from('comments').delete().eq('id', commentId);
    if(error) throw error;
    overlayComments = overlayComments.filter(c => c.id !== commentId);
    renderCommentsList();
    masterComments = masterComments.filter(c => c.id !== commentId);
    if(document.getElementById('masterPaneComments').classList.contains('active')) renderMasterCommentsTable();
    return true;
  } catch(error){
    alert('댓글 삭제 실패: ' + error.message);
    return false;
  }
}

let modalTag = null;
let modalType = 'vid';
let modalTeam = null;
let modalStep = 'paste';
let cropper = null;
let modalMode = 'add';
let editingItemId = null;
let clipStart = null, clipEnd = null, clipYtPlayer = null;
let clipPreviewTimer = null;
let clipDuration = 0;
let clipScrubLastSeek = 0;
let contentDrafts = []; // localStorage 'sa-content-drafts'의 메모리 캐시(배열, 각 원소는 고유 id를 가짐)
let resumingDraftId = null; // 현재 모달이 이어서 작성 중인 임시저장 항목의 id, 새로 시작한 경우 null
let clipEndMarkGraceUntil = 0;

function fmtClip(s){
  if(s === null) return '—';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}
function updateClipLabel(){
  const el = document.getElementById('clipRange');
  if(clipStart === null && clipEnd === null){ el.innerHTML = '전체 재생'; return; }
  el.innerHTML = `구간 <b>${fmtClip(clipStart)}</b> ~ <b>${fmtClip(clipEnd)}</b>`;
}
function updateClipSliderLabels(){
  document.getElementById('clipStartLabel').textContent = fmtClip(Number(document.getElementById('clipStartRange').value));
  document.getElementById('clipEndLabel').textContent = fmtClip(Number(document.getElementById('clipEndRange').value));
}
function updateClipRangeFill(){
  const fill = document.getElementById('clipRangeFill');
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  // 각 슬라이더가 실제로 렌더링되는 비율은 (value - 자신의 min) / (자신의 max - 자신의 min)이다.
  // 지금은 min/max를 항상 [0, clipDuration]으로 고정해두므로 이 비율이 곧 value/clipDuration과
  // 같지만, 혹시라도 min/max가 다른 값으로 바뀌는 경우에도 항상 실제 손잡이 위치와 일치하도록
  // value/clipDuration 대신 각 슬라이더 자신의 min/max를 기준으로 계산한다.
  const sMin = Number(startRange.min), sMax = Number(startRange.max);
  const eMin = Number(endRange.min), eMax = Number(endRange.max);
  const s = Number(startRange.value);
  const e = Number(endRange.value);
  const startFrac = sMax > sMin ? (s - sMin) / (sMax - sMin) : 0;
  const endFrac = eMax > eMin ? (e - eMin) / (eMax - eMin) : 0;
  const left = Math.min(startFrac, endFrac);
  const right = Math.max(startFrac, endFrac);
  // 네이티브 range 손잡이는 트랙 전체 폭이 아니라 (트랙폭 - 손잡이폭)만큼만 이동하고,
  // 손잡이 중심은 항상 손잡이 반지름(12px, thumb width 24px의 절반)만큼 안쪽에서 시작한다.
  fill.style.left = `calc(12px + (100% - 24px) * ${left})`;
  fill.style.width = `calc((100% - 24px) * ${Math.max(right - left, 0)})`;
}
// 시작/끝 슬라이더의 min/max는 항상 [0, clipDuration]으로 고정한다.
// (예전에는 서로 넘나들지 못하게 상대 슬라이더 값으로 startRange.max/endRange.min을
//  계속 좁혀서 막았는데, 그러면 각 슬라이더의 실제 min~max 폭이 clipDuration보다
//  좁아져서 "손잡이의 화면 위치 비율(value-min)/(max-min)"이 실제 재생 위치 비율
//  (value/clipDuration)과 어긋나 버렸다 — 두 손잡이가 화면상 역전되어 그려지거나
//  채움 바가 손잡이 밖으로 튀어나오는 근본 원인이었다. 교차 방지는 min/max를 좁히는
//  대신 onClipStartInput/onClipEndInput에서 "자기 자신의" value만 clamp해서 처리한다.)
function syncClipSliders(){
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  const s = clipStart !== null ? clipStart : 0;
  const e = clipEnd !== null ? clipEnd : clipDuration;
  startRange.min = 0; startRange.max = clipDuration;
  endRange.min = 0; endRange.max = clipDuration;
  startRange.value = s;
  endRange.value = e;
  updateClipSliderLabels();
  updateClipRangeFill();
  updateClipThumbClipPaths();
}

// 슬라이더의 min/max/value를 넘겨준 duration 기준으로 확정한다 (구간 재설정 시 공통으로 재사용)
function applyClipDuration(duration){
  clipDuration = duration;
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  startRange.min = 0; startRange.max = clipDuration; startRange.value = 0;
  endRange.min = 0; endRange.max = clipDuration; endRange.value = clipDuration;
  updateClipSliderLabels();
  updateClipRangeFill();
  updateClipThumbClipPaths();
}
function stopClipPreviewTimer(){
  if(clipPreviewTimer){ clearInterval(clipPreviewTimer); clipPreviewTimer = null; }
}
function syncClipPreviewTimer(){
  stopClipPreviewTimer();
  if(clipStart === null || clipEnd === null || !clipYtPlayer) return;
  clipPreviewTimer = setInterval(() => {
    if(!clipYtPlayer || !clipYtPlayer.getCurrentTime) return;
    const current = clipYtPlayer.getCurrentTime();
    const inEndMarkGrace = Date.now() < clipEndMarkGraceUntil;
    if(current < clipStart || (!inEndMarkGrace && current >= clipEnd)){
      const state = clipYtPlayer.getPlayerState && clipYtPlayer.getPlayerState();
      const shouldPlay = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING || state === YT.PlayerState.ENDED;
      clipYtPlayer.seekTo(clipStart, true);
      if(shouldPlay && clipYtPlayer.playVideo) clipYtPlayer.playVideo();
      else if(state === YT.PlayerState.PAUSED && clipYtPlayer.pauseVideo) clipYtPlayer.pauseVideo();
    }
  }, 250);
}
function loadClipPlayer(onDurationReady){
  const url = document.getElementById('mVideoUrl').value.trim();
  const p = parseYouTube(url);
  if(!p){ setModalMsg('유튜브 링크를 확인해주세요.', 'err'); return; }
  setModalMsg('');
  clipStart = null; clipEnd = null; clipEndMarkGraceUntil = 0; updateClipLabel();
  document.getElementById('clipTools').style.display = 'block';
  document.getElementById('clipPlayerWrap').className = 'clip-player' + (p.isShort ? ' tall' : '');

  // 이전 영상의 duration/슬라이더 상태가 새 영상 로딩 중에 잠깐이라도 남아있지 않도록 즉시 0으로 초기화
  applyClipDuration(0);

  stopClipPreviewTimer();
  if(clipYtPlayer && clipYtPlayer.destroy){ clipYtPlayer.destroy(); clipYtPlayer = null; }
  const mount = document.createElement('div');
  mount.id = 'clipPlayer';
  document.getElementById('clipPlayerWrap').innerHTML = '';
  document.getElementById('clipPlayerWrap').appendChild(mount);

  const build = () => {
    clipYtPlayer = new YT.Player('clipPlayer', {
      videoId: p.id,
      playerVars: { playsinline: 1, enablejsapi: 1, origin: location.origin, rel: 0, cc_load_policy: 0 },
      events: {
        onStateChange: (e) => {
          if(!clipPreviewTimer && modalType === 'vid' && document.getElementById('addModal').classList.contains('active') && [YT.PlayerState.PLAYING, YT.PlayerState.PAUSED, YT.PlayerState.BUFFERING, YT.PlayerState.ENDED].includes(e.data)) syncClipPreviewTimer();
        },
        onReady: (e) => {
          e.target.setVolume(50);
          // onReady 시점의 getDuration()은 (특히 쇼츠에서) 메타데이터가 아직 다 안 실려서
          // 0이거나 실제보다 작은 값을 반환할 수 있다. 두 번 연속 같은 값이 나올 때까지
          // 짧게 재확인해서, duration이 실제로 "확정"된 시점에만 슬라이더에 반영한다.
          let attempts = 0;
          let lastDuration = -1;
          const player = e.target;
          const poll = () => {
            const d = Math.floor(player.getDuration()) || 0;
            attempts++;
            const stable = d > 0 && d === lastDuration;
            if(stable || attempts >= 20){
              applyClipDuration(d);
              if(onDurationReady) onDurationReady(d);
              return;
            }
            lastDuration = d;
            setTimeout(poll, 150);
          };
          poll();
        }
      }
    });
  };
  if(ytReady && window.YT && YT.Player){ build(); }
  else { const iv = setInterval(() => { if(window.YT && YT.Player){ clearInterval(iv); ytReady = true; build(); } }, 200); }
}
function markClipStart(){
  if(!clipYtPlayer || !clipYtPlayer.getCurrentTime) return;
  clipStart = Math.floor(clipYtPlayer.getCurrentTime());
  if(clipEnd !== null && clipEnd <= clipStart) clipEnd = null;
  syncClipSliders();
  updateClipLabel();
  syncClipPreviewTimer();
}
function markClipEnd(){
  if(!clipYtPlayer || !clipYtPlayer.getCurrentTime) return;
  const t = Math.floor(clipYtPlayer.getCurrentTime());
  if(clipStart !== null && t <= clipStart){ setModalMsg('끝은 시작보다 뒤여야 해요.', 'err'); return; }
  clipEnd = t; setModalMsg('');
  // Math.floor로 저장하는 순간 실제 재생 위치가 이미 clipEnd를 넘어 있을 수 있어
  // (절삭 오차 최대 1초 + 폴링 대기 최대 0.25초), 지정 직후 잠깐만 이탈 판정을 건너뛴다.
  clipEndMarkGraceUntil = Date.now() + 1300;
  syncClipSliders();
  updateClipLabel();
  syncClipPreviewTimer();
}
function clearClip(){
  clipStart = null; clipEnd = null; clipEndMarkGraceUntil = 0;
  syncClipSliders();
  updateClipLabel();
  stopClipPreviewTimer();
}
function onClipScrubStart(){
  if(clipYtPlayer && clipYtPlayer.pauseVideo) clipYtPlayer.pauseVideo();
}
// 손잡이 두 개가 겹칠 때(값이 서로 가까울 때) 항상 올바른 쪽이 클릭되도록, z-index가 아니라
// 두 값의 중간점을 기준으로 각 input의 클릭 가능 영역(clip-path) 자체를 절반씩 나눈다.
// pointermove로 미리 우선순위를 정하는 방식은 마우스 hover가 없는 터치의 "첫 탭"에서는
// 애초에 브라우저가 이미 대상을 정한 뒤라 소용이 없어서(실제 히트테스트로 확인된 한계),
// 아예 겹치는 히트 영역 자체를 없애는 이 방식으로 교체했다 — 이러면 pointerdown이 언제
// 처음 발생하든(마우스든 터치든) 항상 값이 더 가까운 손잡이가 그 이벤트를 받는다.
function updateClipThumbClipPaths(){
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  if(!startRange || !endRange) return;
  if(clipDuration <= 0){
    startRange.style.clipPath = '';
    endRange.style.clipPath = '';
    return;
  }
  const s = Number(startRange.value), e = Number(endRange.value);
  const midPct = Math.min(100, Math.max(0, ((s + e) / 2 / clipDuration) * 100));
  startRange.style.clipPath = `inset(0 ${100 - midPct}% 0 0)`;
  endRange.style.clipPath = `inset(0 0 0 ${midPct}%)`;
}
function scrubClipPreview(t){
  if(!clipYtPlayer || !clipYtPlayer.seekTo) return;
  const now = Date.now();
  if(now - clipScrubLastSeek < 100) return; // 과도한 seekTo 호출 방지 (약 100ms 스로틀)
  clipScrubLastSeek = now;
  clipYtPlayer.seekTo(t, true);
}
function onClipStartInput(){
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  let s = Number(startRange.value);
  const e = Number(endRange.value);
  // 상대(끝) 슬라이더의 값/범위는 건드리지 않고 자기 자신의 값만 넘지 못하게 clamp한다
  // (상대 슬라이더 값을 매 틱마다 재할당하면 "끝쪽이 뻑뻑하다" 버그가 재발한다)
  if(s >= e){ s = Math.max(e - 1, 0); startRange.value = s; }
  clipStart = s; clipEnd = e;
  clipEndMarkGraceUntil = 0;
  updateClipSliderLabels();
  updateClipRangeFill();
  updateClipThumbClipPaths();
  updateClipLabel();
  scrubClipPreview(clipStart);
  syncClipPreviewTimer();
}
function onClipStartChange(){
  if(clipYtPlayer && clipYtPlayer.seekTo) clipYtPlayer.seekTo(clipStart, true);
}
function onClipEndInput(){
  const startRange = document.getElementById('clipStartRange');
  const endRange = document.getElementById('clipEndRange');
  let e = Number(endRange.value);
  const s = Number(startRange.value);
  if(e <= s){ e = Math.min(s + 1, clipDuration); endRange.value = e; }
  clipStart = s; clipEnd = e;
  clipEndMarkGraceUntil = 0;
  updateClipSliderLabels();
  updateClipRangeFill();
  updateClipThumbClipPaths();
  updateClipLabel();
  scrubClipPreview(clipEnd);
  syncClipPreviewTimer();
}
function onClipEndChange(){
  if(clipYtPlayer && clipYtPlayer.seekTo) clipYtPlayer.seekTo(clipEnd, true);
}

function loadImageIntoCropper(file){
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById('cropperImg');
    img.src = ev.target.result;
    document.getElementById('cropperWrap').style.display = 'block';
    if(cropper) cropper.destroy();
    cropper = new Cropper(img, { viewMode: 1, autoCropArea: 1, background: false, ready: renderSavePreview, cropend: renderSavePreview });
  };
  reader.readAsDataURL(file);
}

document.getElementById('mImageFile').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  startImageFlow(file);
  e.target.value = '';
});

function showModalStep(step){
  modalStep = step;
  const isMapLabel = modalTag === '맵 지명';
  document.getElementById('pasteStep').style.display = step === 'paste' ? 'block' : 'none';
  document.getElementById('titleWrap').style.display = step === 'details' && !isMapLabel ? 'block' : 'none';
  document.getElementById('videoWrap').style.display = step === 'media' && modalType === 'vid' ? 'block' : 'none';
  document.getElementById('imageWrap').style.display = step === 'media' && modalType === 'img' ? 'block' : 'none';
  const showPreview = modalMode === 'edit' ? step === 'details' : (isMapLabel ? step === 'media' : step === 'details');
  document.getElementById('teamWrap').style.display = showPreview ? 'block' : 'none';
  document.getElementById('editChannelWrap').style.display = (showPreview && modalMode === 'edit' && modalType === 'vid') ? 'block' : 'none';
  document.getElementById('savePreviewWrap').style.display = showPreview ? (modalType === 'img' ? 'flex' : 'block') : 'none';
  if(showPreview) renderSavePreview();
  document.getElementById('modalBackBtn').style.display =
    (step === 'paste' || (modalMode === 'edit' && (modalType === 'img' || step === 'media'))) ? 'none' : 'inline-block';
  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.style.display = step === 'paste' ? 'none' : 'inline-block';
  saveBtn.textContent = step === 'details' || isMapLabel ? '저장' : '다음';
  document.getElementById('modalDraftBtn').style.display = (modalMode === 'add' && step !== 'paste') ? 'inline-block' : 'none';
}
function renderSavePreview(){
  document.getElementById('previewVideoBox').style.display = modalType === 'vid' ? 'flex' : 'none';
  document.getElementById('previewImageBox').style.display = modalType === 'img' ? 'block' : 'none';
  if(modalType === 'vid'){
    document.getElementById('previewThumbImg').src = ytThumb(document.getElementById('mVideoUrl').value.trim());
    document.getElementById('previewTimeBadge').textContent = (clipStart !== null && clipEnd !== null)
      ? `${fmtClip(clipStart)}~${fmtClip(clipEnd)}` : '전체 재생';
  } else if(modalType === 'img' && cropper){
    const canvas = cropper.getCroppedCanvas();
    document.getElementById('previewCroppedImg').src = canvas ? canvas.toDataURL('image/jpeg', 0.85) : '';
  }
}

function showPasteFallback(message){
  setModalMsg(message, 'err');
  const input = document.getElementById('pasteFallback');
  input.style.display = 'block';
  input.value = '';
  input.focus();
}

function startVideoFlow(text){
  if(modalTag === '맵 지명'){
    setModalMsg('맵 지명은 이미지만 가능합니다.', 'err');
    return;
  }
  const url = text.trim();
  if(!parseYouTube(url)){
    setModalMsg('유효한 유튜브 링크가 아닙니다.', 'err');
    return;
  }
  modalType = 'vid';
  document.getElementById('mVideoUrl').value = url;
  showModalStep('media');
  loadClipPlayer();
}

function startImageFlow(file){
  if(file.type === 'image/gif' || /\.gif$/i.test(file.name || '')){
    setModalMsg('GIF는 아직 지원하지 않습니다.', 'err');
    return;
  }
  if(!file.type.startsWith('image/')){
    setModalMsg('이미지 파일만 사용할 수 있습니다.', 'err');
    return;
  }
  modalType = 'img';
  stopClipPreviewTimer();
  if(clipYtPlayer && clipYtPlayer.destroy){ clipYtPlayer.destroy(); clipYtPlayer = null; }
  showModalStep('media');
  setModalMsg('');
  loadImageIntoCropper(file);
}

async function readAddClipboard(){
  if(!navigator.clipboard || !navigator.clipboard.read){
    showPasteFallback('자동 붙여넣기를 지원하지 않는 브라우저입니다. 여기에 Ctrl+V로 붙여넣거나 업로드를 사용해주세요.');
    return;
  }
  try{
    const items = await navigator.clipboard.read();
    for(const item of items){
      const imageType = item.types.find(type => type.startsWith('image/'));
      if(imageType){ startImageFlow(await item.getType(imageType)); return; }
      if(item.types.includes('text/plain')){
        const text = (await (await item.getType('text/plain')).text()).trim();
        if(text){ startVideoFlow(text); return; }
      }
    }
    showPasteFallback('클립보드가 비어 있습니다. 여기에 Ctrl+V로 붙여넣거나 업로드를 사용해주세요.');
  } catch(err){
    showPasteFallback('클립보드를 읽을 수 없습니다. 여기에 Ctrl+V로 붙여넣거나 업로드를 사용해주세요.');
  }
}

document.addEventListener('paste', function(e){
  if(modalStep !== 'paste' || !document.getElementById('addModal').classList.contains('active')) return;
  const files = e.clipboardData && e.clipboardData.files;
  const image = files && Array.from(files).find(file => file.type.startsWith('image/'));
  if(image){ startImageFlow(image); e.preventDefault(); return; }
  const text = e.clipboardData && e.clipboardData.getData('text/plain');
  if(text){ startVideoFlow(text); e.preventDefault(); }
});

function updateTextCounters(){
  const t = document.getElementById('mTitle');
  const n = document.getElementById('mNote');
  document.getElementById('mTitleCounter').textContent = `${t.value.length}/${t.maxLength}`;
  document.getElementById('mNoteCounter').textContent = `${n.value.length}/${n.maxLength}`;
}

function openAddModal(tag){
  modalTag = tag;
  modalMode = 'add';
  editingItemId = null;
  resumingDraftId = null;
  document.getElementById('mTitle').value = '';
  document.getElementById('mNote').value = '';
  updateTextCounters();
  document.getElementById('mVideoUrl').value = '';
  document.getElementById('mVideoUrl').type = 'hidden';
  document.getElementById('mVideoUrl').readOnly = false;
  document.getElementById('mVideoUrlWrap').style.display = 'none';
  document.getElementById('editHint').style.display = 'none';
  document.getElementById('mImageFile').value = '';
  document.getElementById('pasteFallback').style.display = 'none';
  document.getElementById('modalMsg').textContent = '';
  if(cropper){ cropper.destroy(); cropper = null; }
  document.getElementById('cropperWrap').style.display = 'none';
  document.getElementById('cropperImg').src = '';
  document.getElementById('previewThumbImg').src = '';
  document.getElementById('previewCroppedImg').src = '';
  document.getElementById('previewTimeBadge').textContent = '';

  clipStart = null; clipEnd = null; clipEndMarkGraceUntil = 0;
  applyClipDuration(0);
  document.getElementById('clipTools').style.display = 'none';
  stopClipPreviewTimer();
  if(clipYtPlayer && clipYtPlayer.destroy){ clipYtPlayer.destroy(); clipYtPlayer = null; }
  updateClipLabel();

  const isMapLabel = (tag === '맵 지명');
  document.getElementById('modalTitle').textContent = tag + '에 추가';
  modalType = isMapLabel ? 'img' : 'vid';

  modalTeam = null;
  document.getElementById('mTeam').value = '';

  showModalStep('paste');

  document.getElementById('addModal').classList.add('active');
}
function openEditModal(e, id){
  e.stopPropagation();
  const it = items.find(i => i.id === id);
  if(!it) return;

  modalMode = 'edit';
  editingItemId = id;
  modalTag = it.tag;
  modalType = it.type;

  document.getElementById('mTitle').value = it.title || '';
  document.getElementById('mNote').value = it.note || '';
  updateTextCounters();
  document.getElementById('mImageFile').value = '';
  document.getElementById('pasteFallback').style.display = 'none';
  document.getElementById('modalMsg').textContent = '';
  document.getElementById('previewThumbImg').src = '';
  document.getElementById('previewCroppedImg').src = '';
  document.getElementById('previewTimeBadge').textContent = '';

  // 이미지 수정에서는 새 Cropper를 만들지 않으므로, 추가 모드에서 쓰던 크롭 상태가
  // 남아있지 않은지 명시적으로 비워 저장된 이미지가 실수로 바뀌는 일을 막는다
  if(cropper){ cropper.destroy(); cropper = null; }
  document.getElementById('cropperWrap').style.display = 'none';
  document.getElementById('cropperImg').src = '';

  document.getElementById('modalTitle').textContent = it.tag + ' 항목 수정';
  modalTeam = it.team;
  document.getElementById('mTeam').value = modalTeam || '';
  document.getElementById('editHint').style.display = 'block';

  if(it.type === 'vid'){
    document.getElementById('mVideoUrlWrap').style.display = 'block';
    const urlInput = document.getElementById('mVideoUrl');
    urlInput.type = 'url';
    urlInput.readOnly = true;
    urlInput.value = it.video_url || '';
    document.getElementById('editChannelValue').value = it.channel_name || '채널명 없음';

    showModalStep('media');
    loadClipPlayer((duration) => {
      // 이 콜백은 YouTube duration이 확정된 후 비동기로 실행되므로, 그 사이 모달이
      // 닫히거나 다른 항목의 수정 모달이 열렸다면 지금 세션이 여전히 같은 항목을
      // 수정 중인지 확인한 뒤에만 clipStart/clipEnd를 복원한다
      if(modalMode !== 'edit' || editingItemId !== id) return;
      clipStart = it.clip_start;
      clipEnd = it.clip_end;
      syncClipSliders();
      updateClipLabel();
      syncClipPreviewTimer();
    });
  } else {
    document.getElementById('mVideoUrlWrap').style.display = 'none';
    stopClipPreviewTimer();
    if(clipYtPlayer && clipYtPlayer.destroy){ clipYtPlayer.destroy(); clipYtPlayer = null; }

    // showModalStep()이 savePreviewWrap을 modalType 기준으로 다시 그리므로,
    // 저장된 img_url 주입은 반드시 이 호출 다음에 실행한다
    showModalStep('details');
    document.getElementById('previewCroppedImg').src = it.img_url || '';
  }

  document.getElementById('addModal').classList.add('active');
}
function closeModal(){
  document.getElementById('addModal').classList.remove('active');
  if(cropper){ cropper.destroy(); cropper = null; }
  stopClipPreviewTimer();
  if(clipYtPlayer && clipYtPlayer.destroy){ clipYtPlayer.destroy(); clipYtPlayer = null; }
  modalMode = 'add';
  editingItemId = null;
  resumingDraftId = null;
  document.getElementById('mVideoUrl').type = 'hidden';
  document.getElementById('mVideoUrl').readOnly = false;
  document.getElementById('mVideoUrlWrap').style.display = 'none';
  document.getElementById('editHint').style.display = 'none';
}
function goBackModal(){
  setModalMsg('');
  if(modalMode === 'edit'){
    // 수정 모드에는 되돌아갈 유효한 paste 단계가 없다 — UI에서 이미 뒤로 버튼을
    // 숨기지만, 방어적으로도 paste로는 절대 이동하지 않는다
    showModalStep(modalStep === 'details' ? 'media' : modalStep);
    return;
  }
  showModalStep(modalStep === 'details' ? 'media' : 'paste');
}
function advanceAddModal(){
  if(modalStep === 'details' || modalTag === '맵 지명'){ submitItem(); return; }
  if(modalType === 'vid' && document.getElementById('clipTools').style.display === 'none'){
    setModalMsg('유튜브 영상을 불러오지 못했습니다.', 'err'); return;
  }
  if(modalType === 'img' && !cropper){ setModalMsg('이미지를 선택하거나 붙여넣어주세요.', 'err'); return; }
  setModalMsg('');
  showModalStep('details');
}
function setModalMsg(t, cls){
  const el = document.getElementById('modalMsg');
  el.className = 'msg-modal' + (cls ? (' ' + cls) : '');
  el.textContent = t;
}
async function submitItem(){
  const savedTeam = modalTeam || 'none';

  if(modalMode === 'edit'){
    const original = items.find(i => i.id === editingItemId);
    const isMapLabel = (modalTag === '맵 지명');
    const title = isMapLabel ? (original ? original.title : '맵 전체 지명') : document.getElementById('mTitle').value.trim();
    const note = isMapLabel ? (original ? (original.note || '') : '') : document.getElementById('mNote').value.trim();
    if(!isMapLabel && !title){ setModalMsg('제목을 입력해주세요.', 'err'); return; }

    const saveBtn = document.getElementById('modalSaveBtn');
    saveBtn.disabled = true;
    setModalMsg('저장 중...');

    const payload = { title, note: note || null, team: savedTeam };
    if(!isAdminUser && original && original.status === 'rejected'){
      payload.status = 'pending';
      payload.rejection_reason = null;
      payload.reviewed_at = null;
      payload.reviewed_by = null;
    }
    if(modalType === 'vid'){ payload.clip_start = clipStart; payload.clip_end = clipEnd; }

    const { error } = await sb.from('items').update(payload).eq('id', editingItemId);
    if(error){ setModalMsg('저장 실패: ' + error.message, 'err'); saveBtn.disabled = false; return; }

    setModalMsg('수정 완료!', 'ok');
    setTimeout(async () => { closeModal(); saveBtn.disabled = false; await loadAll(); renderCards(); }, 500);
    return;
  }

  const isMapLabel = (modalTag === '맵 지명');
  const title = isMapLabel ? '맵 전체 지명' : document.getElementById('mTitle').value.trim();
  const note = isMapLabel ? '' : document.getElementById('mNote').value.trim();
  if(!isMapLabel && !title){ setModalMsg('제목을 입력해주세요.', 'err'); return; }

  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled = true;
  setModalMsg('저장 중...');

  if(modalType === 'vid'){
    const url = document.getElementById('mVideoUrl').value.trim();
    const p = parseYouTube(url);
    if(!p){ setModalMsg('유튜브 링크를 확인해주세요.', 'err'); saveBtn.disabled = false; return; }

    const channelName = await fetchYouTubeChannelName(url);
    const { error } = await sb.from('items').insert({
      map_id: currentMap, team: savedTeam, type: 'vid', tag: modalTag,
      title, note: note || null, video_url: url, clip_start: clipStart, clip_end: clipEnd,
      channel_name: channelName, created_by: currentSession.user.id,
      status: isAdminUser ? 'published' : 'pending'
    });
    if(error){ setModalMsg('저장 실패: ' + error.message, 'err'); saveBtn.disabled = false; return; }
  } else {
    if(!cropper){ setModalMsg('이미지를 선택하거나 붙여넣어주세요.', 'err'); saveBtn.disabled = false; return; }

    setModalMsg('업로드 중...');
    const blob = await new Promise(res => cropper.getCroppedCanvas().toBlob(res, 'image/jpeg', 0.92));
    const path = `items/${currentSession.user.id}/${Date.now()}.jpg`;
    const { error: upErr } = await sb.storage.from('media').upload(path, blob, { contentType: 'image/jpeg' });
    if(upErr){ setModalMsg('업로드 실패: ' + upErr.message, 'err'); saveBtn.disabled = false; return; }
    const { data: pub } = sb.storage.from('media').getPublicUrl(path);

    setModalMsg('저장 중...');
    const { error } = await sb.from('items').insert({
      map_id: currentMap, team: savedTeam, type: 'img', tag: modalTag,
      title, note: note || null, img_url: pub.publicUrl, video_url: null, clip_start: null, clip_end: null,
      created_by: currentSession.user.id, status: isAdminUser ? 'published' : 'pending'
    });
    if(error){ setModalMsg('저장 실패: ' + error.message, 'err'); saveBtn.disabled = false; return; }
  }

  setModalMsg(isAdminUser ? '추가 완료! 바로 공개됩니다.' : '등록 완료! 관리자 승인 후 공개됩니다.', 'ok');
  if(resumingDraftId) removeDraftById(resumingDraftId); // 등록이 실제로 성공한 시점에 곧바로 지운다(닫기 지연과 무관하게)
  setTimeout(async () => { closeModal(); saveBtn.disabled = false; await loadAll(); renderCards(); }, 500);
}

// --- 컨텐츠 추가 임시저장(localStorage) ---

function loadContentDrafts(){
  try {
    const raw = localStorage.getItem('sa-content-drafts');
    contentDrafts = raw ? JSON.parse(raw) : [];
  } catch(e){
    contentDrafts = []; // 깨진 값이면 빈 배열로 복구
  }
  return contentDrafts;
}
function saveContentDraftsToStorage(){
  try {
    localStorage.setItem('sa-content-drafts', JSON.stringify(contentDrafts));
    return true;
  } catch(e){
    return false; // 저장 공간 초과 등 — 호출부에서 실패를 알리고 모달을 닫지 않아야 함
  }
}

// paste 단계는 "아직 아무 것도 시작 안 한 상태"라 항상 false. 맵/태그는 Master 탭에서 이미
// 선택되어 넘어온 값이라 이것만으로는 "작성 내용 있음"으로 보지 않는다(빈 모달마다 확인창이
// 뜨는 것을 막기 위함) — 실제 URL/제목/설명/이미지가 있을 때만 임시저장 대상으로 본다.
function hasModalUnsavedInput(){
  if(modalMode !== 'add' || modalStep === 'paste') return false;
  if(modalType === 'vid') return !!document.getElementById('mVideoUrl').value.trim();
  if(modalType === 'img') return !!cropper || !!document.getElementById('mTitle').value.trim() || !!document.getElementById('mNote').value.trim();
  return false;
}

function buildDraftFromCurrentModal(){
  const map = maps.find(m => m.id === currentMap);
  return {
    id: resumingDraftId || (Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
    savedAt: new Date().toISOString(),
    mapId: currentMap,
    mapName: map ? map.name : currentMapName, // 맵이 삭제된 경우를 대비한 스냅샷(표시 시엔 현재 이름을 우선 조회)
    tag: modalTag,
    type: modalType,
    title: document.getElementById('mTitle').value.trim(),
    note: document.getElementById('mNote').value.trim(),
    team: modalTeam,
    videoUrl: modalType === 'vid' ? document.getElementById('mVideoUrl').value.trim() : '',
    clipStart: modalType === 'vid' ? clipStart : null,
    clipEnd: modalType === 'vid' ? clipEnd : null
    // 이미지 원본 파일(blob)은 저장하지 않는다 — 이어서 작성 시 이미지는 다시 업로드해야 한다(의도된 제한)
  };
}

function saveDraftAndClose(){
  const draft = buildDraftFromCurrentModal();
  loadContentDrafts();
  const idx = contentDrafts.findIndex(d => d.id === draft.id);
  if(idx >= 0) contentDrafts[idx] = draft; else contentDrafts.push(draft);
  if(!saveContentDraftsToStorage()){
    setModalMsg('임시저장에 실패했어요(저장 공간 부족일 수 있어요). 다시 시도해주세요.', 'err');
    return; // 실패 시 모달을 닫지 않아 입력 내용이 사라지지 않게 한다
  }
  closeModal();
  renderContentDraftsList();
}

function requestCloseModal(){
  if(hasModalUnsavedInput() && confirm('임시저장 하시겠습니까?')){
    saveDraftAndClose();
    return;
  }
  closeModal();
}

function resumeContentDraft(id){
  loadContentDrafts();
  const draft = contentDrafts.find(d => d.id === id);
  if(!draft) return;
  const map = maps.find(m => m.id === draft.mapId);
  currentMap = draft.mapId;
  currentMapName = map ? map.name : (draft.mapName || '');
  openAddModal(draft.tag); // 기본 상태로 초기화(제목/설명 등 clear) 후 아래에서 값 복원
  resumingDraftId = draft.id;
  document.getElementById('mTitle').value = draft.title || '';
  document.getElementById('mNote').value = draft.note || '';
  updateTextCounters();
  modalTeam = draft.team || null;
  document.getElementById('mTeam').value = modalTeam || '';
  if(draft.type === 'vid' && draft.videoUrl && parseYouTube(draft.videoUrl)){
    modalType = 'vid';
    document.getElementById('mVideoUrl').value = draft.videoUrl;
    showModalStep('media');
    loadClipPlayer((duration) => {
      if(resumingDraftId !== draft.id) return; // 그 사이 모달이 닫히거나 다른 draft를 열었으면 무시(openEditModal과 동일 패턴)
      clipStart = draft.clipStart;
      clipEnd = draft.clipEnd;
      syncClipSliders();
      updateClipLabel();
      syncClipPreviewTimer();
    });
  } else if(draft.type === 'img'){
    // 원본 이미지는 저장하지 않으므로 재업로드가 필요하다 — paste 단계에 머물지만, 다음에
    // 사용자가 붙여넣기/파일선택 중 무엇을 하든 각자 modalType을 다시 정하므로 이 값은
    // 참고용일 뿐이다. 그래도 draft가 기억한 원래 타입과 어긋나지 않도록 명시적으로 맞춰둔다.
    modalType = 'img';
  }
  // 이미지 타입(또는 저장된 URL이 없거나 무효한 경우)은 paste 단계에 그대로 머무른다 —
  // 제목/설명/진영만 미리 채워둔 채로 사용자가 이미지를 다시 붙여넣거나 업로드하면 details 단계에서 이어진다.
}

function removeDraftById(id){
  loadContentDrafts();
  contentDrafts = contentDrafts.filter(d => d.id !== id);
  saveContentDraftsToStorage();
  renderContentDraftsList();
}
function deleteContentDraft(id){
  if(!confirm('임시저장한 항목을 삭제할까요?')) return;
  removeDraftById(id);
}

function renderContentDraftsList(){
  loadContentDrafts();
  const section = document.getElementById('contentDraftsSection');
  const list = document.getElementById('contentDraftsList');
  if(!section || !list) return; // 홈 DOM이 아직 준비되지 않은 시점 방어
  if(contentDrafts.length === 0){
    section.style.display = 'none';
    list.innerHTML = '';
    return;
  }
  section.style.display = 'block';
  const sorted = [...contentDrafts].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  list.innerHTML = sorted.map(d => {
    const map = maps.find(m => m.id === d.mapId);
    const mapName = map ? map.name : (d.mapName || '맵 정보 없음');
    const label = d.title || (d.videoUrl ? d.videoUrl.slice(0, 40) : '제목 없음');
    const time = new Date(d.savedAt).toLocaleString('ko-KR');
    return `
      <div class="content-draft-item" data-id="${d.id}">
        <div class="content-draft-info" onclick="resumeContentDraft('${d.id}')">
          <span class="content-draft-title">${escapeHtml(label)}</span>
          <span class="content-draft-meta">${escapeHtml(mapName)} · ${escapeHtml(d.tag || '')} · ${time}</span>
        </div>
        <span class="content-draft-del" title="삭제" onclick="event.stopPropagation(); deleteContentDraft('${d.id}')">🗑</span>
      </div>
    `;
  }).join('');
}

function renderThemeToggle(){
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.setAttribute('aria-checked', String(isLight));
}
function toggleTheme(){
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if(isLight){
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('sa-theme', 'dark'); } catch(e){}
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    try { localStorage.setItem('sa-theme', 'light'); } catch(e){}
  }
  renderThemeToggle();
}

async function renderAuthArea(session){
  const userId = session && session.user.id;
  const previousUserId = currentSession && currentSession.user.id;
  currentSession = session;
  if(previousUserId !== userId) favoritePending.clear();
  await loadFavorites();
  if((currentSession && currentSession.user.id) !== userId) return;
  const el = document.getElementById('authArea');
  let isAdmin = false;
  if(session){
    const nickname = session.user.user_metadata.full_name || session.user.user_metadata.name || '사용자';
    try {
      const { data } = await sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
      isAdmin = !!data;
    } catch(e){
      isAdmin = false;
    }

    el.innerHTML = `
      <span class="mono" style="font-size:12px;color:var(--text);">${nickname}</span>
      <button id="logoutBtn" class="discord-btn">로그아웃</button>
    `;
    document.getElementById('logoutBtn').onclick = async () => {
      await sb.auth.signOut();
    };
  } else {
    el.innerHTML = `<button id="discordLoginBtn" class="discord-btn">디스코드로 로그인</button>`;
    document.getElementById('discordLoginBtn').onclick = discordLogin;
  }
  isAdminUser = isAdmin;
  document.getElementById('masterBtn').style.display = isAdminUser ? 'inline-flex' : 'none';
  if(!isAdminUser && document.getElementById('viewMaster').classList.contains('active')) showMapGrid();
  refreshCommentAuthUI(); // 오버레이가 열려 있는 채로 로그인/로그아웃하면 댓글 입력·삭제 아이콘 상태도 즉시 갱신
  if(previousUserId !== userId) await loadAll();
  else rerenderCurrentView();
}

const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30일간 사이트 재방문이 없으면 로그아웃(client-side, Free 플랜은 서버 세션 만료 기능이 없어 대체)

async function initAuth(){
  let { data: { session } } = await sb.auth.getSession();
  if(session){
    const lastActive = Number(localStorage.getItem('sa-last-active'));
    if(lastActive && Date.now() - lastActive > INACTIVITY_LIMIT_MS){
      const { error } = await sb.auth.signOut();
      if(!error){
        localStorage.removeItem('sa-last-active');
        session = null;
      } // signOut 실패 시 타임스탬프를 건드리지 않아 다음 방문에도 계속 재시도되게 함
    } else {
      localStorage.setItem('sa-last-active', String(Date.now()));
    }
  }
  await renderAuthArea(session);
  sb.auth.onAuthStateChange((event, session) => {
    if(event === 'INITIAL_SESSION') return; // initAuth()가 이미 위에서 만료 판정을 처리했으므로 중복 갱신 방지(실패 시 재시도 타이머 보존)
    if(session) localStorage.setItem('sa-last-active', String(Date.now()));
    else localStorage.removeItem('sa-last-active');
    renderAuthArea(session);
  });
}

renderThemeToggle();
initImageZoomPan();
initAuth();
loadAll();
setInterval(() => {
  if(document.visibilityState === 'visible' && (document.getElementById('viewHome').classList.contains('active') || document.getElementById('viewGrid').classList.contains('active'))){
    void refreshPublicDataIfStale(true);
  }
}, PUBLIC_REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible') void refreshPublicDataIfStale(true);
});
