/* z6 — customer services: تفويض سائق/عامل · استقدام معيّن بالاسم · سياسة التعاقد والأسئلة الشائعة · «اطلب الآن» تحت كل سيرة
   requests and settings live on the server (Supabase), so they reach the office from any device */
(function () {
  if (window.XP_Z6) return; window.XP_Z6 = 1;
  var SB_URL = 'https://rmhkmutxptwdvcorcfyy.supabase.co', SB_KEY = 'sb_publishable_wJghGm84T-aRdvKZZXmF3Q_zEfYRsM9';
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var NATS = ['إثيوبيا', 'كينيا', 'أوغندا', 'بوروندي', 'الفلبين', 'بنغلاديش', 'سريلانكا', 'الهند', 'باكستان', 'نيبال', 'إندونيسيا', 'مصر', 'السودان', 'اليمن', 'المغرب', 'تونس'];
  var JOBS = ['عاملة منزلية', 'عامل منزلي', 'سائق خاص', 'طباخ', 'طباخة', 'ممرضة منزلية', 'مزارع', 'حارس'];
  var STN = { new: 'جديد', contacted: 'تم التواصل', done: 'مكتمل', cancelled: 'ملغي' };
  var KN = { tafweed: 'تفويض سائق/عامل', named: 'معيّن بالاسم', corporate: 'عقد منشأة' };
  var ACTV = ['مزرعة', 'استراحة', 'محل تجاري', 'مطعم أو مقهى', 'شركة أو مؤسسة', 'مستشفى أو مركز صحي', 'أخرى'];
  var CJOBS = ['عامل', 'سائق', 'عاملة نظافة', 'طباخ', 'مزارع', 'حارس', 'راعي', 'أخرى'];
  var INS = '<div class="z6ins"><b>🛡 التأمين التعاقدي طوال مدة العقد (24 شهرًا)</b><span>عبر شركات التأمين المعتمدة في مساند · تختار الشركة بنفسك عند الموافقة على العقد</span><ul><li>رفض العاملة العمل</li><li>الهروب</li><li>المرض المزمن أو النفسي</li><li>عدم الكفاءة المهنية</li></ul></div>';
  var DEF = { tafweed: { price: 2500, note: 'شامل التأمين والضريبة', jobs: ['سائق خاص', 'عامل منزلي', 'عاملة منزلية', 'طباخ', 'مزارع', 'حارس'] }, policy: { sections: [] }, faq: { items: [] } };
  var SET = {}; try { SET = JSON.parse(localStorage.getItem('asayel-sset') || '{}') || {}; } catch (e) { }
  function cfg(k) { return SET[k] || DEF[k]; }

  /* r.js keeps the logged-in customer private: expose it read-only for prefilling forms */
  var RP = window.XP_RPATCH = window.XP_RPATCH || {};
  (RP['r.js'] = RP['r.js'] || []).push(['function need(fn) {', 'U.rcust = function () { return CUST; };\nfunction need(fn) {']);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function $(q, r) { return (r || document).querySelector(q); }
  function U() { return window.XP_U || {}; }
  function wa() { var u = U(), n = u.officeWa ? u.officeWa() : ''; return n || '966555037427'; }
  function waLink(text) { return 'https://wa.me/' + wa() + '?text=' + encodeURIComponent(text); }
  function toast(m) { var h = window.XP_HOST; if (h && h.toast) h.toast(m); }
  function cust() { var u = U(); return (u.rcust && u.rcust()) || null; }
  function digits(v) { return String(v || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/\D/g, ''); }
  function uuid() { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function refNo(id) { return String(id).slice(0, 6).toUpperCase(); }
  function dt(d) { d = new Date(d); return d.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' }); }

  /* ---------- server ---------- */
  function lib() {
    return new Promise(function (ok, no) {
      if (window.supabase && window.supabase.createClient) return ok();
      var s = document.querySelector('script[src="' + LIB + '"]');
      if (!s) { s = document.createElement('script'); s.src = LIB; s.crossOrigin = 'anonymous'; document.head.appendChild(s); }
      var n = 0; (function w() { if (window.supabase && window.supabase.createClient) return ok(); if (++n > 200) return no(new Error('lib')); setTimeout(w, 75); })();
    });
  }
  var ANON = null;
  function anon() { return lib().then(function () { if (!ANON) ANON = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'asayel-z6' } }); return ANON; }); }
  function token() { try { var s = JSON.parse(localStorage.getItem('asayel-chat') || 'null'); return s && s.access_token; } catch (e) { return null; } }
  function staffDb() {
    var t = token(); if (!t) return Promise.reject(new Error('login'));
    return lib().then(function () { return window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'asayel-z6s' }, global: { headers: { Authorization: 'Bearer ' + t } } }); });
  }
  var setLoaded = null;
  function loadSettings() {
    if (setLoaded) return setLoaded;
    setLoaded = anon().then(function (db) { return db.from('site_settings').select('key,value'); }).then(function (r) {
      (r.data || []).forEach(function (x) { SET[x.key] = x.value; });
      try { localStorage.setItem('asayel-sset', JSON.stringify(SET)); } catch (e) { }
      paintLive();
    }).catch(function () { setLoaded = null; });
    return setLoaded;
  }
  function paintLive() {
    var t = cfg('tafweed');
    document.querySelectorAll('.z6price').forEach(function (e) { e.textContent = fmt(t.price); });
    document.querySelectorAll('.z6pnote').forEach(function (e) { e.textContent = t.note || ''; });
    var pb = $('#z6polbody'); if (pb) pb.innerHTML = policyHTML();
    var ed = $('#z6edwrap'); if (ed && !ed.__dirty) { ed.outerHTML = editorHTML(); }
    var jb = $('#z6tfjob'); if (jb && !jb.__set) { jb.innerHTML = (t.jobs || DEF.tafweed.jobs).map(function (j) { return '<option>' + esc(j) + '</option>'; }).join(''); }
  }

  /* ---------- styles ---------- */
  var css = '.z6w{max-width:760px;margin:0 auto;padding:16px 16px 60px;display:flex;flex-direction:column;gap:14px;direction:rtl}' +
    '.z6h1{font-size:26px;margin:6px 0 0;color:#fff;font-weight:800}.z6sub{margin:0;color:#9FB3CC;font-size:15px;line-height:1.8}' +
    '.z6pr{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:radial-gradient(600px 300px at 20% 10%,#1C4F8F 0%,#0B2A52 60%,#08203F 100%);border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:20px;padding:20px 22px}.z6pr strong{font-size:38px;line-height:1;color:#F2B544}.z6pr small{font-size:14px;color:#C9D7EA}.z6pr ul{margin:0;padding:0 18px 0 0;font-size:14px;line-height:1.9;color:#E6EEF8}' +
    '.z6f{display:grid;grid-template-columns:1fr 1fr;gap:10px}.z6f label{display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:#C9D7EA}.z6f .full{grid-column:1/-1}.z6f input,.z6f select,.z6f textarea{min-height:46px;border:1.5px solid rgba(255,255,255,.14);border-radius:12px;padding:8px 12px;font:16px inherit;font-family:inherit;box-sizing:border-box;width:100%;background:#0A2140;color:#fff}.z6f input::placeholder,.z6f textarea::placeholder{color:#6F86A3}.z6f input:focus,.z6f select:focus,.z6f textarea:focus{outline:none;border-color:#3D8BFF}.z6f select option{background:#0E2747;color:#fff}.z6f textarea{min-height:80px;resize:vertical}.z6f .req:after{content:" *";color:#FF8A80}' +
    '.z6f fieldset{border:1.5px solid rgba(255,255,255,.14);border-radius:10px;padding:6px 12px;display:flex;gap:14px;flex-wrap:wrap;margin:0}.z6f legend{font-size:13px;color:#C9D7EA;padding:0 4px}.z6f fieldset label{flex-direction:row;align-items:center;gap:6px;color:#fff;font-size:14.5px}.z6f fieldset input{min-height:auto;width:auto}' +
    '.z6drop{border:2px dashed rgba(255,255,255,.25);border-radius:12px;padding:16px;text-align:center;cursor:pointer;background:rgba(255,255,255,.04);color:#C9D7EA;font-size:14px}.z6drop img{max-width:100%;max-height:200px;border-radius:8px;display:block;margin:8px auto 0}.z6drop.ok{border-color:#1E9E6A;background:rgba(30,158,106,.12);color:#7BE0B5}' +
    '.z6err{color:#FF8A80;font-size:13.5px;min-height:18px;margin:0}.z6ok{background:rgba(30,158,106,.12);border:1.5px solid rgba(30,158,106,.45);color:#E6EEF8;border-radius:20px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}.z6ok b.n{font-size:28px;letter-spacing:2px;direction:ltr;color:#F2B544}.z6ok .mut{color:#9FB3CC}' +
    '.z6btns{display:flex;gap:8px;flex-wrap:wrap}.z6wa{background:#1FA855!important;color:#fff!important;border-color:#1FA855!important}' +
    '.z6svc{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.z6svc.z6s3{grid-template-columns:repeat(3,1fr)}@media (max-width:1000px){.z6svc{grid-template-columns:repeat(2,1fr)}}'+'.z6ins{margin-top:12px;background:rgba(242,181,68,.08);border:1px solid rgba(242,181,68,.35);border-radius:18px;padding:14px 18px;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;color:#E6EEF8}.z6ins b{color:#F2B544;font-size:15.5px}.z6ins span{color:#C9D7EA;font-size:13.5px}.z6ins ul{flex-basis:100%;margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}.z6ins li{background:rgba(255,255,255,.06);border-radius:999px;padding:4px 12px;font-size:13px}.z6ins li:before{content:"✓ ";color:#7BE0B5}'+'.z6ev{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#7BE0B5;background:rgba(30,158,106,.15);border-radius:999px;padding:2px 9px;margin-top:4px;align-self:flex-start}.z6evb{font-size:12.5px!important}.z6evb.on{background:#1E7A55!important;color:#fff!important;border-color:#1E7A55!important}.z6ev.adm{color:#1F6B4F;background:#E6F0EA}.z6sc{background:#0E2747;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#E6EEF8;transition:border-color .15s,transform .15s}.z6sc:hover{border-color:#3D8BFF;transform:translateY(-2px)}.z6sc i{font-style:normal;font-size:26px}.z6sc b{font-size:17px;color:#fff}.z6sc span{font-size:14px;color:#9FB3CC;line-height:1.7}.z6sc em{font-style:normal;color:#F2B544;font-weight:700;font-size:14.5px;margin-top:auto}.z6sc em span{color:inherit;font-size:inherit}' +
    '.z6pol{display:flex;flex-direction:column;gap:12px}.z6pol h3{margin:4px 0 6px;font-size:18px;color:#F2B544}.z6pol ol{margin:0;padding:0 20px 0 0;line-height:1.95;font-size:15px;color:#E6EEF8}.z6faq details{border:1px solid rgba(255,255,255,.1);border-radius:14px;background:#0E2747;padding:0 16px}.z6faq details+details{margin-top:8px}.z6faq summary{cursor:pointer;padding:14px 0;font-weight:700;font-size:15.5px;color:#fff;list-style-position:inside}.z6faq details p{margin:0 0 14px;color:#9FB3CC;line-height:1.8;font-size:14.5px}' +
    '.z6tabs{display:flex;gap:6px}.z6tabs a{padding:9px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.2);text-decoration:none;color:#C9D7EA;font-size:14.5px;background:transparent}.z6tabs a.on{background:#3D8BFF;color:#fff;border-color:#3D8BFF}' +
    '.z6cvwa{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;background:#1FA855;color:#fff;border-radius:10px;padding:8px 12px;font-size:14px;font-weight:700;text-decoration:none;color:#fff!important}' +
    '.z6rq{display:flex;flex-direction:column;gap:10px}.z6r{background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;padding:14px;display:grid;grid-template-columns:1fr auto;gap:8px 14px}.z6r.new{border-color:#E0A526;box-shadow:0 0 0 3px #FBEFD3}.z6r h4{margin:0;font-size:15.5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.z6r dl{margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px 12px;font-size:13.5px;grid-column:1/-1}.z6r dt{color:#6B7570;font-size:12px}.z6r dd{margin:0 0 4px}.z6r .act{display:flex;gap:6px;flex-wrap:wrap;align-items:center;grid-column:1/-1}.z6r select,.z6r input{min-height:36px;border:1.5px solid #E2D9C6;border-radius:8px;padding:0 8px;font:14px "IBM Plex Sans Arabic",sans-serif}.z6r input{flex:1;min-width:160px}' +
    '.z6tag{font-size:12px;padding:2px 8px;border-radius:999px;background:#E6F0EA;color:#1F6B4F;font-weight:600}.z6tag.named{background:#E7EEF8;color:#2563A8}.z6tag.corporate{background:#FBEFD3;color:#8A4E0E}.z6tag.st-new{background:#FBEFD3;color:#8A4E0E}.z6tag.st-done{background:#E6F0EA;color:#1F6B4F}.z6tag.st-cancelled{background:#F3E3E1;color:#A1281B}.z6tag.st-contacted{background:#EDE7F6;color:#5B3C99}' +
    '.z6ed textarea{width:100%;min-height:180px;border:1.5px solid #E2D9C6;border-radius:10px;padding:10px;font:14px/1.8 "IBM Plex Sans Arabic",sans-serif;box-sizing:border-box}.z6ed input{min-height:40px;border:1.5px solid #E2D9C6;border-radius:10px;padding:0 10px;font:15px "IBM Plex Sans Arabic",sans-serif}' +
    '@media (max-width:640px){.z6f{grid-template-columns:1fr}.z6svc,.z6svc.z6s3{grid-template-columns:1fr}.z6r{grid-template-columns:1fr}.z6pr strong{font-size:28px}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  /* ---------- shared bits ---------- */
  function head(active) {
    var u = U(), c = cust();
    return '<header class="rtop"><a class="rbr" href="#/Landing" style="text-decoration:none;color:inherit">' + (u.logo ? u.logo(28) : '') + '<div><b>شركة أصايل المنصورة</b><span>استقدام وتأجير العمالة المنزلية · نجران</span></div></a><nav class="rnav">' +
      '<a href="#/Landing">الرئيسية</a>' + (active !== 'tf' ? '<a href="#/Tafweed">التفويض</a>' : '') + (active !== 'nm' ? '<a href="#/RecNamed">معيّن بالاسم</a>' : '') + (active !== 'co' ? '<a href="#/Corporate">المنشآت</a>' : '') + (active !== 'pol' ? '<a href="#/Policy">السياسة والأسئلة</a>' : '') +
      '<a href="#/' + (c ? 'CustHome' : 'CustomerLogin') + '">' + (c ? 'حسابي' : 'دخول العملاء') + '</a></nav></header>';
  }
  function svcCards() {
    var t = cfg('tafweed');
    return '<div class="z6svc">' +
      '<a class="z6sc" href="#/Tafweed"><i>🚗</i><b>تفويض سائق أو عامل</b><span>سائق خاص أو عامل منزلي على تأشيرتك، ونتولى الإجراءات حتى الوصول.</span><em><span class="z6price">' + fmt(t.price) + '</span> ر.س · <span class="z6pnote">' + esc(t.note) + '</span></em></a>' +
      '<a class="z6sc" href="#/RecNamed"><i>🪪</i><b>استقدام معيّن بالاسم</b><span>عندك عامل أو عاملة تعرفه؟ أرسل بياناته وصورة جوازه ونكمل استقدامه.</span><em>أرسل الطلب ←</em></a>' +
      '<a class="z6sc" href="#/Corporate"><i>🏢</i><b>عقود الشركات والمنشآت</b><span>عمالة لمزرعتك أو استراحتك أو محلك أو مطعمك: استقدام أو إيجار شهري بعقد واحد.</span><em>اطلب عرض سعر ←</em></a>' +
      '<a class="z6sc" href="#/Policy"><i>📄</i><b>سياسة التعاقد والأسئلة الشائعة</b><span>خطوات مساند، مدة الاستقدام، الضمان، الإلغاء والاسترداد.</span><em>اقرأ ←</em></a></div>' + INS;
  }
  function gate(back, what) {
    return '<section class="rcd z6gate"><h2 style="margin:0">🔐 سجّل الدخول لإرسال ' + what + '</h2><p class="mut" style="margin:0">حساب واحد للاستقدام والإيجار وكل الخدمات · نعبّي بياناتك تلقائيًا ونتابع طلبك من «حسابي».</p><div class="z6btns"><a class="xbt" href="#/CustomerLogin" data-z6back="' + back + '">دخول العملاء</a><a class="xbt ghost" href="#/CustomerLogin" data-z6back="' + back + '">عميل جديد؟ أنشئ حسابك</a></div></section>';
  }
  function opts(list, sel) { return list.map(function (x) { return '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }

  /* ---------- page: تفويض ---------- */
  var DONE = { tf: null, nm: null, co: null };
  function pageTafweed() {
    loadSettings();
    var t = cfg('tafweed'), c = cust() || {};
    var body = !cust() ? gate('Tafweed', 'طلب التفويض') : DONE.tf ? doneHTML(DONE.tf, 'tf') :
      '<section class="rcd"><h2 style="margin:0">اطلب الخدمة</h2><p class="mut sm" style="margin:0">نتواصل معك خلال أوقات الدوام لإكمال الإجراءات في مساند.</p>' +
      '<form id="z6tf" class="z6f" novalidate>' +
      '<label><span class="req">اسم صاحب العمل</span><input name="name" autocomplete="name" maxlength="60" value="' + esc(c.name || '') + '"></label>' +
      '<label><span class="req">رقم الجوال</span><input name="phone" inputmode="numeric" maxlength="10" placeholder="05xxxxxxxx" dir="ltr" value="' + esc(c.ph || '') + '"></label>' +
      '<label><span class="req">المهنة</span><select name="job" id="z6tfjob">' + opts(t.jobs || DEF.tafweed.jobs) + '</select></label>' +
      '<label>الجنسية المفضلة<select name="nat"><option>لا يهم · رشّحوا لي</option>' + opts(NATS) + '</select></label>' +
      '<label>رقم التأشيرة (إن وجد)<input name="visa" inputmode="numeric" maxlength="10" placeholder="10 أرقام" dir="ltr" value="' + esc(c.visa || '') + '"></label>' +
      '<label>عدد العمال<input name="count" inputmode="numeric" maxlength="2" value="1" dir="ltr"></label>' +
      '<label class="full">ملاحظات<textarea name="notes" maxlength="500" placeholder="مثال: سائق برخصة سعودية، خبرة في الطرق الطويلة"></textarea></label>' +
      '<p class="z6err full" role="alert"></p><div class="z6btns full"><button type="submit" class="xbt">إرسال الطلب</button><a class="xbt ghost z6wa" target="_blank" rel="noopener" href="' + esc(waLink('السلام عليكم، أستفسر عن خدمة تفويض سائق/عامل')) + '">💬 استفسار واتساب</a></div></form></section>';
    return head('tf') + '<main class="z6w"><h1 class="z6h1">تفويض سائق أو عامل</h1><p class="z6sub">نستقدم لك سائقًا خاصًا أو عاملًا على تأشيرتك بسعر ثابت وواضح، ونتابع الطلب معك خطوة بخطوة حتى الوصول.</p>' +
      '<div class="z6pr"><div><strong><span class="z6price">' + fmt(t.price) + '</span> <small>ر.س</small></strong><div><small class="z6pnote">' + esc(t.note) + '</small></div></div><ul><li>التعاقد عبر منصة مساند</li><li>متابعة التفييز والسفر والوصول</li><li>الضمان حسب العقد</li></ul></div>' + body + INS + '</main>';
  }
  /* ---------- page: معيّن بالاسم ---------- */
  var PASS = null;
  function pageNamed() {
    var c = cust() || {};
    var body = !cust() ? gate('RecNamed', 'طلب الاستقدام المعيّن بالاسم') : DONE.nm ? doneHTML(DONE.nm, 'nm') :
      '<section class="rcd"><form id="z6nm" class="z6f" novalidate>' +
      '<label><span class="req">اسم صاحب العمل</span><input name="name" autocomplete="name" maxlength="60" value="' + esc(c.name || '') + '"></label>' +
      '<label><span class="req">جوال صاحب العمل</span><input name="phone" inputmode="numeric" maxlength="10" placeholder="05xxxxxxxx" dir="ltr" value="' + esc(c.ph || '') + '"></label>' +
      '<label><span class="req">اسم العامل / العاملة (كما في الجواز)</span><input name="wname" maxlength="60" dir="auto"></label>' +
      '<label>جوال العامل (إن وجد)<input name="wphone" inputmode="tel" maxlength="16" dir="ltr" placeholder="+251…"></label>' +
      '<label><span class="req">المهنة</span><select name="job">' + opts(JOBS) + '</select></label>' +
      '<label><span class="req">الجنسية</span><select name="nat">' + opts(NATS) + '</select></label>' +
      '<fieldset><legend>الخبرة</legend><label><input type="radio" name="exp" value="سبق له العمل في السعودية" checked> سبق له العمل</label><label><input type="radio" name="exp" value="لم يسبق له العمل"> لم يسبق له العمل</label></fieldset>' +
      '<fieldset><legend>الجنس</legend><label><input type="radio" name="gender" value="أنثى" checked> أنثى</label><label><input type="radio" name="gender" value="ذكر"> ذكر</label></fieldset>' +
      '<label class="full"><span class="req">صورة الجواز</span><div class="z6drop' + (PASS ? ' ok' : '') + '" id="z6drop" tabindex="0" role="button">' + (PASS ? '✓ ' + esc(PASS.name) + (PASS.url ? '<img alt="معاينة الجواز" src="' + PASS.url + '">' : '') : '📷 اضغط لاختيار صورة الجواز أو تصويره (صورة أو PDF · حتى 5 ميجابايت)') + '</div><input type="file" id="z6pass" accept="image/*,application/pdf" capture="environment" hidden></label>' +
      '<label class="full">ملاحظات<textarea name="notes" maxlength="500" placeholder="مثال: كانت تعمل عندنا سابقًا، رقم التأشيرة…"></textarea></label>' +
      '<p class="z6err full" role="alert"></p><div class="z6btns full"><button type="submit" class="xbt">إرسال الطلب</button></div></form></section>';
    return head('nm') + '<main class="z6w"><h1 class="z6h1">استقدام عامل أو عاملة معيّن بالاسم</h1><p class="z6sub">للعميل الذي يعرف العامل مسبقًا ويريد استقدامه باسمه. أرسل البيانات وصورة الجواز، ونتواصل معك لإكمال العقد في مساند.</p>' + body + '</main>';
  }
  function doneHTML(d, k) {
    return '<section class="z6ok"><span style="font-size:34px">✅</span><b>وصلنا طلبك</b><span>رقم الطلب</span><b class="n">#' + esc(d.ref) + '</b><span class="mut">نتواصل معك على ' + esc(d.phone) + ' خلال أوقات الدوام.</span>' +
      '<div class="z6btns"><a class="xbt z6wa" target="_blank" rel="noopener" href="' + esc(waLink('السلام عليكم، أرسلت طلب ' + ({ tf: 'تفويض', nm: 'استقدام معيّن بالاسم', co: 'عقد منشأة' })[k] + ' رقم #' + d.ref + ' باسم ' + d.name)) + '">💬 متابعة عبر واتساب</a><button type="button" class="xbt ghost" data-z6new="' + k + '">طلب جديد</button></div></section>';
  }
  /* ---------- page: عقود المنشآت ---------- */
  function pageCorporate() {
    var c = cust() || {};
    var body = !cust() ? gate('Corporate', 'طلب عقد المنشأة') : DONE.co ? doneHTML(DONE.co, 'co') :
      '<section class="rcd"><h2 style="margin:0">اطلب عرض سعر للمنشأة</h2><p class="mut sm" style="margin:0">نرسل لك عرضًا مفصلًا خلال يوم عمل.</p><form id="z6co" class="z6f" novalidate>' +
      '<label><span class="req">اسم المنشأة</span><input name="org" maxlength="80" placeholder="مثال: مزرعة الوادي"></label>' +
      '<label><span class="req">نوع النشاط</span><select name="activity">' + opts(ACTV) + '</select></label>' +
      '<label>رقم السجل التجاري (إن وجد)<input name="cr" inputmode="numeric" maxlength="10" dir="ltr" placeholder="10 أرقام"></label>' +
      '<label>المدينة / الحي<input name="city" maxlength="60" placeholder="نجران · الفهد"></label>' +
      '<label><span class="req">اسم المسؤول</span><input name="name" autocomplete="name" maxlength="60" value="' + esc(c.name || '') + '"></label>' +
      '<label><span class="req">جوال المسؤول</span><input name="phone" inputmode="numeric" maxlength="10" placeholder="05xxxxxxxx" dir="ltr" value="' + esc(c.ph || '') + '"></label>' +
      '<label><span class="req">المهنة المطلوبة</span><select name="job">' + opts(CJOBS) + '</select></label>' +
      '<label><span class="req">العدد</span><input name="count" inputmode="numeric" maxlength="3" value="1" dir="ltr"></label>' +
      '<fieldset class="full"><legend>نوع الخدمة</legend><label><input type="radio" name="service" value="استقدام" checked> استقدام</label><label><input type="radio" name="service" value="إيجار شهري"> إيجار شهري</label><label><input type="radio" name="service" value="غير محدد"> لم أحدد بعد</label></fieldset>' +
      '<label class="full">ملاحظات<textarea name="notes" maxlength="500" placeholder="مثال: نحتاج 3 عمال لمزرعة نخيل بسكن متوفر، بداية الشهر القادم"></textarea></label>' +
      '<p class="z6err full" role="alert"></p><div class="z6btns full"><button type="submit" class="xbt">إرسال الطلب</button><a class="xbt ghost z6wa" target="_blank" rel="noopener" href="' + esc(waLink('السلام عليكم، أستفسر عن عقود المنشآت')) + '">💬 استفسار واتساب</a></div></form></section>';
    return head('co') + '<main class="z6w"><h1 class="z6h1">عقود الشركات والمنشآت</h1><p class="z6sub">مزارع، استراحات، محلات، مطاعم وشركات: نوفر العمالة بالاستقدام أو بالإيجار الشهري، بعقد واحد ومتابعة من موظف مخصص لمنشأتك.</p>' +
      '<div class="z6svc z6s3"><div class="z6sc"><i>🌴</i><b>مزارع واستراحات</b><span>عمال ومزارعون وحراس ورعاة.</span></div><div class="z6sc"><i>🏪</i><b>محلات ومطاعم</b><span>عمال وعاملات نظافة وطباخون.</span></div><div class="z6sc"><i>🏢</i><b>شركات ومؤسسات</b><span>سائقون وعمالة عامة بعقود مرنة.</span></div></div>' + body + INS + '</main>';
  }
  /* ---------- page: سياسة التعاقد والأسئلة الشائعة ---------- */
  var POLTAB = 'pol';
  function policyHTML() {
    if (POLTAB === 'faq') {
      var F = cfg('faq').items || [];
      return '<div class="z6faq">' + (F.length ? F.map(function (x, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; }).join('') : '<p class="mut">جارٍ التحميل…</p>') + '</div>';
    }
    var S = cfg('policy').sections || [];
    return '<div class="z6pol">' + (S.length ? S.map(function (s) { return '<section class="rcd"><h3>' + esc(s.t) + '</h3><ol>' + (s.items || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></section>'; }).join('') : '<p class="mut">جارٍ التحميل…</p>') + '</div>';
  }
  function pagePolicy() {
    loadSettings();
    return head('pol') + '<main class="z6w"><h1 class="z6h1">سياسة التعاقد والأسئلة الشائعة</h1><p class="z6sub">كل ما تحتاج تعرفه قبل الاستقدام أو الإيجار. السياسة التفصيلية الملزمة هي عقد منصة مساند.</p>' +
      '<div class="z6tabs" role="tablist"><a href="#/Policy" role="tab" data-z6tab="pol" class="' + (POLTAB === 'pol' ? 'on' : '') + '">سياسة التعاقد</a><a href="#/Policy" role="tab" data-z6tab="faq" class="' + (POLTAB === 'faq' ? 'on' : '') + '">الأسئلة الشائعة</a></div>' +
      '<div id="z6polbody">' + policyHTML() + '</div>' +
      '<div class="rcd" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap"><b>عندك سؤال ما لقيت جوابه؟</b><a class="xbt z6wa" target="_blank" rel="noopener" href="' + esc(waLink('السلام عليكم، عندي استفسار')) + '">💬 راسلنا واتساب</a></div></main>';
  }

  /* ---------- admin page: طلبات العملاء الخاصة ---------- */
  var RQ = null, RQF = 'all', RQERR = '';
  function isStaff() { var ok = false; try { ok = sessionStorage.getItem('asayel-ok') === '1'; } catch (e) { } return ok && !!token(); }
  function isMgr() { var u = U(); return u.me && u.me() === 'المدير'; }
  function pageReqs() {
    var u = U();
    if (!isStaff()) return (u.head ? u.head('طلبات العملاء الخاصة', '') : '<h1>طلبات العملاء الخاصة</h1>') + '<div class="rnote">🔒 هذه الصفحة للموظفين · <a href="#/StaffLogin">سجّل الدخول</a></div>';
    if (!RQ) loadReqs(); loadSettings();
    var h = u.head ? u.head('طلبات العملاء الخاصة', 'التفويض · المعيّن بالاسم · عقود المنشآت · تصل من موقع العملاء مباشرة') : '<h1>طلبات العملاء الخاصة</h1>';
    return h + '<div id="z6rq">' + reqsHTML() + '</div>' + (isMgr() ? editorHTML() : '<div class="rnote">✏ تعديل سعر التفويض وسياسة التعاقد والأسئلة الشائعة: للمدير فقط</div>');
  }
  function reqsHTML() {
    if (RQERR) return '<div class="rnote">⚠ ' + esc(RQERR) + '</div>';
    if (!RQ) return '<p class="mut">جارٍ تحميل الطلبات…</p>';
    var n = function (f) { return RQ.filter(f).length; };
    var L = RQ.filter(function (r) { return RQF === 'all' || r.status === RQF || r.kind === RQF; });
    var u = U();
    var k = u.kpis ? u.kpis([{ l: 'طلبات جديدة', v: n(function (r) { return r.status === 'new'; }), tone: 'a' }, { l: 'تم التواصل', v: n(function (r) { return r.status === 'contacted'; }) }, { l: 'مكتملة', v: n(function (r) { return r.status === 'done'; }), tone: 'g' }, { l: 'الإجمالي', v: RQ.length }]) : '';
    var chips = [['all', 'الكل'], ['new', 'جديد'], ['contacted', 'تم التواصل'], ['done', 'مكتمل'], ['cancelled', 'ملغي'], ['tafweed', 'التفويض'], ['named', 'معيّن بالاسم'], ['corporate', 'المنشآت']];
    return k + '<div class="xf" role="group" aria-label="تصفية">' + chips.map(function (c) { return '<button type="button" class="xfc' + (RQF === c[0] ? ' on' : '') + '" data-z6f="' + c[0] + '">' + c[1] + '</button>'; }).join('') + btnRefresh() + '</div>' +
      '<div class="z6rq">' + (L.length ? L.map(rowHTML).join('') : '<p class="mut">لا توجد طلبات</p>') + '</div>';
  }
  function btnRefresh() { return '<button type="button" class="xfc" data-z6reload="1">↻ تحديث</button>'; }
  function rowHTML(r) {
    var d = r.data || {}, F = [];
    var add = function (l, v) { if (v) F.push('<div><dt>' + l + '</dt><dd>' + esc(v) + '</dd></div>'); };
    add('صاحب العمل', d.name); add('الجوال', d.phone); add('المهنة', d.job); add('الجنسية', d.nat);
    if (r.kind === 'named') { add('اسم العامل', d.wname); add('جوال العامل', d.wphone); add('الخبرة', d.exp); add('الجنس', d.gender); }
    else if (r.kind === 'corporate') { add('المنشأة', d.org); add('النشاط', d.activity); add('السجل التجاري', d.cr); add('المدينة', d.city); add('العدد', d.count); add('نوع الخدمة', d.service); }
    else { add('رقم التأشيرة', d.visa); add('العدد', d.count); add('السعر وقت الطلب', d.price ? fmt(d.price) + ' ر.س' : ''); }
    add('ملاحظات العميل', d.notes);
    var ph = digits(d.phone).replace(/^0/, '966');
    return '<article class="z6r' + (r.status === 'new' ? ' new' : '') + '" data-id="' + r.id + '"><h4><span class="z6tag ' + r.kind + '">' + KN[r.kind] + '</span>#' + refNo(r.id) + ' <span class="z6tag st-' + r.status + '">' + STN[r.status] + '</span></h4><span class="mut sm">' + dt(r.created_at) + '</span><dl>' + F.join('') + '</dl>' +
      '<div class="act"><select data-z6st="' + r.id + '" aria-label="حالة الطلب">' + Object.keys(STN).map(function (s) { return '<option value="' + s + '"' + (s === r.status ? ' selected' : '') + '>' + STN[s] + '</option>'; }).join('') + '</select>' +
      '<input data-z6note="' + r.id + '" placeholder="ملاحظة الموظف" maxlength="300" value="' + esc(r.staff_note || '') + '">' +
      (r.passport_path ? '<button type="button" class="xbt sm ghost" data-z6pass="' + esc(r.passport_path) + '">🪪 صورة الجواز</button>' : '') +
      (ph ? '<a class="xbt sm z6wa" target="_blank" rel="noopener" href="https://wa.me/' + ph + '?text=' + encodeURIComponent('السلام عليكم ' + (d.name || '') + '، معك مكتب أصايل المنصورة بخصوص طلبك رقم #' + refNo(r.id)) + '">💬 واتساب العميل</a>' : '') + '</div></article>';
  }
  function paintReqs() { var b = $('#z6rq'); if (b) b.innerHTML = reqsHTML(); }
  function loadReqs() {
    staffDb().then(function (db) { return db.from('cust_requests').select('*').order('created_at', { ascending: false }).limit(300); }).then(function (r) {
      if (r.error) throw r.error; RQ = r.data || []; RQERR = ''; paintReqs(); navBadge();
    }).catch(function (e) { RQERR = e && e.message === 'login' ? 'سجّل الدخول باسمك لعرض الطلبات' : 'تعذّر تحميل الطلبات · ' + ((e && e.message) || ''); paintReqs(); });
  }
  function saveReq(id, patch) {
    patch.updated_at = new Date().toISOString();
    return staffDb().then(function (db) { return db.from('cust_requests').update(patch).eq('id', id).select('id,status,staff_note'); }).then(function (r) {
      if (r.error || !r.data || !r.data.length) throw (r.error || new Error('denied'));
      RQ.forEach(function (x) { if (x.id === id) Object.assign(x, r.data[0]); }); return r.data[0];
    });
  }
  function editorHTML() {
    var t = cfg('tafweed'), P = cfg('policy').sections || [], F = cfg('faq').items || [];
    var pol = P.map(function (s) { return '## ' + s.t + '\n' + (s.items || []).map(function (x) { return '- ' + x; }).join('\n'); }).join('\n\n');
    var faq = F.map(function (x) { return 'س: ' + x.q + '\nج: ' + x.a; }).join('\n\n');
    var card = function (tt, b) { var u = U(); return u.card ? u.card(tt, b) : '<section class="xcd"><h3>' + tt + '</h3>' + b + '</section>'; };
    return '<div class="z6ed" id="z6edwrap">' + card('💰 سعر خدمة التفويض', '<div class="xrow" style="gap:10px;flex-wrap:wrap"><label>السعر (ر.س) <input id="z6tp" inputmode="numeric" dir="ltr" value="' + esc(t.price) + '" style="width:120px"></label><label>الوصف <input id="z6tn" value="' + esc(t.note) + '" style="width:220px"></label></div><label class="mut sm">المهن المتاحة (افصل بفاصلة)<input id="z6tj" value="' + esc((t.jobs || []).join('، ')) + '" style="width:100%"></label><div class="xrow mt"><button type="button" class="xbt" data-z6save="tafweed">حفظ ونشر للعملاء</button></div>') +
      card('📄 سياسة التعاقد', '<p class="mut sm">كل قسم يبدأ بـ ## ثم العنوان، وكل بند في سطر يبدأ بـ -</p><textarea id="z6pol">' + esc(pol) + '</textarea><div class="xrow mt"><button type="button" class="xbt" data-z6save="policy">حفظ ونشر للعملاء</button><a class="xbt ghost" href="#/Policy" target="_blank">معاينة الصفحة</a></div>') +
      card('❓ الأسئلة الشائعة', '<p class="mut sm">كل سؤال يبدأ بـ «س:» وجوابه في السطر التالي يبدأ بـ «ج:»</p><textarea id="z6faq">' + esc(faq) + '</textarea><div class="xrow mt"><button type="button" class="xbt" data-z6save="faq">حفظ ونشر للعملاء</button></div>') + '</div>';
  }
  function parseEditor(k) {
    if (k === 'tafweed') {
      var p = parseInt(digits($('#z6tp').value), 10); if (!p || p < 100 || p > 100000) throw new Error('اكتب سعرًا صحيحًا');
      var jobs = $('#z6tj').value.split(/[،,]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 15);
      return { price: p, note: $('#z6tn').value.trim().slice(0, 60), jobs: jobs.length ? jobs : DEF.tafweed.jobs };
    }
    if (k === 'policy') {
      var S = [], cur = null;
      $('#z6pol').value.split('\n').forEach(function (l) { l = l.trim(); if (!l) return; if (/^##/.test(l)) { cur = { t: l.replace(/^#+\s*/, ''), items: [] }; S.push(cur); } else { if (!cur) { cur = { t: 'عام', items: [] }; S.push(cur); } cur.items.push(l.replace(/^[-•*]\s*/, '')); } });
      if (!S.length) throw new Error('السياسة فارغة'); return { sections: S };
    }
    var I = [], q = null;
    $('#z6faq').value.split('\n').forEach(function (l) { l = l.trim(); if (!l) return; if (/^س\s*[:：]/.test(l)) { q = { q: l.replace(/^س\s*[:：]\s*/, ''), a: '' }; I.push(q); } else if (q) { q.a += (q.a ? ' ' : '') + l.replace(/^ج\s*[:：]\s*/, ''); } });
    I = I.filter(function (x) { return x.q && x.a; }); if (!I.length) throw new Error('اكتب سؤالًا وجوابًا على الأقل'); return { items: I };
  }
  function navBadge() {
    var n = RQ ? RQ.filter(function (r) { return r.status === 'new'; }).length : 0;
    document.querySelectorAll('a[href="#/CustReqs"]').forEach(function (a) { var b = a.querySelector('.z6nb'); if (!b) { b = document.createElement('span'); b.className = 'z6nb'; b.style.cssText = 'background:#C0392B;color:#fff;border-radius:9px;padding:0 6px;font-size:11px;margin-inline-start:6px'; a.appendChild(b); } b.textContent = n || ''; b.style.display = n ? '' : 'none'; });
  }

  /* ---------- customer-side submit ---------- */
  function formData(f) { var o = {}; Array.prototype.forEach.call(f.elements, function (e) { if (!e.name || (e.type === 'radio' && !e.checked)) return; o[e.name] = String(e.value || '').trim(); }); return o; }
  function submitReq(kind, f) {
    var err = $('.z6err', f), btn = $('button[type=submit]', f), d = formData(f);
    var cu = cust(); if (!cu) { reopen(); return; } d.account = cu.ph || '';
    d.phone = digits(d.phone);
    if (!d.name || d.name.length < 3) { err.textContent = 'اكتب اسم صاحب العمل'; return; }
    if (!/^05\d{8}$/.test(d.phone)) { err.textContent = 'رقم الجوال يبدأ بـ 05 ومكوّن من 10 أرقام'; return; }
    if (kind === 'named') { if (!d.wname || d.wname.length < 3) { err.textContent = 'اكتب اسم العامل كما في الجواز'; return; } if (!PASS) { err.textContent = 'أرفق صورة الجواز'; return; } }
    if (kind === 'corporate') { if (!d.org || d.org.length < 2) { err.textContent = 'اكتب اسم المنشأة'; return; } d.cr = digits(d.cr); if (d.cr && d.cr.length !== 10) { err.textContent = 'رقم السجل التجاري 10 أرقام (أو اتركه فارغًا)'; return; } d.count = String(Math.max(1, Math.min(500, parseInt(digits(d.count), 10) || 1))); }
    if (kind === 'tafweed') { d.visa = digits(d.visa); if (d.visa && d.visa.length !== 10) { err.textContent = 'رقم التأشيرة 10 أرقام (أو اتركه فارغًا)'; return; } d.count = String(Math.max(1, Math.min(20, parseInt(digits(d.count), 10) || 1))); d.price = cfg('tafweed').price; }
    err.textContent = ''; btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    var id = uuid(), path = null;
    anon().then(function (db) {
      var up = Promise.resolve();
      if (kind === 'named' && PASS) {
        var ext = (PASS.name.match(/\.(jpe?g|png|webp|heic|pdf)$/i) || [, PASS.type === 'application/pdf' ? 'pdf' : 'jpg'])[1].toLowerCase();
        path = id + '/passport.' + ext;
        up = db.storage.from('sreq').upload(path, PASS.file, { contentType: PASS.type || 'image/jpeg', upsert: false }).then(function (r) { if (r.error) throw r.error; });
      }
      return up.then(function () { return db.from('cust_requests').insert({ id: id, kind: kind, data: d, passport_path: path }); });
    }).then(function (r) {
      if (r && r.error) throw r.error;
      var k = { tafweed: 'tf', named: 'nm', corporate: 'co' }[kind]; DONE[k] = { ref: refNo(id), name: d.name, phone: d.phone }; if (k === 'nm') PASS = null;
      reopen(); toast('✅ وصلنا طلبك رقم #' + refNo(id));
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'إرسال الطلب'; err.textContent = 'تعذّر الإرسال، تحقق من الإنترنت وحاول مرة أخرى' + (e && /mime|size|large/i.test(e.message || '') ? ' (الملف غير مدعوم أو أكبر من 5 ميجابايت)' : ''); });
  }
  function pickPass(file) {
    if (!file) return;
    if (file.size > 5242880) { toast('حجم الملف أكبر من 5 ميجابايت'); return; }
    if (!/^image\/|application\/pdf/.test(file.type || '') && !/\.(heic|pdf)$/i.test(file.name)) { toast('اختر صورة أو ملف PDF'); return; }
    PASS = { file: file, name: file.name, type: file.type, url: /^image\/(jpe?g|png|webp)/.test(file.type) ? URL.createObjectURL(file) : '' };
    var dz = $('#z6drop'); if (dz) { dz.classList.add('ok'); dz.innerHTML = '✓ ' + esc(file.name) + (PASS.url ? '<img alt="معاينة الجواز" src="' + PASS.url + '">' : ''); }
    var e = $('#z6nm .z6err'); if (e) e.textContent = '';
  }
  function reopen() { var h = window.XP_HOST; if (h && h.reopen) h.reopen(); }

  document.addEventListener('submit', function (e) {
    var f = e.target, k = { z6tf: 'tafweed', z6nm: 'named', z6co: 'corporate' }[f.id]; if (!k) return;
    e.preventDefault(); e.stopImmediatePropagation(); submitReq(k, f);
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-z6new],[data-z6tab],#z6drop,[data-z6f],[data-z6reload],[data-z6pass],[data-z6save]'); if (!t) return;
    if (t.dataset.z6new) { DONE[t.dataset.z6new] = null; reopen(); return; }
    if (t.dataset.z6tab) { e.preventDefault(); POLTAB = t.dataset.z6tab; document.querySelectorAll('[data-z6tab]').forEach(function (a) { a.classList.toggle('on', a.dataset.z6tab === POLTAB); }); var b = $('#z6polbody'); if (b) b.innerHTML = policyHTML(); return; }
    if (t.id === 'z6drop') { var i = $('#z6pass'); if (i) i.click(); return; }
    if (t.dataset.z6f) { RQF = t.dataset.z6f; paintReqs(); return; }
    if (t.dataset.z6reload) { RQ = null; paintReqs(); loadReqs(); return; }
    if (t.dataset.z6pass) {
      var w = window.open('about:blank', '_blank');
      staffDb().then(function (db) { return db.storage.from('sreq').createSignedUrl(t.dataset.z6pass, 300); }).then(function (r) { if (r.data && w) w.location = r.data.signedUrl; else { if (w) w.close(); toast('تعذّر فتح الملف'); } }).catch(function () { if (w) w.close(); toast('تعذّر فتح الملف'); });
      return;
    }
    if (t.dataset.z6save) {
      var k = t.dataset.z6save, v;
      try { v = parseEditor(k); } catch (er) { toast('⚠ ' + er.message); return; }
      t.disabled = true;
      staffDb().then(function (db) { return db.from('site_settings').update({ value: v, updated_at: new Date().toISOString() }).eq('key', k).select('key'); }).then(function (r) {
        t.disabled = false;
        if (r.error || !r.data || !r.data.length) { toast('🔒 الحفظ للمدير فقط'); return; }
        SET[k] = v; try { localStorage.setItem('asayel-sset', JSON.stringify(SET)); } catch (e2) { }
        var u = U(); if (u.log) u.log('تعديل', 'خدمات العملاء', { tafweed: 'سعر التفويض', policy: 'سياسة التعاقد', faq: 'الأسئلة الشائعة' }[k], '—', k === 'tafweed' ? fmt(v.price) + ' ر.س' : 'نُشر');
        toast('✅ تم الحفظ ونُشر للعملاء');
      }).catch(function () { t.disabled = false; toast('تعذّر الحفظ'); });
    }
  });
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-z6back]'); if (a) { try { sessionStorage.setItem('z6back', a.dataset.z6back); } catch (er) { } } }, true);
  document.addEventListener('input', function (e) { var w = e.target.closest && e.target.closest('#z6edwrap'); if (w) w.__dirty = 1; });
  document.addEventListener('keydown', function (e) { if (e.target && e.target.id === 'z6drop' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); var i = $('#z6pass'); if (i) i.click(); } });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'z6pass') { pickPass(t.files && t.files[0]); t.value = ''; return; }
    if (t.dataset && t.dataset.z6st) { var id = t.dataset.z6st, v = t.value; saveReq(id, { status: v }).then(function () { paintReqs(); navBadge(); toast('تم تحديث الحالة: ' + STN[v]); }).catch(function () { toast('تعذّر الحفظ'); paintReqs(); }); return; }
    if (t.dataset && t.dataset.z6note) { saveReq(t.dataset.z6note, { staff_note: t.value.trim().slice(0, 300) }).then(function () { toast('تم حفظ الملاحظة'); }).catch(function () { toast('تعذّر الحفظ'); }); }
  });

  /* ---------- «تم التقييم النفسي والمهني» on candidate profiles ---------- */
  var EV = {}; try { EV = JSON.parse(localStorage.getItem('xp-ev') || '{}') || {}; } catch (e) { }
  function evKey(n, co) { return String(n || '').trim() + '|' + String(co || '').trim(); }
  function isEv(n, co) { return !!EV[evKey(n, co)]; }
  var EVB = '<span class="z6ev">✓ تم التقييم النفسي والمهني</span>';
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-z6ev]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var c = (U().CANDS || [])[+b.dataset.z6ev]; if (!c) return;
    var k = evKey(c.n, c.co); if (EV[k]) delete EV[k]; else EV[k] = 1; c.ev = EV[k] ? 1 : 0;
    try { localStorage.setItem('xp-ev', JSON.stringify(EV)); } catch (er) { }
    var u = U(); if (u.log) u.log('تعديل', 'المرشحات', 'التقييم النفسي والمهني · ' + c.n, c.ev ? 'لم يتم' : 'تم', c.ev ? 'تم' : 'لم يتم');
    toast(c.ev ? '✓ ' + c.n + ': تم التقييم النفسي والمهني' : c.n + ': أُلغيت علامة التقييم'); reopen();
  }, true);

  /* ---------- opening ad: a centred pop-up over the home page (not a full screen) ---------- */
  var AD = null;
  var adCss = '.z6adov{position:fixed;inset:0;z-index:9500;background:rgba(7,27,51,.72);display:flex;align-items:center;justify-content:center;padding:16px;animation:z6fd .25s ease}@keyframes z6fd{from{opacity:0}to{opacity:1}}' +
    '.z6adbx{position:relative;background:#fff;border-radius:24px;padding:16px 16px 20px;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:visible;box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;gap:16px;animation:z6pp .3s ease}@keyframes z6pp{from{transform:scale(.94);opacity:0}to{transform:none;opacity:1}}' +
    '.z6adm{width:100%;border-radius:18px;overflow:hidden;background:#0B2A52}.z6adm img,.z6adm video{display:block;width:100%;height:auto;max-height:64vh;object-fit:contain;margin:0 auto}.z6adm .ladm{width:100%;max-width:none;margin:0;border-radius:0}' +
    '.z6adm .ladd{aspect-ratio:1/1;width:100%;max-width:none;margin:0;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:10px;border-radius:0;padding:28px}.z6adm .ladd h1{font-size:clamp(24px,5vw,34px);line-height:1.3;margin:0}' +
    '.z6adx{position:absolute;top:-14px;left:-14px;width:38px;height:38px;border-radius:50%;border:2px solid #fff;background:#1F2A24;color:#fff!important;box-shadow:0 4px 14px rgba(0,0,0,.35);font-size:22px;line-height:1;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center}' +
    '.z6adgo{display:inline-block;background:#D4A04A;color:#fff!important;font-weight:800;font-size:20px;padding:12px 38px;border-radius:8px;text-decoration:none}.z6adgo:hover{background:#C18F3C}' +
    '@media (max-width:640px){.z6adbx{padding:12px 12px 16px;border-radius:20px;width:calc(100% - 12px)}.z6adx{top:-12px;left:-6px}.z6adgo{font-size:18px;padding:11px 30px}}';
  var st2 = document.createElement('style'); st2.textContent = adCss; (document.head || document.documentElement).appendChild(st2);
  function closeAd() { var o = document.getElementById('z6adov'); if (o) { var v = o.querySelector('video'); if (v) try { v.pause(); } catch (e) { } o.remove(); } document.removeEventListener('keydown', adKey); }
  function adKey(e) { if (e.key === 'Escape') closeAd(); }
  function showAd() {
    if (!AD || document.getElementById('z6adov') || !/^#\/Landing/.test(location.hash)) return;
    var o = document.createElement('div'); o.id = 'z6adov'; o.className = 'z6adov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'عرض');
    o.innerHTML = '<div class="z6adbx"><button type="button" class="z6adx" aria-label="إغلاق">×</button><div class="z6adm">' + AD.html + '</div><a class="z6adgo" href="' + esc(AD.href) + '">لطلب العرض</a></div>';
    document.body.appendChild(o); AD = null;
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('.z6adx') || e.target.closest('.z6adgo')) closeAd(); });
    document.addEventListener('keydown', adKey);
    var v = o.querySelector('video'); if (v) { v.muted = true; v.loop = true; try { v.play(); } catch (e) { } }
    setTimeout(function () { var x = o.querySelector('.z6adx'); if (x) x.focus(); }, 50);
  }
  window.addEventListener('hashchange', function () { if (!/^#\/Landing/.test(location.hash)) closeAd(); });

  /* ---------- hook into the program ---------- */
  function init() {
    var u = window.XP_U; if (!u || !u.P || !u.P.Landing || !u.P.RecCVs || !u.P.CustHome || !window.XP_HOST) return setTimeout(init, 60);
    var P = u.P;
    P.Tafweed = { cust: 1, t: 'تفويض سائق أو عامل', r: pageTafweed };
    P.RecNamed = { cust: 1, t: 'استقدام معيّن بالاسم', r: pageNamed };
    P.Policy = { cust: 1, t: 'سياسة التعاقد والأسئلة الشائعة', r: pagePolicy };
    P.Corporate = { cust: 1, t: 'عقود الشركات والمنشآت', r: pageCorporate };
    P.CustReqs = { t: 'طلبات العملاء الخاصة', r: pageReqs };
    if (u.NEW && u.NEW.indexOf('CustReqs') < 0) { var i = u.NEW.indexOf('TeamChat'); u.NEW.splice(i >= 0 ? i + 1 : 1, 0, 'CustReqs'); }
    /* landing: services section above the footer */
    var lo = P.Landing.r; P.Landing.r = function () {
      var h = lo.apply(this, arguments); loadSettings();
      var sec = '<section class="lsec" id="lmore">' + svcCards() + '</section>';
      var at = h.indexOf('<section class="lsec" id="lnat"'); if (at < 0) at = h.indexOf('<section class="lsec"><div class="lrate"');
      return at >= 0 ? h.slice(0, at) + sec + h.slice(at) : h.replace('<footer class="lfoot"', sec + '<footer class="lfoot"');
    };
    /* opening ad → pop-up over the home page */
    if (P.LandingAd) { var ao = P.LandingAd.r; P.LandingAd.r = function () {
      var h = ao.apply(this, arguments); if (h.indexOf('id="lad"') < 0) return h;
      var w = document.createElement('div'); w.innerHTML = h; var lad = w.querySelector('#lad'), body = lad && lad.querySelector('.ladm, .ladd'), go = lad && lad.querySelector('.ladgo');
      AD = { html: body ? body.outerHTML : '', href: go ? go.getAttribute('href') : '#/CustomerLogin' };
      try { history.replaceState(null, '', '#/Landing'); } catch (e) { }
      setTimeout(showAd, 350);
      return P.Landing.r();
    }; }
    /* customer account: the same services */
    var ho = P.CustHome.r; P.CustHome.r = function () { var h = ho.apply(this, arguments); if (h.indexOf('rgrid') < 0) return h;
      var bk = null; try { bk = sessionStorage.getItem('z6back'); if (bk) sessionStorage.removeItem('z6back'); } catch (e) { }
      if (bk && cust() && P[bk]) { setTimeout(function () { location.hash = '#/' + bk; }, 0); } loadSettings(); return h + '<div style="margin-top:18px">' + svcCards() + '</div>'; };
    /* CV list: «اطلب الآن» with a ready WhatsApp message under every CV */
    var co = P.RecCVs.r; P.RecCVs.r = function () {
      var h = co.apply(this, arguments); if (h.indexOf('xcvc') < 0) return h;
      var w = document.createElement('div'); w.innerHTML = h;
      w.querySelectorAll('article.xcvc').forEach(function (a) {
        var n = (a.querySelector('b') || {}).textContent || '', m = (a.querySelector('p.mut') || {}).textContent || '';
        var parts = m.split('·').map(function (s) { return s.trim(); });
        var msg = 'السلام عليكم، أرغب بطلب العاملة ' + n + (parts[0] ? ' · ' + parts[0] : '') + (parts[1] ? ' · ' + parts[1] : '') + ' (من السير الذاتية في موقع أصايل المنصورة)';
        if (isEv(n, parts[0])) { var bb = a.querySelector('.xrow'); if (bb) bb.insertAdjacentHTML('afterend', EVB); }
        a.insertAdjacentHTML('beforeend', '<a class="z6cvwa" target="_blank" rel="noopener" href="' + esc(waLink(msg)) + '">💬 اطلب الآن</a>');
      });
      return w.innerHTML;
    };
    if (P.Candidates) { var cd = P.Candidates.r; P.Candidates.r = function () {
      var h = cd.apply(this, arguments); if (h.indexOf('data-act="cvopen"') < 0) return h;
      var w = document.createElement('div'), C = U().CANDS || []; w.innerHTML = h;
      w.querySelectorAll('article.xcvc').forEach(function (a) {
        var ob = a.querySelector('[data-act="cvopen"][data-i]'); if (!ob) return; var i = +ob.dataset.i, c = C[i]; if (!c) return;
        var on = isEv(c.n, c.co), row = a.querySelector('.xrow');
        if (on && row) row.insertAdjacentHTML('afterend', '<span class="z6ev adm">✓ تم التقييم النفسي والمهني</span>');
        a.insertAdjacentHTML('beforeend', '<button type="button" class="xbt sm ghost z6evb' + (on ? ' on' : '') + '" data-z6ev="' + i + '" aria-pressed="' + on + '">' + (on ? '✓ تم التقييم النفسي والمهني' : '🧠 تأكيد التقييم النفسي والمهني') + '</button>');
      });
      return w.innerHTML;
    }; }
    /* customer «طلبي»: who picks the insurance and what it covers */
    if (P.RecMy) { var rm = P.RecMy.r; P.RecMy.r = function () { var h = rm.apply(this, arguments); return h.indexOf('id="rlogin"') >= 0 ? h : h + INS; }; }
    var k = (location.hash.match(/^#\/([A-Za-z]+)/) || [])[1];
    if (k === 'LandingAd' || !k) { try { reopen(); } catch (e) { } }
    if (k === 'Corporate' || k === 'Candidates' || k === 'RecMy' || k === 'Tafweed' || k === 'RecNamed' || k === 'Policy' || k === 'CustReqs' || k === 'Landing' || k === 'CustHome' || k === 'RecCVs') { try { reopen(); } catch (e) { } }
    /* staff: keep the «new requests» count fresh in the side menu */
    setInterval(function () { if (isStaff() && document.querySelector('a[href="#/CustReqs"]')) { if (!RQ || Date.now() - (init.t || 0) > 60000) { init.t = Date.now(); loadReqs(); } else navBadge(); } }, 5000);
    new MutationObserver(function () { if (RQ) navBadge(); }).observe(document.body, { childList: true });
  }
  init();
})();
