/* z7 — «معاينة باسم» only through the home-page form; after Musaned is paid the staff member records the
   foreign office that accepted the worker and the request joins visa tracking like any worker, typed «معاينة باسم» */
(function () {
  var SB_URL = 'https://rmhkmutxptwdvcorcfyy.supabase.co', SB_KEY = 'sb_publishable_wJghGm84T-aRdvKZZXmF3Q_zEfYRsM9';
  var NT = 'معاينة باسم';
  function U() { return window.XP_U || {}; }
  function V() { return window.XP_V || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var u = U(); if (u.toast) u.toast(m); }
  function reopen() { var h = window.XP_HOST; if (h && h.reopen) try { h.reopen(); } catch (e) { } }
  function token() { try { var s = JSON.parse(localStorage.getItem('asayel-chat') || 'null'); return s && s.access_token; } catch (e) { return null; } }
  var DB = null, DBT = null;
  function db() {
    var t = token(); if (!t || !window.supabase || !window.supabase.createClient) return null;
    if (DBT !== t) { DBT = t; DB = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'asayel-z7' }, global: { headers: { Authorization: 'Bearer ' + t } } }); }
    return DB;
  }
  function refNo(id) { return String(id).slice(0, 6).toUpperCase(); }
  function today() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }

  var st = document.createElement('style');
  st.textContent = '.z7ty{display:inline-block;margin-inline-start:6px;padding:1px 8px;border-radius:8px;font-size:12px;font-weight:700;background:#EAF2FF;color:#1D5FD1;vertical-align:middle}.z7ty.nm{background:#FFF3DA;color:#9A6400}' +
    '.z7mv{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#1E7A46;background:#E6F4EC;border-radius:9px;padding:6px 10px}.z7f{display:flex;flex-direction:column;gap:12px}.z7f label{display:flex;flex-direction:column;gap:5px;font-size:13.5px}.z7f input{padding:10px;border:1.5px solid #D9D2C3;border-radius:10px;font:inherit}.z7f .z7e{color:#B3261E;margin:0;min-height:1em;font-size:13px}';
  (document.head || document.documentElement).appendChild(st);

  /* 1) no blank «معاينة باسم» cards in the CV list */
  function dropCards() { document.querySelectorAll('.nmcv').forEach(function (a) { a.remove(); }); }

  /* 2) named requests from Supabase, and their place in visa tracking */
  var NM = {}, loaded = 0, loading = 0;
  function vOf(rid) { return (V().VISA || []).filter(function (v) { return v.rid === rid; })[0]; }
  function toVisa(r) {
    var d = r.data || {}, t = r.track; if (!t || !V().VISA || vOf(r.id)) return;
    var v = { id: 'س-' + refNo(r.id), rid: r.id, c: d.name || '', w: d.wname || NT, co: d.nat || '', ag: t.ag, st: t.st == null ? 2 : t.st, sd: t.sd || '—', days: Math.max(0, Math.round((Date.now() - new Date(t.at || r.created_at).getTime()) / 864e5)), n: 1, e: t.by || '', live: 1, ph: d.account || d.phone || '' };
    if (t.done) { v.done = 1; v.dt = t.dt || ''; }
    v.k = { no: t.no || '', cd: '', ld: '', ins: '', city: 'NAJRAN', rel: 'مسلمة', ty: NT, pp: '', ph: d.phone || '' };
    V().VISA.unshift(v);
  }
  function load(force) {
    var c = db(); if (!c || loading || (loaded && !force) || !V().VISA) return;
    loading = 1;
    c.from('cust_requests').select('id,data,track,status,created_at').eq('kind', 'named').order('created_at', { ascending: true }).limit(300).then(function (r) {
      loading = 0; if (r.error) return; loaded = 1;
      (r.data || []).forEach(function (x) { NM[x.id] = x; toVisa(x); });
      paint(); if (/VisaTrack|RecReport|Arrivals/.test(location.hash)) reopen();
    }, function () { loading = 0; });
  }
  function persist(v) {
    var x = v && v.rid && NM[v.rid], c = db(); if (!x || !c) return;
    var t = Object.assign({}, x.track, { st: v.st, sd: v.sd, done: v.done ? 1 : 0, dt: v.dt || '', no: (v.k && v.k.no) || '' });
    x.track = t; c.from('cust_requests').update({ track: t, updated_at: new Date().toISOString() }).eq('id', v.rid).then(function () { });
  }

  /* 3) the staff action on each named request in «طلبات العملاء الخاصة» */
  function paint() {
    document.querySelectorAll('article.z6r[data-id]').forEach(function (a) {
      if (!a.querySelector('.z6tag.named')) return;
      var x = NM[a.dataset.id], act = a.querySelector('.act'); if (!act) return;
      var key = x && x.track ? 'mv:' + x.track.ag : 'go', old = act.querySelector('.z7slot');
      if (old && old.dataset.k === key) return; if (old) old.remove();
      var s = document.createElement('span'); s.className = 'z7slot'; s.dataset.k = key;
      if (x && x.track) s.innerHTML = '<span class="z7mv">✓ في متابعة التفييز · الوكيل ' + esc(x.track.ag) + '</span>';
      else s.innerHTML = '<button type="button" class="xbt sm" data-z7mv="' + esc(a.dataset.id) + '">✈ سُدّد مساند · إضافة المكتب وإكمال الإجراءات</button>';
      act.appendChild(s);
    });
  }
  function agentNames() { var o = []; (V().VISA || []).forEach(function (v) { if (v.ag && v.ag !== NT && o.indexOf(v.ag) < 0) o.push(v.ag); }); return o; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-z7mv],[data-z7ok]'); if (!b) return; e.preventDefault();
    var u = U();
    if (b.dataset.z7mv) {
      var x = NM[b.dataset.z7mv]; if (!x) { load(1); toast('جارٍ تحميل الطلب… حاول بعد لحظة'); return; }
      var d = x.data || {};
      u.drawer('إكمال إجراءات طلب معاينة باسم #' + refNo(x.id), '<div class="z7f">' +
        '<p class="mut">بعد رفع العميل للطلب وسداد مساند، اكتب اسم المكتب الخارجي (الوكيل) الذي قُبلت منه العاملة، ثم تكمل الإجراءات في «متابعة التفييز» مثل أي عاملة، ويظهر بجانب اسمها «معاينة باسم».</p>' +
        '<p><b>العميل:</b> ' + esc(d.name) + ' · <b>العاملة:</b> ' + esc(d.wname) + ' · <b>الجنسية:</b> ' + esc(d.nat) + '</p>' +
        '<label><span>اسم المكتب الخارجي الذي قُبلت منه *</span><input id="z7ag" list="z7agl" maxlength="80" autocomplete="off"><datalist id="z7agl">' + agentNames().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label>' +
        '<label><span>رقم عقد مساند (اختياري)</span><input id="z7no" inputmode="numeric" maxlength="20" dir="ltr"></label>' +
        '<p class="z7e" role="alert"></p><button type="button" class="xbt" data-z7ok="' + esc(x.id) + '">حفظ ونقل إلى متابعة التفييز</button></div>');
      setTimeout(function () { var i = document.getElementById('z7ag'); if (i) i.focus(); }, 50);
      return;
    }
    var id = b.dataset.z7ok, x2 = NM[id], c = db(), err = document.querySelector('.z7f .z7e');
    var ag = ((document.getElementById('z7ag') || {}).value || '').trim(), no = ((document.getElementById('z7no') || {}).value || '').replace(/\D/g, '');
    if (ag.length < 2) { err.textContent = 'اكتب اسم المكتب الخارجي'; return; }
    if (!x2 || !c) { err.textContent = 'سجّل الدخول باسمك أولًا'; return; }
    var by = (u.me && u.me()) || '';
    var t2 = { ag: ag, no: no, at: new Date().toISOString(), by: by, st: 2 }, d2 = x2.data || {};
    b.disabled = true;
    c.from('cust_requests').update({ track: t2, status: 'done', staff_note: ('سُدّد مساند · الوكيل: ' + ag + (no ? ' · عقد ' + no : '')).slice(0, 300), updated_at: new Date().toISOString() }).eq('id', id).select('id').then(function (r) {
      if (r.error || !r.data || !r.data.length) { b.disabled = false; err.textContent = 'تعذّر الحفظ (صلاحيات الموظفين فقط)'; return; }
      x2.track = t2; x2.status = 'done'; toVisa(x2);
      if (u.log) u.log('اعتماد', 'معاينة باسم', 'طلب #' + refNo(id) + ' · ' + (d2.name || '') + ' · الوكيل ' + ag, 'بانتظار السداد', 'متابعة التفييز');
      var dr = document.getElementById('xdr'); if (dr) dr.classList.remove('show');
      toast('✅ نُقل الطلب إلى متابعة التفييز · س-' + refNo(id));
      var rl = document.querySelector('[data-z6reload]'); if (rl) rl.click(); else paint();
    }, function () { b.disabled = false; err.textContent = 'تعذّر الحفظ، تحقق من الإنترنت'; });
  });

  /* 4) beside the worker's name: «معاينة باسم» instead of «جديدة» / «سبق لها العمل» */
  function tyOf(v) { var t = (v.k && v.k.ty) || 'جديدة'; return v.named ? NT : t; }
  function tag(v) { var t = tyOf(v); return ' <b class="z7ty' + (t === NT ? ' nm' : '') + '">' + esc(t) + '</b>'; }
  function labelNames(h) {
    (V().VISA || []).forEach(function (v) {
      if (!v.live || !v.w) return;
      var a = 'العاملة ' + esc(v.w) + ' · ' + esc(v.co);
      h = h.split(a).join('العاملة ' + esc(v.w) + tag(v) + ' · ' + esc(v.co));
    });
    return h;
  }
  function tyOptions() {
    var s = document.getElementById('kty'); if (!s || s.__z7) return; s.__z7 = 1;
    if (![].some.call(s.options, function (o) { return o.value === 'سبق لها العمل'; })) { var o = document.createElement('option'); o.value = o.textContent = 'سبق لها العمل'; s.insertBefore(o, s.options[1] || null); }
  }

  function init() {
    var u = window.XP_U; if (!u || !u.P || !u.P.VisaTrack || !u.ACT || !window.XP_V || !window.XP_HOST) return setTimeout(init, 80);
    var P = u.P, A = u.ACT;
    var vt = P.VisaTrack.r; P.VisaTrack.r = function () { return labelNames(vt.apply(this, arguments)); };
    if (P.RecMy) { var rm = P.RecMy.r; P.RecMy.r = function () { return labelNames(rm.apply(this, arguments)); }; }
    ['fnext', 'fdeliver', 'rcsave'].forEach(function (k) {
      var f = A[k]; if (!f) return;
      A[k] = function (t) { var i = t && t.dataset ? +t.dataset.i : NaN, v = (V().VISA || [])[i]; var r = f.apply(this, arguments); if (v && v.rid) persist(v); return r; };
    });
    setInterval(function () { if (token()) load(0); }, 3000);
    window.addEventListener('hashchange', function () { if (/CustReqs/.test(location.hash) && token()) load(1); });
  }
  init();
  new MutationObserver(function () { dropCards(); paint(); tyOptions(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
