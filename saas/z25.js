/* z25 — نسخة المكاتب: ربط الجهاز بالمكتب (إيميل المكتب + كلمة المرور) قبل شاشة «اسم الموظف + رمزه»،
   ومنع دخول موظف مكتب آخر من رابط هذا المكتب، وشريط التجربة للموظفين. */
(function () {
  var SA = window.XP_SAAS; if (!SA || window.XP_Z25) return; window.XP_Z25 = 1;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dev() { try { return localStorage.getItem(SA.devKey) || ''; } catch (e) { return ''; } }
  function rpc(fn, args, tok) {
    return fetch(SA.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SA.key, Authorization: 'Bearer ' + (tok || SA.key), 'Content-Type': 'application/json', 'x-tenant': SA.slug }, body: JSON.stringify(args || {}) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.message) || 'تعذّر الاتصال'); return j; }); });
  }
  function linkCard(note) {
    return '<div id="z25link" dir="rtl"><b class="z25o">' + esc(SA.name) + '</b><p>ربط هذا الجهاز بالمكتب لأول مرة: اكتب إيميل المكتب وكلمة مروره. بعدها كل موظف يدخل باسمه ورمزه.</p>' + (note ? '<p class="z25n">' + esc(note) + '</p>' : '') +
      '<form id="z25f"><input id="z25e" type="email" placeholder="إيميل المكتب" autocomplete="username" dir="ltr" required><input id="z25p" type="password" placeholder="كلمة مرور المكتب" autocomplete="current-password" dir="ltr" required><button type="submit">ربط الجهاز</button><em id="z25x" role="alert"></em></form></div>';
  }
  var checked = 0;
  function mount() {
    var box = document.getElementById('pin'); if (!box) return;
    var form = box.querySelector('form'), sel = document.getElementById('z4who');
    if (!box.querySelector('.z25h')) box.insertAdjacentHTML('afterbegin', '<div class="z25h">' + esc(SA.name) + '</div>');
    var need = !dev() || (checked && sel && !sel.options.length);
    var card = document.getElementById('z25link');
    if (need) { if (form) form.style.display = 'none'; if (!card) box.insertAdjacentHTML('beforeend', linkCard(dev() ? 'ربط الجهاز انتهى أو أُلغي · اربطه من جديد' : '')); }
    else { if (form) form.style.display = ''; if (card) card.remove(); }
    if (!checked && sel) setTimeout(function () { checked = 1; }, 3500);
    /* قائمة الموظفين وصلت لكن الشاشة ما زالت على الأسماء الافتراضية: إعادة تحميل مرة واحدة */
    var L = SA.logins;
    if (sel && L && L.length && dev()) {
      var want = L.map(function (x) { return x.name; }).join('|'), have = [].map.call(sel.options, function (o) { return o.textContent; }).join('|');
      if (want !== have) { var k = 'z25r-' + SA.slug; try { if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); location.reload(); } } catch (e) { } }
      else try { sessionStorage.removeItem('z25r-' + SA.slug); } catch (e) { }
    }
  }
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'z25f') return; e.preventDefault(); e.stopImmediatePropagation();
    var x = document.getElementById('z25x'), b = e.target.querySelector('button'); b.disabled = true; x.textContent = 'جارٍ الربط…';
    rpc('tenant_device_link', { p_slug: SA.slug, p_email: document.getElementById('z25e').value, p_password: document.getElementById('z25p').value }).then(function (r) {
      try { localStorage.setItem(SA.devKey, r.device); } catch (er) { }
      x.textContent = '✓ تم ربط الجهاز'; setTimeout(function () { location.reload(); }, 600);
    }).catch(function (er) { b.disabled = false; x.textContent = er.message; });
  }, true);

  /* موظف مسجّل دخوله في مكتب آخر على نفس الجهاز: يخرج من هذا الرابط */
  function session() { try { var s = JSON.parse(localStorage.getItem('asayel-chat') || 'null'); return s && s.access_token; } catch (e) { return null; } }
  var mm = 0;
  function mismatch() {
    var t = session(); if (!t || mm) return; mm = 1;
    rpc('tenant_public', {}, t).then(function (r) {
      if (r && r.id && r.id !== SA.tid) { try { localStorage.removeItem('asayel-chat'); } catch (e) { } alert('أنت مسجّل دخول في مكتب آخر («' + (r.name || '') + '»). سجّل دخولك في هذا المكتب.'); location.reload(); }
    }, function () { });
  }

  /* شريط التجربة للموظفين */
  function badge() {
    var nav = document.querySelector('#app nav.xn'); if (!nav || nav.querySelector('.z25b')) return;
    var o = SA.office || {}, days = o.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(o.trial_ends_at) - Date.now()) / 864e5)) : null;
    var b = document.createElement('div'); b.className = 'z25b'; b.innerHTML = '<b>' + esc(SA.name) + '</b>' + (days != null ? '<span>🧪 تجربة · باقي ' + days + ' يوم</span>' : '');
    nav.insertBefore(b, nav.firstChild ? nav.firstChild.nextSibling : null);
  }
  var pend = 0;
  new MutationObserver(function () { if (!pend) { pend = 1; requestAnimationFrame(function () { pend = 0; mount(); badge(); }); } }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(mismatch, 4000); mismatch();
  var st = document.createElement('style');
  st.textContent = '.z25h{font:800 26px Tajawal,sans-serif;color:#0B1F3A;text-align:center;margin-bottom:10px}' +
    '#z25link{display:flex;flex-direction:column;gap:8px;text-align:center;font-family:Tajawal,sans-serif}#z25link p{margin:0;color:#4A5650;font-size:14px}#z25link .z25n{color:#A1281B}' +
    '#z25f{display:flex;flex-direction:column;gap:8px;margin-top:6px}#z25f input{height:48px;border:2px solid #D9D2C3;border-radius:14px;font:600 16px Tajawal,sans-serif;padding:0 12px;text-align:center}' +
    '#z25f button{height:50px;border:0;border-radius:14px;background:#1E5BB8;color:#fff;font:700 17px Tajawal,sans-serif;cursor:pointer}#z25f em{color:#A1281B;font-style:normal;min-height:18px}' +
    '.z25b{margin:6px 12px 10px;padding:8px 10px;border-radius:10px;background:#E7EEFA;color:#1E5BB8;text-align:center;font-family:Tajawal,sans-serif;display:flex;flex-direction:column;gap:2px}.z25b b{font-size:17px}.z25b span{font-size:12.5px;color:#8A5A00}';
  document.head.appendChild(st);
})();
