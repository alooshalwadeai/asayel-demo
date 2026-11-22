/* نسخة المكاتب (SaaS) — يعمل قبل أي ملف آخر:
   - يحدد المكتب من الرابط /o/<رابط-المكتب>/
   - يوجّه البرنامج كله لقاعدة بيانات المكاتب (المشروع المنفصل) بدل قاعدة أصايل
   - يرسل رقم المكتب (x-tenant) مع كل طلب، ويضع ملفات كل مكتب في مجلده tenants/<رقم المكتب>/
   البرنامج نفسه (الصفحات وطريقة العمل) هو نفس برنامج أصايل بدون أي تعديل. */
(function () {
  var LIVE = 'https://rmhkmutxptwdvcorcfyy.supabase.co', LK = 'sb_publishable_wJghGm84T-aRdvKZZXmF3Q_zEfYRsM9';
  var STG = 'https://injumfjfjchpshtuepqe.supabase.co', SK = 'sb_publishable_yks4e0oOz1KQnD9pkVltAw_Ekge7ZQ2';
  var m = location.pathname.match(/^\/o\/([a-z0-9-]+)/);
  if (!m) { location.replace('/signup.html'); throw new Error('no office'); }
  var slug = m[1];
  if (!/\/$/.test(location.pathname) && location.pathname === '/o/' + slug) { location.replace('/o/' + slug + '/' + location.search + location.hash); throw new Error('redirect'); }
  var T = null;
  try {
    var x = new XMLHttpRequest(); x.open('POST', STG + '/rest/v1/rpc/tenant_public', false);
    x.setRequestHeader('apikey', SK); x.setRequestHeader('Authorization', 'Bearer ' + SK); x.setRequestHeader('Content-Type', 'application/json'); x.setRequestHeader('x-tenant', slug);
    x.send('{}'); T = JSON.parse(x.responseText || 'null');
  } catch (e) { T = null; }
  if (!T || !T.id) {
    document.documentElement.innerHTML = '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B1F3A;font-family:Tajawal,sans-serif;color:#E6EEF8;text-align:center;direction:rtl"><div><h1 style="font-size:28px">المكتب غير موجود أو انتهت فترته التجريبية</h1><p style="color:#9FB3CC">تأكد من الرابط، أو تواصل مع المطوّر.</p><a href="/signup.html" style="color:#7DB3FF">سجّل مكتبك</a></div></body>';
    throw new Error('office not found');
  }
  var TID = T.id, NAME = T.name || '';
  window.XP_SAAS = { slug: slug, tid: TID, name: NAME, office: T, url: STG, key: SK, devKey: 'saas-dev-' + slug };
  function dev() { try { return localStorage.getItem('saas-dev-' + slug) || ''; } catch (e) { return ''; } }
  document.title = NAME;

  /* ملفات كل مكتب في مجلده */
  var BK = /^(\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/|upload\/sign\/|info\/)?)(cvs|chat|sreq|agentdocs|brand)\/(.*)$/;
  function fixUrl(u) {
    if (u.indexOf(LIVE) === 0) u = STG + u.slice(LIVE.length);
    if (u.indexOf(STG) !== 0) return u;
    var rest = u.slice(STG.length), q = '', i = rest.indexOf('?'); if (i >= 0) { q = rest.slice(i); rest = rest.slice(0, i); }
    var mm = BK.exec(rest);
    if (mm && mm[3].indexOf('tenants/') !== 0) rest = mm[1] + mm[2] + '/tenants/' + TID + '/' + mm[3];
    return STG + rest + q;
  }
  window.XP_SAAS.fixUrl = fixUrl;

  /* نصوص البرنامج: نفس الملفات، موجّهة لقاعدة المكاتب، وباسم المكتب */
  function rw(t) {
    return t.split(LIVE).join(STG).split(LK).join(SK)
      .split('/storage/v1/object/public/cvs/').join('/storage/v1/object/public/cvs/tenants/' + TID + '/')
      .split('شركة أصايل المنصورة للاستقدام').join(NAME).split('شركة أصايل المنصورة').join(NAME).split('أصايل المنصورة').join(NAME);
  }
  window.XP_SAAS.rw = rw;
  try {
    var X = XMLHttpRequest.prototype, O = X.open, D = Object.getOwnPropertyDescriptor(X, 'responseText');
    X.open = function (mt, u) { this.__su = String(u || ''); if (this.__su.indexOf(LIVE) === 0 && !/\/storage\/v1\/object\/public\/site\//.test(this.__su)) arguments[1] = fixUrl(this.__su); return O.apply(this, arguments); };
    Object.defineProperty(X, 'responseText', { configurable: true, get: function () { var t = D.get.call(this); if (this.readyState === 4 && /\.js(\?|$)/.test(this.__su || '')) t = rw(t); return t; } });
  } catch (e) { }

  /* كل طلب لقاعدة البيانات: قاعدة المكاتب + رقم المكتب */
  var F = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (url.indexOf(LIVE) !== 0 && url.indexOf(STG) !== 0) return F.apply(this, arguments);
    url = fixUrl(url); init = Object.assign({}, init || {});
    var h = new Headers(init.headers || (typeof input !== 'string' && input.headers) || undefined);
    if (h.get('apikey') === LK) h.set('apikey', SK);
    if (h.get('Authorization') === 'Bearer ' + LK) h.set('Authorization', 'Bearer ' + SK);
    h.set('x-tenant', slug); init.headers = h;
    if (/\/rest\/v1\/rpc\/staff_logins$/.test(url)) init.body = JSON.stringify({ p_device: dev() });
    var sm = /\/storage\/v1\/object\/(list\/)?(cvs|chat|sreq|agentdocs|brand)$/.exec(url.split('?')[0]);
    if (sm && typeof init.body === 'string') {
      try {
        var b = JSON.parse(init.body), pre = 'tenants/' + TID + '/';
        if (sm[1] && typeof b.prefix === 'string' && b.prefix.indexOf('tenants/') !== 0) b.prefix = pre + b.prefix;
        if (Array.isArray(b.prefixes)) b.prefixes = b.prefixes.map(function (p) { return p.indexOf('tenants/') === 0 ? p : pre + p; });
        init.body = JSON.stringify(b);
      } catch (e) { }
    }
    if (typeof input !== 'string') input = new Request(url, input); else input = url;
    var pr = F.call(this, input, init);
    if (/\/rest\/v1\/rpc\/staff_logins$/.test(url)) pr.then(function (res) { res.clone().json().then(function (d) { if (Array.isArray(d)) window.XP_SAAS.logins = d; }, function () { }); }, function () { });
    return pr;
  };
})();
