/* z4 — internal chat (server-backed, private DMs + team) · floating window */
(function () {
  if (window.XP_CHAT4) return; window.XP_CHAT4 = 1;
  var SB_URL = 'https://rmhkmutxptwdvcorcfyy.supabase.co', SB_KEY = 'sb_publishable_wJghGm84T-aRdvKZZXmF3Q_zEfYRsM9';
  var UN = { 'المدير': 'manager', 'الشريك': 'partner', 'ماجد (المشرف)': 'majed', 'هيا (الإيجار)': 'haya', 'ريم (الاستقدام)': 'reem', 'خالد (المحاسب)': 'khaled', 'سارة (خدمة العملاء)': 'sara', 'منصور (الاستقبال)': 'mansour' };
  var ALL = 'الكل';
  var sb = null, ME = null, STAFF = [], CONV = {}, MSG = {}, READ = {}, UNR = {}, TEAM = null;
  var S = { open: false, view: 'list', conv: null, target: null, err: '', busy: false, menu: null, mi: 0, file: null };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function short(n) { return String(n || '').split(' (')[0]; }
  function $(q) { return document.querySelector(q); }
  function staff(id) { for (var i = 0; i < STAFF.length; i++) if (STAFF[i].id === id) return STAFF[i]; return null; }
  function other(c) { return c && c.kind === 'dm' ? staff(c.a === ME.id ? c.b : c.a) : null; }
  function cname(c) { if (!c) return ''; if (c.kind === 'team') return 'محادثة الفريق'; var o = other(c); return o ? o.name : 'محادثة خاصة'; }
  function tm(d) { d = new Date(d); return d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' }); }
  function dayl(d) { d = new Date(d); var t = new Date(); t.setHours(0, 0, 0, 0); var x = new Date(d); x.setHours(0, 0, 0, 0); var k = Math.round((t - x) / 864e5); return k === 0 ? 'اليوم' : k === 1 ? 'أمس' : d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'numeric' }); }
  function canTeam() { return ME && ME.chat === 'full'; }
  function totalUnread() { var n = 0; Object.keys(UNR).forEach(function (k) { n += UNR[k] || 0; }); return n; }
  function dmWith(uid) { var ks = Object.keys(CONV); for (var i = 0; i < ks.length; i++) { var c = CONV[ks[i]]; if (c.kind === 'dm' && (c.a === uid || c.b === uid)) return c; } return null; }

  /* ---------- styles ---------- */
  var css = '.z4fab{position:fixed;right:18px;bottom:18px;z-index:9000;width:58px;height:58px;border-radius:50%;border:0;background:#1F6B4F;color:#fff;box-shadow:0 6px 20px rgba(31,42,36,.28);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '.z4fab:hover{transform:scale(1.05)}.z4fab svg{width:28px;height:28px}.z4fab .z4b{position:absolute;top:-3px;left:-3px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#C0392B;color:#fff;font:700 12px/22px inherit;font-family:inherit;border:2px solid #fff}' +
    '.z4fab.on{display:none}' +
    '.z4w{position:fixed;right:18px;bottom:18px;z-index:9001;width:390px;max-width:calc(100vw - 24px);height:min(620px,calc(100vh - 40px));background:#EFE9DD;border-radius:16px;box-shadow:0 18px 50px rgba(31,42,36,.35);display:flex;flex-direction:column;overflow:hidden;direction:rtl;font-family:inherit;color:#1F2A24}' +
    '.z4w[hidden]{display:none}' +
    '.z4h{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#1F6B4F;color:#fff;flex:0 0 auto}.z4h .z4av{width:38px;height:38px;border-radius:50%;background:#FBF7EF;color:#1F6B4F;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}' +
    '.z4h .z4t{flex:1;min-width:0}.z4h b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.z4h small{display:block;font-size:11.5px;opacity:.85}' +
    '.z4ib{background:transparent;border:0;color:inherit;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center}.z4ib:hover{background:rgba(255,255,255,.15)}' +
    '.z4m{flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:4px;background:#EFE9DD;overscroll-behavior:contain}' +
    '.z4d{align-self:center;background:#FBF7EF;color:#4A5650;font-size:11.5px;padding:3px 10px;border-radius:8px;margin:6px 0}' +
    '.z4g{max-width:80%;padding:6px 10px 4px;border-radius:12px;background:#fff;align-self:flex-start;box-shadow:0 1px 1px rgba(0,0,0,.08);word-wrap:break-word;white-space:pre-wrap;font-size:14px;line-height:1.55}' +
    '.z4g.me{align-self:flex-end;background:#D7EEDD}.z4g .z4s{display:block;font-size:11.5px;font-weight:700;color:#1F6B4F;margin-bottom:1px}.z4g .z4tm{display:block;text-align:left;font-size:10.5px;color:#6B7570;margin-top:2px;direction:ltr}' +
    '.z4g img{display:block;max-width:100%;max-height:220px;border-radius:8px;margin:2px 0 4px;cursor:pointer}.z4g a.z4f{display:inline-flex;gap:6px;align-items:center;color:#2563A8;text-decoration:none;font-weight:600;margin-bottom:2px}' +
    '.z4e{margin:auto;text-align:center;color:#4A5650;font-size:13.5px;padding:20px;line-height:1.8}' +
    '.z4c{flex:0 0 auto;background:#FBF7EF;border-top:1px solid #E2D9C6;padding:8px;position:relative}' +
    '.z4tg{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#1F6B4F;background:#E6F0EA;border-radius:8px;padding:5px 10px;margin-bottom:6px}.z4tg.team{color:#8A4E0E;background:#F7EBD7}.z4tg button{margin-inline-start:auto;border:0;background:transparent;font-size:15px;cursor:pointer;color:inherit}' +
    '.z4er{font-size:12.5px;color:#A1281B;background:#FBE6E3;border-radius:8px;padding:5px 10px;margin-bottom:6px}' +
    '.z4fi{font-size:12.5px;background:#E7EEF8;color:#2563A8;border-radius:8px;padding:5px 10px;margin-bottom:6px;display:flex;gap:8px;align-items:center}.z4fi button{margin-inline-start:auto;border:0;background:transparent;cursor:pointer;color:inherit;font-size:15px}' +
    '.z4r{display:flex;align-items:flex-end;gap:6px}.z4r textarea{flex:1;resize:none;border:1px solid #E2D9C6;border-radius:20px;padding:9px 14px;font:inherit;font-size:15px;line-height:1.4;max-height:110px;min-height:42px;height:42px;background:#fff;color:#1F2A24;outline:none}.z4r textarea:focus{border-color:#1F6B4F}' +
    '.z4r .z4at,.z4r .z4sd{width:42px;height:42px;border-radius:50%;border:0;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center}.z4r .z4at{background:transparent;color:#4A5650;font-size:20px}.z4r .z4sd{background:#1F6B4F;color:#fff}.z4r .z4sd svg{width:20px;height:20px;transform:scaleX(-1)}.z4r .z4sd:disabled{opacity:.5}' +
    '.z4mn{position:absolute;bottom:100%;right:8px;left:8px;max-height:230px;overflow-y:auto;background:#fff;border:1px solid #E2D9C6;border-radius:12px;box-shadow:0 -6px 20px rgba(31,42,36,.15);padding:4px}' +
    '.z4mn button{display:flex;width:100%;gap:10px;align-items:center;border:0;background:transparent;padding:8px 10px;border-radius:8px;text-align:right;font:inherit;font-size:14px;cursor:pointer;color:#1F2A24}.z4mn button.sel,.z4mn button:hover{background:#E6F0EA}.z4mn small{color:#6B7570;font-size:11.5px}.z4mn .z4av{width:30px;height:30px;border-radius:50%;background:#1F6B4F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex:0 0 auto}.z4mn .z4av.all{background:#8A4E0E}' +
    '.z4l{flex:1;overflow-y:auto;background:#FBF7EF}.z4l button.z4it{display:flex;width:100%;gap:10px;align-items:center;border:0;border-bottom:1px solid #EFE7D8;background:transparent;padding:11px 12px;text-align:right;font:inherit;cursor:pointer;color:#1F2A24}.z4l button.z4it:hover{background:#F3EDE1}' +
    '.z4l .z4av{width:42px;height:42px;border-radius:50%;background:#1F6B4F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}.z4l .z4av.team{background:#8A4E0E}.z4l .z4x{flex:1;min-width:0}.z4l .z4x b{display:flex;justify-content:space-between;gap:6px;font-size:14.5px}.z4l .z4x b small{font-weight:400;color:#6B7570;font-size:11px}.z4l .z4x span{display:block;color:#4A5650;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.z4l .z4u{background:#1F6B4F;color:#fff;border-radius:10px;min-width:20px;height:20px;font-size:11.5px;line-height:20px;text-align:center;padding:0 5px;flex:0 0 auto}' +
    '.z4nw{margin:10px;display:flex;gap:8px}.z4nw button{flex:1;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:600;cursor:pointer;background:#1F6B4F;color:#fff}' +
    '.z4lg{padding:22px 18px;display:flex;flex-direction:column;gap:12px;background:#FBF7EF;flex:1;overflow:auto}.z4lg label{font-size:13px;font-weight:600;display:flex;flex-direction:column;gap:5px}.z4lg select,.z4lg input{font:inherit;font-size:15px;padding:10px 12px;border:1px solid #E2D9C6;border-radius:10px;background:#fff;color:#1F2A24}.z4lg button{border:0;border-radius:10px;padding:11px;font:inherit;font-weight:700;background:#1F6B4F;color:#fff;cursor:pointer}.z4lg p{margin:0;font-size:12.5px;color:#4A5650;line-height:1.7}' +
    '.z4pop{position:absolute;top:52px;left:8px;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:4px;z-index:2;min-width:170px}.z4pop button{display:block;width:100%;border:0;background:transparent;padding:9px 12px;text-align:right;font:inherit;font-size:13.5px;cursor:pointer;border-radius:6px;color:#1F2A24}.z4pop button:hover{background:#F3EDE1}' +
    '@media (max-width:640px){.z4w{right:0;left:0;bottom:auto;top:0;width:100%;max-width:100%;height:100%;border-radius:0}.z4fab{right:14px;bottom:14px}}' +
    '.z4pl .z4it{display:flex;gap:10px;align-items:center;width:100%;border:0;border-bottom:1px solid #EFE7D8;background:transparent;padding:10px 4px;text-align:right;font:inherit;cursor:pointer;color:inherit}.z4pl .z4av{width:38px;height:38px;border-radius:50%;background:#1F6B4F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}.z4pl .z4av.team{background:#8A4E0E}.z4pl .z4x{flex:1;min-width:0}.z4pl .z4x b{display:flex;justify-content:space-between}.z4pl .z4x b small{font-weight:400;color:#6B7570}.z4pl .z4x span{display:block;color:#4A5650;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.z4pl .z4u{background:#1F6B4F;color:#fff;border-radius:10px;min-width:20px;height:20px;font-size:11.5px;line-height:20px;text-align:center;padding:0 5px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 21.5l3.9-1.9c1.1.3 2.3.5 3.5.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3zm-4.5 10a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4.5 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4.5 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.5-7.5a1 1 0 000-1.8L3.4 3.6a1 1 0 00-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 001.4 1.1z"/></svg>';

  /* ---------- DOM skeleton ---------- */
  var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'z4fab'; fab.setAttribute('aria-label', 'المحادثات الداخلية'); fab.innerHTML = ICON + '<span class="z4b" hidden>0</span>';
  var win = document.createElement('section'); win.className = 'z4w'; win.hidden = true; win.setAttribute('role', 'dialog'); win.setAttribute('aria-label', 'المحادثات الداخلية');
  win.innerHTML = '<header class="z4h"><button type="button" class="z4ib" data-z="back" aria-label="رجوع" hidden>›</button><div class="z4av">💬</div><div class="z4t"><b id="z4ttl">المحادثات</b><small id="z4sub"></small></div><button type="button" class="z4ib" data-z="more" aria-label="خيارات">⋮</button><button type="button" class="z4ib" data-z="close" aria-label="إغلاق">×</button></header>' +
    '<div id="z4body" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' +
    '<div class="z4c" id="z4comp" hidden><div id="z4mn" class="z4mn" hidden></div><div id="z4tg"></div><div id="z4er"></div><div id="z4fi"></div><div class="z4r"><button type="button" class="z4at" data-z="att" aria-label="إرفاق ملف">📎</button><textarea id="z4in" rows="1" placeholder="اكتب رسالة… استخدم @ لاختيار المستلم" aria-label="نص الرسالة"></textarea><button type="button" class="z4sd" data-z="send" aria-label="إرسال">' + SEND + '</button></div><input type="file" id="z4file" hidden></div>';
  var CUSTP = { LandingAd: 1, Landing: 1, CustomerLogin: 1, Home: 1, JijiChat: 1, WhatsAppChat: 1, AvailableWorkers: 1, Booking: 1, StaffLogin: 1, Main: 1 };
  function staffView() {
    var ok = false; try { ok = sessionStorage.getItem('asayel-ok') === '1'; } catch (e) { }
    var k = (location.hash.match(/^#\/([A-Za-z]+)/) || [])[1] || 'LandingAd', U = window.XP_U, pg = U && U.P && U.P[k];
    return ok && !CUSTP[k] && !(pg && pg.cust) && !document.querySelector('#pin.show');
  }
  function vis() { var v = staffView(); fab.style.display = v ? '' : 'none'; if (!v && S.open) closeWin(); }
  window.addEventListener('hashchange', function () { setTimeout(vis, 0); }); setInterval(vis, 1000);
  function mount() { if (!document.body) return setTimeout(mount, 50); document.body.appendChild(fab); document.body.appendChild(win); vis(); boot(); }
  mount();

  /* ---------- mobile keyboard: keep the composer visible ---------- */
  function fit() {
    var vv = window.visualViewport; if (!vv || window.innerWidth > 640 || win.hidden) { win.style.height = ''; win.style.top = ''; return; }
    win.style.top = vv.offsetTop + 'px'; win.style.height = vv.height + 'px';
    var m = $('.z4m'); if (m && S.stick) m.scrollTop = m.scrollHeight;
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit); }
  window.addEventListener('resize', fit);

  /* ---------- server ---------- */
  function loadLib(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'; s.crossOrigin = 'anonymous'; s.onload = cb; s.onerror = function () { S.err = 'تعذّر تحميل خدمة المحادثة · تحقق من الاتصال'; render(); }; document.head.appendChild(s);
  }
  function boot() {
    loadLib(function () {
      sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'asayel-chat' } });
      sb.auth.onAuthStateChange(function (ev, ses) {
        /* another tab switched or ended the login: follow it */
        if (ME && ses && ses.user && ses.user.id !== ME.id) location.reload();
        else if (ME && ev === 'SIGNED_OUT') { var H = window.XP_HOST; if (H && H.logout) H.logout(); location.reload(); }
      });
      sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) start(r.data.session.user.id);
        else { render(); var H = window.XP_HOST, ok = false; try { ok = sessionStorage.getItem('asayel-ok') === '1'; } catch (e) { } if (ok && H && H.logout) { H.logout(); location.reload(); } }
      });
    });
  }
  function unlockProgram() {
    var H = window.XP_HOST; if (H && H.unlock) return H.unlock();
    try { sessionStorage.setItem('asayel-ok', '1'); } catch (e) { }
    var k = (location.hash.match(/^#\/([A-Za-z]+)/) || [])[1];
    if (!k || k === 'StaffLogin' || CUSTP[k]) location.hash = '#/Dashboard';
    location.reload();
  }
  function whenSb() { return new Promise(function (ok, no) { var n = 0; (function w() { if (sb) return ok(); if (++n > 150) return no(); setTimeout(w, 100); })(); }); }
  var chan = null, poll = null;
  function start(uid) {
    return sb.from('staff').select('*').order('created_at').then(function (r) {
      STAFF = r.data || []; ME = staff(uid);
      if (!ME) { S.err = 'هذا الحساب غير مسجّل كموظف'; render(); return; }
      syncMe();
      return refresh(true).then(function () {
        if (chan) sb.removeChannel(chan);
        chan = sb.channel('z4-' + uid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, function (p) { incoming(p.new); }).subscribe();
        clearInterval(poll); poll = setInterval(function () { refresh(false); }, 20000);
        render();
      });
    });
  }
  function refresh(first) {
    return Promise.all([
      sb.from('conversations').select('*'),
      sb.from('reads').select('*'),
      sb.from('messages').select('*').order('created_at', { ascending: false }).limit(400)
    ]).then(function (rs) {
      (rs[0].data || []).forEach(function (c) { CONV[c.id] = c; if (c.kind === 'team') TEAM = c; });
      (rs[1].data || []).forEach(function (x) { READ[x.conv_id] = x.last_read_at; });
      var seen = {}; Object.keys(MSG).forEach(function (k) { MSG[k].forEach(function (m) { seen[m.id] = 1; }); });
      var fresh = [];
      (rs[2].data || []).slice().reverse().forEach(function (m) { if (!CONV[m.conv_id]) return; (MSG[m.conv_id] = MSG[m.conv_id] || []); if (!seen[m.id]) { MSG[m.conv_id].push(m); fresh.push(m); } });
      Object.keys(MSG).forEach(function (k) { MSG[k].sort(function (a, b) { return a.id - b.id; }); });
      recount();
      if (!first) fresh.forEach(function (m) { if (m.sender !== ME.id) notify(m); });
      render();
    });
  }
  function recount() {
    UNR = {}; Object.keys(MSG).forEach(function (k) { var lr = READ[k] ? new Date(READ[k]).getTime() : 0; UNR[k] = MSG[k].filter(function (m) { return m.sender !== ME.id && !m.hidden_at && new Date(m.created_at).getTime() > lr; }).length; });
    if (S.open && S.view === 'thread' && S.conv && document.visibilityState !== 'hidden') UNR[S.conv] = 0;
  }
  function incoming(m) {
    var go = function () {
      var L = (MSG[m.conv_id] = MSG[m.conv_id] || []); if (L.some(function (x) { return x.id === m.id; })) return; L.push(m);
      if (m.sender !== ME.id) { UNR[m.conv_id] = (UNR[m.conv_id] || 0) + 1; notify(m); }
      render();
    };
    if (CONV[m.conv_id]) go(); else sb.from('conversations').select('*').eq('id', m.conv_id).then(function (r) { if (r.data && r.data[0]) { CONV[m.conv_id] = r.data[0]; go(); } });
  }
  function notify(m) {
    var viewing = S.open && S.view === 'thread' && S.conv === m.conv_id;
    if (viewing) { markRead(m.conv_id); return; }
    if (!staffView()) return;
    var typing = S.open && ($('#z4in').value.trim() || S.file);
    if (!S.open) { openWin(); showConv(m.conv_id); }
    else if (!typing) showConv(m.conv_id);
    else { var t = window.XP_HOST && window.XP_HOST.toast; if (t) t('💬 رسالة جديدة من ' + short((staff(m.sender) || {}).name)); }
  }
  function markRead(cid) {
    if (!cid || !ME) return; var now = new Date().toISOString(); READ[cid] = now; UNR[cid] = 0; badge();
    sb.from('reads').upsert({ conv_id: cid, user_id: ME.id, last_read_at: now }).then(function () { });
  }
  function syncMe() {
    var U = window.XP_U; if (!U || !U.me || !ME || U.me() === ME.name || (U.MEM || []).indexOf(ME.name) < 0) return;
    var s = document.createElement('select'); s.id = 'tcme'; s.hidden = true; s.innerHTML = '<option>' + esc(ME.name) + '</option>'; s.value = ME.name; document.body.appendChild(s);
    s.dispatchEvent(new Event('change', { bubbles: true })); s.remove();
  }

  /* ---------- rendering ---------- */
  function badge() {
    var n = totalUnread(), b = fab.querySelector('.z4b'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    var pl = document.getElementById('z4pl'); if (pl) pl.innerHTML = pageList();
  }
  function last(cid) { var L = MSG[cid] || []; for (var i = L.length - 1; i >= 0; i--) if (!L[i].hidden_at || CONV[cid].kind === 'dm') return L[i]; return null; }
  function convs() {
    return Object.keys(CONV).map(function (k) { return CONV[k]; }).filter(function (c) { return c.kind === 'team' || (MSG[c.id] || []).length; })
      .sort(function (a, b) { var x = last(a.id), y = last(b.id); return (y ? y.id : 0) - (x ? x.id : 0); });
  }
  function snip(m) { if (!m) return 'لا توجد رسائل بعد'; var s = m.sender === ME.id ? 'أنت: ' : (CONV[m.conv_id].kind === 'team' ? short((staff(m.sender) || {}).name) + ': ' : ''); return s + (m.body || (m.att_name ? '📎 ' + m.att_name : '')); }
  function itemHTML(c) {
    var m = last(c.id), u = UNR[c.id] || 0, nm = cname(c);
    return '<button type="button" class="z4it" data-zc="' + c.id + '"><span class="z4av' + (c.kind === 'team' ? ' team' : '') + '">' + (c.kind === 'team' ? '👥' : esc(nm.charAt(0))) + '</span><span class="z4x"><b>' + esc(nm) + (m ? '<small>' + tm(m.created_at) + '</small>' : '') + '</b><span>' + esc(snip(m)) + '</span></span>' + (u ? '<span class="z4u">' + u + '</span>' : '') + '</button>';
  }
  function pageList() {
    if (!sb) return '<p class="mut">جارٍ الاتصال…</p>';
    if (!ME) return '<p class="mut">جارٍ فتح محادثاتك…</p>';
    var L = convs(); if (ME.chat === 'none') return '<p class="mut">🔒 ليس لديك صلاحية على المحادثات</p>';
    return '<p class="mut sm">تظهر هنا فقط المحادثات المسموح لك بها · المحادثات الخاصة لا يراها إلا طرفاها</p>' + L.map(itemHTML).join('') + '<div style="margin-top:10px"><button type="button" class="xbt" data-zopen="new">+ رسالة جديدة</button></div>';
  }
  function render() {
    badge();
    var back = win.querySelector('[data-z=back]'), ttl = $('#z4ttl'), sub = $('#z4sub'), av = win.querySelector('.z4h .z4av'), body = $('#z4body'), comp = $('#z4comp');
    if (!body) return;
    if (!ME) {
      back.hidden = true; ttl.textContent = 'المحادثات الداخلية'; sub.textContent = ''; av.textContent = '💬'; comp.hidden = true;
      body.innerHTML = '<div class="z4e">' + (S.err ? esc(S.err) : 'جارٍ فتح محادثاتك…') + '</div>';
      return;
    }
    if (S.view === 'list') {
      back.hidden = true; ttl.textContent = 'المحادثات'; sub.textContent = 'باسم: ' + ME.name; av.textContent = '💬';
      body.innerHTML = '<div class="z4l">' + convs().map(itemHTML).join('') + '</div><div class="z4nw"><button type="button" data-z="new">✎ رسالة جديدة</button></div>';
      comp.hidden = true; return;
    }
    back.hidden = false; comp.hidden = false;
    var c = S.conv ? CONV[S.conv] : null, tg = S.target;
    if (c) { ttl.textContent = cname(c); sub.textContent = c.kind === 'team' ? 'كل الموظفين المصرّح لهم' : 'محادثة خاصة'; av.textContent = c.kind === 'team' ? '👥' : cname(c).charAt(0); }
    else if (tg) { ttl.textContent = tg === ALL ? 'محادثة الفريق' : (staff(tg) || {}).name; sub.textContent = tg === ALL ? 'كل الموظفين المصرّح لهم' : 'محادثة خاصة جديدة'; av.textContent = tg === ALL ? '👥' : ttl.textContent.charAt(0); }
    else { ttl.textContent = 'رسالة جديدة'; sub.textContent = 'اكتب @ واختر المستلم'; av.textContent = '✎'; }
    var L = c ? (MSG[c.id] || []) : [];
    var h = '', pd = '';
    L.forEach(function (m) {
      var d = dayl(m.created_at); if (d !== pd) { h += '<div class="z4d">' + esc(d) + '</div>'; pd = d; }
      var mine = m.sender === ME.id, who = staff(m.sender);
      h += '<div class="z4g' + (mine ? ' me' : '') + '">' + (!mine && c.kind === 'team' ? '<span class="z4s">' + esc(who ? who.name : '—') + '</span>' : '') + attHTML(m) + (m.body ? esc(m.body) : '') + '<span class="z4tm">' + tm(m.created_at) + (m.hidden_at ? ' · أرشيف' : '') + '</span></div>';
    });
    if (!L.length) h = '<div class="z4e">' + (c || tg ? 'لا توجد رسائل بعد · اكتب رسالتك بالأسفل' : 'اكتب <b>@</b> ثم اختر اسم الموظف لمحادثة خاصة<br>أو <b>@الكل</b> لمحادثة الفريق') + '</div>';
    var box = body.querySelector('.z4m'); var keep = box && box.scrollHeight - box.scrollTop - box.clientHeight > 80 ? box.scrollTop : null;
    body.innerHTML = '<div class="z4m">' + h + '</div>';
    box = body.querySelector('.z4m'); box.scrollTop = keep == null ? box.scrollHeight : keep; S.stick = keep == null;
    signImgs(box);
    compBits();
    if (c && S.open && document.visibilityState !== 'hidden' && (UNR[c.id] || (L.length && READ[c.id] < L[L.length - 1].created_at))) markRead(c.id);
  }
  function compBits() {
    var c = S.conv ? CONV[S.conv] : null, tg = S.target, x = '';
    if (tg && tg !== ALL) x = '<div class="z4tg">🔒 محادثة خاصة مع ' + esc(short((staff(tg) || {}).name)) + '<button type="button" data-z="untg" aria-label="إلغاء المستلم">×</button></div>';
    else if (tg === ALL) x = '<div class="z4tg team">👥 إرسال إلى محادثة الفريق<button type="button" data-z="untg" aria-label="إلغاء المستلم">×</button></div>';
    else if (c && c.kind === 'dm') x = '<div class="z4tg">🔒 محادثة خاصة مع ' + esc(short(cname(c))) + '</div>';
    else if (c && c.kind === 'team') x = '<div class="z4tg team">👥 إرسال إلى محادثة الفريق</div>';
    $('#z4tg').innerHTML = x; $('#z4er').innerHTML = S.err ? '<div class="z4er" role="alert">' + esc(S.err) + '</div>' : '';
    $('#z4fi').innerHTML = S.file ? '<div class="z4fi">📎 ' + esc(S.file.name) + ' · ' + Math.ceil(S.file.size / 1024) + ' ك.ب<button type="button" data-z="unfile" aria-label="إزالة المرفق">×</button></div>' : '';
    var ro = (c && c.kind === 'team' && !canTeam() && !tg) || (tg === ALL && !canTeam());
    var inp = $('#z4in'); inp.disabled = !!ro; inp.placeholder = ro ? '👁 صلاحيتك في محادثة الفريق: مشاهدة فقط' : (c ? 'اكتب رسالة…' : 'اكتب @ واختر المستلم ثم رسالتك…');
    win.querySelector('[data-z=send]').disabled = !!ro || S.busy; win.querySelector('[data-z=att]').disabled = !!ro;
  }
  var URLS = {};
  function attHTML(m) {
    if (!m.att_path) return '';
    if (/^image\//.test(m.att_type || '')) return '<img alt="' + esc(m.att_name) + '" data-zimg="' + esc(m.att_path) + '"' + (URLS[m.att_path] ? ' src="' + esc(URLS[m.att_path]) + '"' : '') + '>';
    return '<a class="z4f" href="#" data-zfile="' + esc(m.att_path) + '" data-n="' + esc(m.att_name) + '">📄 ' + esc(m.att_name || 'ملف') + '</a><br>';
  }
  function signImgs(box) {
    box.querySelectorAll('img[data-zimg]:not([src])').forEach(function (im) {
      var p = im.dataset.zimg; sb.storage.from('chat').createSignedUrl(p, 3600).then(function (r) { if (r.data) { URLS[p] = r.data.signedUrl; im.src = r.data.signedUrl; } });
    });
  }

  /* ---------- window control ---------- */
  function openWin() { S.open = true; win.hidden = false; fab.classList.add('on'); fit(); render(); }
  function closeWin() { S.open = false; win.hidden = true; fab.classList.remove('on'); hideMenu(); var p = win.querySelector('.z4pop'); if (p) p.remove(); try { fab.focus({ preventScroll: true }); } catch (e) { } }
  function showConv(cid) { S.view = 'thread'; S.conv = cid; S.target = null; S.err = ''; render(); }
  function showNew(tg) { S.view = 'thread'; S.conv = null; S.target = tg || null; S.err = ''; render(); setTimeout(function () { var i = $('#z4in'); if (i && window.innerWidth > 640) i.focus(); }, 30); }
  window.XP_CHAT = { open: function (cid) { openWin(); if (cid === 'new') showNew(); else if (cid) showConv(cid); }, close: closeWin, state: S };

  fab.addEventListener('click', function () {
    openWin();
    if (ME && S.view === 'list') { var ks = Object.keys(UNR).filter(function (k) { return UNR[k]; }); if (ks.length === 1) showConv(ks[0]); }
    setTimeout(function () { var i = $('#z4in'); if (i && !win.querySelector('#z4comp').hidden && window.innerWidth > 640) i.focus(); else { var p = $('#z4p'); if (p) p.focus(); } }, 30);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.open && !S.menu) closeWin(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.open && S.view === 'thread' && S.conv) markRead(S.conv); });

  /* ---------- one login for the program and the chat: employee + personal code ---------- */
  function pinBox() {
    var box = document.getElementById('pin'); if (!box || box.__z4) return; box.__z4 = 1;
    var f = box.querySelector('form'), inp = box.querySelector('input'), sp = box.querySelector('span');
    if (sp) sp.textContent = 'اختر اسمك ثم أدخل رمزك الشخصي';
    var sel = document.createElement('select'); sel.id = 'z4who'; sel.setAttribute('aria-label', 'الموظف');
    sel.style.cssText = 'width:100%;height:50px;box-sizing:border-box;border:2px solid #D9D2C3;border-radius:14px;font-family:inherit;font-size:17px;font-weight:600;text-align:center;text-align-last:center;padding:0 12px;background:#fff;color:#1F2A24';
    var last = ''; try { last = localStorage.getItem('asayel-who') || ''; } catch (e) { }
    sel.innerHTML = Object.keys(UN).map(function (n) { return '<option' + (n === last ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
    inp.parentNode.insertBefore(sel, inp); inp.maxLength = 6; inp.setAttribute('aria-label', 'الرمز الشخصي');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      var err = box.querySelector('em'), btn = f.querySelector('button'), n = sel.value;
      var v = inp.value.replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).trim();
      if (!v) { err.textContent = 'أدخل رمزك'; return; }
      btn.disabled = true; err.textContent = 'جارٍ الدخول…';
      whenSb().then(function () { return sb.auth.signInWithPassword({ email: UN[n] + '@staff.asayel.app', password: v }); }).then(function (r) {
        btn.disabled = false; err.textContent = '';
        if (r.error) { inp.value = ''; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); err.textContent = /fetch|network/i.test(r.error.message || '') ? 'تعذّر الاتصال بالخادم' : 'الرمز غير صحيح'; return; }
        try { localStorage.setItem('asayel-who', n); } catch (e2) { }
        inp.value = ''; S.view = 'list'; S.conv = null;
        start(r.data.user.id).then(unlockProgram);
      }).catch(function () { btn.disabled = false; err.textContent = 'تعذّر الاتصال بالخادم · تحقق من الإنترنت'; });
    }, true);
  }
  new MutationObserver(function () { pinBox(); lockMe(); }).observe(document.documentElement, { childList: true, subtree: true });
  /* the «أنا» selector follows the logged-in employee */
  function lockMe() { if (!ME) return; document.querySelectorAll('#shme,#tcme').forEach(function (s) { if (!s.hidden && (!s.disabled || s.value !== ME.name)) { s.value = ME.name; s.disabled = true; s.title = 'تعمل باسم ' + ME.name + ' · للتبديل سجّل الخروج'; } }); }
  document.addEventListener('change', function (e) { var t = e.target; if (ME && (t.id === 'shme' || t.id === 'tcme') && t.value !== ME.name) { e.stopImmediatePropagation(); t.value = ME.name; } }, true);
  /* logging out of the program also logs out of the chat */
  function chatOut() { if (!sb) return; sb.auth.signOut().then(function () { if (chan) sb.removeChannel(chan); chan = null; clearInterval(poll); ME = null; CONV = {}; MSG = {}; READ = {}; UNR = {}; TEAM = null; S.view = 'list'; S.conv = null; S.target = null; var i = $('#z4in'); if (i) i.value = ''; S.file = null; closeWin(); render(); }); }
  document.addEventListener('click', function (e) { if (e.target.closest('nav a.logout, [data-act=logout]')) chatOut(); }, true);
  win.addEventListener('click', function (e) {
    var t = e.target.closest('[data-z],[data-zc],[data-zfile],[data-zimg],[data-zm]'); if (!t) { var p0 = win.querySelector('.z4pop'); if (p0) p0.remove(); return; }
    var z = t.dataset.z;
    if (t.dataset.zc) { showConv(t.dataset.zc); return; }
    if (t.dataset.zm != null) { pick(t.dataset.zm); return; }
    if (t.dataset.zfile) { e.preventDefault(); sb.storage.from('chat').createSignedUrl(t.dataset.zfile, 300, { download: t.dataset.n || true }).then(function (r) { if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener'); }); return; }
    if (t.dataset.zimg) { if (t.src) window.open(t.src, '_blank', 'noopener'); return; }
    if (z === 'close') closeWin();
    else if (z === 'back') { S.view = 'list'; S.conv = null; S.target = null; S.err = ''; hideMenu(); render(); }
    else if (z === 'new') showNew();
    else if (z === 'untg') { S.target = null; render(); }
    else if (z === 'unfile') { S.file = null; compBits(); }
    else if (z === 'att') $('#z4file').click();
    else if (z === 'send') send();
    else if (z === 'more') {
      var ex = win.querySelector('.z4pop'); if (ex) { ex.remove(); return; }
      if (!ME) return;
      var pp = document.createElement('div'); pp.className = 'z4pop'; pp.innerHTML = '<button type="button" data-z="new">✎ رسالة جديدة</button>' + (TEAM ? '<button type="button" data-zc="' + TEAM.id + '">👥 محادثة الفريق</button>' : '') + '<button type="button" data-z="logout">⎋ تسجيل الخروج من البرنامج (' + esc(short(ME.name)) + ')</button>';
      win.appendChild(pp); return;
    }
    else if (z === 'logout') { chatOut(); var H = window.XP_HOST; if (H && H.logout) H.logout(); location.hash = '#/StaffLogin'; }
    var pop = win.querySelector('.z4pop'); if (pop) pop.remove();
  });
  win.addEventListener('change', function (e) { if (e.target.id === 'z4file') { var f = e.target.files[0]; if (f && f.size > 10485760) { S.err = 'حجم الملف أكبر من 10 ميجابايت'; f = null; } else S.err = ''; S.file = f || null; e.target.value = ''; compBits(); } });

  /* ---------- @ recipient picker ---------- */
  function norm(s) { return String(s || '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }
  function atq() { var i = $('#z4in'), v = i.value.slice(0, i.selectionStart), m = v.match(/(^|\s)@([^\s@]*)$/); return m ? m[2] : null; }
  function opts(q) {
    var n = norm(q), L = STAFF.filter(function (s) { return s.id !== ME.id && s.chat !== 'none' && norm(s.name).indexOf(n) >= 0; }).map(function (s) { return { id: s.id, n: s.name }; });
    if (canTeam() && norm(ALL).indexOf(n) === 0) L.unshift({ id: ALL, n: ALL });
    return L;
  }
  function showMenu() {
    var q = atq(), box = $('#z4mn'); if (q == null || !ME) return hideMenu();
    var L = opts(q); S.menu = L; if (S.mi >= L.length) S.mi = 0;
    if (!L.length) { box.innerHTML = '<div style="padding:10px;color:#6B7570;font-size:13px">لا يوجد موظف بهذا الاسم</div>'; box.hidden = false; return; }
    box.innerHTML = L.map(function (o, k) { return '<button type="button" data-zm="' + esc(o.id) + '"' + (k === S.mi ? ' class="sel"' : '') + '><span class="z4av' + (o.id === ALL ? ' all' : '') + '">' + (o.id === ALL ? '👥' : esc(o.n.charAt(0))) + '</span><span>@' + esc(o.n) + '<br><small>' + (o.id === ALL ? 'محادثة الفريق · كل المصرّح لهم' : 'محادثة خاصة') + '</small></span></button>'; }).join('');
    box.hidden = false;
  }
  function hideMenu() { S.menu = null; S.mi = 0; var b = $('#z4mn'); if (b) b.hidden = true; }
  function pick(id) {
    var i = $('#z4in'), pos = i.selectionStart, v = i.value, pre = v.slice(0, pos).replace(/(^|\s)@[^\s@]*$/, '$1'), post = v.slice(pos);
    i.value = (pre + post).replace(/^\s+/, ''); hideMenu();
    S.err = '';
    if (id === ALL) { if (TEAM) { S.conv = TEAM.id; S.target = null; } else S.target = ALL; }
    else { var c = dmWith(id); if (c) { S.conv = c.id; S.target = null; } else { S.conv = null; S.target = id; } }
    S.view = 'thread'; render(); i.focus(); try { i.setSelectionRange(pre.length, pre.length); } catch (e) { }
  }
  win.addEventListener('input', function (e) { if (e.target.id !== 'z4in') return; var i = e.target; i.style.height = 'auto'; i.style.height = Math.min(110, i.scrollHeight) + 'px'; if (S.err) { S.err = ''; compBits(); } showMenu(); });
  win.addEventListener('keydown', function (e) {
    if (e.target.id !== 'z4in') return;
    if (S.menu && S.menu.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); S.mi = (S.mi + (e.key === 'ArrowDown' ? 1 : S.menu.length - 1)) % S.menu.length; showMenu(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(S.menu[S.mi].id); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideMenu(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && window.innerWidth > 640) { e.preventDefault(); send(); }
  });

  /* ---------- send ---------- */
  function send() {
    if (S.busy || !ME) return;
    var i = $('#z4in'), body = i.value.trim(), f = S.file;
    if (!body && !f) return;
    var c = S.conv ? CONV[S.conv] : null, tg = S.target;
    if (!c && !tg) { S.err = 'اختر المستلم أولًا: اكتب @ ثم اسم الموظف، أو @الكل لمحادثة الفريق'; compBits(); i.focus(); return; }
    if (((c && c.kind === 'team') || tg === ALL) && !canTeam()) { S.err = 'صلاحيتك في محادثة الفريق: مشاهدة فقط'; compBits(); return; }
    S.busy = true; S.err = ''; compBits();
    var getConv = c ? Promise.resolve(c.id) : tg === ALL ? Promise.resolve(TEAM && TEAM.id) : sb.rpc('start_dm', { other: tg }).then(function (r) { if (r.error) throw r.error; return r.data; });
    getConv.then(function (cid) {
      if (!cid) throw new Error('no conv');
      var ensure = CONV[cid] ? Promise.resolve() : sb.from('conversations').select('*').eq('id', cid).then(function (r) { if (r.data && r.data[0]) CONV[cid] = r.data[0]; });
      return ensure.then(function () {
        var up = Promise.resolve(null);
        if (f) { var path = cid + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + (f.name.match(/\.[A-Za-z0-9]{1,6}$/) || [''])[0].toLowerCase(); up = sb.storage.from('chat').upload(path, f, { contentType: f.type || 'application/octet-stream' }).then(function (r) { if (r.error) throw r.error; return path; }); }
        return up.then(function (path) {
          var row = { conv_id: cid, body: body }; if (path) { row.att_path = path; row.att_name = f.name.slice(0, 120); row.att_type = f.type || ''; row.att_size = f.size; }
          return sb.from('messages').insert(row).select().single();
        });
      }).then(function (r) {
        if (r.error) throw r.error;
        i.value = ''; i.style.height = ''; S.file = null; S.busy = false; S.conv = cid; S.target = null; S.view = 'thread';
        var L = (MSG[cid] = MSG[cid] || []); if (!L.some(function (x) { return x.id === r.data.id; })) L.push(r.data);
        markRead(cid); render();
      });
    }).catch(function (er) { S.busy = false; S.err = 'تعذّر الإرسال · ' + ((er && er.message) || 'حاول مرة أخرى'); compBits(); });
  }

  /* ---------- the «التواصل الداخلي والتنويهات» page: only conversations this account may see ---------- */
  function hookPage() {
    var U = window.XP_U; if (!U || !U.P || !U.P.TeamChat) return setTimeout(hookPage, 100);
    var pg = U.P.TeamChat; if (pg.__z4) return;
    var o = pg.r;
    pg.r = function () {
      var w = document.createElement('div'); w.innerHTML = o.apply(this, arguments);
      var cc = w.querySelector('#tcw'); cc = cc && cc.closest('.xcd');
      var box = '<section class="xcd"><h3>💬 المحادثات (الفريق والخاصة)</h3><div id="z4pl" class="z4pl">' + pageList() + '</div></section>';
      if (cc) cc.outerHTML = box; else { var g = w.querySelector('.wgrid') || w; g.insertAdjacentHTML('afterbegin', box); }
      w.querySelectorAll('.rlock').forEach(function (n) { if (/المحادثة|الإرسال/.test(n.textContent) && !/التنويهات/.test(n.textContent)) n.remove(); });
      return w.innerHTML;
    };
    pg.__z4 = 1;
    var h = window.XP_HOST; if (h && h.reopen && document.getElementById('tcw')) { try { h.reopen(); } catch (e) { } }
  }
  hookPage();
  document.addEventListener('click', function (e) {
    var t = e.target.closest('#z4pl [data-zc],#z4pl [data-zopen]'); if (!t) return; e.preventDefault(); e.stopPropagation();
    openWin(); if (t.dataset.zc) showConv(t.dataset.zc); else if (t.dataset.zopen === 'new' && ME) showNew();
  }, true);
  /* manager's chat-access selects → server */
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || t.dataset.cacc !== 'chat' || !ME || !ME.is_manager) return;
    sb.from('staff').update({ chat: t.value }).eq('name', t.dataset.u).then(function (r) { if (!r.error) { var s = STAFF.filter(function (x) { return x.name === t.dataset.u; })[0]; if (s) s.chat = t.value; } });
  });
})();
