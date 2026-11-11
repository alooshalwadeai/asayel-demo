(function () {
'use strict';
/* recruitment customer portal: phone login, visa, 3-day hold, bank transfer receipt, two-step confirmation */
var U = window.XP_U; if (!U || !U.CANDS) return;
var P = U.P, ACT = U.ACT, esc = U.esc, chip = U.chip, btn = U.btn, card = U.card, head = U.head, kpis = U.kpis, table = U.table, drawer = U.drawer, log = U.log, fmt = U.fmt;
var can = U.can || function () { return true; }, meSel = U.meSel || function () { return ''; };
var CANDS = U.CANDS, DAY = 864e5, HOLD = 3 * DAY;
function toast(m) { U.toast(m); }
function rerender() { var h = window.XP_HOST || {}; if (h.reopen) h.reopen(); }
function closeDr() { var d = document.getElementById('xdr'); if (d) d.classList.remove('show'); }
function go(p) { if (p==="CustHome" && CUST) sessionStorage.setItem("asayel-recruit-session",CUST.ph); location.hash = '#/' + p; }
function dt(ms) { var d = new Date(ms); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function hrs(h) { return h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : h <= 10 ? h + ' ساعات' : h + ' ساعة'; }
function remTxt(ms) { if (ms <= 0) return 'انتهت المهلة'; var d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 36e5); var ds = d === 0 ? '' : d === 1 ? 'يوم' : d === 2 ? 'يومان' : d + ' أيام'; return ds ? ds + (h ? ' و' + hrs(h) : '') : (h ? hrs(h) : 'أقل من ساعة'); }

/* permissions (shared with the manager's permission table) */
if (U.PERMS) [['pay', 'تأكيد السداد (استلام التحويل · مساند)'], ['bank', 'تعديل صورة حسابات المكتب']].forEach(function (p) { if (!U.PERMS.some(function (x) { return x[0] === p[0]; })) U.PERMS.push(p); });
if (U.PERM) { U.PERM['خالد (المحاسب)'] = Object.assign(U.PERM['خالد (المحاسب)'] || {}, { pay: 1 }); }

/* data */
var ACCTS = [{ name: 'محمد بن سعيد آل هتيلة', nid: '1012345678', ph: '0555000111', pw: '13572468', visa: '', naf: 0 }];
function mid(n) { return n ? n.slice(0, 1) + '•••••••' + n.slice(-2) : '—'; }
function mph(n) { return n ? n.slice(0, 3) + '•••••' + n.slice(-2) : '—'; }
var CUST = ACCTS.find(a => a.ph === sessionStorage.getItem("asayel-recruit-session")) || null, BANK = null, NAFV = 0;
try { BANK = localStorage.getItem('asayel-bankimg'); } catch (e) { BANK = null; }
var now = Date.now();
var HOLDS = [
  { ci: 2, cn: 'فهد بن ناصر اليامي', ph: '05•••••214', visa: '1•••••••37', at: now - 1.3 * DAY, st: 'held' },
  { ci: 8, cn: 'نورة بنت علي آل منصور', ph: '05•••••651', visa: '1•••••••52', at: now - 2.6 * DAY, st: 'review', rc: { n: 'إيصال-تحويل-نورة.jpg', u: '' } },
  { ci: 5, cn: 'سالم بن محمد الوادعي', ph: '05•••••233', visa: '1•••••••19', at: now - 5 * DAY, st: 'musaned' }
];
HOLDS.forEach(function (h) { CANDS[h.ci].hold = h; });
var STN = { held: 'محجوزة · بانتظار التحويل', review: 'إيصال مرفوع · بانتظار المراجعة', musaned: 'تم السداد في مساند · مؤكدة' };
var STT = { held: 'a', review: 'b', musaned: 'g' };
function rem(h) { return h.st === 'held' || h.st === 'review' ? h.at + HOLD - Date.now() : 0; }
function active() { return HOLDS.filter(function (h) { return h.st !== 'done'; }); }
function myHold() { return CUST ? HOLDS.filter(function (h) { return h.ph === CUST.ph && h.st !== 'done'; })[0] : null; }
function release(h, why) {
  var c = CANDS[h.ci]; c.s = 'متاحة'; delete c.hold; h.st = 'done';
  HOLDS.splice(HOLDS.indexOf(h), 1);
  log('تعديل', 'حجوزات الاستقدام', (why === 'expired' ? 'انتهت مهلة 72 ساعة لحجز ' : 'إلغاء حجز ') + c.n + ' للعميل ' + h.cn + (why === 'expired' && h.rc ? ' (كان فيه إيصال لم يُراجع)' : ''), 'محجوزة', 'متاحة للاستقدام');
}
function sweep() { HOLDS.slice().forEach(function (h) { if ((h.st === 'held' || h.st === 'review') && rem(h) <= 0) release(h, 'expired'); }); }
function bankImg() {
  if (BANK) return '<img class="rbank" src="' + BANK + '" alt="حسابات المكتب البنكية">';
  return '<svg class="rbank" viewBox="0 0 520 250" style="direction:ltr" role="img" aria-label="حسابات المكتب البنكية (صورة مؤقتة)"><rect width="520" height="250" rx="18" fill="#F4EFE4" stroke="#E2D9C6"/><text x="490" y="44" text-anchor="end" font-size="22" font-weight="700" fill="#1F6B4F" font-family="IBM Plex Sans Arabic,sans-serif">حسابات شركة أصايل المنصورة</text>' +
    '<g font-family="IBM Plex Sans Arabic,sans-serif" text-anchor="end"><rect x="24" y="66" width="472" height="66" rx="12" fill="#fff"/><text x="478" y="94" font-size="16" fill="#1F2A24" font-weight="700">البنك (1) · شركة أصايل المنصورة</text><text x="478" y="120" font-size="15" fill="#4A5650" direction="ltr">SA•• •••• •••• •••• •••• ••10</text>' +
    '<rect x="24" y="142" width="472" height="66" rx="12" fill="#fff"/><text x="478" y="170" font-size="16" fill="#1F2A24" font-weight="700">البنك (2) · شركة أصايل المنصورة</text><text x="478" y="196" font-size="15" fill="#4A5650" direction="ltr">SA•• •••• •••• •••• •••• ••27</text>' +
    '<text x="260" y="236" text-anchor="middle" font-size="12.5" fill="#8A6A1E">صورة مؤقتة · يغيّرها المدير من لوحة التحكم</text></g></svg>';
}
function note() { return '<div class="rnote" role="note"><b>⏳ تنويه:</b> الحجز لمدة <b>3 أيام (72 ساعة) للسداد فقط</b> ولا تُمدَّد. إذا لم يتم السداد خلال المدة ترجع العاملة ضمن العاملات المتاحة للاستقدام.</div>'; }
function topbar(active) {
  return '<header class="rtop"><div class="rbr">' + U.logo(28) + '<div><b>شركة أصايل المنصورة</b><span>بوابة العملاء · استقدام وإيجار</span></div></div>' +
    (CUST ? '<nav class="rnav"><a href="#/CustHome" class="' + (active === 'home' ? 'on' : '') + '">حسابي</a><a href="#/RecCVs" class="' + (active === 'cv' ? 'on' : '') + '">السير الذاتية</a><a href="#/RecMy" class="' + (active === 'my' ? 'on' : '') + '">طلبي</a><button type="button" class="xbt sm ghost" data-act="rout">خروج</button></nav>' : '') + '</header>';
}
function need(fn) { return function () { if (!CUST) { try { history.replaceState(null, '', '#/CustomerLogin'); } catch (e) { } return P.CustomerLogin.r(); } return fn(); }; }

/* ---------- customer pages ---------- */
P.CustomerLogin = { cust: 1, t: 'دخول العملاء', r: function () {
  if (CUST) { try { history.replaceState(null, '', '#/CustHome'); } catch (e) { } return P.CustHome.r(); }
  return topbar('') + '<h1 class="rh">دخول العملاء</h1><p class="mut rsub">حساب واحد للاستقدام والإيجار · يعمل على الجوال والكمبيوتر</p><div class="rgrid">' +
    '<section class="rcd"><h2>تسجيل الدخول</h2><p class="mut sm">لعملاء الاستقدام والإيجار</p>' +
    '<form id="rlogin" class="rform"><label>رقم الجوال<input id="rph" inputmode="numeric" autocomplete="tel" placeholder="05xxxxxxxx" maxlength="10"></label><label>كلمة المرور (8 أرقام)<input id="rpw" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password"></label><button type="submit" class="xbt">دخول</button></form>' +
    '<p class="mut sm">للتجربة: 0555000111 · 13572468</p></section>' +
    '<section class="rcd"><h2>عميل جديد</h2><p class="mut sm">سجّل مرة وحدة وتستخدم نفس الحساب للاستقدام والإيجار</p><form id="rreg" class="rform"><label>الاسم الكامل<input id="rgn" autocomplete="name"></label><label>رقم الهوية الوطنية / الإقامة<input id="rgi" inputmode="numeric" maxlength="10" placeholder="10 أرقام"></label><label>رقم الجوال<input id="rgp" inputmode="numeric" maxlength="10" placeholder="05xxxxxxxx"></label><label>كلمة المرور (8 أرقام)<input id="rgw" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></label><p class="mut sm">لا يتكرر نفس الرقم أكثر من 4 مرات</p><button type="submit" class="xbt">إنشاء الحساب</button></form></section></div>' +
    '<ol class="rflow"><li><b>سجّل وادخل</b><span>بالجوال وكلمة المرور</span></li><li><b>اختر الخدمة</b><span>استقدام أو إيجار</span></li><li><b>أكّد هويتك عبر نفاذ</b><span>للإيجار فقط · مطابقة الهوية مع الجوال</span></li></ol>' +
    '<p class="rfoot"><a href="#/Landing">← الصفحة الرئيسية</a> · <a href="#/StaffLogin">دخول الموظفين والإدارة</a></p>';
} };
P.CustHome = { cust: 1, t: 'حسابي', r: need(function () {
  sweep(); var h = myHold();
  var naf = CUST.naf ? chip('✓ موثّقة عبر نفاذ', 'g') : chip('غير موثّقة بنفاذ', 'a');
  return topbar('home') + '<h1 class="rh">أهلًا ' + esc(CUST.name.split(' ')[0]) + ' 👋</h1><p class="mut rsub">اختر الخدمة اللي تبيها</p>' +
    '<section class="rcd racc"><div class="xrow"><b>' + esc(CUST.name) + '</b>' + naf + '</div><div class="raccg"><span>الجوال <b dir="ltr">' + mph(CUST.ph) + '</b></span><span>الهوية <b dir="ltr">' + mid(CUST.nid) + '</b></span><span>التأشيرة <b dir="ltr">' + (CUST.visa ? mid(CUST.visa) : '—') + '</b></span></div></section>' +
    '<div class="rgrid"><section class="rcd rsvc rec"><div class="xrow"><h2>🛂 الاستقدام</h2>' + chip('بدون نفاذ', 'g') + '</div><p class="mut">اختر العاملة من السير الذاتية واحجزها باسمك 72 ساعة للسداد بالتحويل.</p>' +
    (h ? '<div class="rmine">لديك حجز قائم للعاملة <b>' + esc(CANDS[h.ci].n) + '</b> · ' + esc(h.st !== 'musaned' ? 'متبقي ' + remTxt(rem(h)) : STN[h.st]) + '</div><a class="xbt" href="#/RecMy">متابعة طلبي</a>' : '<a class="xbt" href="#/' + 'RecCVs' + '">' + 'تصفح السير الذاتية' + '</a>') + '</section>' +
    '<section class="rcd rsvc rent"><div class="xrow"><h2>🏠 الإيجار</h2>' + (CUST.naf ? chip('هويتك موثّقة', 'g') : chip('يتطلب نفاذ', 'b')) + '</div><p class="mut">بالساعة أو اليوم أو الشهر داخل نجران وضواحيها · السداد عبر الموقع: بطاقة، تابي، تمارا، أو نقدًا في المكتب.</p>' +
    (CUST.naf ? '<a class="xbt" href="#/AvailableWorkers">تصفح العاملات المتاحة</a>' : '<p class="sm">قبل أول حجز إيجار نؤكد هويتك عبر نفاذ لمطابقة رقم الهوية مع رقم الجوال.</p>' + btn('🔐 تأكيد الهوية عبر نفاذ', 'rnafath', '', '')) + '</section></div>';
}) };
P.RecVisa = { cust: 1, t: 'رقم التأشيرة', r: need(function () {
  go("RecCVs"); return "";
}) };
P.RecCVs = { cust: 1, t: 'السير الذاتية', r: need(function () {
  sweep();
  var mine = myHold(), cos = [];
  var list = CANDS.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { return o.c.s === 'متاحة' || (mine && mine.ci === o.i); });
  list.forEach(function (o) { if (cos.indexOf(o.c.co) < 0) cos.push(o.c.co); });
  return topbar('cv') + '<h1 class="rh">السير الذاتية المتاحة</h1><p class="mut rsub">اختر السيرة التي ترغب في حجزها لمدة ٧٢ ساعة</p>' + note() +
    (mine ? '<div class="rmine">لديك حجز قائم للعاملة <b>' + esc(CANDS[mine.ci].n) + '</b> · ' + esc(mine.st !== 'musaned' ? 'متبقي ' + remTxt(rem(mine)) : STN[mine.st]) + ' <a href="#/RecMy">إكمال الطلب ←</a></div>' : '') +
    '<div class="xf" role="group" aria-label="تصفية حسب الدولة"><button type="button" class="xfc on" data-cf="">الكل</button>' + cos.map(function (c) { return '<button type="button" class="xfc" data-cf="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
    '<section class="xcv">' + list.map(function (o) {
      var c = o.c, me = mine && mine.ci === o.i;
      return '<article class="xcvc' + (me ? ' rme' : '') + '" data-co="' + esc(c.co) + '"><div class="xav" aria-hidden="true">' + esc(c.n.charAt(0)) + '</div><div class="xrow"><b>' + esc(c.n) + '</b>' + (me ? chip('محجوزة لك', 'a') : chip('متاحة', 'g')) + '</div><p class="mut">' + esc(c.co) + ' · ' + c.age + ' سنة · خبرة ' + c.ex + ' سنوات</p><p>' + esc(c.sk) + '</p><p class="mut">' + esc(c.lg) + '</p><div class="xrow"><span class="mut">الراتب</span><b>' + fmt(c.sal) + ' ر.س</b></div>' +
        (me ? btn('إكمال السداد', 'rgomy', '', 'sm') : btn('احجزها لي 3 أيام', 'rhold', 'data-i="' + o.i + '"', 'sm')) + '</article>';
    }).join('') + '</section>';
}) };
P.RecMy = { cust: 1, t: 'طلبي', r: need(function () {
  sweep(); var h = myHold();
  if (!h) return topbar('my') + '<section class="rcd rnarrow"><h2>لا يوجد حجز حاليًا</h2><p class="mut">اختر عاملة من السير الذاتية واحجزها 3 أيام للسداد.</p><a class="xbt" href="#/RecCVs">تصفح السير الذاتية</a></section>';
  var c = CANDS[h.ci], order = ['held', 'review', 'musaned'], k = order.indexOf(h.st);
  var steps = '<ol class="rsteps">' + ['الحجز', 'رفع إيصال التحويل', 'تأكيد السداد في مساند'].map(function (s, j) { return '<li class="' + (j < k || h.st === 'musaned' ? 'done' : j === k ? 'now' : '') + '">' + s + '</li>'; }).join('') + '</ol>';
  var clock = h.st !== 'musaned' ? '<div class="rclock"><span>' + (h.st === 'review' ? 'إيصالك قيد المراجعة · ' : '') + 'متبقي على انتهاء الحجز</span><b>' + remTxt(rem(h)) + '</b><small>ينتهي ' + dt(h.at + HOLD) + ' · لا يُمدَّد</small></div>' :
    '<div class="rclock ok"><span>الحالة</span><b>' + esc(STN[h.st]) + '</b></div>';
  var pay = h.st === 'held' ? '<h3 class="xgh">حوّل المبلغ لأحد حسابات المكتب</h3>' + bankImg() + (h.rej ? '<p class="sherr">رُفض الإيصال السابق: ' + esc(h.rej) + ' · ارفع إيصالًا جديدًا</p>' : '') +
    '<label class="xbt rup">📎 إرفاق إيصال التحويل<input type="file" id="rrc" accept="image/*,application/pdf" hidden></label><p class="mut sm">ارفع الإيصال قبل انتهاء المهلة، والمكتب يراجعه ويؤكد السداد.</p>' :
    h.rc ? '<h3 class="xgh">الإيصال المرفق</h3>' + (h.rc.u ? '<img class="rrcimg" src="' + h.rc.u + '" alt="إيصال التحويل">' : '<span class="tcf">📎 ' + esc(h.rc.n) + '</span>') : '';
  return topbar('my') + '<h1 class="rh">طلب الاستقدام</h1>' + note() + '<div class="rgrid"><section class="rcd"><div class="xrow"><h2>' + esc(c.n) + '</h2>' + chip(STN[h.st], STT[h.st]) + '</div><p class="mut">' + esc(c.co) + ' · ' + c.age + ' سنة · ' + esc(c.sk) + '</p><p class="mut sm">محجوزة باسم: ' + esc(h.cn) + ' · تأشيرة ' + esc(h.visa) + '</p>' + clock + steps +
    (h.st === 'held' ? btn('إلغاء الحجز', 'rmycancel', '', 'sm ghost') : '') + '</section><section class="rcd">' + (pay || '<p class="mut">تم تأكيد السداد في مساند · الحجز مؤكد باسمك.</p>') + '</section></div>';
}) };

/* ---------- manager page ---------- */
P.RecHolds = { t: 'حجوزات الاستقدام والسداد', r: function () {
  sweep(); var A = active();
  var c = function (s) { return A.filter(function (h) { return h.st === s; }).length; };
  var perms = U.MEM && U.me && U.me() === 'المدير' ? card('🔐 صلاحيات السداد', '<p class="mut sm">يحددها المدير لكل موظف</p><div class="xtw"><table class="xt shpt"><thead><tr><th>الموظف</th><th>تأكيد السداد (التحويل · مساند)</th><th>تعديل صورة الحسابات</th></tr></thead><tbody>' + U.MEM.filter(function (m) { return m !== 'المدير'; }).map(function (m) {
    return '<tr><td data-l="الموظف"><b>' + esc(m) + '</b></td>' + ['pay', 'bank'].map(function (k) { return '<td><label class="shpk"><input type="checkbox" data-perm="' + k + '" data-u="' + esc(m) + '"' + (can(k, m) ? ' checked' : '') + ' aria-label="' + esc(k + ' ' + m) + '"></label></td>'; }).join('') + '</tr>';
  }).join('') + '</tbody></table></div>') : '';
  var rows = A.map(function (h) { return { h: h, c: CANDS[h.ci] }; });
  return head('حجوزات الاستقدام والسداد', 'حجز 72 ساعة للسداد بالتحويل بدون تمديد · تأكيد استلام التحويل = تم السداد في مساند', meSel('shme') + btn('⏩ محاكاة مرور يوم', 'rsim', '', 'ghost') + '<a class="xbt ghost" href="#/CustomerLogin">بوابة العميل ↗</a>') +
    kpis([{ l: 'بانتظار التحويل', v: c('held'), tone: 'a' }, { l: 'إيصالات للمراجعة', v: c('review'), tone: 'b' }, { l: 'تنتهي خلال 24 ساعة', v: A.filter(function (h) { return h.st !== 'musaned' && rem(h) < DAY; }).length, tone: 'r' }, { l: 'مؤكدة', v: c('musaned'), tone: 'g' }]) +
    card('الحجوزات', table([
      { l: 'العاملة', r: function (o) { return '<b>' + esc(o.c.n) + '</b><small class="sub">' + esc(o.c.co) + '</small>'; } },
      { l: 'محجوزة للعميل', r: function (o) { return '<b>' + esc(o.h.cn) + '</b><small class="sub">' + esc(o.h.ph) + ' · تأشيرة ' + esc(o.h.visa) + '</small>'; } },
      { l: 'الحالة', r: function (o) { return chip(STN[o.h.st], STT[o.h.st]); } },
      { l: 'المتبقي', r: function (o) { return o.h.st !== 'musaned' ? '<b class="' + (rem(o.h) < DAY ? 'late' : '') + '">' + remTxt(rem(o.h)) + '</b>' : '—'; } },
      { l: 'الإيصال', noexp: 1, r: function (o) { return o.h.rc ? btn('عرض', 'rview', 'data-k="' + HOLDS.indexOf(o.h) + '"', 'sm ghost') : '—'; } },
      { l: 'إجراء', noexp: 1, r: function (o) { var k = 'data-k="' + HOLDS.indexOf(o.h) + '"', b = '';
        if (o.h.st === 'review') b = can('pay') ? btn('✓ استلام التحويل · تم السداد في مساند', 'rok', k, 'sm') + btn('رفض', 'rrej', k, 'sm ghost') : '<span class="mut sm">بانتظار صاحب صلاحية تأكيد السداد</span>';
        if (o.h.st !== 'musaned' && U.me && U.me() === 'المدير') b += btn('إلغاء الحجز', 'rcancel', k, 'sm ghost');
        return b || '—'; } }
    ], rows, { title: 'حجوزات الاستقدام', ph: 'ابحث باسم العاملة أو العميل', tag: function (o) { return STN[o.h.st]; }, chips: [['', 'الكل', rows.length]].concat(['held', 'review', 'musaned'].map(function (s) { return [STN[s], STN[s], c(s)]; })) })) +
    '<div class="wgrid">' + card('صورة حسابات المكتب', bankImg() + (can('bank') ? '<div class="xrow mt"><label class="xbt sm ghost shup">🖼 تغيير الصورة<input type="file" id="rbank" accept="image/*" hidden></label>' + (BANK ? btn('إرجاع الصورة المؤقتة', 'rbankreset', '', 'sm ghost') : '') + '</div>' : '<p class="mut sm">التعديل لمن لديه صلاحية «تعديل صورة حسابات المكتب»</p>')) + perms + '</div>';
} };

/* ---------- actions ---------- */
function H(t) { return HOLDS[+t.dataset.k]; }
ACT.rnafath = function () {
  if (!CUST) { go('CustomerLogin'); return; }
  NAFV = 10 + Math.floor(Math.random() * 89);
  drawer('تأكيد الهوية عبر نفاذ', '<div class="rnafd"><p>نطابق رقم الهوية <b dir="ltr">' + mid(CUST.nid) + '</b> مع الجوال <b dir="ltr">' + mph(CUST.ph) + '</b></p><p>افتح تطبيق <b>نفاذ</b> واختر الرقم:</p><b class="rnum">' + NAFV + '</b><p class="mut sm">محاكاة · يتفعّل بعد الربط الرسمي مع النفاذ الوطني</p>' + btn('✓ تم التحقق (محاكاة)', 'rnafok') + '</div>');
};
ACT.rnafok = function () { closeDr(); if (!CUST) return; CUST.naf = 1; log('اعتماد', 'بوابة العميل', 'تأكيد هوية عبر نفاذ (محاكاة) · ' + CUST.name, 'غير موثّق', 'موثّق'); toast('تم تأكيد هويتك عبر نفاذ · تقدر تحجز في الإيجار الحين'); go('AvailableWorkers'); };
ACT.rout = function () { sessionStorage.removeItem("asayel-recruit-session"); CUST = null; toast('تم تسجيل الخروج'); go('CustomerLogin'); };
ACT.rcontact = function () { toast('يُضاف رقم واتساب المكتب الرسمي عند الإطلاق'); };
ACT.rgomy = function () { go('RecMy'); };
ACT.rhold = function (t) {
  var i = +t.dataset.i, c = CANDS[i];
  if (myHold()) { toast('عندك حجز قائم · أكمل سداده أو ألغه قبل حجز عاملة أخرى'); return; }
  if (c.s !== 'متاحة') { toast('هذه العاملة لم تعد متاحة'); rerender(); return; }
  drawer('تأكيد الحجز', note() + '<p>تحجز <b>' + esc(c.n) + '</b> (' + esc(c.co) + ') باسم <b>' + esc(CUST.name) + '</b> لمدة 3 أيام (72 ساعة) للسداد بالتحويل البنكي، بدون تمديد.</p>' + btn('تأكيد الحجز', 'rholdok', 'data-i="' + i + '"') + ' <button type="button" class="xbt ghost" data-close>رجوع</button>');
};
ACT.rholdok = function (t) {
  var i = +t.dataset.i, c = CANDS[i]; if (c.s !== 'متاحة' || myHold()) { closeDr(); return; }
  var h = { ci: i, cn: CUST.name, ph: CUST.ph, visa: '', at: Date.now(), st: 'held' };
  HOLDS.unshift(h); c.s = 'محجوزة لعميل'; c.hold = h;
  log('إضافة', 'حجوزات الاستقدام', 'حجز ' + c.n + ' للعميل ' + CUST.name + ' (3 أيام)', 'متاحة', 'محجوزة');
  closeDr(); toast('تم حجز ' + c.n + ' باسمك لمدة 3 أيام · يمكنك الآن إضافة رقم التأشيرة'); go('RecMy');
};
ACT.rmycancel = function () { var h = myHold(); if (!h) return; release(h, 'cancel'); toast('تم إلغاء الحجز ورجعت العاملة متاحة'); rerender(); };
ACT.rview = function (t) { var h = H(t); drawer('إيصال التحويل · ' + h.cn, (h.rc.u ? '<img class="rrcimg" src="' + h.rc.u + '" alt="إيصال التحويل">' : '<p class="tcf">📎 ' + esc(h.rc.n) + '</p><p class="mut sm">ملف تجريبي</p>') + '<p class="mut sm">رُفع ' + dt(h.rc.at || h.at) + '</p>'); };
ACT.rok = function (t) { var h = H(t); if (!can('pay')) { toast('ليست لديك صلاحية تأكيد السداد'); return; } h.st = 'musaned'; CANDS[h.ci].s = 'تم الاختيار'; log('اعتماد', 'حجوزات الاستقدام', 'استلام التحويل والسداد في مساند · ' + h.cn + ' · ' + CANDS[h.ci].n, 'إيصال للمراجعة', 'مؤكدة'); toast('تم تأكيد السداد في مساند · الحجز مؤكد باسم ' + h.cn); rerender(); };
ACT.rrej = function (t) { var k = t.dataset.k; drawer('رفض الإيصال', '<label class="shfl"><span>سبب الرفض</span><select id="rrjs" class="xsel"><option>المبلغ غير مطابق</option><option>الإيصال غير واضح</option><option>التحويل لم يصل للحساب</option></select></label><p class="mut sm">يُبلَّغ العميل، ويقدر يرفع إيصالًا جديدًا ضمن المهلة المتبقية بدون تمديد.</p>' + btn('تأكيد الرفض', 'rrejdo', 'data-k="' + k + '"')); };
ACT.rrejdo = function (t) { var h = H(t), why = document.getElementById('rrjs').value; h.st = 'held'; h.rej = why; h.rc = null; log('تعديل', 'حجوزات الاستقدام', 'رفض إيصال ' + h.cn + ' · ' + why, 'إيصال للمراجعة', 'محجوزة'); closeDr(); toast('رُفض الإيصال وأُبلغ العميل'); rerender(); };
ACT.rcancel = function (t) { var h = H(t); release(h, 'cancel'); toast('أُلغي الحجز ورجعت العاملة متاحة'); rerender(); };
ACT.rsim = function () { HOLDS.forEach(function (h) { if (h.st !== 'musaned') h.at -= DAY; }); var before = HOLDS.length; sweep(); var n = before - HOLDS.length; toast(n ? 'مرّ يوم · انتهت مهلة ' + n + ' حجز ورجعت العاملة متاحة' : 'مرّ يوم على الحجوزات'); rerender(); };
ACT.rbankreset = function () { BANK = null; try { localStorage.removeItem('asayel-bankimg'); } catch (e) { } toast('رجعت الصورة المؤقتة'); rerender(); };

/* ---------- events ---------- */
function v(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
function okPw(p) { if (!/^\d{8}$/.test(p)) return false; for (var d = 0; d < 10; d++) if (p.split(String(d)).length - 1 > 4) return false; return true; }
document.addEventListener('submit', function (e) {
  var id = e.target.id; if (['rlogin', 'rreg', 'rvisa'].indexOf(id) < 0) return; e.preventDefault(); e.stopPropagation();
  if (id === 'rlogin') {
    var a = ACCTS.filter(function (x) { return x.ph === v('rph'); })[0];
    if (!a || a.pw !== v('rpw')) { toast('رقم الجوال أو كلمة المرور غير صحيحة'); return; }
    CUST = a; sessionStorage.setItem("asayel-recruit-session",a.ph); log('دخول', 'بوابة العميل', 'دخول عميل · ' + a.name, '—', 'جوال وكلمة مرور'); go('CustHome');
  }
  if (id === 'rreg') {
    var n = v('rgn'), nid = v('rgi'), ph = v('rgp'), pw = v('rgw');
    if (n.split(/\s+/).length < 3) { toast('اكتب الاسم الكامل (ثلاثي على الأقل)'); return; }
    if (!/^[12]\d{9}$/.test(nid)) { toast('رقم الهوية أو الإقامة 10 أرقام ويبدأ بـ 1 أو 2'); return; }
    if (!/^05\d{8}$/.test(ph)) { toast('رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام'); return; }
    if (!okPw(pw)) { toast('كلمة المرور 8 أرقام، ولا يتكرر نفس الرقم أكثر من 4 مرات'); return; }
    if (ACCTS.some(function (x) { return x.ph === ph; })) { toast('هذا الجوال مسجّل · سجّل دخولك'); return; }
    if (ACCTS.some(function (x) { return x.nid === nid; })) { toast('رقم الهوية مسجّل بحساب آخر · راجع المكتب'); return; }
    CUST = { name: n, nid: nid, ph: ph, pw: pw, visa: '', naf: 0 }; ACCTS.push(CUST); log('إضافة', 'بوابة العميل', 'تسجيل عميل جديد · ' + n, '—', 'بانتظار تأكيد نفاذ'); toast('تم إنشاء حسابك · أهلًا ' + n.split(' ')[0]); go('CustHome');
  }
  if (id === 'rvisa') {
    var vn = v('rvn'); if (!/^\d{10}$/.test(vn)) { toast('رقم التأشيرة 10 أرقام'); return; }
    CUST.visa = vn; log('تعديل', 'بوابة العميل', 'رقم تأشيرة · ' + CUST.name, '—', vn.slice(0, 1) + '•••••••' + vn.slice(-2)); go('RecCVs');
  }
}, true);
document.addEventListener('change', function (e) {
  var id = e.target.id, f = e.target.files && e.target.files[0]; if (!f) return;
  if (id === 'rrc') {
    var h = myHold(); if (!h || h.st !== 'held') return; if (f.size > 5e6) { toast('حجم الإيصال كبير · الحد 5 ميجا'); return; }
    var done = function (u) { h.st = 'review'; h.rc = { n: f.name, u: u, at: Date.now() }; h.rej = ''; log('إضافة', 'حجوزات الاستقدام', 'إيصال تحويل · ' + h.cn + ' · ' + CANDS[h.ci].n, 'محجوزة', 'إيصال للمراجعة'); toast('تم رفع الإيصال · المكتب يراجعه قبل انتهاء المهلة'); rerender(); };
    if (/^image\//.test(f.type)) { var r = new FileReader(); r.onload = function () { done(r.result); }; r.readAsDataURL(f); } else done('');
  }
  if (id === 'rbank') {
    if (!can('bank')) return; if (!/^image\//.test(f.type) || f.size > 2e6) { toast('اختر صورة أقل من 2 ميجا'); return; }
    var rb = new FileReader(); rb.onload = function () { BANK = rb.result; try { localStorage.setItem('asayel-bankimg', BANK); } catch (er) { } log('تعديل', 'حجوزات الاستقدام', 'صورة حسابات المكتب', 'السابقة', f.name); toast('تم تحديث صورة الحسابات · تظهر للعملاء مباشرة'); rerender(); }; rb.readAsDataURL(f);
  }
});

/* ---------- register + styles ---------- */
var ci = U.NEW.indexOf('Candidates'); U.NEW.splice(ci >= 0 ? ci + 1 : U.NEW.length, 0, 'RecHolds');
var css = '.xs.xcu{display:block;min-height:100vh;background:#FBF8F1}.xcu .xmn{max-width:1040px;margin:0 auto;padding:16px}.rtop{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:6px 0 14px;border-bottom:1px solid #EFE8DA;margin-bottom:16px}.rbr{display:flex;align-items:center;gap:10px}.rbr div{display:flex;flex-direction:column}.rbr span{font-size:12.5px;color:#4A5650}.rnav{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.rnav a{padding:7px 12px;border-radius:999px;color:#1F2A24;text-decoration:none;font-size:14px}.rnav a.on{background:#1F6B4F;color:#fff}' +
'.rh{font-size:24px;margin:4px 0}.rsub{margin:0 0 12px}.rgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.rcd{background:#fff;border:1.5px solid #E2D9C6;border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px}.rcd h2{margin:0;font-size:20px}.rnarrow{max-width:520px;margin:0 auto}.rform{display:flex;flex-direction:column;gap:10px}.rform label{display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:#4A5650}.rform input{height:44px;border:1.5px solid #E2D9C6;border-radius:10px;padding:0 12px;font:16px "IBM Plex Sans Arabic",sans-serif;box-sizing:border-box;width:100%}.rform input:focus{outline:none;border-color:#1F6B4F}' +
'.rreg summary{cursor:pointer;color:#1F6B4F;font-weight:600}.rnaf{height:48px;font-size:16px}.rli{margin:0;padding-inline-start:18px;font-size:13.5px;color:#4A5650}.rfoot{text-align:center;margin-top:18px}.rfoot a{color:#4A5650}.rnote{background:#FFF4DC;border:1.5px solid #E9C77E;border-radius:12px;padding:10px 14px;font-size:14px;margin:8px 0 12px}.rmine{background:#E6F0EA;border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:14px}.rmine a{color:#164D39;font-weight:700}' +
'.rask{display:flex;flex-direction:column;gap:6px;background:#F5EFE2;border-radius:12px;padding:12px}.rme{outline:2px solid #D98A2B}.rclock{background:#FFF4DC;border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}.rclock b{font-size:24px;color:#8A4B0F}.rclock.paused{background:#E7EEF8}.rclock.paused b{color:#18467D;font-size:19px}.rclock.ok{background:#E6F0EA}.rclock.ok b{color:#164D39;font-size:18px}.rclock small{color:#4A5650}' +
'.rsteps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;counter-reset:s}.rsteps li{counter-increment:s;display:flex;align-items:center;gap:8px;font-size:14px;color:#8A8F8B}.rsteps li:before{content:counter(s);width:24px;height:24px;border-radius:50%;border:1.5px solid #CFC6B3;display:grid;place-items:center;font-size:12px;flex:none}.rsteps li.done{color:#164D39}.rsteps li.done:before{content:"✓";background:#1F6B4F;border-color:#1F6B4F;color:#fff}.rsteps li.now{color:#1F2A24;font-weight:700}.rsteps li.now:before{border-color:#D98A2B;background:#FFF4DC}' +
'.rbank{width:100%;height:auto;border-radius:14px;display:block}.rrcimg{max-width:100%;border-radius:10px;border:1px solid #E2D9C6}.rup{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;height:46px}.rnafd{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}.rnum{font-size:56px;color:#1F6B4F;background:#E6F0EA;border-radius:18px;padding:6px 28px}' +
'.rflow{list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;counter-reset:f}.rflow li{counter-increment:f;background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}.rflow li:before{content:counter(f);width:24px;height:24px;border-radius:50%;background:#1F6B4F;color:#fff;display:grid;place-items:center;font-size:12px;margin-bottom:4px}.rflow span{font-size:13px;color:#4A5650}.racc{margin-bottom:16px}.raccg{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:14px;color:#4A5650}.raccg b{color:#1F2A24}.rsvc{border-top:5px solid #2563A8}.rsvc.rent{border-top-color:#1F6B4F}.rsvc .xbt{align-self:flex-start}.xcu a.xbt{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.rsvc.rec a.xbt{background:#2563A8}' +
'@media (max-width:820px){.rflow{grid-template-columns:1fr}.rgrid{grid-template-columns:1fr}.rh{font-size:21px}.xcu .xmn{padding:12px 16px}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
