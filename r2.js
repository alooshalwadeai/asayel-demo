(function () {
'use strict';
var U = window.XP_U; if (!U) return;
var P = U.P, ACT = U.ACT, esc = U.esc, btn = U.btn, card = U.card, log = U.log;
function toast(m) { U.toast(m); }
function rerender() { var h = window.XP_HOST || {}; if (h.reopen) h.reopen(); }
/* ---------- team chat + announcements: program-wide with access levels ---------- */
var LV = [['full', 'كامل'], ['view', 'مشاهدة فقط'], ['none', 'بدون']];
var CACC = { 'سارة (خدمة العملاء)': { chat: 'view', ann: 'view' } };
function acc(u, k) { if (u === 'المدير') return 'full'; var a = CACC[u] || {}; return a[k] || (k === 'chat' ? 'full' : 'view'); }
function me() { return U.me ? U.me() : 'المدير'; }
var DISM = {};
if (P.TeamChat && !P.TeamChat.__w) {
  var tcOrig = P.TeamChat.r;
  P.TeamChat = { t: 'التواصل الداخلي والتنويهات', __w: 1, r: function () {
    var u = me(), ch = acc(u, 'chat'), an = acc(u, 'ann');
    var w = document.createElement('div'); w.innerHTML = tcOrig();
    var h1 = w.querySelector('.xh h1'); if (h1) h1.textContent = 'التواصل الداخلي والتنويهات';
    var hp = w.querySelector('.xh p'); if (hp) hp.textContent = 'لكل أقسام البرنامج: الاستقدام، الإيجار، الإيواء والحسابات · الصلاحيات يحددها المدير';
    var cc = w.querySelector('#tcw'); cc = cc && cc.closest('.xcd');
    var ac = w.querySelector('#annform'); ac = ac && ac.closest('.xcd');
    function lock(el, t) { var n = document.createElement('p'); n.className = 'rlock'; n.textContent = t; el.appendChild(n); }
    if (cc) { if (ch === 'none') cc.remove(); else if (ch === 'view') { ['#tcform', '#tcmen', '#tcpend'].forEach(function (q) { var e = cc.querySelector(q); if (e) e.remove(); }); cc.querySelectorAll('[data-act=tcwipe]').forEach(function (e) { e.remove(); }); lock(cc, '👁 صلاحيتك: مشاهدة فقط · لا يمكنك الإرسال'); } }
    if (ac) { if (an === 'none') ac.remove(); else if (an === 'view') { var f = ac.querySelector('#annform'); if (f) f.remove(); ac.querySelectorAll('[data-act=annnow]').forEach(function (e) { e.remove(); }); lock(ac, '👁 صلاحيتك: مشاهدة التنويهات فقط'); } }
    if (ch === 'none' && an === 'none') { var g = w.querySelector('.wgrid'); if (g) g.insertAdjacentHTML('beforebegin', '<div class="rnote">🔒 ليس لديك صلاحية على المحادثة أو التنويهات · راجع المدير</div>'); }
    var html = w.innerHTML;
    if (u === 'المدير') html += card('🔐 صلاحيات التواصل والتنويهات', '<p class="mut sm">لكل موظف: كامل (يشارك ويرسل) · مشاهدة فقط · بدون (لا تظهر له)</p><div class="xtw"><table class="xt shpt"><thead><tr><th>الموظف</th><th>محادثة الفريق</th><th>التنويهات</th></tr></thead><tbody>' + (U.MEM || []).filter(function (m) { return m !== 'المدير'; }).map(function (m) {
      return '<tr><td data-l="الموظف"><b>' + esc(m) + '</b></td>' + ['chat', 'ann'].map(function (k) { return '<td data-l="' + (k === 'chat' ? 'محادثة الفريق' : 'التنويهات') + '"><select class="xsel" data-cacc="' + k + '" data-u="' + esc(m) + '" aria-label="' + esc(k + ' ' + m) + '">' + LV.map(function (l) { return '<option value="' + l[0] + '"' + (acc(m, k) === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>');
    return html;
  } };
}
function annBar() {
  var A = U.ANN; if (!A) return ''; var u = me(); if (acc(u, 'ann') === 'none') return '';
  var i = -1; for (var k = 0; k < A.length; k++) { if (!A[k].sch && A[k].read.indexOf(u) < 0 && !DISM[u + '|' + A[k].x]) { i = k; break; } }
  if (i < 0) return ''; var a = A[i];
  return '<div class="rann" role="status"><span>📢 <b>تنويه:</b> ' + esc(a.x) + (a.f ? ' · 📎 ' + esc(a.f.n) : '') + '</span><span class="xrow">' + btn('تم الاطلاع', 'rannok', 'data-i="' + i + '"', 'sm') + '<a class="xbt sm ghost" href="#/TeamChat">كل التنويهات</a></span></div>';
}
ACT.rannok = function (t) { var a = U.ANN[+t.dataset.i], u = me(); if (!a) return; if (u === 'المدير') DISM[u + '|' + a.x] = 1; else if (a.read.indexOf(u) < 0) { a.read.push(u); log('اعتماد', 'التنويهات', 'اطلاع على: ' + a.x, '—', u); } rerender(); };
Object.keys(P).forEach(function (k) {
  var pg = P[k]; if (!pg || pg.cust || k === 'TeamChat' || k === 'Shelter' || k === 'WorkerStatus' || pg.__ab) return;
  var o = pg.r; pg.r = function () { var h = o.apply(this, arguments); var b = annBar(); return b ? h.replace(/(<\/header>)/, '$1' + b) : h; }; pg.__ab = 1;
});
document.addEventListener('change', function (e) {
  var t = e.target; if (!t.dataset || !t.dataset.cacc) return;
  var u = t.dataset.u, k = t.dataset.cacc, b = acc(u, k); CACC[u] = CACC[u] || {}; CACC[u][k] = t.value;
  var nm = function (v) { return LV.filter(function (l) { return l[0] === v; })[0][1]; };
  log('تعديل', 'الصلاحيات', (k === 'chat' ? 'محادثة الفريق' : 'التنويهات') + ' · ' + u, nm(b), nm(t.value)); toast('صلاحية ' + u + ' في ' + (k === 'chat' ? 'المحادثة' : 'التنويهات') + ': ' + nm(t.value));
});
var tci = U.NEW.indexOf('TeamChat'); if (tci >= 0) { U.NEW.splice(tci, 1); U.NEW.splice(1, 0, 'TeamChat'); }

var can = U.can || function () { return true; };
/* ---------- customer home page (separate from management) + opening ad + about ---------- */
var OFDEF = [
  { k: 'rent', t: 'خصم [النسبة] على الإيجار الشهري', b: 'لأول حجز شهري للعملاء الجدد والحاليين.', u: 'حتى [تاريخ الانتهاء]', f: 1, op: 1 },
  { k: 'rent', t: 'باقة 10 ساعات', b: 'استخدمها على أكثر من زيارة خلال الشهر بسعر أقل من الساعة المفردة.', u: 'العرض حتى [التاريخ]', f: 0 },
  { k: 'recruit', t: 'استقدام من الفلبين', b: 'إجراءات أسرع ومتابعة لطلبك خطوة بخطوة حتى الوصول والتسليم.', u: 'المدة المتوقعة: [عدد الأيام]', f: 1 },
  { k: 'rent', t: 'أول زيارة بسعر خاص', b: 'للعملاء الجدد في نجران عند التسجيل والتحقق من الهوية.', u: 'العرض حتى [التاريخ]', f: 0 },
  { k: 'recruit', t: 'سير ذاتية جديدة كل أسبوع', b: 'اختر العاملة بنفسك واحجزها باسمك 72 ساعة لإكمال السداد.', u: 'متجدد', f: 1 }
];
var ABDEF = { t: 'شركة أصايل المنصورة في منطقة نجران، متخصصة في استقدام العمالة المنزلية وتأجيرها بالساعة واليوم والشهر. نبني خدمتنا على الوضوح والمتابعة: تختار العاملة بنفسك، وتعرف مرحلة طلبك أول بأول، وتدفع بالطريقة اللي تناسبك.', p: ['وضوح في الأسعار والإجراءات من أول خطوة', 'متابعة طلبك خطوة بخطوة حتى الوصول', 'خدمة داخل نجران وضواحيها', 'فريق يرد عليك في أوقات العمل'] };
function clone(x) { return JSON.parse(JSON.stringify(x)); }
var OFS = clone(OFDEF), ABOUT = clone(ABDEF);
try { var so = JSON.parse(localStorage.getItem('asayel-offers') || 'null'); if (so && so.length) OFS = so; } catch (e) { }
try { var sa = JSON.parse(localStorage.getItem('asayel-about') || 'null'); if (sa && sa.t) ABOUT = sa; } catch (e) { }
OFS.forEach(function (o) { if (o.m && /^blob:/.test(o.m.u)) delete o.m; });
var EDIT = null, EDAB = null, LTAB = '', LSL = 0, FORCEAD = 0, ADT = 0;
if (U.PERMS && !U.PERMS.some(function (x) { return x[0] === 'ads'; })) U.PERMS.push(['ads', 'إدارة الإعلانات والعروض']);
function media(o, cls, ad) { if (!o.m || !o.m.u) return ''; return o.m.type === 'vid' ? '<video class="' + cls + '" src="' + o.m.u + '" autoplay muted' + (ad ? '' : ' loop') + ' playsinline aria-label="' + esc(o.t) + '"></video>' : '<img class="' + cls + '" src="' + o.m.u + '" alt="' + esc(o.t) + '">'; }
function kName(k) { return k === 'rent' ? 'إيجار' : 'استقدام'; }
function lOffer(o) { return '<article class="lof ' + o.k + (o.m ? ' hasm' : '') + '">' + media(o, 'lofm') + '<span class="lofk">' + kName(o.k) + '</span><h3>' + esc(o.t) + '</h3><p>' + esc(o.b) + '</p><small>' + esc(o.u) + '</small></article>'; }
function isMgr() { try { return sessionStorage.getItem('asayel-ok') === '1'; } catch (e) { return false; } }

/* opening ad: closes when the ad ends; skip appears after 10 seconds */
function opAd() { return OFS.filter(function (o) { return o.op; })[0]; }
P.LandingAd = { cust: 1, t: 'إعلان', r: function () {
  var a = opAd(), seen = false; try { seen = sessionStorage.getItem('asayel-adseen') === '1'; } catch (e) { }
  if (!a || (seen && !FORCEAD)) { try { history.replaceState(null, '', '#/Landing'); } catch (e) { } return P.Landing.r(); }
  FORCEAD = 0; ADT = Date.now(); try { sessionStorage.setItem('asayel-adseen', '1'); } catch (e) { }
  var body = a.m ? media(a, 'ladm', 1) : '<div class="ladd ' + a.k + '">' + U.logo(64) + '<span class="lpill w">عرض ' + (a.k === 'rent' ? 'الإيجار' : 'الاستقدام') + '</span><h1>' + esc(a.t) + '</h1><p>' + esc(a.b) + '</p><small>' + esc(a.u) + '</small></div>';
  return '<div class="lad" id="lad" data-kind="' + (a.m ? a.m.type : 'card') + '"><div class="ladbar"><span class="ladp" id="ladp"></span></div>' + body +
    '<div class="ladc"><a class="xbt ghost ladgo" href="#/CustomerLogin">استفد من العرض</a><button type="button" class="xbt ladsk" id="ladsk" data-act="ladskip" disabled>تخطّي بعد 10</button></div></div>';
} };
ACT.ladskip = function (t) { if (t.disabled) return; location.hash = '#/Landing'; };
setInterval(function () {
  var el = document.getElementById('lad'); if (!el) return;
  var s = Math.floor((Date.now() - ADT) / 1000), sk = document.getElementById('ladsk'), p = document.getElementById('ladp'), dur = el.dataset.kind === 'vid' ? 0 : 15;
  if (sk) { if (s >= 10) { if (sk.disabled) { sk.disabled = false; sk.textContent = 'تخطّي ←'; } } else sk.textContent = 'تخطّي بعد ' + (10 - s); }
  var v = el.querySelector('video');
  if (p) p.style.width = (v && v.duration ? Math.min(100, v.currentTime / v.duration * 100) : dur ? Math.min(100, s / dur * 100) : 0) + '%';
  if (dur && s >= dur) location.hash = '#/Landing';
}, 250);
document.addEventListener('ended', function (e) { if (e.target.closest && e.target.closest('#lad')) location.hash = '#/Landing'; }, true);

function ltop(act) {
  var L = act === 'home' ? [['#lof', 'العروض'], ['#/OffersRec', 'عروض الاستقدام'], ['#/OffersRent', 'عروض الإيجار'], ['#lsv', 'الخدمات'], ['#lab', 'من نحن'], ['#lct', 'تواصل معنا']] : [['#/Landing', 'الرئيسية'], ['#/OffersRec', 'عروض الاستقدام'], ['#/OffersRent', 'عروض الإيجار'], ['#/CustomerLogin', 'تابع طلبك']];
  return '<header class="ltop"><a class="lbr" href="#/Landing">' + U.logo(34) + '<span><b>شركة أصايل المنصورة</b><small>استقدام وتأجير العمالة المنزلية · نجران</small></span></a>' +
    '<nav class="lnav" aria-label="التنقل">' + L.map(function (l) { var on = (act === 'rec' && l[0] === '#/OffersRec') || (act === 'rent' && l[0] === '#/OffersRent'); return '<a href="' + l[0] + '" class="' + (on ? 'on' : '') + '">' + l[1] + '</a>'; }).join('') + '</nav>' +
    '<div class="lact"><a class="xbt ghost lstf" href="#/StaffLogin">🔐 دخول الإدارة والموظفين</a><a class="xbt" href="#/CustomerLogin">دخول العملاء</a></div></header>';
}
function offersPage(kind) {
  var rec = kind === 'recruit', list = OFS.filter(function (o) { return o.k === kind; });
  var hero = '<section class="lohero ' + kind + '"><div><span class="lpill w">' + (rec ? 'الاستقدام' : 'الإيجار') + '</span><h1>' + (rec ? 'عروض الاستقدام' : 'عروض الإيجار') + '</h1><p>' + (rec ? 'اختر العاملة من السير الذاتية واحجزها باسمك 72 ساعة لإكمال السداد بالتحويل.' : 'بالساعة أو اليوم أو الشهر داخل نجران وضواحيها · ادفع عبر الموقع أو في المكتب.') + '</p><div class="xrow"><a class="xbt lw" href="#/CustomerLogin">' + (rec ? 'ابدأ طلب الاستقدام' : 'احجز عاملة الآن') + '</a><a class="xbt ghost lwo" href="' + (rec ? '#/OffersRent' : '#/OffersRec') + '">' + (rec ? 'شوف عروض الإيجار' : 'شوف عروض الاستقدام') + ' ←</a></div></div><span class="lohc">' + list.length + '<small>' + (list.length === 1 ? 'عرض متاح' : 'عروض متاحة') + '</small></span></section>';
  var grid = list.length ? '<div class="lofs lobig">' + list.map(function (o) { return lOffer(o).replace('</small></article>', '</small><a class="xbt" href="#/CustomerLogin">استفد من العرض</a></article>'); }).join('') + '</div>' : '<div class="loempty">لا توجد عروض ' + (rec ? 'استقدام' : 'إيجار') + ' حاليًا · تابعنا قريبًا أو <a href="#/JijiChat">اسأل جيجي</a></div>';
  var how = '<section class="lsec"><div class="lohow">' + (rec ? [['📝', 'سجّل بجوالك', 'بدون نفاذ'], ['🛂', 'أدخل رقم التأشيرة', 'أو اطلبه من المكتب'], ['⏳', 'احجز 72 ساعة', 'للسداد فقط'], ['🏦', 'حوّل وارفع الإيصال', 'نؤكد في مساند']] : [['🔐', 'ادخل عبر نفاذ', 'تحقق الهوية'], ['👩', 'اختر عاملة متاحة', 'المتاحات فقط'], ['📅', 'حدد المدة', 'يوم · أسبوع · شهر'], ['💳', 'ادفع', 'بطاقة · تابي · تمارا · نقدًا']]).map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>'; }).join('') + '</div></section>';
  return '<div class="lpg">' + ltop(rec ? 'rec' : 'rent') + hero + '<section class="lsec"><div class="lsh"><h2>العروض المتاحة الآن</h2></div>' + grid + '</section>' + how +
    '<footer class="lfoot"><span>© شركة أصايل المنصورة · نجران</span><span><a href="#/Landing">الرئيسية</a> · <a href="#/CustomerLogin">دخول العملاء</a> · <a href="#/StaffLogin">دخول الإدارة والموظفين</a></span></footer><a class="ljiji" href="#/JijiChat"><span>ج</span>اسأل جيجي</a></div>';
}
P.OffersRec = { cust: 1, t: 'عروض الاستقدام', r: function () { return offersPage('recruit'); } };
P.OffersRent = { cust: 1, t: 'عروض الإيجار', r: function () { return offersPage('rent'); } };
/* customer home page */
P.Landing = { cust: 1, t: 'شركة أصايل المنصورة · استقدام وتأجير العمالة المنزلية', r: function () {
  var feat = OFS.filter(function (o) { return o.f; }); if (!feat.length) feat = OFS.slice(0, 1); LSL = LSL % Math.max(1, feat.length);
  var list = OFS.filter(function (o) { return !LTAB || o.k === LTAB; });
  var top = ltop('home');
  var hero = '<section class="lhero"><div class="lhtx"><span class="lpill">نخدم منطقة نجران وضواحيها</span><h1>عاملتك المنزلية… <em>استقدام</em> أو <em>إيجار</em> من مكان واحد</h1><p>اختر العاملة بنفسك، تابع طلبك خطوة بخطوة، وادفع بالطريقة اللي تناسبك.</p>' +
    '<div class="lcta"><a class="lbig rec" href="#/CustomerLogin"><b>أبغى استقدام</b><small>دخول بالجوال · بدون نفاذ</small></a><a class="lbig rent" href="#/CustomerLogin"><b>أبغى إيجار</b><small>بالساعة أو اليوم أو الشهر · عبر نفاذ</small></a></div>' +
    '<ul class="ltrust"><li>✓ متابعة الطلب حتى الوصول</li><li>✓ حجز السيرة الذاتية 72 ساعة</li><li>✓ دفع عبر الموقع أو في المكتب</li></ul></div>' +
    '<div class="lslide" aria-roledescription="عروض متحركة">' + feat.map(function (o, i) { return '<div class="lsl ' + o.k + (o.m ? ' hasm' : '') + (i === LSL ? ' on' : '') + '" aria-hidden="' + (i === LSL ? 'false' : 'true') + '">' + media(o, 'lslm') + '<span class="lpill w">عرض ' + (o.k === 'rent' ? 'الإيجار' : 'الاستقدام') + '</span><h2>' + esc(o.t) + '</h2><p>' + esc(o.b) + '</p><small>' + esc(o.u) + '</small><a class="xbt" href="#/CustomerLogin">استفد من العرض</a></div>'; }).join('') +
    '<div class="ldots">' + feat.map(function (_, i) { return '<button type="button" data-lsl="' + i + '" class="' + (i === LSL ? 'on' : '') + '" aria-label="العرض ' + (i + 1) + '"></button>'; }).join('') + '</div></div></section>';
  var offers = '<section class="lsec" id="lof"><div class="lsh"><h2>عروضنا الحالية</h2><div class="xseg" role="group" aria-label="نوع العرض">' + [['', 'الكل'], ['rent', 'إيجار'], ['recruit', 'استقدام']].map(function (t) { return '<button type="button" data-ltab="' + t[0] + '" class="' + (LTAB === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div><div class="lofs">' + list.map(lOffer).join('') + '</div><div class="lomore"><a class="xbt ghost" href="#/OffersRec">كل عروض الاستقدام ←</a><a class="xbt ghost" href="#/OffersRent">كل عروض الإيجار ←</a></div></section>';
  var step = function (a) { return '<ol class="lst">' + a.map(function (s) { return '<li><b>' + s[0] + '</b><span>' + s[1] + '</span></li>'; }).join('') + '</ol>'; };
  var svc = '<section class="lsec lsv2" id="lsv"><article class="lsv rec"><div class="lsvh"><span class="lic">🛂</span><div><h2>الاستقدام</h2><p>اختر العاملة من السير الذاتية واحجزها باسمك</p></div></div>' +
    step([['سجّل بجوالك', 'رقم الجوال وكلمة مرور من 8 أرقام'], ['أدخل رقم التأشيرة', 'ما عندك رقم؟ راسل المكتب ونعطيك إياه'], ['احجز السيرة الذاتية', 'تُحجز باسمك 72 ساعة للسداد فقط'], ['حوّل وارفع الإيصال', 'نؤكد السداد في مساند'], ['تابع حتى الوصول', 'الفحص، التفييز، الباركود، التذكرة، ثم الوصول']]) + '<a class="xbt" href="#/CustomerLogin">ابدأ طلب الاستقدام</a></article>' +
    '<article class="lsv rent"><div class="lsvh"><span class="lic">🏠</span><div><h2>الإيجار</h2><p>بالساعة أو اليوم أو الشهر داخل نجران وضواحيها</p></div></div>' +
    step([['ادخل عبر نفاذ', 'للتحقق من الهوية ورقم الجوال'], ['اختر عاملة متاحة', 'تظهر لك العاملات المتاحة فقط'], ['حدد المدة', 'يوم، أسبوع، أو شهر بسعر أقل'], ['ادفع عبر الموقع', 'بطاقة، تابي، تمارا، أو نقدًا في المكتب'], ['يعتمد المكتب الحجز', 'خلال أوقات العمل']]) + '<a class="xbt" href="#/CustomerLogin">احجز عاملة للإيجار</a></article></section>';
  var about = '<section class="lsec labt" id="lab"><div class="labl">' + U.logo(56) + '<h2>من نحن</h2><p>' + esc(ABOUT.t) + '</p></div><ul class="labp">' + ABOUT.p.filter(Boolean).map(function (x) { return '<li><span>✓</span>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
  var info = '<section class="lsec linfo" id="lct"><div class="lic2"><span>🕘</span><b>أوقات العمل</b><p>الفترة الصباحية 9:00 – 12:00<br>الفترة المسائية 4:00 – 8:00</p></div><div class="lic2"><span>📍</span><b>منطقة الخدمة</b><p>نجران وضواحيها مثل بدر الجنوب وهداده</p></div><div class="lic2"><span>🔎</span><b>تابع طلبك</b><p>ادخل حسابك وشوف مرحلة طلبك الحالية</p><a href="#/CustomerLogin">متابعة الطلب ←</a></div><div class="lic2"><span>💬</span><b>تواصل معنا</b><p>واتساب: [الرقم الرسمي]</p><a href="#/JijiChat">اسأل جيجي الآن ←</a></div></section>';
  var foot = '<footer class="lfoot"><span>© شركة أصايل المنصورة · نجران</span><span><a href="#/CustomerLogin">دخول العملاء</a> · <a href="#/StaffLogin">دخول الإدارة والموظفين</a></span></footer><a class="ljiji" href="#/JijiChat"><span>ج</span>اسأل جيجي</a>';
  return '<div class="lpg">' + top + hero + offers + svc + about + info + foot + '</div>';
} };
setInterval(function () { var s = document.querySelector('.lslide'); if (!s || s.matches(':hover') || document.hidden) return; var all = s.querySelectorAll('.lsl'); if (all.length < 2) return; LSL = (LSL + 1) % all.length; all.forEach(function (e, i) { e.classList.toggle('on', i === LSL); e.setAttribute('aria-hidden', i === LSL ? 'false' : 'true'); }); s.querySelectorAll('.ldots button').forEach(function (b, i) { b.classList.toggle('on', i === LSL); }); }, 5000);

/* management page (separate, inside the manager dashboard) */
function saveAll() {
  var ok = 1; try { localStorage.setItem('asayel-offers', JSON.stringify(OFS)); } catch (e) { ok = 0; try { localStorage.setItem('asayel-offers', JSON.stringify(OFS.map(function (o) { var c = Object.assign({}, o); delete c.m; return c; }))); } catch (e2) { } }
  try { localStorage.setItem('asayel-about', JSON.stringify(ABOUT)); } catch (e) { } return ok;
}
function edRead() {
  document.querySelectorAll('[data-of]').forEach(function (e) { var o = EDIT[+e.dataset.i]; if (!o) return; var k = e.dataset.of; if (k === 'op') { if (e.checked) EDIT.forEach(function (x, j) { x.op = j === +e.dataset.i ? 1 : 0; }); return; } o[k] = e.type === 'checkbox' ? (e.checked ? 1 : 0) : e.value.trim(); });
  var t = document.getElementById('abt'); if (t) EDAB.t = t.value.trim();
  var pp = document.getElementById('abp'); if (pp) EDAB.p = pp.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
}
P.AdsAdmin = { t: 'الإعلانات والعروض ومن نحن', r: function () {
  if (!EDIT) { EDIT = clone(OFS); EDAB = clone(ABOUT); }
  var ed = can('ads'), dis = ed ? '' : ' disabled';
  var cur = OFS.filter(function (o) { return o.op; })[0];
  var list = EDIT.map(function (o, i) {
    return '<fieldset class="adf ' + o.k + '"><legend>' + (o.op ? '🎬 ' : '') + 'عرض ' + (i + 1) + '</legend><div class="adg"><div class="adm">' + (o.m ? media(o, 'admp') : '<div class="admp adnone">بدون صورة أو فيديو</div>') +
      (ed ? '<div class="xrow"><label class="xbt sm ghost shup">🖼 صورة أو فيديو<input type="file" accept="image/*,video/*" data-ofm="' + i + '" hidden></label>' + (o.m ? btn('إزالة', 'admdel', 'data-i="' + i + '"', 'sm ghost') : '') + '</div>' : '') + '</div><div class="adx">' +
      '<label class="shfl"><span>العنوان</span><input data-of="t" data-i="' + i + '" value="' + esc(o.t) + '"' + dis + '></label><label class="shfl"><span>الوصف</span><input data-of="b" data-i="' + i + '" value="' + esc(o.b) + '"' + dis + '></label>' +
      '<div class="shg"><label class="shfl"><span>المدة أو التاريخ</span><input data-of="u" data-i="' + i + '" value="' + esc(o.u) + '"' + dis + '></label><label class="shfl"><span>النوع</span><select class="xsel" data-of="k" data-i="' + i + '"' + dis + '><option value="rent"' + (o.k === 'rent' ? ' selected' : '') + '>إيجار</option><option value="recruit"' + (o.k === 'recruit' ? ' selected' : '') + '>استقدام</option></select></label></div>' +
      '<div class="xrow"><label class="shck"><input type="checkbox" data-of="f" data-i="' + i + '"' + (o.f ? ' checked' : '') + dis + '> يظهر في الشريط المتحرك</label><label class="shck"><input type="radio" name="adop" data-of="op" data-i="' + i + '"' + (o.op ? ' checked' : '') + dis + '> الإعلان الافتتاحي</label>' + (ed ? btn('حذف', 'addel', 'data-i="' + i + '"', 'sm ghost') : '') + '</div></div></div></fieldset>';
  }).join('');
  return U.head('الإعلانات والعروض ومن نحن', 'كل ما تضيفه هنا يظهر للعملاء في الصفحة الرئيسية · صفحة الإدارة مستقلة عن صفحة العميل', '<a class="xbt ghost" href="#/Landing" target="_blank" rel="noopener">الصفحة الرئيسية ↗</a><a class="xbt ghost" href="#/OffersRec" target="_blank" rel="noopener">عروض الاستقدام ↗</a><a class="xbt ghost" href="#/OffersRent" target="_blank" rel="noopener">عروض الإيجار ↗</a>' + btn('▶ معاينة الإعلان الافتتاحي', 'adprev', '', 'ghost') + (ed ? btn('＋ إعلان أو عرض', 'adnew') : '')) +
    (ed ? '' : '<div class="rnote">👁 صلاحيتك مشاهدة فقط · التعديل لمن لديه صلاحية «إدارة الإعلانات والعروض»</div>') +
    U.kpis([{ l: 'عروض منشورة', v: OFS.length }, { l: 'في الشريط المتحرك', v: OFS.filter(function (o) { return o.f; }).length, tone: 'g' }, { l: 'بصورة أو فيديو', v: OFS.filter(function (o) { return o.m; }).length, tone: 'b' }, { l: 'الإعلان الافتتاحي', v: cur ? 1 : 0, s: cur ? cur.t : 'لا يوجد', tone: 'a' }]) +
    card('🎬 الإعلان الافتتاحي', '<p class="mut">يظهر للعميل أول ما يفتح الموقع (مرة في كل زيارة). <b>يُغلق تلقائيًا بعد انتهاء الإعلان</b> (نهاية الفيديو، أو 15 ثانية للصورة)، ويظهر زر <b>«تخطّي» بعد 10 ثوانٍ</b>. اختر الإعلان الافتتاحي من القائمة تحت بعلامة «الإعلان الافتتاحي».</p>') +
    card('العروض والإعلانات', '<p class="mut sm">كل عرض يظهر في الصفحة الرئيسية، وفي صفحة قسمه حسب النوع: «عروض الاستقدام» أو «عروض الإيجار».</p><div class="adl">' + list + '</div>' + (ed ? '<div class="xrow mt">' + btn('حفظ ونشر للعملاء', 'adsave') + btn('رجوع للعروض الأصلية', 'adreset', '', 'ghost') + '</div>' : '')) +
    card('ℹ من نحن', '<label class="shfl"><span>النص التعريفي</span><textarea id="abt" rows="4" class="adta"' + dis + '>' + esc(EDAB.t) + '</textarea></label><label class="shfl"><span>نقاط التميّز (كل نقطة في سطر)</span><textarea id="abp" rows="4" class="adta"' + dis + '>' + esc(EDAB.p.join('\n')) + '</textarea></label>' + (ed ? '<div class="xrow mt">' + btn('حفظ ونشر للعملاء', 'adsave') + '</div>' : ''));
} };
ACT.adnew = function () { edRead(); EDIT.unshift({ k: 'rent', t: 'إعلان جديد', b: '', u: '', f: 1 }); rerender(); toast('أُضيف إعلان جديد في أول القائمة · عدّله ثم احفظ'); };
ACT.addel = function (t) { edRead(); EDIT.splice(+t.dataset.i, 1); rerender(); };
ACT.admdel = function (t) { edRead(); delete EDIT[+t.dataset.i].m; rerender(); };
ACT.adsave = function () { if (!can('ads')) return; edRead(); OFS = clone(EDIT.filter(function (o) { return o.t; })); EDIT = clone(OFS); ABOUT = clone(EDAB); var ok = saveAll(); LSL = 0; log('تعديل', 'الإعلانات والعروض', 'نشر العروض ونص من نحن للعملاء', '—', OFS.length + ' عرض'); toast(ok ? 'تم النشر · يظهر الآن للعملاء في الصفحة الرئيسية' : 'تم النشر · الفيديو يبقى لهذه الجلسة في النسخة التجريبية'); rerender(); };
ACT.adreset = function () { EDIT = clone(OFDEF); EDAB = clone(ABDEF); rerender(); toast('رجعت القيم الأصلية · اضغط «حفظ ونشر» لاعتمادها'); };
ACT.adprev = function () { FORCEAD = 1; location.hash = '#/LandingAd'; };
document.addEventListener('change', function (e) {
  var i = e.target.dataset && e.target.dataset.ofm, f = e.target.files && e.target.files[0]; if (i == null || !f || !EDIT) return;
  edRead(); var o = EDIT[+i];
  if (/^video\//.test(f.type)) { if (f.size > 50e6) { toast('حجم الفيديو كبير · الحد 50 ميجا'); return; } o.m = { type: 'vid', u: URL.createObjectURL(f), n: f.name }; rerender(); toast('أُضيف الفيديو · اضغط «حفظ ونشر»'); return; }
  if (!/^image\//.test(f.type)) { toast('اختر صورة أو فيديو'); return; } if (f.size > 4e6) { toast('حجم الصورة كبير · الحد 4 ميجا'); return; }
  var r = new FileReader(); r.onload = function () { o.m = { type: 'img', u: r.result, n: f.name }; rerender(); toast('أُضيفت الصورة · اضغط «حفظ ونشر»'); }; r.readAsDataURL(f);
});
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-ltab]'); if (t) { LTAB = t.dataset.ltab; rerender(); return; }
  var d = e.target.closest('[data-lsl]'); if (d) { LSL = +d.dataset.lsl; rerender(); return; }
  var a = e.target.closest('.lnav a'); if (a && a.getAttribute('href').charAt(1) !== '/') { e.preventDefault(); var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
(function () { var k = U.NEW.indexOf('TeamChat'); U.NEW.splice(k >= 0 ? k + 1 : 1, 0, 'AdsAdmin'); })();
/* every management page needs the manager PIN */
Object.keys(P).forEach(function (k) {
  var pg = P[k]; if (!pg || pg.cust || pg.__lk) return;
  var o = pg.r; pg.r = function () { if (!isMgr()) return '<div class="rlockp">' + U.logo(48) + '<h1>هذه الصفحة للإدارة والموظفين</h1><p>سجّل دخولك أولًا للوصول إليها.</p><div class="xrow"><a class="xbt" href="#/Insights">🔐 دخول الإدارة</a><a class="xbt ghost" href="#/Landing">صفحة العملاء</a></div></div>'; return o.apply(this, arguments); }; pg.__lk = 1;
});
var rlk = document.createElement('style'); rlk.textContent = '.rlockp{max-width:520px;margin:60px auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;background:#fff;border:1.5px solid #E2D9C6;border-radius:20px;padding:30px}.rlockp h1{font-size:22px;margin:6px 0 0}.rlockp p{margin:0;color:#4A5650}.rlockp a.xbt{text-decoration:none}.xs:has(.rlockp) .xn{display:none}'; document.head.appendChild(rlk);
var lcss = '.xcu:has(.lpg) .xmn{max-width:none;padding:0}.lpg{--g:#1F6B4F;--gd:#164D39;--b:#2563A8;--cr:#FBF8F1;--ln:#E2D9C6;background:var(--cr);min-height:100vh}.lpg>*{max-width:1200px;margin-inline:auto;padding-inline:32px;box-sizing:border-box}' +
'.ltop{display:flex;align-items:center;gap:18px;padding-block:14px;position:sticky;top:0;z-index:5;background:rgba(251,248,241,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--ln);max-width:none!important;padding-inline:max(32px,calc((100% - 1136px)/2))!important}.lbr{display:flex;align-items:center;gap:10px;text-decoration:none;color:#1F2A24}.lbr span{display:flex;flex-direction:column}.lbr b{font-family:"Reem Kufi",sans-serif;font-size:19px}.lbr small{font-size:12px;color:#4A5650}.lnav{display:flex;gap:4px;margin-inline-start:auto}.lnav a{padding:8px 12px;border-radius:999px;color:#1F2A24;text-decoration:none;font-size:14.5px}.lnav a:hover{background:#EFE8DA}.lact{display:flex;gap:8px}' +
'.lmgr{margin-top:12px;background:#E7EEF8;border:1.5px solid #B9CDE8;border-radius:12px;padding:10px 14px;font-size:14px}.lhero{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;padding-block:44px 28px}.lpill{display:inline-block;background:#F2E3BE;color:#6B4E12;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600}.lpill.w{background:rgba(255,255,255,.18);color:#fff}.lhtx h1{font-size:44px;line-height:1.25;margin:14px 0 10px;color:#1F2A24}.lhtx h1 em{font-style:normal;color:var(--g)}.lhtx h1 em:first-of-type{color:var(--b)}.lhtx>p{font-size:17px;color:#4A5650;margin:0 0 22px}' +
'.lcta{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lbig{display:flex;flex-direction:column;gap:3px;border-radius:16px;padding:16px 18px;color:#fff;text-decoration:none;transition:transform .15s,box-shadow .15s}.lbig:hover{transform:translateY(-2px);box-shadow:0 8px 20px #0002}.lbig b{font-size:19px}.lbig small{opacity:.9;font-size:13px}.lbig.rec{background:var(--b)}.lbig.rent{background:var(--g)}.ltrust{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:#164D39}' +
'.lslide{position:relative;min-height:330px;border-radius:24px;overflow:hidden;background:var(--g)}.lsl{position:absolute;inset:0;padding:30px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;color:#fff;opacity:0;transition:opacity .6s;background:radial-gradient(circle at 15% 85%,rgba(255,255,255,.14) 0 120px,transparent 121px),linear-gradient(135deg,#1F6B4F,#2E8462)}.lsl.recruit{background:radial-gradient(circle at 15% 85%,rgba(255,255,255,.14) 0 120px,transparent 121px),linear-gradient(135deg,#1E4F8A,#2E6FB8)}.lsl.on{opacity:1;z-index:1}.lsl h2{font-size:30px;margin:6px 0 0;line-height:1.3}.lsl p{margin:0;font-size:15.5px;opacity:.92}.lsl small{opacity:.85}.lsl .xbt{align-self:flex-start;background:#fff;color:#1F2A24;margin-top:8px}.ldots{position:absolute;bottom:16px;left:20px;z-index:2;display:flex;gap:6px}.ldots button{width:9px;height:9px;border-radius:999px;border:0;background:rgba(255,255,255,.45);cursor:pointer;padding:0}.ldots button.on{width:26px;background:#fff}' +
'.lsec{padding-block:26px}.lsh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.lsec h2{margin:0;font-size:24px}.lofs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.lof{background:#fff;border:1.5px solid var(--ln);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:6px;border-top:5px solid var(--g)}.lof.recruit{border-top-color:var(--b)}.lof h3{margin:4px 0 0;font-size:17px}.lof p{margin:0;color:#4A5650;font-size:14px;flex:1}.lof small{color:#8A6A1E;font-weight:600}.lofk{align-self:flex-start;font-size:12px;font-weight:700;border-radius:8px;padding:3px 9px;background:#E6F0EA;color:var(--gd)}.lof.recruit .lofk{background:#E3ECF7;color:#1E4F8A}' +
'.lsv2{display:grid;grid-template-columns:1fr 1fr;gap:18px}.lsv{background:#fff;border:1.5px solid var(--ln);border-radius:20px;padding:22px;display:flex;flex-direction:column;gap:14px}.lsvh{display:flex;gap:12px;align-items:center}.lsvh p{margin:2px 0 0;color:#4A5650;font-size:14px}.lic{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:#E3ECF7;flex:none}.lsv.rent .lic{background:#E6F0EA}.lst{list-style:none;margin:0;padding:0;counter-reset:l;display:flex;flex-direction:column;gap:10px}.lst li{counter-increment:l;display:grid;grid-template-columns:30px 1fr;column-gap:10px;font-size:14.5px}.lst li:before{content:counter(l);grid-row:span 2;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--b);color:#fff;font-size:13px;font-weight:700}.lsv.rent .lst li:before{background:var(--g)}.lst span{color:#4A5650;font-size:13px}.lsv .xbt{align-self:flex-start}.lsv.rec .xbt{background:var(--b)}' +
'.linfo{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.lic2{background:#fff;border:1.5px solid var(--ln);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px}.lic2>span{font-size:22px}.lic2 p{margin:0;color:#4A5650;font-size:13.5px;line-height:1.7}.lic2 a{color:var(--gd);font-weight:700;text-decoration:none;font-size:14px;margin-top:auto}.lstaff{display:flex!important;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.lstaff>div{flex:1}.lstaff p{margin:4px 0 0;color:#4A5650}.lstaff{background:#EFE8DA;border-radius:20px;padding-block:20px!important;margin-block:10px}' +
'.lfoot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-block:22px 90px;color:#4A5650;font-size:13.5px;border-top:1px solid var(--ln);margin-top:16px}.lfoot a{color:#4A5650}.ljiji{position:fixed;bottom:18px;left:18px;z-index:6;display:flex;align-items:center;gap:8px;background:#C9822B;color:#fff;text-decoration:none;border-radius:999px;padding:10px 16px 10px 10px;font-weight:700;box-shadow:0 6px 18px #0003}.ljiji span{width:28px;height:28px;border-radius:50%;background:#fff;color:#C9822B;display:grid;place-items:center}' +
'.lofed{display:flex;flex-direction:column;gap:12px}.lofed fieldset{border:1.5px solid var(--ln,#E2D9C6);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}.lofed legend{font-weight:700;padding:0 6px}' +
'@media (max-width:1020px){.lnav{display:none}.lhero{grid-template-columns:1fr;padding-block:24px}.lhtx h1{font-size:32px}.lofs{grid-template-columns:1fr 1fr}.linfo{grid-template-columns:1fr 1fr}}' +
'@media (max-width:640px){.lpg>*{padding-inline:16px}.ltop{padding-inline:16px!important;flex-wrap:wrap;gap:10px}.lact{width:100%}.lact .xbt{flex:1;justify-content:center;text-align:center}.lhtx h1{font-size:27px}.lcta,.lofs,.lsv2,.linfo{grid-template-columns:1fr}.lslide{min-height:280px}.lsl{padding:22px}.lsl h2{font-size:23px}.lstaff{margin-inline:16px!important}}' +
'@media (prefers-reduced-motion:reduce){.lsl{transition:none}.lbig{transition:none}}';
lcss += '.lsl.hasm{background:#123}.lslm{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}.lsl.hasm:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(0,0,0,.72),rgba(0,0,0,.05) 70%)}.lsl{isolation:isolate}.lofm{width:calc(100% + 36px);margin:-16px -18px 6px;height:170px;object-fit:cover;border-radius:12px 12px 0 0;display:block;background:#EFE8DA}.lmed{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lmedp{width:140px;height:80px;object-fit:cover;border-radius:8px}.lstf{white-space:nowrap}.lpg a.xbt{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.lsl .lpill{align-self:flex-start}.lpg .lstaff{max-width:1136px;padding-inline:24px}.lfoot{max-width:1136px!important;padding-inline:0!important}';
lcss += '.xcu:has(.lad) .xmn{max-width:none;padding:0}.lad{position:fixed;inset:0;z-index:50;background:#0E1A14;display:flex;align-items:center;justify-content:center}.ladm{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain}.ladd{width:min(760px,92vw);border-radius:28px;padding:40px;color:#fff;display:flex;flex-direction:column;gap:10px;align-items:flex-start;background:radial-gradient(circle at 15% 85%,rgba(255,255,255,.14) 0 160px,transparent 161px),linear-gradient(135deg,#1F6B4F,#2E8462)}.ladd.recruit{background:radial-gradient(circle at 15% 85%,rgba(255,255,255,.14) 0 160px,transparent 161px),linear-gradient(135deg,#1E4F8A,#2E6FB8)}.ladd h1{font-size:40px;margin:6px 0 0;line-height:1.25}.ladd p{font-size:18px;margin:0;opacity:.92}.ladbar{position:absolute;top:0;inset-inline:0;height:4px;background:rgba(255,255,255,.15)}.ladp{display:block;height:100%;width:0;background:#E9B44C;transition:width .25s linear}.ladc{position:absolute;bottom:24px;inset-inline:24px;display:flex;justify-content:space-between;gap:10px}.ladc .xbt{text-decoration:none;display:inline-flex;align-items:center}.ladgo{background:#fff!important;color:#1F2A24!important}.ladsk{min-width:130px;justify-content:center}.ladsk:disabled{opacity:.6;cursor:default}' +
'.labt{display:grid!important;grid-template-columns:1.3fr 1fr;gap:24px;align-items:center;background:#fff;border:1.5px solid #E2D9C6;border-radius:24px;padding:28px!important;max-width:1136px!important;margin-block:10px}.labl h2{margin:8px 0}.labl p{margin:0;color:#4A5650;font-size:16px;line-height:1.9}.labp{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}.labp li{display:flex;gap:10px;align-items:center;background:#F7F3EA;border-radius:12px;padding:12px 14px;font-weight:600}.labp li span{width:26px;height:26px;border-radius:50%;background:#1F6B4F;color:#fff;display:grid;place-items:center;flex:none;font-size:13px}' +
'.adl{display:flex;flex-direction:column;gap:12px}.adf{border:1.5px solid #E2D9C6;border-inline-start:5px solid #1F6B4F;border-radius:14px;padding:12px 14px}.adf.recruit{border-inline-start-color:#2563A8}.adf legend{font-weight:700;padding:0 6px}.adg{display:grid;grid-template-columns:220px 1fr;gap:14px}.adm{display:flex;flex-direction:column;gap:8px}.admp{width:100%;height:130px;object-fit:cover;border-radius:10px;background:#F2EDE2}.adnone{display:grid;place-items:center;color:#8A8F8B;font-size:13px}.adx{display:flex;flex-direction:column;gap:8px}.adta{border:1.5px solid #E2D9C6;border-radius:10px;padding:8px 10px;font:14px "IBM Plex Sans Arabic",sans-serif;resize:vertical;width:100%;box-sizing:border-box}' +
'@media (max-width:820px){.labt{grid-template-columns:1fr}.adg{grid-template-columns:1fr}.ladd{padding:24px}.ladd h1{font-size:27px}.labt{margin-inline:16px!important}}';
lcss += '.lnav a.on{background:#1F6B4F;color:#fff}.lomore{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.lohero{margin-top:22px;border-radius:24px;padding:34px 36px!important;color:#fff;display:flex!important;align-items:center;justify-content:space-between;gap:20px;background:radial-gradient(circle at 10% 90%,rgba(255,255,255,.13) 0 150px,transparent 151px),linear-gradient(135deg,#1F6B4F,#2E8462);max-width:1136px!important}.lohero.recruit{background:radial-gradient(circle at 10% 90%,rgba(255,255,255,.13) 0 150px,transparent 151px),linear-gradient(135deg,#1E4F8A,#2E6FB8)}.lohero h1{font-size:38px;margin:10px 0 6px}.lohero p{margin:0 0 16px;font-size:16.5px;opacity:.92;max-width:620px}.lohero .lw{background:#fff;color:#1F2A24}.lohero .lwo{color:#fff;border-color:rgba(255,255,255,.6);background:transparent}.lohc{font-size:54px;font-weight:700;display:flex;flex-direction:column;align-items:center;line-height:1;background:rgba(255,255,255,.14);border-radius:20px;padding:18px 26px}.lohc small{font-size:14px;font-weight:500;margin-top:6px}.lobig .lof .xbt{align-self:flex-start;margin-top:6px}.lof.recruit .xbt{background:#2563A8}.loempty{background:#fff;border:1.5px dashed #E2D9C6;border-radius:16px;padding:28px;text-align:center;color:#4A5650}.lohow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.lohow div{background:#fff;border:1.5px solid #E2D9C6;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px;align-items:flex-start}.lohow span{font-size:24px}.lohow small{color:#4A5650}' +
'@media (max-width:820px){.lohero{flex-direction:column;align-items:flex-start;margin-inline:16px!important;padding:24px!important}.lohero h1{font-size:28px}.lohow{grid-template-columns:1fr 1fr}}';
var lst = document.createElement('style'); lst.textContent = lcss; document.head.appendChild(lst);

var st = document.createElement('style'); st.textContent = '.rann{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#E7EEF8;border:1.5px solid #B9CDE8;border-radius:12px;padding:10px 14px;margin:0 0 12px;font-size:14px}.rlock{margin:8px 0 0;background:#F5EFE2;border-radius:10px;padding:8px 12px;font-size:13px;color:#5C4A1E}'; document.head.appendChild(st);
})();
