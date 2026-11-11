(function () {
'use strict';
/* "معاينة باسم": customer brings a worker from outside the office CV list (no 3-month office warranty) */
function init() {
  var U = window.XP_U, V = window.XP_V; if (!U || !V || !U.cust || !U.P.RecCVs) return;
  var P = U.P, ACT = U.ACT, esc = U.esc, btn = U.btn, card = U.card, chip = U.chip, drawer = U.drawer, log = U.log, CANDS = U.CANDS;
  var can = U.can || function () { return true; };
  function toast(m) { U.toast(m); }
  function rerender() { var h = window.XP_HOST || {}; if (h.reopen) h.reopen(); }
  function closeDr() { var d = document.getElementById('xdr'); if (d) d.classList.remove('show'); }
  function nowT() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  if (U.PERMS && !U.PERMS.some(function (x) { return x[0] === 'named'; })) U.PERMS.push(['named', 'طلبات المعاينة باسم']);
  if (U.PERM) U.PERM['ريم (الاستقدام)'] = Object.assign(U.PERM['ريم (الاستقدام)'] || {}, { named: 1 });

  var NR = [], SEQ = 300, VSEQ = 500; /* named requests */
  var STN = { wait: 'بانتظار رد المكتب', ok: 'مقبول · بدأت الإجراءات', no: 'مرفوض' };
  var TONE = { wait: 'a', ok: 'g', no: 'r' };
  var NOTE = 'المعاينة باسم: عاملة تختارها أنت من خارج قائمة السير الذاتية لدى المكتب. لها إجراءات خاصة، و<b>لا يشملها ضمان المكتب للأشهر الثلاثة الأولى</b>.';
  function mine() { var c = U.cust(); return c ? NR.filter(function (r) { return r.ph === c.ph; }) : []; }

  /* customer: one blank CV per nationality */
  var cvr = P.RecCVs.r;
  P.RecCVs.r = function () {
    var h = cvr.apply(this, arguments), c = U.cust(); if (!c || !c.visa || h.indexOf('class="xcv"') < 0) return h;
    var cos = []; CANDS.forEach(function (x) { if (cos.indexOf(x.co) < 0) cos.push(x.co); });
    var cards = cos.map(function (co) {
      return '<article class="xcvc nmcv" data-co="' + esc(co) + '"><div class="xav nmav" aria-hidden="true">؟</div><div class="xrow"><b>معاينة باسم</b>' + chip(co, 'n') + '</div><p class="mut">عاملة تعرفها من خارج قائمة المكتب</p><p class="mut">ترسل صورة جوازها ورقم جوالها، والمكتب يرد عليك</p><p class="nmw">⚠ بدون ضمان المكتب 3 أشهر</p>' + btn('طلب معاينة باسم', 'nmopen', 'data-co="' + esc(co) + '"', 'sm ghost') + '</article>';
    }).join('');
    var my = mine(), top = my.length ? '<div class="rmine">لديك ' + my.length + ' طلب معاينة باسم · آخر حالة: <b>' + STN[my[0].st] + '</b> <a href="#/RecMy">التفاصيل ←</a></div>' : '';
    var i = h.lastIndexOf('</section>');
    h = h.slice(0, i) + cards + h.slice(i);
    var j = h.indexOf('<div class="xf"'); return j > 0 ? h.slice(0, j) + top + h.slice(j) : h;
  };
  var PEND = null;
  ACT.nmopen = function (t) {
    var co = t.dataset.co; PEND = null;
    drawer('طلب معاينة باسم · ' + co, '<div class="rnote">' + NOTE + '</div>' +
      '<label class="shfl"><span>صورة جواز العاملة *</span><label class="xbt sm ghost shup">📎 إرفاق صورة الجواز<input type="file" id="nmpp" accept="image/*,application/pdf" hidden></label><span id="nmppn" class="mut sm">لم يُرفق بعد</span></label>' +
      '<label class="shfl"><span>رقم جوال العاملة للتواصل * (مع رمز الدولة)</span><input id="nmph" dir="ltr" inputmode="tel" placeholder="+254 7xx xxx xxx"></label>' +
      '<label class="shfl"><span>اسم العاملة (اختياري)</span><input id="nmwn"></label><label class="shfl"><span>ملاحظات (اختياري)</span><input id="nmnt" placeholder="مثال: عملت عند أقاربي سابقًا"></label>' +
      '<label class="shck"><input type="checkbox" id="nmack"> فهمت أن المعاينة باسم لا يشملها ضمان المكتب للأشهر الثلاثة الأولى</label>' +
      '<div class="xrow mt">' + btn('إرسال الطلب للمكتب', 'nmsend', 'data-co="' + esc(co) + '"') + '</div>');
  };
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'nmpp') return; var f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.size > 5e6) { toast('حجم الملف كبير · الحد 5 ميجا'); return; }
    var done = function (u) { PEND = { n: f.name, u: u }; var s = document.getElementById('nmppn'); if (s) s.textContent = '✓ ' + f.name; };
    if (/^image\//.test(f.type)) { var r = new FileReader(); r.onload = function () { done(r.result); }; r.readAsDataURL(f); } else done('');
  });
  ACT.nmsend = function (t) {
    var c = U.cust(); if (!c) return; var g = function (id) { return ((document.getElementById(id) || {}).value || '').trim(); };
    var ph = g('nmph').replace(/[\s-]/g, '');
    if (!PEND) { toast('أرفق صورة جواز العاملة'); return; }
    if (!/^\+?\d{9,15}$/.test(ph)) { toast('اكتب رقم جوال العاملة مع رمز الدولة'); return; }
    if (!document.getElementById('nmack').checked) { toast('أكّد إنك اطلعت على أن المعاينة باسم بدون ضمان'); return; }
    var r = { id: 'م-' + (SEQ++), cn: c.name, ph: c.ph, visa: c.visa, co: t.dataset.co, wph: ph, wn: g('nmwn'), nt: g('nmnt'), pp: PEND, st: 'wait', at: nowT(), rep: '' };
    NR.unshift(r); PEND = null;
    log('إضافة', 'المعاينة باسم', 'طلب معاينة باسم ' + r.id + ' · ' + r.cn + ' · ' + r.co, '—', STN.wait);
    closeDr(); toast('أُرسل طلبك للمكتب · بنرد عليك في حال تم العمل عليه'); location.hash = '#/RecMy';
  };

  /* customer: status in "طلبي" */
  var myr = P.RecMy.r;
  P.RecMy.r = function () {
    var h = myr.apply(this, arguments).replace(/الضمان 90 يوم من ([^<]*?) · بدون ضمان/g, 'التاريخ $1 · معاينة باسم بدون ضمان'), my = mine(); if (!my.length) return h;
    return h + '<section class="rcd nmmy"><h2>📄 طلبات المعاينة باسم</h2><p class="mut sm">' + NOTE + '</p>' + my.map(function (r) {
      return '<div class="nmr"><div class="xrow"><b>' + r.id + ' · ' + esc(r.co) + (r.wn ? ' · ' + esc(r.wn) : '') + '</b>' + chip(STN[r.st], TONE[r.st]) + '</div><p class="mut sm">أُرسل ' + r.at + ' · جوال العاملة <span dir="ltr">' + esc(r.wph) + '</span></p>' + (r.rep ? '<p class="nmrep">💬 رد المكتب: ' + esc(r.rep) + '</p>' : '<p class="mut sm">بنرد عليك هنا وعلى واتساب في حال تم العمل على الطلب.</p>') + '</div>';
    }).join('') + '</section>';
  };

  /* office: requests list inside bookings page, by permission */
  function officeCard() {
    if (!NR.length) return '';
    var ed = can('named');
    return card('📄 طلبات المعاينة باسم (' + NR.filter(function (r) { return r.st === 'wait'; }).length + ' بانتظار الرد)', '<p class="mut sm">عاملة من خارج قائمة المكتب · إجراءات خاصة · بدون ضمان 3 أشهر' + (ed ? '' : ' · 🔒 الرد لمن لديه صلاحية «طلبات المعاينة باسم»') + '</p>' + NR.map(function (r, i) {
      var k = 'data-i="' + i + '"';
      return '<div class="nmr"><div class="xrow"><b>' + r.id + ' · ' + esc(r.cn) + '</b>' + chip(STN[r.st], TONE[r.st]) + '</div><p class="mut sm">' + esc(r.co) + (r.wn ? ' · العاملة ' + esc(r.wn) : '') + ' · جوال العاملة <b dir="ltr">' + esc(r.wph) + '</b> · تأشيرة ' + esc(r.visa) + ' · ' + r.at + (r.nt ? ' · ' + esc(r.nt) : '') + '</p><div class="xrow">' +
        btn('🛂 الجواز', 'nmpass', k, 'sm ghost') + '<a class="xbt sm ghost" href="https://wa.me/' + esc(r.wph.replace(/^\+/, '')) + '" target="_blank" rel="noopener">💬 تواصل مع العاملة</a>' +
        (r.st === 'wait' && ed ? btn('✓ قبول وبدء الإجراءات', 'nmok', k, 'sm') + btn('رفض', 'nmno', k, 'sm ghost') : '') + '</div>' + (r.rep ? '<p class="nmrep">💬 ' + esc(r.rep) + '</p>' : '') + '</div>';
    }).join(''));
  }
  var hr = P.RecHolds.r;
  P.RecHolds.r = function () { var h = hr.apply(this, arguments), c = officeCard(); if (!c) return h; var i = h.indexOf('</header>'); return i > 0 ? h.slice(0, i + 9) + c + h.slice(i + 9) : c + h; };
  ACT.nmpass = function (t) { var r = NR[+t.dataset.i]; drawer('جواز العاملة · ' + r.id, r.pp.u ? '<img class="rrcimg" src="' + r.pp.u + '" alt="صورة جواز العاملة">' : '<p class="tcf">📎 ' + esc(r.pp.n) + '</p>'); };
  function sendC(r, x) { V.CUST[r.cn] = V.CUST[r.cn] || { ph: String(r.ph).replace(/^(\d{2})\d{5}/, '$1•••••'), v: 1 }; V.sendWA(r.cn, 'المعاينة باسم', x); }
  ACT.nmok = function (t) {
    if (!can('named')) { toast('🔒 ليست لديك صلاحية «طلبات المعاينة باسم»'); return; }
    var r = NR[+t.dataset.i]; r.st = 'ok'; r.rep = 'تم قبول طلب المعاينة باسم وبدأنا الإجراءات. تنبيه: لا يشملها ضمان المكتب للأشهر الثلاثة الأولى.';
    var v = { id: 'س-' + (VSEQ++), c: r.cn, w: r.wn || 'معاينة باسم', co: r.co, ag: 'معاينة باسم', st: 2, sd: '—', days: 0, n: 1, e: 'ريم', live: 1, ph: r.ph, named: 1 };
    v.k = { no: '', cd: '', ld: '', ins: '', city: 'NAJRAN', rel: 'مسلمة', ty: 'معاينة باسم', pp: '' };
    V.VISA.unshift(v); sendC(r, r.rep);
    log('اعتماد', 'المعاينة باسم', 'قبول ' + r.id + ' · ' + r.cn + ' · طلب ' + v.id, STN.wait, STN.ok); toast('تم القبول · أُنشئ طلب ' + v.id + ' في متابعة التفييز وأُبلغ العميل'); rerender();
  };
  ACT.nmno = function (t) {
    if (!can('named')) return; drawer('رفض طلب المعاينة باسم', '<label class="shfl"><span>السبب (يظهر للعميل)</span><select id="nmrs" class="xsel"><option>تعذّر التواصل مع العاملة</option><option>بيانات الجواز غير واضحة</option><option>العاملة لا تنطبق عليها الشروط</option></select></label>' + btn('تأكيد الرفض', 'nmnodo', 'data-i="' + t.dataset.i + '"'));
  };
  ACT.nmnodo = function (t) { var r = NR[+t.dataset.i], why = document.getElementById('nmrs').value; r.st = 'no'; r.rep = 'نعتذر، لم نتمكن من إكمال طلب المعاينة باسم: ' + why + '. تقدر تتواصل معنا أو تختار من السير الذاتية.'; sendC(r, r.rep); log('تعديل', 'المعاينة باسم', 'رفض ' + r.id + ' · ' + why, STN.wait, STN.no); closeDr(); toast('رُفض الطلب وأُبلغ العميل'); rerender(); };

  /* delivery of a named worker: no office warranty */
  var fdel = ACT.fdeliver;
  ACT.fdeliver = function (t) {
    var v = V.VISA[+t.dataset.i]; if (!v || !v.named) return fdel(t);
    if (!can('recv')) { toast('🔒 لموظف الاستقبال'); return; }
    var d = new Date(); v.done = 1; v.dt = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() + ' · بدون ضمان';
    V.sendWA(v.c, 'تسليم العاملة', 'تم تسليمك عاملتك ' + v.w + ' اليوم ✅ (معاينة باسم · لا يشملها ضمان المكتب للأشهر الثلاثة الأولى). نتمنى لكم التوفيق 🌷');
    log('اعتماد', 'متابعة الوصول', 'تسليم ' + v.w + ' للعميل ' + v.c + ' (معاينة باسم)', 'في المكتب', 'مع العميل · بدون ضمان'); toast('تم التسليم · معاينة باسم بدون ضمان'); rerender();
  };
  var vt = P.VisaTrack.r;
  P.VisaTrack.r = function () { return vt.apply(this, arguments).replace(/(الوكيل معاينة باسم)/g, '$1 · <b class="nmw">بدون ضمان 3 أشهر</b>').replace(/ · بدون ضمان · الضمان بدأ/g, ' · معاينة باسم بدون ضمان'); };

  var st = document.createElement('style');
  st.textContent = '.nmcv{border-style:dashed;background:#FBF8F1}.nmav{background:#E9E2D4!important;color:#8A6A1E!important}.nmw{color:#B5481B;font-weight:700;font-size:12.5px}.nmr{border:1.5px solid #E2D9C6;border-radius:12px;padding:10px 12px;margin-top:8px;background:#fff;display:flex;flex-direction:column;gap:6px}.nmr p{margin:0}.nmrep{background:#E6F0EA;border-radius:10px;padding:8px 10px;font-size:13.5px}.nmmy{margin-top:16px}';
  document.head.appendChild(st);
  try { if (document.querySelector('#xmain')) rerender(); } catch (e) { }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
})();
