(function () {
'use strict';
/* recruitment journey: portal booking -> payment -> visa stages -> arrival -> office -> delivery, with role permissions */
var R = window.XP_RPATCH = window.XP_RPATCH || {};
(R['x.js'] = R['x.js'] || []).push(
  ["window.XP = {\n  pages: NEW,", "window.XP_V = { VISA: VISA, ARR: ARR, VSTEPS: VSTEPS, GUAR: GUAR, CUST: CUST, RULES: RULES, sendWA: sendWA, fill: fill, chatOf: chatOf, WB: WB, timeline: timeline, stageReply: stageReply };\nwindow.XP = {\n  pages: NEW,"],
  ["AUDIT.unshift({ t: t, u: 'المدير', r: 'المدير',", "var __me = window.XP_ME ? window.XP_ME() : 'المدير'; AUDIT.unshift({ t: t, u: __me, r: __me,"]
);
(R['r.js'] = R['r.js'] || []).push(["U.ACCTS = function () { return ACCTS; };", "U.ACCTS = function () { return ACCTS; }; U.HOLDS = function () { return HOLDS; }; U.cust = function () { return CUST; };"]);
window.XP_ME = function () { if (document.querySelector('.xcu')) return 'العميل (البوابة)'; var U = window.XP_U; return U && U.me ? U.me() : 'المدير'; };

function init() {
  var U = window.XP_U, V = window.XP_V; if (!U || !V || !U.HOLDS) return;
  var P = U.P, ACT = U.ACT, esc = U.esc, btn = U.btn, card = U.card, chip = U.chip, drawer = U.drawer, log = U.log, CANDS = U.CANDS;
  var can = U.can || function () { return true; };
  function toast(m) { U.toast(m); }
  function rerender() { var h = window.XP_HOST || {}; if (h.reopen) h.reopen(); }
  function closeDr() { var d = document.getElementById('xdr'); if (d) d.classList.remove('show'); }
  function me() { return U.me ? U.me() : 'المدير'; }
  var VS = V.VSTEPS;

  /* staff + permissions */
  var RECV = 'منصور (الاستقبال)';
  if (U.MEM && U.MEM.indexOf(RECV) < 0) U.MEM.splice(U.MEM.indexOf('سارة (خدمة العملاء)') >= 0 ? U.MEM.indexOf('سارة (خدمة العملاء)') + 1 : U.MEM.length, 0, RECV);
  var NP = [['rec', 'تحديث مراحل الاستقدام'], ['airport', 'استقبال المطار'], ['recv', 'الاستقبال وتسليم العاملات']];
  if (U.PERMS) NP.forEach(function (p) { if (!U.PERMS.some(function (x) { return x[0] === p[0]; })) U.PERMS.push(p); });
  if (U.PERM) {
    U.PERM['ريم (الاستقدام)'] = Object.assign(U.PERM['ريم (الاستقدام)'] || {}, { rec: 1 });
    U.PERM['ماجد (المشرف)'] = Object.assign(U.PERM['ماجد (المشرف)'] || {}, { airport: 1 });
    U.PERM[RECV] = Object.assign(U.PERM[RECV] || {}, { recv: 1, cust: 1 });
  }
  var PN = {}; NP.concat([['pay', 'تأكيد السداد']]).forEach(function (p) { PN[p[0]] = p[1]; });
  function who(k) { return (U.MEM || []).filter(function (m) { return m !== 'المدير' && can(k, m); }).join('، ') || 'المدير فقط'; }
  function deny(k) { toast('🔒 ليست لديك صلاحية «' + PN[k] + '» · المسموح لهم: ' + who(k)); }
  function roleBar(keys) {
    return '<div class="frole"><span class="frw">👤 تعمل الآن باسم</span>' + U.meSel('shme') + '<span class="frp">' + keys.map(function (k) { return (can(k) ? '✅ ' : '🔒 ') + PN[k]; }).join(' · ') + '</span></div>';
  }

  /* live requests created from the customer portal */
  var AG = { 'الفلبين': 'مانيلا برايت', 'كينيا': 'نيروبي هوم كير', 'إندونيسيا': 'جاكرتا سينار', 'أوغندا': 'كمبالا ستار', 'سريلانكا': 'كولومبو بيرل', 'إثيوبيا': 'أديس نجمة', 'بنغلاديش': 'داكا جرين' };
  var SEQ = 242;
  function live() { return V.VISA.filter(function (v) { return v.live; }); }
  function today() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  function stageMsg(v) { var s = V.stageReply(v).split('\n'); return s.slice(1).join('\n'); }
  function notify(v, ty) { V.sendWA(v.c, ty, stageMsg(v)); }
  function visaFor(name) { return V.VISA.filter(function (v) { return v.c === name && v.live; })[0]; }

  var rok = ACT.rok;
  ACT.rok = function (t) {
    var h = U.HOLDS()[+t.dataset.k]; rok(t);
    if (!h || h.st !== 'musaned' || visaFor(h.cn)) return;
    var c = CANDS[h.ci], v = { id: 'س-' + (SEQ++), c: h.cn, w: c.n, co: c.co, ag: AG[c.co] || 'الوكيل المعتمد', st: 2, sd: '—', days: 0, n: 1, e: 'ريم', live: 1, ph: h.ph };
    V.VISA.unshift(v);
    V.CUST[h.cn] = { ph: String(h.ph).replace(/^(\d{2})\d{5}/, '$1•••••'), v: 1 };
    V.WB.cust = h.cn;
    notify(v, 'تأكيد السداد والعقد');
    log('إضافة', 'متابعة التفييز', 'طلب استقدام جديد ' + v.id + ' · ' + v.c + ' · ' + v.w, '—', VS[v.st]);
  };

  ACT.fnext = function (t) {
    var v = V.VISA[+t.dataset.i]; if (!v) return;
    if (!can('rec')) return deny('rec');
    if (v.st >= 6) return;
    if (v.st === 5) {
      drawer('حجز التذكرة · ' + v.w, '<p class="mut">بيانات الرحلة تُرسل للعميل تلقائيًا، وتظهر في «متابعة الوصول» لموظف استقبال المطار.</p><div class="shg"><label class="shfl"><span>رقم الرحلة</span><input id="ffl" value="SV 1854 عبر الرياض"></label><label class="shfl"><span>مطار الوصول</span><select id="fap" class="xsel"><option>مطار نجران</option><option>مطار أبها</option><option>مطار الملك خالد · الرياض</option></select></label><label class="shfl"><span>موعد الوصول</span><input id="fdt" value="اليوم"></label><label class="shfl"><span>الساعة</span><input id="ftm" value="16:30"></label></div><div class="xrow mt">' + btn('✈ اعتماد التذكرة وإبلاغ العميل', 'fticket', 'data-i="' + t.dataset.i + '"') + '</div>');
      return;
    }
    var b = VS[v.st]; v.st++; notify(v, 'تحديث المرحلة');
    log('تعديل', 'متابعة التفييز', 'طلب ' + v.id + ' · ' + v.c, b, VS[v.st]);
    toast('تم تحديث الطلب إلى «' + VS[v.st] + '» · أُرسلت رسالة واتساب للعميل تلقائيًا'); rerender();
  };
  ACT.fticket = function (t) {
    var v = V.VISA[+t.dataset.i]; if (!can('rec')) return deny('rec');
    var g = function (id) { return (document.getElementById(id) || {}).value || ''; };
    var dd = g('fdt').trim(), a = { w: v.w, c: v.c, id: v.id, co: v.co, f: g('ffl'), ap: g('fap'), d: /اليوم/.test(dd) ? 'اليوم · ' + today().slice(0, 5) : dd, tm: g('ftm'), rc: 'ماجد', n: 1, s: 'في الطريق', g: /اليوم/.test(dd) ? 'today' : 'week', live: 1 };
    V.ARR.unshift(a); var b = VS[v.st]; v.st = 6; v.sd = today();
    notify(v, 'صدور التذكرة');
    log('تعديل', 'متابعة التفييز', 'تذكرة ' + v.w + ' · ' + a.f + ' · ' + a.ap, b, VS[v.st]);
    closeDr(); toast('اعتُمدت التذكرة · أُبلغ العميل بموعد الوصول وظهرت الرحلة في «متابعة الوصول»'); rerender();
  };
  var arrived = ACT.arrived;
  ACT.arrived = function (t) {
    var a = V.ARR[+t.dataset.i]; if (!a) return;
    var k = a.s === 'وصلت المطار' ? 'recv' : 'airport';
    if (!can(k)) return deny(k);
    arrived(t);
  };
  ACT.fdeliver = function (t) {
    var v = V.VISA[+t.dataset.i]; if (!can('recv')) return deny('recv');
    v.done = 1; v.dt = today();
    V.GUAR.unshift({ k: 'ع-' + (190 + V.GUAR.length), c: v.c, w: v.w, co: v.co, st: today(), el: 0 });
    V.sendWA(v.c, 'تسليم العاملة', 'تم تسليمك عاملتك ' + v.w + ' اليوم ✅ يبدأ ضمان 90 يوم من تاريخ اليوم ' + today() + '، وأي ملاحظة تواصل معنا. نتمنى لكم التوفيق 🌷');
    log('اعتماد', 'متابعة الوصول', 'تسليم العاملة ' + v.w + ' للعميل ' + v.c, 'في المكتب', 'مع العميل · بداية الضمان');
    toast('تم تسليم العاملة للعميل · بدأ الضمان وأُرسلت رسالة للعميل'); rerender();
  };

  function hstep(cur) { return '<ol class="fst">' + VS.map(function (x, i) { return '<li class="' + (i < cur ? 'd' : i === cur ? 'c' : '') + '"><i>' + (i < cur ? '✓' : i + 1) + '</i><span>' + esc(x) + '</span></li>'; }).join('') + '</ol>'; }
  function liveCard() {
    var L = live(); if (!L.length) return '';
    return card('🆕 طلبات بوابة العملاء', L.map(function (v) {
      var i = V.VISA.indexOf(v), nx = VS[v.st + 1], act;
      if (v.done) act = chip('✅ سُلّمت للعميل ' + v.dt + ' · الضمان بدأ', 'g');
      else if (v.st < 6) act = btn(v.st === 5 ? '✈ حجز التذكرة' : 'تحديث المرحلة ← ' + nx, 'fnext', 'data-i="' + i + '"') + '<span class="mut sm">' + (can('rec') ? 'تُرسل رسالة واتساب للعميل تلقائيًا' : '🔒 لمن لديه صلاحية «تحديث مراحل الاستقدام»') + '</span>';
      else if (v.st < 8) act = '<a class="xbt ghost" href="#/Arrivals">متابعة الوصول ←</a><span class="mut sm">المرحلة التالية يحدّثها الاستقبال</span>';
      else act = btn('🤝 تسليم العاملة للعميل', 'fdeliver', 'data-i="' + i + '"') + '<span class="mut sm">' + (can('recv') ? 'عند حضور العميل بالهوية' : '🔒 لموظف الاستقبال') + '</span>';
      return '<div class="flv"><div class="xrow"><b>' + v.id + ' · ' + esc(v.c) + '</b>' + chip(VS[v.st], v.st >= 8 ? 'g' : 'b') + '</div><p class="mut">العاملة ' + esc(v.w) + ' · ' + esc(v.co) + ' · الوكيل ' + esc(v.ag) + ' · الموظف المسؤول: ريم</p>' + hstep(v.done ? v.st + 1 : v.st) + '<div class="xrow mt">' + act + '</div></div>';
    }).join(''));
  }
  function permCard() {
    if (me() !== 'المدير' || !U.MEM) return '';
    var K = ['pay', 'rec', 'airport', 'recv'];
    return card('🔐 من يسوي إيش في طلب الاستقدام', '<p class="mut sm">يحددها المدير لكل موظف · المدير يملك كل الصلاحيات</p><div class="xtw"><table class="xt shpt"><thead><tr><th>الموظف</th>' + K.map(function (k) { return '<th>' + PN[k] + '</th>'; }).join('') + '</tr></thead><tbody>' + U.MEM.filter(function (m) { return m !== 'المدير'; }).map(function (m) {
      return '<tr><td data-l="الموظف"><b>' + esc(m) + '</b></td>' + K.map(function (k) { return '<td data-l="' + PN[k] + '"><label class="shpk"><input type="checkbox" data-perm="' + k + '" data-u="' + esc(m) + '"' + (can(k, m) ? ' checked' : '') + ' aria-label="' + esc(PN[k] + ' ' + m) + '"></label></td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>');
  }
  function wrap(name, fn) { var o = P[name]; if (!o) return; var r = o.r; o.r = function () { return fn(r.apply(this, arguments)); }; }
  function afterHead(h, top) { var i = h.indexOf('</header>'); return i >= 0 ? h.slice(0, i + 9) + top + h.slice(i + 9) : top + h; }
  wrap('VisaTrack', function (h) { return afterHead(h, roleBar(['rec', 'recv']) + liveCard()) + permCard(); });
  wrap('Arrivals', function (h) { return afterHead(h, roleBar(['airport', 'recv'])); });

  /* customer portal: tracking + office messages */
  wrap('RecMy', function (h) {
    var c = U.cust && U.cust(); if (!c) return h; var v = visaFor(c.name); if (!v) return h;
    var msgs = V.chatOf(v.c).msgs.filter(function (m) { return m.who === 'bot'; });
    return h + '<div class="rgrid fcu"><section class="rcd"><h2>📍 متابعة طلبك ' + v.id + '</h2><p class="mut">العاملة ' + esc(v.w) + ' · ' + esc(v.co) + '</p>' + hstep(v.done ? v.st + 1 : v.st) + (v.done ? '<p class="fok">✅ تم التسليم · الضمان 90 يوم من ' + v.dt + '</p>' : '') + '</section>' +
      '<section class="rcd fwa"><h2>💬 رسائل المكتب على واتساب</h2><div class="fwal">' + msgs.slice().reverse().map(function (m, j) { return '<div class="fwm' + (j === 0 ? ' new' : '') + '">' + esc(m.x).replace(/\n/g, '<br>') + '<time>' + esc(m.t || '') + '</time></div>'; }).join('') + '</div></section></div>';
  });

  var st = document.createElement('style');
  st.textContent = '.frole{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#FFF4DC;border:1.5px solid #E9C77E;border-radius:12px;padding:8px 14px;margin-bottom:14px;font-size:14px}.frw{font-weight:700}.frp{color:#4A5650;font-size:13px}' +
    '.flv{border:1.5px solid #CFE0D6;background:#F6FAF7;border-radius:14px;padding:14px;margin-bottom:10px}.fcu .fst{grid-template-columns:repeat(3,1fr);row-gap:12px}.fst{list-style:none;margin:10px 0;padding:0;display:grid;grid-template-columns:repeat(9,1fr);gap:4px}.fst li{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-size:12px;color:#8A8F8B;position:relative}.fst li i{width:26px;height:26px;border-radius:50%;border:2px solid #CFC6B3;display:grid;place-items:center;font-style:normal;font-size:12px;background:#fff}.fst li.d{color:#164D39}.fst li.d i{background:#1F6B4F;border-color:#1F6B4F;color:#fff}.fst li.c{color:#1F2A24;font-weight:700}.fst li.c i{border-color:#D98A2B;background:#FFF4DC;box-shadow:0 0 0 4px rgba(217,138,43,.18)}.flv .xrow.mt{align-items:center;gap:10px}' +
    '.fcu{margin-top:16px}.fwa{background:#ECE5DD}.fwal{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto}.fwm{background:#fff;border-radius:12px 12px 12px 2px;padding:10px 12px;font-size:14px;line-height:1.7;align-self:flex-start;max-width:95%;box-shadow:0 1px 1px rgba(0,0,0,.08)}.fwm.new{outline:2px solid #25D366}.fwm time{display:block;font-size:11px;color:#8A8F8B;text-align:left;margin-top:2px}.fok{color:#164D39;font-weight:700}';
  document.head.appendChild(st);
  try { if (document.querySelector('#xmain')) rerender(); } catch (e) { }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
})();
