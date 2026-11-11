(function () {
'use strict';
var H = function () { return window.XP_HOST || {}; };
function toast(m) { (H().toast || alert)(m); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function chip(t, tone) { return '<span class="xc t-' + (tone || 'n') + '">' + esc(t) + '</span>'; }
function stars(r) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= Math.round(r) ? 'on' : '') + '">★</span>'; return '<span class="xst" aria-label="التقييم ' + r + ' من 5">' + s + '</span>'; }
function bar(p, tone) { p = Math.max(0, Math.min(100, p)); return '<span class="xb"><i class="t-' + (tone || 'g') + '" style="width:' + p + '%"></i></span>'; }
function steps(list, cur) {
  var h = '<span class="xsp" aria-label="المرحلة: ' + esc(list[cur]) + '">';
  list.forEach(function (s, i) { h += '<i class="' + (i < cur ? 'd' : i === cur ? 'c' : '') + '" title="' + esc(s) + '"></i>'; });
  return h + '</span><small class="xsl">' + esc(list[cur]) + '</small>';
}
function timeline(list, cur, dates) {
  var h = '<ol class="xtl">';
  list.forEach(function (s, i) { h += '<li class="' + (i < cur ? 'd' : i === cur ? 'c' : '') + '"><b>' + esc(s) + '</b><span>' + esc((dates && dates[i]) || (i < cur ? 'مكتملة' : i === cur ? 'جارية الآن' : 'لم تبدأ')) + '</span></li>'; });
  return h + '</ol>';
}

/* ---------- audit store ---------- */
var AUDIT = [
  { t: 'اليوم 18:42', u: 'خالد', r: 'المحاسب', a: 'تعديل', s: 'الحسابات', i: 'سند قبض #4471 · حجز #1056', b: '225 ريال', af: '250 ريال', dev: 'كمبيوتر المكتب', m: 1 },
  { t: 'اليوم 18:10', u: 'المدير', r: 'المدير', a: 'اعتماد', s: 'حجوزات الإيجار', i: 'حجز #1058 · سالم الوادعي', b: 'بانتظار الاعتماد', af: 'معتمد', dev: 'جوال · نجران' },
  { t: 'اليوم 17:55', u: 'هيا', r: 'موظفة الإيجار', a: 'إضافة', s: 'العملاء', i: 'عميل جديد · ناصر الصقور', b: '—', af: 'هوية 10•••••482', dev: 'كمبيوتر المكتب' },
  { t: 'اليوم 16:30', u: 'ريم', r: 'موظفة الاستقدام', a: 'تعديل', s: 'متابعة التفييز', i: 'طلب س-238', b: 'العقد في مساند', af: 'التفييز', dev: 'كمبيوتر المكتب' },
  { t: 'اليوم 14:05', u: 'خالد', r: 'المحاسب', a: 'إضافة', s: 'الحسابات', i: 'سند صرف · مواصلات العاملات', b: '—', af: '350 ريال', dev: 'كمبيوتر المكتب', m: 1 },
  { t: 'اليوم 12:48', u: 'المدير', r: 'المدير', a: 'حذف', s: 'آراء العملاء', i: 'تعليق مسيء على العاملة روز', b: 'ظاهر', af: 'محذوف', dev: 'جوال · نجران' },
  { t: 'اليوم 11:20', u: 'سارة', r: 'خدمة العملاء', a: 'تعديل', s: 'العملاء', i: 'رقم جوال · فهد آل منصور', b: '05•••••311', af: '05•••••907', dev: 'كمبيوتر المكتب' },
  { t: 'اليوم 09:02', u: 'خالد', r: 'المحاسب', a: 'دخول', s: 'النظام', i: 'تسجيل دخول ناجح', b: '—', af: '—', dev: 'كمبيوتر المكتب' },
  { t: 'أمس 21:14', u: 'المطوّر', r: 'المطوّر', a: 'تعديل', s: 'الإعدادات', i: 'سعر الساعة · فئة الفلبين', b: '35 ريال', af: '40 ريال', dev: 'كمبيوتر', m: 1 },
  { t: 'أمس 19:40', u: 'المدير', r: 'المدير', a: 'اعتماد', s: 'قيود عكسية', i: 'إلغاء سند #4459 بطلب المحاسب', b: '180 ريال', af: 'ملغى بقيد عكسي', dev: 'جوال · نجران', m: 1 },
  { t: 'أمس 16:22', u: 'ماجد', r: 'المشرف', a: 'تعديل', s: 'حالات العاملات', i: 'العاملة لينا', b: 'في الإيواء', af: 'جاهزة للتسليم', dev: 'جوال' },
  { t: 'أمس 10:15', u: 'غير معروف', r: '—', a: 'دخول', s: 'النظام', i: 'محاولة دخول فاشلة (3 مرات)', b: '—', af: 'تم الإيقاف 30 ثانية', dev: 'متصفح غير معروف', w: 1 }
];
function log(a, s, i, b, af, money) {
  var d = new Date(), t = 'الآن ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  AUDIT.unshift({ t: t, u: 'المدير', r: 'المدير', a: a, s: s, i: i, b: b || '—', af: af || '—', dev: 'هذا الجهاز', m: money ? 1 : 0, fresh: 1 });
}

/* ---------- data ---------- */
var VSTEPS = ['الطلب', 'اختيار المرشحة', 'العقد في مساند', 'الفحص الطبي', 'الباركود', 'التفييز', 'التذكرة', 'الوصول للمطار', 'الوصول للمكتب'];
var VISA = [
  { id: 'س-241', c: 'عبدالله اليامي', w: 'جوسلين', co: 'الفلبين', ag: 'مانيلا برايت', st: 5, sd: '—', days: 34, n: 1, e: 'ريم' },
  { id: 'س-240', c: 'منى اليامي', w: 'غريس', co: 'كينيا', ag: 'نيروبي هوم كير', st: 6, sd: '21/10/2026', days: 41, n: 1, e: 'ريم' },
  { id: 'س-239', c: 'حمد آل عباس', w: 'سري', co: 'إندونيسيا', ag: 'جاكرتا سينار', st: 3, sd: '—', days: 52, n: 0, e: 'ريم' },
  { id: 'س-238', c: 'سعيد آل هتيلة', w: 'سوسان', co: 'أوغندا', ag: 'كمبالا ستار', st: 4, sd: '—', days: 29, n: 0, e: 'ريم' },
  { id: 'س-237', c: 'نورة آل منصور', w: 'جوانا', co: 'الفلبين', ag: 'مانيلا برايت', st: 6, sd: '02/10/2026', days: 58, n: 1, e: 'ريم' },
  { id: 'س-236', c: 'علي آل مريح', w: '', co: 'بنغلاديش', ag: 'داكا جرين', st: 1, sd: '—', days: 12, n: 1, e: 'ماجد' },
  { id: 'س-235', c: 'محمد آل سعيد', w: 'تشاميلا', co: 'سريلانكا', ag: 'كولومبو بيرل', st: 6, sd: '18/10/2026', days: 47, n: 1, e: 'ريم' },
  { id: 'س-234', c: 'فهد آل منصور', w: 'هيوت', co: 'إثيوبيا', ag: 'أديس نجمة', st: 2, sd: '—', days: 61, n: 0, e: 'ماجد' },
  { id: 'س-233', c: 'ناصر الصقور', w: '', co: 'كينيا', ag: 'نيروبي هوم كير', st: 0, sd: '—', days: 3, n: 1, e: 'ريم' },
  { id: 'س-232', c: 'سالم الوادعي', w: 'إستر', co: 'الفلبين', ag: 'مانيلا برايت', st: 8, sd: '25/09/2026', days: 66, n: 1, e: 'ريم' },
  { id: 'س-230', c: 'عبدالرحمن آل حيدر', w: 'ماريتا', co: 'الفلبين', ag: 'مانيلا برايت', st: 7, sd: '08/10/2026', days: 54, n: 1, e: 'ريم' },
  { id: 'س-229', c: 'حمد آل عباس', w: 'أنيتا', co: 'إندونيسيا', ag: 'جاكرتا سينار', st: 6, sd: '12/10/2026', days: 63, n: 1, e: 'ريم' },
  { id: 'س-228', c: 'علي آل مريح', w: 'ميري', co: 'أوغندا', ag: 'كمبالا ستار', st: 6, sd: '15/10/2026', days: 49, n: 0, e: 'ماجد' },
  { id: 'س-227', c: 'هادي اليامي', w: 'ديفينا', co: 'الفلبين', ag: 'مانيلا برايت', st: 7, sd: '06/10/2026', days: 57, n: 1, e: 'ريم' },
  { id: 'س-226', c: 'جابر آل قريع', w: 'نيلوفر', co: 'سريلانكا', ag: 'كولومبو بيرل', st: 7, sd: '05/10/2026', days: 60, n: 0, e: 'ماجد' }
];
var ARR = [
  { w: 'ماريتا', c: 'عبدالرحمن آل حيدر', id: 'س-230', co: 'الفلبين', f: 'PR 654 عبر الرياض', ap: 'مطار نجران', d: 'اليوم · الخميس 29/10', tm: '06:15', rc: 'ماجد', n: 1, s: 'وصلت المطار', g: 'today' },
  { w: 'ديفينا', c: 'هادي اليامي', id: 'س-227', co: 'الفلبين', f: 'PR 654 عبر الرياض', ap: 'مطار نجران', d: 'اليوم · الخميس 29/10', tm: '06:15', rc: 'ماجد', n: 1, s: 'وصلت المطار', g: 'today' },
  { w: 'نيلوفر', c: 'جابر آل قريع', id: 'س-226', co: 'سريلانكا', f: 'UL 265 عبر جدة', ap: 'مطار نجران', d: 'اليوم · الخميس 29/10', tm: '07:40', rc: 'ماجد', n: 0, s: 'وصلت المطار', g: 'today' },
  { w: 'جوانا', c: 'نورة آل منصور', id: 'س-237', co: 'الفلبين', f: 'PR 658 عبر الرياض', ap: 'مطار نجران', d: 'اليوم · الخميس 29/10', tm: '21:35', rc: 'ماجد', n: 1, s: 'في الطريق', g: 'today' },
  { w: 'إستر', c: 'سالم الوادعي', id: 'س-232', co: 'الفلبين', f: 'SV 863', ap: 'مطار الملك خالد · الرياض', d: 'اليوم · الخميس 29/10', tm: '14:10', rc: 'ماجد', n: 1, on: 1, s: 'في المكتب', g: 'today' },
  { w: 'غريس', c: 'منى اليامي', id: 'س-240', co: 'كينيا', f: 'KQ 310 عبر جدة', ap: 'مطار نجران', d: 'غدًا · الجمعة 30/10', tm: '08:20', rc: 'ماجد', n: 1, s: 'مجدولة', g: 'tomorrow' },
  { w: 'تشاميلا', c: 'محمد آل سعيد', id: 'س-235', co: 'سريلانكا', f: 'UL 265', ap: 'مطار أبها', d: 'غدًا · الجمعة 30/10', tm: '23:50', rc: 'هيا', n: 0, s: 'مجدولة', g: 'tomorrow' },
  { w: 'أنيتا', c: 'حمد آل عباس', id: 'س-229', co: 'إندونيسيا', f: 'GA 980', ap: 'مطار الملك خالد · الرياض', d: 'الأحد 1/11', tm: '06:40', rc: 'ماجد', n: 1, s: 'متأخرة', g: 'week' },
  { w: 'ميري', c: 'علي آل مريح', id: 'س-228', co: 'أوغندا', f: 'ET 404 عبر أديس أبابا', ap: 'مطار نجران', d: 'الثلاثاء 3/11', tm: '19:15', rc: 'ماجد', n: 0, s: 'مجدولة', g: 'week' }
];
var ATN = { 'في المكتب': 'g', 'وصلت المطار': 'p', 'في الطريق': 'b', 'مجدولة': 'n', 'متأخرة': 'r' };
var GUAR = [
  { k: 'ع-188', c: 'سالم الوادعي', w: 'إستر', co: 'الفلبين', st: '29/10/2026', el: 0 },
  { k: 'ع-181', c: 'عبدالرحمن آل حيدر', w: 'سيتي نور', co: 'إندونيسيا', st: '12/10/2026', el: 17 },
  { k: 'ع-176', c: 'منيرة الصقور', w: 'أمينة', co: 'كينيا', st: '20/08/2026', el: 70 },
  { k: 'ع-172', c: 'حسين آل زمانان', w: 'ماري', co: 'الفلبين', st: '06/08/2026', el: 84 },
  { k: 'ع-169', c: 'جابر آل قريع', w: 'روزا', co: 'أوغندا', st: '02/08/2026', el: 88 },
  { k: 'ع-164', c: 'هادي اليامي', w: 'نيلا', co: 'سريلانكا', st: '25/06/2026', el: 126 },
  { k: 'ع-160', c: 'مريم آل منصور', w: 'سارا', co: 'إثيوبيا', st: '10/07/2026', el: 61, ret: 'مستردة' },
  { k: 'ع-157', c: 'سعد آل سدران', w: 'لوسي', co: 'كينيا', st: '28/06/2026', el: 45, ret: 'مستبدلة' }
];
var RETURNS = [
  { k: 'ع-160', c: 'مريم آل منصور', ty: 'استرداد', why: 'رفض العمل خلال الضمان', amt: 14500, s: 'مكتمل' },
  { k: 'ع-157', c: 'سعد آل سدران', ty: 'استبدال', why: 'مرض مزمن أثبته الفحص', amt: 0, s: 'بانتظار وصول البديلة' },
  { k: 'ع-152', c: 'علي آل مريح', ty: 'استرداد جزئي', why: 'هروب بعد 40 يومًا', amt: 7800, s: 'بانتظار اعتماد المدير' }
];
var AGENTS = [
  { n: 'مانيلا برايت', co: 'الفلبين', act: 9, del: 41, avg: 52, late: 8, r: 4.7, owed: 18400, paid: 96200 },
  { n: 'جاكرتا سينار', co: 'إندونيسيا', act: 5, del: 22, avg: 64, late: 21, r: 3.9, owed: 9600, paid: 51800 },
  { n: 'نيروبي هوم كير', co: 'كينيا', act: 7, del: 30, avg: 47, late: 6, r: 4.8, owed: 12100, paid: 64300 },
  { n: 'كمبالا ستار', co: 'أوغندا', act: 4, del: 17, avg: 55, late: 12, r: 4.2, owed: 6800, paid: 33900 },
  { n: 'داكا جرين', co: 'بنغلاديش', act: 3, del: 11, avg: 71, late: 27, r: 3.4, owed: 4200, paid: 19700 },
  { n: 'كولومبو بيرل', co: 'سريلانكا', act: 2, del: 9, avg: 58, late: 11, r: 4.1, owed: 3900, paid: 17400 },
  { n: 'أديس نجمة', co: 'إثيوبيا', act: 3, del: 6, avg: 76, late: 33, r: 3.1, owed: 5100, paid: 11200 }
];
var CANDS = [
  { n: 'ماريسا', co: 'الفلبين', age: 31, ex: 6, lg: 'عربي · إنجليزي', sk: 'طبخ · رعاية أطفال', sal: 1500, ag: 'مانيلا برايت', s: 'متاحة' },
  { n: 'ديوي', co: 'إندونيسيا', age: 28, ex: 4, lg: 'عربي', sk: 'تنظيف · كي', sal: 1200, ag: 'جاكرتا سينار', s: 'متاحة' },
  { n: 'فيث', co: 'كينيا', age: 26, ex: 3, lg: 'إنجليزي', sk: 'تنظيف · رعاية كبار', sal: 1100, ag: 'نيروبي هوم كير', s: 'محجوزة لعميل' },
  { n: 'جوسلين', co: 'الفلبين', age: 35, ex: 11, lg: 'عربي · إنجليزي', sk: 'طبخ عربي · تنظيف', sal: 1700, ag: 'مانيلا برايت', s: 'متاحة' },
  { n: 'سوسان', co: 'أوغندا', age: 29, ex: 2, lg: 'إنجليزي', sk: 'تنظيف', sal: 1000, ag: 'كمبالا ستار', s: 'متاحة' },
  { n: 'روكسانا', co: 'بنغلاديش', age: 33, ex: 5, lg: 'عربي', sk: 'تنظيف · طبخ', sal: 1000, ag: 'داكا جرين', s: 'تم الاختيار' },
  { n: 'شاني', co: 'سريلانكا', age: 37, ex: 9, lg: 'عربي · إنجليزي', sk: 'رعاية أطفال · طبخ', sal: 1400, ag: 'كولومبو بيرل', s: 'متاحة' },
  { n: 'ألماز', co: 'إثيوبيا', age: 24, ex: 1, lg: 'عربي', sk: 'تنظيف', sal: 900, ag: 'أديس نجمة', s: 'متاحة' },
  { n: 'ريزا', co: 'الفلبين', age: 30, ex: 7, lg: 'إنجليزي', sk: 'رعاية مسنين · تمريض منزلي', sal: 1800, ag: 'مانيلا برايت', s: 'محجوزة لعميل' },
  { n: 'سري', co: 'إندونيسيا', age: 32, ex: 8, lg: 'عربي', sk: 'طبخ · تنظيف · كي', sal: 1400, ag: 'جاكرتا سينار', s: 'متاحة' },
  { n: 'جين', co: 'كينيا', age: 27, ex: 4, lg: 'إنجليزي · عربي بسيط', sk: 'رعاية أطفال', sal: 1150, ag: 'نيروبي هوم كير', s: 'متاحة' },
  { n: 'نالوكا', co: 'أوغندا', age: 34, ex: 6, lg: 'إنجليزي', sk: 'تنظيف · طبخ', sal: 1100, ag: 'كمبالا ستار', s: 'متاحة' }
];
var STAT = ['في الإيواء', 'تحت الدراسة', 'جاهزة للتسليم', 'مع العميل', 'نقل كفالة', 'نزاع', 'رفض عمل', 'عدم دفع راتب', 'هروب'];
var STONE = ['b', 'a', 'g', 'p', 'b', 'r', 'r', 'a', 'r'];
var STCOL = ['#3B6FB0', '#D98A2B', '#1F6B4F', '#7A4FB3', '#5B8FD0', '#C0392B', '#E06B5C', '#E2B04A', '#8E1B12'];
var SW = [
  { w: 'لينا', co: 'الفلبين', s: 2, since: '3 أيام', note: 'اجتازت الفحص · جاهزة لعميل الاستقدام س-231' },
  { w: 'فاطمة', co: 'بنغلاديش', s: 0, since: '9 أيام', note: 'بانتظار نقل كفالة' },
  { w: 'أمينة', co: 'كينيا', s: 1, since: 'يومان', note: 'مقابلة مع المشرف غدًا' },
  { w: 'روز', co: 'أوغندا', s: 3, since: '21 يومًا', note: 'إيجار شهري · عقد #1049' },
  { w: 'هيلين', co: 'إثيوبيا', s: 6, since: '4 أيام', note: 'رفضت العمل لدى العميل · تحت المعالجة' },
  { w: 'ميرا', co: 'سريلانكا', s: 5, since: '6 أيام', note: 'نزاع على الراتب مع الكفيل' },
  { w: 'سيتي', co: 'إندونيسيا', s: 3, since: '12 يومًا', note: 'إيجار أسبوعي' },
  { w: 'جوي', co: 'الفلبين', s: 4, since: 'يوم', note: 'نقل كفالة للعميل حمد آل عباس' },
  { w: 'أنجلينا', co: 'كينيا', s: 7, since: '15 يومًا', note: 'الكفيل لم يدفع راتبين · رُفع لمساند' },
  { w: 'نور', co: 'إندونيسيا', s: 0, since: '5 أيام', note: 'رجعت من إيجار شهري' }
];
var STCOUNT = [12, 5, 7, 64, 3, 2, 2, 1, 1];
var TSTEPS = ['الطلب', 'موافقة الكفيل الحالي', 'موافقة العاملة', 'سداد الرسوم', 'اعتماد النقل', 'مكتمل'];
var TRANS = [
  { id: 'ن-31', w: 'جوي', from: 'مكتب أصايل (إيواء)', to: 'حمد آل عباس', st: 4, fee: 2000, of: 1500, paid: 1 },
  { id: 'ن-30', w: 'فاطمة', from: 'عبدالله آل جابر', to: 'سعيد آل هتيلة', st: 1, fee: 2000, of: 1200, paid: 0 },
  { id: 'ن-29', w: 'كارين', from: 'منصور اليامي', to: 'نورة آل منصور', st: 3, fee: 4000, of: 1500, paid: 0 },
  { id: 'ن-28', w: 'آنا', from: 'مكتب أصايل (إيواء)', to: 'علي آل مريح', st: 5, fee: 2000, of: 1500, paid: 1 },
  { id: 'ن-27', w: 'بريا', from: 'هادي الصقور', to: 'فهد آل منصور', st: 2, fee: 2000, of: 1000, paid: 0 }
];
var COMM = {
  'أكتوبر 2026': [
    { e: 'هيا', r: 'موظفة الإيجار', rc: 46, rv: 21850, qc: 0 }, { e: 'ريم', r: 'موظفة الاستقدام', rc: 4, rv: 1900, qc: 7 },
    { e: 'سارة', r: 'خدمة العملاء', rc: 19, rv: 8420, qc: 2 }, { e: 'ماجد', r: 'المشرف', rc: 11, rv: 6300, qc: 3 }],
  'سبتمبر 2026': [
    { e: 'هيا', r: 'موظفة الإيجار', rc: 39, rv: 18200, qc: 0, done: 1 }, { e: 'ريم', r: 'موظفة الاستقدام', rc: 2, rv: 900, qc: 5, done: 1 },
    { e: 'سارة', r: 'خدمة العملاء', rc: 15, rv: 6750, qc: 1, done: 1 }, { e: 'ماجد', r: 'المشرف', rc: 9, rv: 4800, qc: 2, done: 1 }]
};
var CM = { month: 'أكتوبر 2026', rp: 3, qp: 250, posted: {} };
var LEAVES = [
  { w: 'سيتي', ty: 'سنوية', f: '01/11', to: '14/11', d: 14, bal: 30, s: 'بانتظار' },
  { w: 'أمينة', ty: 'مرضية', f: '29/10', to: '31/10', d: 3, bal: 10, s: 'بانتظار', doc: 1 },
  { w: 'جوي', ty: 'طارئة', f: '02/11', to: '04/11', d: 3, bal: 5, s: 'بانتظار' },
  { w: 'روز', ty: 'سنوية', f: '20/10', to: '02/11', d: 14, bal: 30, s: 'موافق' },
  { w: 'نور', ty: 'مرضية', f: '26/10', to: '30/10', d: 5, bal: 10, s: 'موافق', doc: 1 },
  { w: 'ميرا', ty: 'طارئة', f: '15/10', to: '17/10', d: 3, bal: 5, s: 'مرفوض' }
];
var MONTHS = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت'];

/* ---------- charts ---------- */
function bars(labels, series, opt) {
  opt = opt || {};
  var W = 640, Hh = 230, L = 34, B = 28, T = 14, R = 8, n = labels.length, max = 0;
  labels.forEach(function (_, i) { var s = 0; series.forEach(function (se) { s = opt.stack ? s + se.v[i] : Math.max(s, se.v[i]); }); max = Math.max(max, s); });
  max = Math.ceil(max / 4) * 4 || 4;
  var cw = (W - L - R) / n, bw = opt.stack ? cw * 0.5 : cw * 0.7 / series.length, svg = '';
  for (var g = 0; g <= 4; g++) { var y = T + (Hh - T - B) * g / 4; svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + Math.round(max * (4 - g) / 4) + '</text>'; }
  labels.forEach(function (lb, i) {
    var x0 = L + cw * i + (cw - (opt.stack ? bw : bw * series.length)) / 2, acc = 0;
    series.forEach(function (se, j) {
      var v = se.v[i], h = (Hh - T - B) * v / max, x = opt.stack ? x0 : x0 + j * bw, y = Hh - B - h - (opt.stack ? acc : 0);
      if (opt.stack) acc += h;
      if (v > 0) svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + se.c + '" class="br" style="animation-delay:' + (i * 40) + 'ms"><title>' + esc(se.n + ' · ' + lb + ': ' + v) + '</title></rect>';
    });
    svg += '<text x="' + (L + cw * i + cw / 2) + '" y="' + (Hh - 8) + '" class="ax" text-anchor="middle">' + esc(lb) + '</text>';
  });
  var lg = '<div class="xlg">' + series.map(function (se) { return '<span><i style="background:' + se.c + '"></i>' + esc(se.n) + '</span>'; }).join('') + '</div>';
  return lg + '<svg class="xch" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(opt.label || 'رسم بياني') + '">' + svg + '</svg>';
}
function donut(items, center) {
  var tot = items.reduce(function (a, b) { return a + b.v; }, 0), off = 0, C = 2 * Math.PI * 42, svg = '';
  items.forEach(function (it) { var len = C * it.v / tot; svg += '<circle r="42" cx="60" cy="60" fill="none" stroke="' + it.c + '" stroke-width="16" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(it.n + ': ' + it.v) + '</title></circle>'; off += len; });
  var lg = '<ul class="xdl">' + items.map(function (it) { return '<li><i style="background:' + it.c + '"></i>' + esc(it.n) + '<b>' + it.v + '</b></li>'; }).join('') + '</ul>';
  return '<div class="xdn"><svg viewBox="0 0 120 120" role="img" aria-label="توزيع"><g transform="rotate(-90 60 60)">' + svg + '</g><text x="60" y="58" text-anchor="middle" class="dv">' + tot + '</text><text x="60" y="74" text-anchor="middle" class="dt">' + esc(center || 'الإجمالي') + '</text></svg>' + lg + '</div>';
}

/* ---------- building blocks ---------- */
function head(t, sub, actions) { return '<header class="xh"><div><h1>' + esc(t) + '</h1><p>' + sub + '</p></div><div class="xha">' + (actions || '') + '</div></header>'; }
function kpis(list) {
  return '<section class="xk">' + list.map(function (k) {
    return '<div class="xkc' + (k.tone ? ' k-' + k.tone : '') + '"><span>' + esc(k.l) + '</span><strong class="v" data-n="' + k.v + '">' + (k.pre || '') + fmt(k.v) + (k.suf || '') + '</strong><small>' + (k.s || '') + '</small></div>';
  }).join('') + '</section>';
}
function card(title, body, extra) { return '<section class="xcd"><div class="xcdh"><h2>' + esc(title) + '</h2>' + (extra || '') + '</div>' + body + '</section>'; }
function btn(t, act, attrs, cls) { return '<button type="button" class="xbt ' + (cls || '') + '" data-act="' + act + '" ' + (attrs || '') + '>' + t + '</button>'; }
var TID = 0;
function table(cols, rows, o) {
  o = o || {}; var id = 'xt' + (++TID);
  var chips = o.chips ? '<div class="xf" role="group" aria-label="تصفية">' + o.chips.map(function (c, i) { return '<button type="button" class="xfc' + (i === 0 ? ' on' : '') + '" data-chip="' + id + '" data-v="' + esc(c[0]) + '">' + esc(c[1]) + (c[2] != null ? ' <b>' + c[2] + '</b>' : '') + '</button>'; }).join('') + '</div>' : '';
  var tools = '<div class="xtb"><label class="xse"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="' + esc(o.ph || 'ابحث…') + '" data-search="' + id + '" aria-label="بحث"></label><span class="xcount" id="' + id + 'c"></span>' + exportBtns(id, o.title) + '</div>';
  var th = '<thead><tr>' + cols.map(function (c) { return '<th' + (c.noexp ? ' data-noexp="1"' : '') + '>' + esc(c.l) + '</th>'; }).join('') + '</tr></thead>';
  var tb = '<tbody>' + rows.map(function (r, i) {
    return '<tr data-tag="' + esc(o.tag ? o.tag(r) : '') + '"' + (o.row ? ' data-act="' + o.row + '" data-i="' + i + '" tabindex="0" class="clk' + (o.rc ? ' ' + o.rc(r) : '') + '"' : (o.rc ? ' class="' + o.rc(r) + '"' : '')) + '>' + cols.map(function (c) { return '<td data-l="' + esc(c.l) + '"' + (c.noexp ? ' data-noexp="1"' : '') + '>' + (c.r ? c.r(r, i) : esc(r[c.k])) + '</td>'; }).join('') + '</tr>';
  }).join('') + '</tbody>';
  return chips + tools + '<div class="xtw"><table class="xt" id="' + id + '" data-title="' + esc(o.title || '') + '">' + th + tb + '</table><p class="xempty" hidden>لا توجد نتائج مطابقة</p></div>';
}
function exportBtns(id, title) {
  return '<div class="xex" role="group" aria-label="تصدير"><button type="button" data-exp="copy" data-t="' + id + '" title="نسخ الجدول">نسخ</button><button type="button" data-exp="xls" data-t="' + id + '" title="تنزيل ملف Excel">Excel</button><button type="button" data-exp="print" data-t="' + id + '" title="طباعة">طباعة</button></div>';
}

/* ---------- export ---------- */
function tableData(t) {
  var keep = [];
  var hs = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th, i) { if (!th.hasAttribute('data-noexp')) keep.push(i); return th.textContent.trim(); });
  var out = [keep.map(function (i) { return hs[i]; })];
  t.querySelectorAll('tbody tr').forEach(function (tr) {
    if (tr.style.display === 'none') return;
    var tds = tr.children; out.push(keep.map(function (i) { return tds[i] ? tds[i].innerText.replace(/\s+/g, ' ').trim() : ''; }));
  });
  return out;
}
function doExport(kind, t, title) {
  title = title || t.getAttribute('data-title') || document.title.split('·')[0].trim();
  var data = tableData(t);
  if (kind === 'copy') {
    var tsv = data.map(function (r) { return r.join('\t'); }).join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(tsv) : Promise.reject()).then(function () { toast('تم نسخ ' + (data.length - 1) + ' صف · الصقه في Excel أو واتساب'); }, function () { toast('تعذّر النسخ من هذا المتصفح'); });
    return;
  }
  if (kind === 'xls') {
    var csv = '﻿' + data.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = title.replace(/[\\/:*?"<>|]/g, '') + '.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('تم تنزيل الملف · يفتح في Excel مباشرة'); return;
  }
  var d = new Date(), html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;margin:24px;color:#1F2A24}h1{font-size:20px;margin:0}p{color:#4A5650;font-size:12px;margin:4px 0 16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1F6B4F;color:#fff;padding:8px;text-align:right}td{padding:7px 8px;border-bottom:1px solid #ddd}tr:nth-child(even) td{background:#F7F3EA}footer{margin-top:18px;font-size:11px;color:#777;display:flex;justify-content:space-between}</style></head><body><h1>شركة أصايل المنصورة · ' + esc(title) + '</h1><p>تاريخ الطباعة: ' + d.toLocaleDateString('ar-SA-u-ca-gregory') + ' · ' + d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura') + ' هـ · عدد السجلات: ' + (data.length - 1) + '</p><table><thead><tr>' + data[0].map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + data.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table><footer><span>طُبع من نظام شركة أصايل المنصورة</span><span>التوقيع: ............</span></footer></body></html>';
  var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px'; document.body.appendChild(f);
  f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(function () { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(function () { f.remove(); }, 1500); }, 300);
}

/* ---------- drawer ---------- */
function drawer(title, body) {
  var d = document.getElementById('xdr');
  if (!d) { d = document.createElement('div'); d.id = 'xdr'; document.body.appendChild(d); d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.classList.remove('show'); }); document.addEventListener('keydown', function (e) { if (e.key === 'Escape') d.classList.remove('show'); }); }
  d.innerHTML = '<aside role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="xdrh"><h2>' + esc(title) + '</h2><button type="button" data-close aria-label="إغلاق">✕</button></div><div class="xdrb">' + body + '</div></aside>';
  d.classList.add('show'); setTimeout(function () { var b = d.querySelector('[data-close]'); if (b) b.focus(); }, 30);
}
function kv(list) { return '<dl class="xkv">' + list.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd>'; }).join('') + '</dl>'; }
function closeDrawer() { var d = document.getElementById('xdr'); if (d) d.classList.remove('show'); }

/* ---------- pages ---------- */
var ATONE = { 'تعديل': 'a', 'إضافة': 'g', 'حذف': 'r', 'اعتماد': 'b', 'دخول': 'n' };
function guarState(g) { if (g.ret) return g.ret; var rem = 90 - g.el; return rem <= 0 ? 'منتهية' : rem <= 10 ? 'تنتهي قريبًا' : 'سارية'; }
function guarTone(s) { return { 'سارية': 'g', 'تنتهي قريبًا': 'a', 'منتهية': 'n', 'مستردة': 'r', 'مستبدلة': 'b' }[s]; }
function cnt(arr, f) { return arr.filter(f).length; }
function commRows() { return COMM[CM.month].map(function (x) { var c = Math.round(x.rv * CM.rp / 100) + x.qc * CM.qp; return Object.assign({ c: c, posted: x.done || CM.posted[CM.month + x.e] }, x); }); }

var P = {
  Insights: { t: 'التنبيهات والإحصاءات', r: function () {
    var lateV = cnt(VISA, function (v) { return v.days > 45 && v.st < 6; }), gs = cnt(GUAR, function (g) { return guarState(g) === 'تنتهي قريبًا'; }), lv = cnt(LEAVES, function (l) { return l.s === 'بانتظار'; }), ar = cnt(ARR, function (a) { return a.g === 'today'; });
    var al = [
      ['r', 4, 'عقود إيجار تنتهي خلال 48 ساعة', 'نبّه العملاء بالتمديد قبل الانتهاء', 'Bookings'],
      ['a', 3, 'عقود إيجار بانتظار السداد', 'أقدمها منذ 19 ساعة', 'Accounts'],
      ['r', lateV, 'طلبات تفييز متأخرة (+45 يومًا)', 'تابع الوكيل اليوم', 'VisaTrack'],
      ['a', gs, 'ضمانات تنتهي خلال 10 أيام', 'اتصل بالعميل للاطمئنان قبل انتهاء الضمان', 'Guarantee'],
      ['b', ar, 'عاملات يصلن اليوم', 'تأكد من جاهزية الاستقبال', 'Arrivals'],
      ['b', 5, 'طلبات استقدام جديدة من الموقع', 'لم يتواصل معها أحد بعد', 'Recruitment'],
      ['a', 2, 'طلبات إيواء معلقة', 'عاملات بانتظار قرار الإيواء', 'WorkerStatus'],
      ['g', lv, 'إجازات بانتظار الاعتماد', 'العاملة في إجازة تختفي من المتاحات', 'Leaves']
    ];
    var alerts = '<section class="xal">' + al.map(function (a) { return '<a class="xalc t-' + a[0] + '" href="#/' + a[4] + '"><strong class="v" data-n="' + a[1] + '">' + a[1] + '</strong><div><b>' + esc(a[2]) + '</b><span>' + esc(a[3]) + '</span></div><i aria-hidden="true">←</i></a>'; }).join('') + '</section>';
    var rec = bars(MONTHS, [{ n: 'طلبات فعّالة', c: '#1F6B4F', v: [6, 5, 8, 7, 9, 11, 10, 12, 14, 17] }, { n: 'في فترة الضمان', c: '#E2B04A', v: [2, 3, 3, 4, 3, 5, 4, 6, 5, 7] }, { n: 'مستردة', c: '#C0392B', v: [1, 0, 1, 0, 2, 1, 0, 1, 1, 1] }], { stack: 1, label: 'طلبات الاستقدام حسب الأشهر' });
    var ren = bars(MONTHS, [{ n: 'عقود فعّالة', c: '#3B6FB0', v: [88, 92, 120, 131, 126, 98, 104, 140, 152, 171] }, { n: 'مستردة', c: '#E06B5C', v: [3, 2, 5, 4, 6, 3, 2, 5, 4, 6] }], { label: 'عقود الإيجار حسب الأشهر' });
    return head('التنبيهات والإحصاءات', 'كل ما يحتاج انتباهك اليوم في مكان واحد · محدّث لحظيًا', btn('تحديث', 'refresh', '', 'ghost')) + alerts +
      '<div class="x2">' + card('طلبات الاستقدام حسب الأشهر · 2026', rec, chip('+21% عن الشهر السابق', 'g')) + card('عقود الإيجار حسب الأشهر · 2026', ren, chip('أعلى شهر: أكتوبر', 'b')) + '</div>' +
      kpis([{ l: 'إيراد الإيجار هذا الشهر', v: 64280, suf: ' ر.س', s: '171 عقدًا · متوسط 376 ريال' }, { l: 'إيراد الاستقدام هذا الشهر', v: 98500, suf: ' ر.س', s: '17 طلبًا · 7 في الضمان' }, { l: 'نسبة الإرجاع', v: 3, suf: '%', s: 'ضمن المعدل الطبيعي', tone: 'g' }, { l: 'متوسط مدة الاستقدام', v: 51, suf: ' يومًا', s: 'من الطلب حتى الوصول' }]);
  } },

  AuditLog: { t: 'سجل حركة النظام', r: function () {
    var money = cnt(AUDIT, function (a) { return a.m; });
    return head('سجل حركة النظام', 'كل عملية في البرنامج مسجّلة: مين، متى، من أي جهاز، والقيمة قبل وبعد', chip('السجل محمي من الحذف والتعديل', 'g')) +
      '<div class="xnote"><b>شفافية الشراكة:</b> هذا السجل لا يستطيع أحد حذفه أو تعديله، ولا حتى المدير أو المطوّر. يراه الشريك كاملًا، وكل تعديل على مبلغ يظهر بلون مميّز.</div>' +
      kpis([{ l: 'عمليات اليوم', v: cnt(AUDIT, function (a) { return /اليوم|الآن/.test(a.t); }) }, { l: 'تعديلات مالية', v: money, s: 'تحتاج مراجعة الشريك', tone: 'a' }, { l: 'عمليات حذف', v: cnt(AUDIT, function (a) { return a.a === 'حذف'; }), tone: 'r' }, { l: 'محاولات دخول فاشلة', v: cnt(AUDIT, function (a) { return a.w; }), tone: 'r' }]) +
      card('السجل', table([
        { l: 'الوقت', r: function (a) { return '<span class="nw">' + esc(a.t) + '</span>' + (a.fresh ? ' ' + chip('جديد', 'g') : ''); } },
        { l: 'المستخدم', r: function (a) { return '<b>' + esc(a.u) + '</b><small class="sub">' + esc(a.r) + '</small>'; } },
        { l: 'العملية', r: function (a) { return chip(a.a, ATONE[a.a]); } },
        { l: 'القسم', k: 's' }, { l: 'التفاصيل', k: 'i' },
        { l: 'قبل ← بعد', r: function (a) { return a.b === '—' && a.af === '—' ? '—' : '<span class="old">' + esc(a.b) + '</span> ← <b>' + esc(a.af) + '</b>'; } },
        { l: 'الجهاز', k: 'dev' }
      ], AUDIT, { title: 'سجل حركة النظام', ph: 'ابحث باسم المستخدم أو القسم أو رقم السند', row: 'audit', tag: function (a) { return a.a + (a.m ? ' مالي' : ''); }, rc: function (a) { return a.m ? 'money' : a.w ? 'warn' : ''; },
        chips: [['', 'الكل', AUDIT.length], ['مالي', 'مالية', money], ['تعديل', 'تعديل'], ['إضافة', 'إضافة'], ['حذف', 'حذف'], ['اعتماد', 'اعتماد'], ['دخول', 'دخول']] }));
  } },

  VisaTrack: { t: 'متابعة التفييز', r: function () {
    var late = cnt(VISA, function (v) { return v.days > 45 && v.st < 6; });
    return head('متابعة التفييز', 'كل طلب استقدام ومرحلته الحالية، من الطلب حتى وصول العاملة', btn('+ طلب جديد', 'demo')) +
      kpis([{ l: 'تحت الإجراء', v: cnt(VISA, function (v) { return v.st < 8; }) }, { l: 'تم تفييزها هذا الشهر', v: 4, tone: 'g' }, { l: 'متوسط المدة', v: 51, suf: ' يومًا', s: 'الهدف: أقل من 45' }, { l: 'متأخرة +45 يومًا', v: late, tone: 'r', s: 'تحتاج متابعة الوكيل' }]) +
      card('الطلبات', table([
        { l: 'رقم الطلب', r: function (v) { return '<b>' + v.id + '</b>'; } }, { l: 'العميل', k: 'c' }, { l: 'الدولة', k: 'co' }, { l: 'الوكيل', k: 'ag' },
        { l: 'المرحلة', r: function (v) { return steps(VSTEPS, v.st); } }, { l: 'تاريخ التفييز', k: 'sd' },
        { l: 'المدة', r: function (v) { return '<span class="' + (v.days > 45 && v.st < 6 ? 'late' : '') + '">' + v.days + ' يومًا</span>'; } },
        { l: 'إبلاغ العميل', noexp: 0, r: function (v, i) { return v.n ? chip('تم الإبلاغ ✓', 'g') : btn('إبلاغ بالواتساب', 'vnotify', 'data-i="' + i + '"', 'sm'); } },
        { l: 'الموظف', k: 'e' }
      ], VISA, { title: 'متابعة التفييز', ph: 'ابحث برقم الطلب أو العميل أو الوكيل', row: 'visa', tag: function (v) { return (v.days > 45 && v.st < 6 ? 'متأخر ' : '') + (v.st >= 8 ? 'وصلت' : 'جاري') + (v.n ? '' : ' لم يبلغ'); },
        chips: [['', 'الكل', VISA.length], ['جاري', 'تحت الإجراء'], ['متأخر', 'متأخرة', late], ['لم يبلغ', 'لم يُبلَّغ العميل'], ['وصلت', 'مكتملة']] }));
  } },

  Arrivals: { t: 'متابعة الوصول', r: function () {
    var grp = { today: 'اليوم', tomorrow: 'غدًا', week: 'هذا الأسبوع' }, h = '';
    ['today', 'tomorrow', 'week'].forEach(function (g) {
      var list = ARR.filter(function (a) { return a.g === g; }); if (!list.length) return;
      h += '<h3 class="xgh">' + grp[g] + ' <span>' + list.length + '</span></h3><div class="xarr">' + list.map(function (a) {
        var i = ARR.indexOf(a), tone = ATN[a.s];
        return '<article class="xac"><div class="xat"><strong>' + a.tm + '</strong><span>' + esc(a.d) + '</span></div><div class="xab"><div class="xrow"><b>' + esc(a.w) + '</b>' + chip(a.s, tone) + '</div><p>' + esc(a.co) + ' · طلب ' + a.id + ' · العميل ' + esc(a.c) + '</p><p class="mut">✈ ' + esc(a.f) + ' · ' + esc(a.ap) + '</p><p class="mut">المستلم: ' + esc(a.rc) + '</p><div class="xrow">' +
          (a.n ? chip('العميل مُبلَّغ ✓', 'g') : btn('إبلاغ العميل', 'anotify', 'data-i="' + i + '"', 'sm')) + (a.s !== 'في المكتب' ? btn(a.s === 'وصلت المطار' ? 'وصلت المكتب' : 'وصلت المطار', 'arrived', 'data-i="' + i + '"', 'sm ghost') : '') + '</div></div></article>';
      }).join('') + '</div>';
    });
    return head('متابعة الوصول', 'رحلات العاملات القادمات · جيجي والواتساب يردّون على العميل بموعد الوصول تلقائيًا', btn('+ إضافة رحلة', 'demo')) +
      kpis([{ l: 'يصلن اليوم', v: cnt(ARR, function (a) { return a.g === 'today'; }), tone: 'b' }, { l: 'خلال 7 أيام', v: ARR.length }, { l: 'رحلات متأخرة', v: cnt(ARR, function (a) { return a.s === 'متأخرة'; }), tone: 'r' }, { l: 'عملاء لم يُبلَّغوا', v: cnt(ARR, function (a) { return !a.n; }), tone: 'a' }]) + h +
      card('جدول الوصول', table([{ l: 'العاملة', k: 'w' }, { l: 'العميل', k: 'c' }, { l: 'الطلب', k: 'id' }, { l: 'الرحلة', k: 'f' }, { l: 'المطار', k: 'ap' }, { l: 'التاريخ', k: 'd' }, { l: 'الوقت', k: 'tm' }, { l: 'الحالة', r: function (a) { return chip(a.s, ATN[a.s]); } }, { l: 'المستلم', k: 'rc' }], ARR, { title: 'متابعة الوصول' }));
  } },

  Guarantee: { t: 'فترة الضمان', r: function () {
    var rows = GUAR.map(function (g) { return Object.assign({ state: guarState(g) }, g); });
    var soon = cnt(rows, function (g) { return g.state === 'تنتهي قريبًا'; });
    return head('فترة الضمان', 'ضمان 90 يومًا لكل عقد استقدام · تنبيه تلقائي قبل الانتهاء بـ 10 أيام', btn('إعدادات الضمان', 'demo', '', 'ghost')) +
      kpis([{ l: 'عقود في الضمان', v: cnt(rows, function (g) { return g.state === 'سارية' || g.state === 'تنتهي قريبًا'; }) }, { l: 'تنتهي خلال 10 أيام', v: soon, tone: 'a' }, { l: 'استرداد واستبدال هذا العام', v: RETURNS.length, tone: 'r' }, { l: 'مبالغ مستردة', v: 22300, suf: ' ر.س', s: 'تظهر في الحسابات بقيد عكسي' }]) +
      card('العقود', table([
        { l: 'العقد', r: function (g) { return '<b>' + g.k + '</b>'; } }, { l: 'العميل', k: 'c' }, { l: 'العاملة', k: 'w' }, { l: 'الدولة', k: 'co' }, { l: 'بداية الضمان', k: 'st' },
        { l: 'المدة', r: function (g) { var p = Math.min(100, g.el / 90 * 100), rem = 90 - g.el; return '<div class="xgb">' + bar(p, g.ret ? 'n' : rem <= 10 ? 'a' : 'g') + '<small>' + (g.ret ? 'أُغلق' : rem > 0 ? 'باقي ' + rem + ' يومًا' : 'انتهى') + '</small></div>'; } },
        { l: 'الحالة', r: function (g) { return chip(g.state, guarTone(g.state)); } },
        { l: 'إجراء', noexp: 1, r: function (g, i) { return g.state === 'سارية' || g.state === 'تنتهي قريبًا' ? btn('تسجيل إرجاع', 'gret', 'data-i="' + i + '"', 'sm ghost') : ''; } }
      ], rows, { title: 'فترة الضمان', ph: 'ابحث برقم العقد أو العميل', tag: function (g) { return g.state; }, chips: [['', 'الكل', rows.length], ['سارية', 'سارية'], ['تنتهي قريبًا', 'تنتهي قريبًا', soon], ['منتهية', 'منتهية'], ['مستردة', 'مستردة'], ['مستبدلة', 'مستبدلة']] })) +
      card('الاسترداد والاستبدال', table([{ l: 'العقد', k: 'k' }, { l: 'العميل', k: 'c' }, { l: 'النوع', r: function (x) { return chip(x.ty, x.ty === 'استبدال' ? 'b' : 'r'); } }, { l: 'السبب', k: 'why' }, { l: 'المبلغ', r: function (x) { return x.amt ? fmt(x.amt) + ' ر.س' : '—'; } }, { l: 'الحالة', k: 's' }], RETURNS, { title: 'الاسترداد والاستبدال' }));
  } },

  Agents: { t: 'الوكلاء الخارجيون', r: function () {
    var owed = AGENTS.reduce(function (a, b) { return a + b.owed; }, 0);
    return head('الوكلاء الخارجيون', 'أداء كل وكيل في الدول المصدّرة وحسابه المالي', btn('+ إضافة وكيل', 'demo')) +
      kpis([{ l: 'وكلاء نشطون', v: AGENTS.length }, { l: 'طلبات جارية عندهم', v: AGENTS.reduce(function (a, b) { return a + b.act; }, 0) }, { l: 'مستحق للوكلاء', v: owed, suf: ' ر.س', tone: 'a' }, { l: 'أفضل وكيل', v: 4.8, s: 'نيروبي هوم كير', tone: 'g' }]) +
      '<section class="xag">' + AGENTS.map(function (a, i) {
        return '<article class="xagc" data-act="agent" data-i="' + i + '" tabindex="0"><div class="xrow"><div><b>' + esc(a.n) + '</b><small class="sub">' + esc(a.co) + '</small></div>' + stars(a.r) + '</div>' +
          '<div class="xm3"><div><strong>' + a.act + '</strong><span>جارية</span></div><div><strong>' + a.del + '</strong><span>تم توريدها</span></div><div><strong>' + a.avg + '</strong><span>يوم متوسط</span></div></div>' +
          '<div class="xlab"><span>نسبة التأخير</span><b class="' + (a.late > 20 ? 'late' : '') + '">' + a.late + '%</b></div>' + bar(a.late, a.late > 20 ? 'r' : a.late > 10 ? 'a' : 'g') +
          '<div class="xrow mt"><span class="mut">مستحق له</span><b>' + fmt(a.owed) + ' ر.س</b></div></article>';
      }).join('') + '</section>' +
      card('مقارنة الوكلاء', table([{ l: 'الوكيل', k: 'n' }, { l: 'الدولة', k: 'co' }, { l: 'جارية', k: 'act' }, { l: 'تم توريدها', k: 'del' }, { l: 'متوسط الأيام', k: 'avg' }, { l: 'التأخير', r: function (a) { return a.late + '%'; } }, { l: 'التقييم', r: function (a) { return a.r.toFixed(1); } }, { l: 'المدفوع', r: function (a) { return fmt(a.paid); } }, { l: 'المستحق', r: function (a) { return fmt(a.owed); } }], AGENTS, { title: 'الوكلاء الخارجيون', row: 'agent' }));
  } },

  Candidates: { t: 'المرشحات والسير الذاتية', r: function () {
    var cos = []; CANDS.forEach(function (c) { if (cos.indexOf(c.co) < 0) cos.push(c.co); });
    return head('المرشحات والسير الذاتية', 'بنك السير الذاتية من الوكلاء · اختر للعميل أو انقل للإيجار بضغطة', btn('+ استيراد سير ذاتية', 'demo')) +
      kpis([{ l: 'سير ذاتية', v: CANDS.length }, { l: 'متاحة للاختيار', v: cnt(CANDS, function (c) { return c.s === 'متاحة'; }), tone: 'g' }, { l: 'محجوزة لعملاء', v: cnt(CANDS, function (c) { return c.s === 'محجوزة لعميل'; }), tone: 'a' }, { l: 'دول', v: cos.length }]) +
      '<div class="xf" role="group" aria-label="تصفية حسب الدولة"><button type="button" class="xfc on" data-cf="">الكل</button>' + cos.map(function (c) { return '<button type="button" class="xfc" data-cf="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<section class="xcv" id="xcv">' + CANDS.map(function (c, i) {
        var tone = c.s === 'متاحة' ? 'g' : c.s === 'محجوزة لعميل' ? 'a' : 'b';
        return '<article class="xcvc" data-co="' + esc(c.co) + '"><div class="xav" aria-hidden="true">' + esc(c.n.charAt(0)) + '</div><div class="xrow"><b>' + esc(c.n) + '</b>' + chip(c.s, tone) + '</div><p class="mut">' + esc(c.co) + ' · ' + c.age + ' سنة · خبرة ' + c.ex + ' سنوات</p><p>' + esc(c.sk) + '</p><p class="mut">' + esc(c.lg) + '</p><div class="xrow"><span class="mut">الراتب</span><b>' + fmt(c.sal) + ' ر.س</b></div><p class="mut sm">الوكيل: ' + esc(c.ag) + '</p>' +
          (c.s === 'متاحة' ? '<div class="xrow">' + btn('اختيار لعميل', 'cpick', 'data-i="' + i + '"', 'sm') + btn('نقل للإيجار', 'crent', 'data-i="' + i + '"', 'sm ghost') + '</div>' : btn('عرض السيرة', 'cview', 'data-i="' + i + '"', 'sm ghost')) + '</article>';
      }).join('') + '</section>';
  } },

  WorkerStatus: { t: 'حالات العاملات', r: function () {
    var items = STAT.map(function (s, i) { return { n: s, v: STCOUNT[i], c: STCOL[i] }; });
    var flow = bars(['7/9', '14/9', '21/9', '28/9', '5/10', '12/10', '19/10', '26/10'], [{ n: 'دخول الإيواء', c: '#1F6B4F', v: [4, 6, 3, 5, 7, 4, 6, 5] }, { n: 'خروج', c: '#E06B5C', v: [5, 4, 4, 6, 5, 6, 3, 7] }], { label: 'حركة الإشغال الأسبوعية' });
    var risk = STCOUNT[5] + STCOUNT[6] + STCOUNT[7] + STCOUNT[8];
    return head('حالات العاملات', 'الإيواء والجاهزية والمشكلات · غيّر الحالة وتُسجَّل في سجل الحركة تلقائيًا', btn('+ طلب إيواء', 'demo')) +
      kpis([{ l: 'في الإيواء الآن', v: STCOUNT[0], s: 'السعة 60 سريرًا' }, { l: 'جاهزة للتسليم', v: STCOUNT[2], tone: 'g' }, { l: 'حالات تحتاج معالجة', v: risk, s: 'نزاع · رفض عمل · راتب · هروب', tone: 'r' }, { l: 'معدل الدوران', v: 38, suf: '%', s: 'آخر 8 أسابيع' }]) +
      '<div class="x2">' + card('توزيع الحالات', donut(items, 'عاملة')) + card('حركة الإشغال الأسبوعية', flow) + '</div>' +
      card('العاملات', table([
        { l: 'العاملة', r: function (w) { return '<b>' + esc(w.w) + '</b>'; } }, { l: 'الدولة', k: 'co' },
        { l: 'الحالة', r: function (w) { return chip(STAT[w.s], STONE[w.s]); } }, { l: 'منذ', k: 'since' }, { l: 'ملاحظة', k: 'note' },
        { l: 'تغيير الحالة', noexp: 1, r: function (w, i) { return '<select class="xsel" data-chg="' + i + '" aria-label="تغيير حالة ' + esc(w.w) + '">' + STAT.map(function (s, j) { return '<option value="' + j + '"' + (j === w.s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>'; } }
      ], SW, { title: 'حالات العاملات', tag: function (w) { return STAT[w.s]; }, chips: [['', 'الكل', SW.length]].concat(STAT.map(function (s) { return [s, s]; })) }));
  } },

  Transfer: { t: 'نقل الخدمات', r: function () {
    var fees = TRANS.reduce(function (a, t) { return a + t.of; }, 0);
    return head('نقل الخدمات (نقل الكفالة)', 'كل طلب نقل ومراحله ورسومه · يُربط بحسابات الاستقدام', btn('+ طلب نقل', 'demo')) +
      kpis([{ l: 'طلبات جارية', v: cnt(TRANS, function (t) { return t.st < 5; }) }, { l: 'بانتظار السداد', v: cnt(TRANS, function (t) { return !t.paid; }), tone: 'a' }, { l: 'مكتملة هذا الشهر', v: cnt(TRANS, function (t) { return t.st === 5; }), tone: 'g' }, { l: 'أتعاب المكتب', v: fees, suf: ' ر.س' }]) +
      card('الطلبات', table([
        { l: 'الطلب', r: function (t) { return '<b>' + t.id + '</b>'; } }, { l: 'العاملة', k: 'w' }, { l: 'من', k: 'from' }, { l: 'إلى', k: 'to' },
        { l: 'المرحلة', r: function (t) { return steps(TSTEPS, t.st); } }, { l: 'رسوم الجهة', r: function (t) { return fmt(t.fee); } }, { l: 'أتعاب المكتب', r: function (t) { return fmt(t.of); } },
        { l: 'السداد', r: function (t) { return t.paid ? chip('مدفوع', 'g') : chip('غير مدفوع', 'a'); } },
        { l: 'إجراء', noexp: 1, r: function (t, i) { return t.st < 5 ? btn('المرحلة التالية', 'tnext', 'data-i="' + i + '"', 'sm ghost') : chip('مكتمل', 'g'); } }
      ], TRANS, { title: 'نقل الخدمات', row: 'trans' }));
  } },

  Commissions: { t: 'عمولات الموظفين', r: function () {
    var rows = commRows(), tot = rows.reduce(function (a, r) { return a + r.c; }, 0), max = Math.max.apply(null, rows.map(function (r) { return r.c; }));
    var months = Object.keys(COMM);
    return head('عمولات الموظفين', 'تُحسب تلقائيًا من العقود · وتُرحَّل للرواتب بضغطة', '<div class="xseg" role="group" aria-label="الشهر">' + months.map(function (m) { return '<button type="button" data-month="' + esc(m) + '" class="' + (m === CM.month ? 'on' : '') + '">' + esc(m) + '</button>'; }).join('') + '</div>') +
      '<div class="xnote">القاعدة الحالية: <b>' + CM.rp + '%</b> من إيراد عقود الإيجار + <b>' + CM.qp + ' ريال</b> لكل عقد استقدام مكتمل. يعدّلها المدير من الإعدادات، وكل تعديل يُسجَّل في سجل الحركة.</div>' +
      kpis([{ l: 'إجمالي العمولات', v: tot, suf: ' ر.س' }, { l: 'عقود إيجار', v: rows.reduce(function (a, r) { return a + r.rc; }, 0) }, { l: 'عقود استقدام', v: rows.reduce(function (a, r) { return a + r.qc; }, 0) }, { l: 'لم تُرحَّل بعد', v: cnt(rows, function (r) { return !r.posted; }), tone: 'a' }]) +
      '<section class="xcm">' + rows.map(function (r) {
        return '<div class="xcmr"><div class="xav sm" aria-hidden="true">' + esc(r.e.charAt(0)) + '</div><div class="xcmb"><div class="xrow"><b>' + esc(r.e) + ' <small class="sub">' + esc(r.r) + '</small></b><strong>' + fmt(r.c) + ' ر.س</strong></div>' + bar(r.c / max * 100, 'g') +
          '<small class="mut">' + r.rc + ' عقد إيجار (' + fmt(r.rv) + ' ر.س) · ' + r.qc + ' عقد استقدام</small></div>' + (r.posted ? chip('مُرحّلة للرواتب', 'g') : btn('ترحيل للرواتب', 'cpost', 'data-e="' + esc(r.e) + '"', 'sm')) + '</div>';
      }).join('') + '</section>' +
      card('كشف العمولات · ' + CM.month, table([{ l: 'الموظف', k: 'e' }, { l: 'الوظيفة', k: 'r' }, { l: 'عقود الإيجار', k: 'rc' }, { l: 'إيراد الإيجار', r: function (r) { return fmt(r.rv); } }, { l: 'عقود الاستقدام', k: 'qc' }, { l: 'العمولة', r: function (r) { return '<b>' + fmt(r.c) + '</b>'; } }, { l: 'الحالة', r: function (r) { return r.posted ? 'مُرحّلة' : 'بانتظار الترحيل'; } }], rows, { title: 'عمولات الموظفين ' + CM.month }));
  } },

  Leaves: { t: 'إجازات العاملات', r: function () {
    var days = ['الأحد 1/11', 'الإثنين 2/11', 'الثلاثاء 3/11', 'الأربعاء 4/11', 'الخميس 5/11', 'الجمعة 6/11', 'السبت 7/11'];
    var on = [['روز', 'سيتي'], ['روز', 'سيتي', 'جوي'], ['سيتي', 'جوي'], ['سيتي', 'جوي'], ['سيتي'], ['سيتي'], ['سيتي']];
    var strip = '<div class="xwk">' + days.map(function (d, i) { return '<div><b>' + d + '</b>' + on[i].map(function (n) { var l = LEAVES.filter(function (x) { return x.w === n; })[0]; return '<span class="xc t-' + (l && l.s === 'موافق' ? 'b' : 'a') + '">' + n + '</span>'; }).join('') + '</div>'; }).join('') + '</div>';
    return head('إجازات العاملات', 'العاملة في إجازة معتمدة تختفي تلقائيًا من العاملات المتاحات للعملاء', btn('+ تسجيل إجازة', 'demo')) +
      kpis([{ l: 'بانتظار الاعتماد', v: cnt(LEAVES, function (l) { return l.s === 'بانتظار'; }), tone: 'a' }, { l: 'في إجازة الآن', v: 2, tone: 'b' }, { l: 'معتمدة هذا الشهر', v: cnt(LEAVES, function (l) { return l.s === 'موافق'; }) }, { l: 'أيام إجازة هذا الشهر', v: 42 }]) +
      card('الأسبوع القادم', strip, '<span class="mut sm">أزرق: معتمدة · برتقالي: بانتظار الاعتماد</span>') +
      card('الطلبات', table([
        { l: 'العاملة', r: function (l) { return '<b>' + esc(l.w) + '</b>'; } }, { l: 'النوع', r: function (l) { return chip(l.ty, l.ty === 'مرضية' ? 'r' : l.ty === 'طارئة' ? 'a' : 'b') + (l.doc ? ' <small class="mut">📎 تقرير طبي</small>' : ''); } },
        { l: 'من', k: 'f' }, { l: 'إلى', k: 'to' }, { l: 'الأيام', k: 'd' }, { l: 'الرصيد السنوي', r: function (l) { return l.bal + ' يومًا'; } },
        { l: 'الحالة', r: function (l) { return chip(l.s, { 'بانتظار': 'a', 'موافق': 'g', 'مرفوض': 'r' }[l.s]); } },
        { l: 'إجراء', noexp: 1, r: function (l, i) { return l.s === 'بانتظار' ? '<div class="xrow">' + btn('موافقة', 'lok', 'data-i="' + i + '"', 'sm') + btn('رفض', 'lno', 'data-i="' + i + '"', 'sm danger') + '</div>' : ''; } }
      ], LEAVES, { title: 'إجازات العاملات', tag: function (l) { return l.s; }, chips: [['', 'الكل', LEAVES.length], ['بانتظار', 'بانتظار'], ['موافق', 'معتمدة'], ['مرفوض', 'مرفوضة']] }));
  } }
};

/* ---------- actions ---------- */
function rerender() { var h = H(); if (h.reopen) h.reopen(); }
var ACT = {
  demo: function () { toast('تم · هذه نسخة تجريبية بدون حفظ'); },
  refresh: function () { toast('تم التحديث · كل الأرقام محدّثة'); rerender(); },
  audit: function (t) { var a = AUDIT[+t.dataset.i]; drawer('تفاصيل العملية', kv([['الوقت', esc(a.t)], ['المستخدم', esc(a.u + ' · ' + a.r)], ['العملية', chip(a.a, ATONE[a.a])], ['القسم', esc(a.s)], ['التفاصيل', esc(a.i)], ['القيمة قبل', '<span class="old">' + esc(a.b) + '</span>'], ['القيمة بعد', '<b>' + esc(a.af) + '</b>'], ['الجهاز', esc(a.dev)]]) + (a.m ? '<div class="xnote">عملية مالية: تظهر في تقرير الشريك الشهري ولا يمكن حذفها. التصحيح يكون بقيد عكسي فقط.</div>' : '')); },
  visa: function (t) { var v = VISA[+t.dataset.i]; drawer('طلب ' + v.id, kv([['العميل', esc(v.c)], ['الدولة', esc(v.co)], ['الوكيل', esc(v.ag)], ['المدة', v.days + ' يومًا'], ['الموظف', esc(v.e)]]) + '<h3 class="xgh">المراحل</h3>' + timeline(VSTEPS, v.st)); },
  vnotify: function (t) { var v = VISA[+t.dataset.i]; v.n = 1; log('إضافة', 'متابعة التفييز', 'إبلاغ العميل ' + v.c + ' بمرحلة طلب ' + v.id, '—', 'رسالة واتساب'); toast('أُرسلت رسالة واتساب للعميل بمرحلة الطلب'); rerender(); },
  anotify: function (t) { var a = ARR[+t.dataset.i]; a.n = 1; log('إضافة', 'متابعة الوصول', 'إبلاغ ' + a.c + ' بموعد وصول ' + a.w, '—', a.d + ' ' + a.tm); toast('تم إبلاغ العميل بموعد الوصول'); rerender(); },
  arrived: function (t) {
    var a = ARR[+t.dataset.i], b = a.s, office = a.s === 'وصلت المطار'; a.s = office ? 'في المكتب' : 'وصلت المطار';
    VISA.forEach(function (v) { if (v.id === a.id) v.st = office ? 8 : 7; });
    log('تعديل', 'متابعة الوصول', 'العاملة ' + a.w + ' · طلب ' + a.id, b, a.s);
    var R = RULES.filter(function (x) { return x.k === (office ? 'office' : 'airport'); })[0], cu = CUST[a.c] || {};
    if (R.on && cu.v) { sendWA(a.c, office ? 'وصول المكتب' : 'وصول المطار', fill(R.x, a)); if (office) a.on = 1; toast(a.w + ': ' + a.s + ' · أُرسلت رسالة واتساب للعميل تلقائيًا'); }
    else toast(a.w + ': ' + a.s + (cu.v ? '' : ' · لم تُرسل رسالة لأن رقم العميل غير موثّق'));
    rerender();
  },
  gret: function (t) { var g = GUAR[+t.dataset.i]; drawer('تسجيل إرجاع · ' + g.k, kv([['العميل', esc(g.c)], ['العاملة', esc(g.w)], ['الأيام المنقضية', g.el + ' من 90']]) + '<div class="xrow mt">' + btn('استبدال بعاملة أخرى', 'gdo', 'data-i="' + t.dataset.i + '" data-k="مستبدلة"') + btn('استرداد المبلغ', 'gdo', 'data-i="' + t.dataset.i + '" data-k="مستردة"', 'danger') + '</div>'); },
  gdo: function (t) { var g = GUAR[+t.dataset.i]; g.ret = t.dataset.k; log('تعديل', 'فترة الضمان', 'العقد ' + g.k + ' · ' + g.c, 'سارية', t.dataset.k, t.dataset.k === 'مستردة'); closeDrawer(); toast('تم التسجيل · ' + (t.dataset.k === 'مستردة' ? 'أُنشئ قيد عكسي في الحسابات' : 'أُنشئ طلب بديلة')); rerender(); },
  agent: function (t) { var a = AGENTS[+t.dataset.i], mine = VISA.filter(function (v) { return v.ag === a.n; }); drawer(a.n, kv([['الدولة', esc(a.co)], ['التقييم', stars(a.r) + ' ' + a.r], ['متوسط التوريد', a.avg + ' يومًا'], ['نسبة التأخير', a.late + '%'], ['المدفوع', fmt(a.paid) + ' ر.س'], ['المستحق', '<b>' + fmt(a.owed) + ' ر.س</b>']]) + '<h3 class="xgh">طلباته الجارية</h3>' + (mine.length ? mine.map(function (v) { return '<div class="xli"><b>' + v.id + '</b> · ' + esc(v.c) + ' · ' + esc(VSTEPS[v.st]) + '</div>'; }).join('') : '<p class="mut">لا توجد طلبات في العرض التجريبي</p>') + '<div class="xrow mt">' + btn('تسجيل دفعة للوكيل', 'demo') + '</div>'); },
  cpick: function (t) { var c = CANDS[+t.dataset.i]; c.s = 'محجوزة لعميل'; log('تعديل', 'المرشحات', 'حجز السيرة الذاتية ' + c.n, 'متاحة', 'محجوزة لعميل'); toast('حُجزت ' + c.n + ' وأُرسلت سيرتها للعميل'); rerender(); },
  crent: function (t) { var c = CANDS[+t.dataset.i]; c.s = 'تم الاختيار'; log('إضافة', 'العاملات', 'نقل ' + c.n + ' من المرشحات إلى الإيجار', '—', 'بانتظار الوصول'); toast('أُضيفت ' + c.n + ' لقائمة عاملات الإيجار بعد وصولها'); rerender(); },
  cview: function (t) { var c = CANDS[+t.dataset.i]; drawer('السيرة الذاتية · ' + c.n, '<div class="xav lg" aria-hidden="true">' + esc(c.n.charAt(0)) + '</div>' + kv([['الدولة', esc(c.co)], ['العمر', c.age + ' سنة'], ['الخبرة', c.ex + ' سنوات'], ['اللغات', esc(c.lg)], ['المهارات', esc(c.sk)], ['الراتب', fmt(c.sal) + ' ر.س'], ['الوكيل', esc(c.ag)], ['الحالة', chip(c.s, 'a')]])); },
  trans: function (t) { var x = TRANS[+t.dataset.i]; drawer('طلب نقل ' + x.id, kv([['العاملة', esc(x.w)], ['من', esc(x.from)], ['إلى', esc(x.to)], ['رسوم الجهة', fmt(x.fee) + ' ر.س'], ['أتعاب المكتب', fmt(x.of) + ' ر.س']]) + '<h3 class="xgh">المراحل</h3>' + timeline(TSTEPS, x.st)); },
  tnext: function (t) { var x = TRANS[+t.dataset.i], b = TSTEPS[x.st]; x.st = Math.min(5, x.st + 1); if (x.st >= 4) x.paid = 1; log('تعديل', 'نقل الخدمات', 'طلب ' + x.id + ' · ' + x.w, b, TSTEPS[x.st]); toast('انتقل الطلب إلى: ' + TSTEPS[x.st]); rerender(); },
  cpost: function (t) { var e = t.dataset.e; CM.posted[CM.month + e] = 1; var r = commRows().filter(function (x) { return x.e === e; })[0]; log('اعتماد', 'عمولات الموظفين', 'ترحيل عمولة ' + e + ' · ' + CM.month, '—', fmt(r.c) + ' ريال', 1); toast('رُحّلت عمولة ' + e + ' إلى مسير الرواتب'); rerender(); },
  lok: function (t) { var l = LEAVES[+t.dataset.i]; l.s = 'موافق'; log('اعتماد', 'إجازات العاملات', 'إجازة ' + l.w + ' ' + l.f + '–' + l.to, 'بانتظار', 'موافق'); toast('اعتُمدت الإجازة · ' + l.w + ' مخفية من المتاحات خلالها'); rerender(); },
  lno: function (t) { var l = LEAVES[+t.dataset.i]; l.s = 'مرفوض'; log('اعتماد', 'إجازات العاملات', 'إجازة ' + l.w, 'بانتظار', 'مرفوض'); toast('رُفض طلب الإجازة'); rerender(); }
};

function filterTable(id) {
  var t = document.getElementById(id); if (!t) return;
  var qi = document.querySelector('[data-search="' + id + '"]'), q = qi ? qi.value.trim() : '';
  var ch = document.querySelector('.xfc.on[data-chip="' + id + '"]'), tag = ch ? ch.dataset.v : '';
  var rows = t.querySelectorAll('tbody tr'), shown = 0;
  rows.forEach(function (tr) { var ok = (!q || tr.textContent.indexOf(q) >= 0) && (!tag || (tr.dataset.tag || '').indexOf(tag) >= 0); tr.style.display = ok ? '' : 'none'; if (ok) shown++; });
  var c = document.getElementById(id + 'c'); if (c) c.textContent = 'عرض ' + shown + ' من ' + rows.length;
  var em = t.parentNode.querySelector('.xempty'); if (em) em.hidden = shown > 0;
}

/* ---------- shell ---------- */
var OLD = [['لوحة التحكم', 'Dashboard'], ['العاملات', 'Workers'], ['حجوزات الإيجار', 'Bookings'], ['طلبات الاستقدام', 'Recruitment'], ['جدول الإشغال', 'Occupancy'], ['العملاء', 'Customers'], ['التحقق من الهويات', 'IdVerify'], ['الحسابات', 'Accounts'], ['العقود وإشعارات مساند', 'Contracts'], ['الإيواء', 'Shelter'], ['آراء العملاء', 'Reviews'], ['الموظفون والصلاحيات', 'Staff'], ['التقارير والطباعة', 'Reports'], ['الإعدادات', 'Settings'], ['الواتساب والرد الآلي', 'WhatsApp'], ['أرشيف المحادثات', 'ChatArchive']];
var NEW = ['Insights', 'WhatsBot', 'AuditLog', 'VisaTrack', 'Arrivals', 'Guarantee', 'Agents', 'Candidates', 'WorkerStatus', 'Transfer', 'Commissions', 'Leaves'];
function logo(sz) { return '<svg width="' + sz + '" height="' + Math.round(sz * 1.18) + '" viewBox="0 0 100 118" aria-hidden="true"><path d="M50 4C50 4 12 50 12 74a38 38 0 0 0 76 0C88 50 50 4 50 4z" fill="#3B82D6"/><text x="50" y="84" text-anchor="middle" font-family="Reem Kufi, sans-serif" font-size="19" font-weight="700" fill="#fff">M.H.R</text></svg>'; }
function newLinks(active) { return NEW.map(function (k) { return '<a href="#/' + k + '" class="' + (k === active ? 'on' : '') + '">' + esc(P[k].t) + '</a>'; }).join(''); }
function shell(name) {
  var nav = '<nav class="xn" aria-label="قائمة المدير"><div class="xbr">' + logo(30) + '<div><strong>شركة أصايل المنصورة</strong><span>لوحة المدير</span></div></div>' +
    '<div class="xng"><span class="xngh">العمليات والمتابعة <em>جديد</em></span>' + newLinks(name) + '</div>' +
    '<details class="xng"><summary class="xngh">الأقسام الأساسية</summary>' + OLD.map(function (o, i) { return '<a href="#/' + o[1] + '"><small>' + (i + 1) + '</small>' + esc(o[0]) + '</a>'; }).join('') + '</details>' +
    '<a href="#/StaffLogin" class="xout" data-act="logout">تسجيل الخروج</a></nav>';
  return '<div class="xs" dir="rtl">' + nav + '<main class="xmn" id="xmain">' + P[name].r() + '</main></div>';
}

function bindRoot(root) {
  if (root.__xp) return; root.__xp = 1; wbBind(root);
  root.addEventListener('click', function (e) {
    var ex = e.target.closest('[data-exp]');
    if (ex) { e.preventDefault(); var t = document.getElementById(ex.dataset.t) || root.querySelector('table'); if (t) doExport(ex.dataset.exp, t); return; }
    var ch = e.target.closest('[data-chip]');
    if (ch) { root.querySelectorAll('[data-chip="' + ch.dataset.chip + '"]').forEach(function (b) { b.classList.toggle('on', b === ch); }); filterTable(ch.dataset.chip); return; }
    var cf = e.target.closest('[data-cf]');
    if (cf) { root.querySelectorAll('[data-cf]').forEach(function (b) { b.classList.toggle('on', b === cf); }); root.querySelectorAll('.xcvc').forEach(function (c) { c.style.display = !cf.dataset.cf || c.dataset.co === cf.dataset.cf ? '' : 'none'; }); return; }
    var mo = e.target.closest('[data-month]');
    if (mo) { CM.month = mo.dataset.month; rerender(); return; }
    var a = e.target.closest('[data-act]');
    if (a && root.contains(a)) {
      if (a.dataset.act === 'logout') { var h = H(); if (h.logout) h.logout(); return; }
      if (e.target.closest('select')) return;
      if (a.tagName === 'TR' && e.target.closest('button,a')) return;
      e.preventDefault(); if (ACT[a.dataset.act]) ACT[a.dataset.act](a);
    }
  });
  root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][tabindex]')) { e.preventDefault(); ACT[e.target.dataset.act](e.target); } });
  root.addEventListener('input', function (e) { if (e.target.dataset.search) filterTable(e.target.dataset.search); });
  root.addEventListener('change', function (e) {
    var s = e.target.closest('[data-chg]'); if (!s) return;
    var w = SW[+s.dataset.chg], b = STAT[w.s]; STCOUNT[w.s]--; w.s = +s.value; STCOUNT[w.s]++; w.since = 'الآن';
    log('تعديل', 'حالات العاملات', 'العاملة ' + w.w, b, STAT[w.s]); toast('تغيّرت حالة ' + w.w + ' إلى: ' + STAT[w.s] + ' · سُجّلت في سجل الحركة'); rerender();
  });
}
function countUp(root) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('.v[data-n]').forEach(function (el) {
    var n = +el.dataset.n, txt = el.textContent, pre = txt.split(fmt(n))[0], suf = txt.split(fmt(n)).slice(1).join(fmt(n)); if (!isFinite(n) || n === 0 || n % 1) return;
    var t0 = performance.now(); (function step(t) { var p = Math.min(1, (t - t0) / 600), e2 = 1 - Math.pow(1 - p, 3); el.textContent = pre + fmt(Math.round(n * e2)) + suf; if (p < 1) requestAnimationFrame(step); })(t0);
  });
}

/* ---------- enhance existing pages ---------- */
function enhance(root, name) {
  var nav = root.querySelector('nav[aria-label]');
  if (nav && !nav.querySelector('.xold') && /قائمة المدير|المحاسب/.test(nav.getAttribute('aria-label') + nav.textContent)) {
    var d = document.createElement('details'); d.className = 'xold';
    d.innerHTML = '<summary>العمليات والمتابعة <em>جديد</em></summary>' + newLinks('');
    var out = nav.querySelector('.logout'); nav.insertBefore(d, out || null); nav.style.overflowY = 'auto';
  }
  var t = name !== 'WorkerReport' && root.querySelector('table');
  if (t) {
    var f = document.createElement('div'); f.className = 'xfloat'; f.setAttribute('role', 'group'); f.setAttribute('aria-label', 'تصدير الجدول');
    f.innerHTML = '<span>تصدير الجدول</span><button type="button" data-fx="copy">نسخ</button><button type="button" data-fx="xls">Excel</button><button type="button" data-fx="print">طباعة</button>';
    f.addEventListener('click', function (e) { var b = e.target.closest('[data-fx]'); if (b) doExport(b.dataset.fx, t, document.title.split('·')[0].replace('— المدير', '').trim()); });
    root.appendChild(f);
  }
}

var CSS = '.xs{display:flex;min-height:100vh;background:#FBF7EF;color:#1F2A24;font-family:"IBM Plex Sans Arabic",sans-serif}' +
'.xn{width:250px;flex:none;background:#1F2A24;color:#fff;padding:20px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;position:sticky;top:0;height:100vh;overflow-y:auto}' +
'.xbr{display:flex;gap:10px;align-items:center;padding:0 6px}.xbr div{display:flex;flex-direction:column}.xbr strong{font-family:"Reem Kufi",sans-serif;font-size:15px}.xbr span{font-size:12px;color:#B9C4BE}' +
'.xng{display:flex;flex-direction:column;gap:2px}.xngh{font-size:12px;color:#F4C77A;padding:6px 10px;font-weight:600;cursor:pointer;list-style:none}.xngh em,.xold em{font-style:normal;background:#F4C77A;color:#1F2A24;border-radius:999px;padding:1px 7px;font-size:10.5px;margin-inline-start:4px}' +
'.xn a{display:flex;gap:8px;align-items:center;min-height:38px;padding:7px 10px;border-radius:10px;color:#D5DDD8;text-decoration:none;font-size:14px;box-sizing:border-box}.xn a small{opacity:.6;width:18px;font-size:11px}.xn a:hover{background:#2C3A33}.xn a.on{background:#1F6B4F;color:#fff;font-weight:600}' +
'.xout{margin-top:auto;border:1px solid #3A4740;color:#F4C77A!important}' +
'.xold{margin-top:6px;border-top:1px solid #3A4740;padding-top:6px}.xold summary{font-size:13px;color:#F4C77A;padding:8px 10px;cursor:pointer;font-weight:600}.xold a{display:block;padding:7px 10px;border-radius:9px;color:#D5DDD8;text-decoration:none;font-size:13.5px}.xold a:hover{background:#2C3A33}' +
'.xmn{flex:1;min-width:0;padding:26px 30px 60px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px;animation:xin .35s ease}' +
'@keyframes xin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
'.xh{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}.xh h1{margin:0;font-size:26px}.xh p{margin:4px 0 0;color:#4A5650;font-size:14px}.xha{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
'.xk{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.xkc{background:#fff;border:1.5px solid #E2D9C6;border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:4px;transition:transform .15s,box-shadow .15s}.xkc:hover{transform:translateY(-2px);box-shadow:0 6px 18px #1F2A2412}.xkc span{font-size:13.5px;color:#4A5650}.xkc strong{font-size:28px;font-variant-numeric:tabular-nums}.xkc small{font-size:12.5px;color:#4A5650;min-height:16px}' +
'.k-a{background:#FBEFD9;border-color:#E9C48A}.k-a strong{color:#8A4E0E}.k-r{background:#FBE9E7;border-color:#EDB7B0}.k-r strong{color:#A3261B}.k-g{background:#E6F0EA;border-color:#A9CDB8}.k-g strong{color:#164D39}.k-b{background:#E3ECF8;border-color:#AFC6E6}.k-b strong{color:#18467D}' +
'.xcd{background:#fff;border:1.5px solid #E2D9C6;border-radius:16px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;min-width:0}.xcdh{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.xcdh h2{margin:0;font-size:17px}' +
'.x2{display:grid;grid-template-columns:1fr 1fr;gap:16px}' +
'.xc{display:inline-flex;align-items:center;border-radius:999px;padding:3px 10px;font-size:12.5px;font-weight:600;white-space:nowrap;gap:4px}.t-g{background:#E6F0EA;color:#164D39}.t-a{background:#FBEFD9;color:#8A4E0E}.t-r{background:#FBE3E1;color:#A3261B}.t-b{background:#DCE8F7;color:#18467D}.t-p{background:#EEE6F7;color:#5B3591}.t-n{background:#EFEBE3;color:#4A5650}' +
'.xbt{height:40px;padding:0 16px;border-radius:11px;border:none;background:#1F6B4F;color:#fff;font:600 14px "IBM Plex Sans Arabic",sans-serif;cursor:pointer;white-space:nowrap;transition:filter .15s}.xbt:hover{filter:brightness(1.1)}.xbt.sm{height:32px;padding:0 12px;font-size:13px;border-radius:9px}.xbt.ghost{background:#fff;color:#1F6B4F;border:1.5px solid #A9CDB8}.xbt.danger{background:#fff;color:#A3261B;border:1.5px solid #EDB7B0}' +
'.xf{display:flex;gap:8px;flex-wrap:wrap}.xfc{background:#fff;border:1.5px solid #E2D9C6;border-radius:999px;padding:6px 14px;font:500 13.5px "IBM Plex Sans Arabic",sans-serif;cursor:pointer;color:#1F2A24}.xfc b{background:#EFEBE3;border-radius:999px;padding:0 7px;font-size:11.5px;margin-inline-start:2px}.xfc.on{background:#1F2A24;color:#fff;border-color:#1F2A24}.xfc.on b{background:#3A4740}' +
'.xtb{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.xse{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;height:40px;border:1.5px solid #E2D9C6;border-radius:11px;padding:0 12px;color:#4A5650;background:#FDFBF7}.xse input{border:none;outline:none;background:transparent;font:14px "IBM Plex Sans Arabic",sans-serif;flex:1;min-width:0}.xse:focus-within{border-color:#1F6B4F}.xcount{font-size:12.5px;color:#4A5650}' +
'.xex{display:flex;border:1.5px solid #E2D9C6;border-radius:10px;overflow:hidden}.xex button{background:#fff;border:none;border-inline-start:1px solid #E2D9C6;padding:0 12px;height:36px;font:500 13px "IBM Plex Sans Arabic",sans-serif;cursor:pointer;color:#1F2A24}.xex button:first-child{border:none}.xex button:hover{background:#F5EFE2}' +
'.xtw{overflow-x:auto;border:1px solid #EFE8DA;border-radius:12px}.xt{width:100%;border-collapse:collapse;font-size:13.5px}.xt th{background:#F7F2E8;text-align:right;padding:10px 12px;font-weight:600;color:#4A5650;white-space:nowrap;position:sticky;top:0}.xt td{padding:10px 12px;border-top:1px solid #EFE8DA;vertical-align:middle}.xt tr.clk{cursor:pointer}.xt tr.clk:hover td{background:#FBF7EF}.xt tr.money td{background:#FFFBF0}.xt tr.money td:first-child{box-shadow:inset -3px 0 #D98A2B}.xt tr.warn td:first-child{box-shadow:inset -3px 0 #C0392B}.xempty{text-align:center;color:#4A5650;padding:18px;margin:0}' +
'.sub{display:block;color:#4A5650;font-size:12px;font-weight:400}.old{color:#A3261B;text-decoration:line-through}.late{color:#A3261B;font-weight:700}.mut{color:#4A5650}.sm{font-size:12.5px}.nw{white-space:nowrap}.mt{margin-top:8px}' +
'.xsp{display:inline-flex;gap:3px;vertical-align:middle}.xsp i{width:16px;height:6px;border-radius:3px;background:#E2D9C6}.xsp i.d{background:#1F6B4F}.xsp i.c{background:#D98A2B;animation:xpl 1.4s infinite}.xsl{display:block;font-size:12px;color:#4A5650;margin-top:3px}@keyframes xpl{50%{opacity:.45}}' +
'.xb{display:block;height:7px;border-radius:4px;background:#EFE8DA;overflow:hidden;min-width:60px}.xb i{display:block;height:100%;border-radius:4px;transition:width .6s}.xb i.t-g{background:#1F6B4F}.xb i.t-a{background:#D98A2B}.xb i.t-r{background:#C0392B}.xb i.t-n{background:#B5A88F}.xgb small{font-size:12px;color:#4A5650}' +
'.xnote{background:#FFF8E8;border:1.5px solid #EED9A8;border-radius:12px;padding:12px 16px;font-size:14px;line-height:1.7}' +
'.xal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.xalc{display:flex;gap:12px;align-items:center;padding:14px;border-radius:14px;text-decoration:none;color:#1F2A24;border:1.5px solid transparent;transition:transform .15s}.xalc:hover{transform:translateY(-2px)}.xalc strong{font-size:30px;min-width:38px;text-align:center}.xalc div{flex:1;display:flex;flex-direction:column;gap:2px}.xalc b{font-size:14px}.xalc span{font-size:12px;opacity:.85}.xalc i{font-style:normal;opacity:.6}.xalc.t-r{border-color:#EDB7B0}.xalc.t-a{border-color:#E9C48A}.xalc.t-b{border-color:#AFC6E6}.xalc.t-g{border-color:#A9CDB8}' +
'.xlg{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#4A5650}.xlg span{display:flex;align-items:center;gap:5px}.xlg i{width:10px;height:10px;border-radius:3px}.xch{width:100%;height:auto}.xch .gl{stroke:#EFE8DA}.xch .ax{font-size:11px;fill:#4A5650;font-family:"IBM Plex Sans Arabic",sans-serif}.xch .br{transform-origin:bottom;transform-box:fill-box;animation:xgr .6s ease both}@keyframes xgr{from{transform:scaleY(0)}}' +
'.xdn{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.xdn svg{width:170px;height:170px;flex:none}.xdn .dv{font-size:22px;font-weight:700;fill:#1F2A24}.xdn .dt{font-size:9px;fill:#4A5650}.xdl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;flex:1;min-width:200px;font-size:13px}.xdl li{display:flex;align-items:center;gap:6px}.xdl i{width:10px;height:10px;border-radius:50%}.xdl b{margin-inline-start:auto}' +
'.xgh{font-size:15px;margin:6px 0 0;display:flex;gap:8px;align-items:center}.xgh span{background:#1F2A24;color:#fff;border-radius:999px;padding:0 9px;font-size:12px}' +
'.xarr{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.xac{display:flex;background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;overflow:hidden}.xat{background:#1F2A24;color:#fff;padding:14px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:84px;text-align:center}.xat strong{font-size:22px}.xat span{font-size:11px;color:#B9C4BE}.xab{padding:12px 14px;flex:1;display:flex;flex-direction:column;gap:4px;font-size:13.5px}.xab p{margin:0}' +
'.xrow{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}' +
'.xag{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.xagc{background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:transform .15s,box-shadow .15s}.xagc:hover{transform:translateY(-2px);box-shadow:0 6px 18px #1F2A2412}' +
'.xm3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}.xm3 div{background:#F7F2E8;border-radius:10px;padding:8px 4px;display:flex;flex-direction:column}.xm3 strong{font-size:18px}.xm3 span{font-size:11px;color:#4A5650}.xlab{display:flex;justify-content:space-between;font-size:12.5px}' +
'.xst{color:#D9D2C3;letter-spacing:1px}.xst .on{color:#E2A21B}' +
'.xcv{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.xcvc{background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:5px;font-size:13.5px;animation:xin .3s ease}.xcvc p{margin:0}' +
'.xav{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#E6F0EA,#DCE8F7);color:#1F6B4F;display:flex;align-items:center;justify-content:center;font:700 22px "Reem Kufi",sans-serif}.xav.sm{width:40px;height:40px;font-size:17px;flex:none}.xav.lg{width:84px;height:84px;font-size:34px;margin:0 auto 10px}' +
'.xsel{height:34px;border:1.5px solid #E2D9C6;border-radius:9px;font:13px "IBM Plex Sans Arabic",sans-serif;padding:0 8px;background:#fff}' +
'.xseg{display:flex;background:#fff;border:1.5px solid #E2D9C6;border-radius:12px;padding:3px}.xseg button{height:34px;padding:0 14px;border:none;border-radius:9px;background:transparent;font:500 14px "IBM Plex Sans Arabic",sans-serif;cursor:pointer}.xseg button.on{background:#1F2A24;color:#fff}' +
'.xcm{display:flex;flex-direction:column;gap:10px}.xcmr{display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid #E2D9C6;border-radius:14px;padding:12px 14px}.xcmb{flex:1;display:flex;flex-direction:column;gap:5px;min-width:0}' +
'.xwk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.xwk div{background:#FBF7EF;border-radius:10px;padding:10px 8px;display:flex;flex-direction:column;gap:5px;min-height:90px;font-size:12.5px}.xwk b{font-size:12px;color:#4A5650}' +
'.xtl{list-style:none;margin:0;padding:0 18px 0 0;border-right:2px solid #E2D9C6;display:flex;flex-direction:column;gap:14px}.xtl li{position:relative;display:flex;flex-direction:column;font-size:14px}.xtl li:before{content:"";position:absolute;right:-26px;top:3px;width:12px;height:12px;border-radius:50%;background:#E2D9C6;border:2px solid #fff}.xtl li.d:before{background:#1F6B4F}.xtl li.c:before{background:#D98A2B;box-shadow:0 0 0 4px #FBEFD9}.xtl span{font-size:12px;color:#4A5650}' +
'.xli{padding:8px 0;border-top:1px solid #EFE8DA;font-size:14px}' +
'#xdr{position:fixed;inset:0;z-index:75;background:#1F2A2400;pointer-events:none;transition:background .2s}#xdr.show{background:#1F2A2466;pointer-events:auto}#xdr aside{position:absolute;top:0;bottom:0;left:0;width:min(420px,100vw);background:#fff;box-shadow:8px 0 30px #0003;transform:translateX(-100%);transition:transform .25s ease;display:flex;flex-direction:column}#xdr.show aside{transform:none}' +
'.xdrh{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #EFE8DA}.xdrh h2{margin:0;font-size:18px}.xdrh button{width:40px;height:40px;border-radius:10px;border:1.5px solid #E2D9C6;background:#fff;cursor:pointer;font-size:16px}.xdrb{padding:18px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:12px}' +
'.xkv{display:grid;grid-template-columns:auto 1fr;gap:10px 16px;margin:0;font-size:14px}.xkv dt{color:#4A5650}.xkv dd{margin:0}' +
'.xfloat{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:45;display:flex;align-items:center;gap:4px;background:#1F2A24;color:#fff;border-radius:999px;padding:5px 6px 5px 6px;box-shadow:0 6px 24px #0004;font-size:13px}.xfloat span{padding:0 10px 0 6px;color:#F4C77A;font-weight:600}.xfloat button{background:#2C3A33;color:#fff;border:none;border-radius:999px;height:32px;padding:0 14px;font:500 13px "IBM Plex Sans Arabic",sans-serif;cursor:pointer}.xfloat button:hover{background:#1F6B4F}' +
'button:focus-visible,a:focus-visible,select:focus-visible,[tabindex]:focus-visible{outline:3px solid #D98A2B;outline-offset:2px}' +
'@media (max-width:1100px){.xk,.xal{grid-template-columns:repeat(2,minmax(0,1fr))}.x2{grid-template-columns:1fr}}' +
'@media (max-width:820px){.xs{flex-direction:column}.xn{width:auto;height:auto;position:sticky;top:0;z-index:30;flex-direction:row;align-items:center;overflow-x:auto;overflow-y:hidden;padding:10px 12px;gap:10px}.xbr div,.xngh{display:none}.xng{flex-direction:row}details.xng{display:none}.xn a{white-space:nowrap;min-height:36px}.xout{margin-top:0}.xmn{padding:18px 16px 70px}.xh h1{font-size:22px}' +
'.xt thead{display:none}.xt,.xt tbody,.xt tr,.xt td{display:block;width:100%;box-sizing:border-box}.xt tr{border-top:1px solid #EFE8DA;padding:8px 4px}.xt td{border:none;padding:4px 8px;display:flex;justify-content:space-between;gap:10px;text-align:left}.xt td:before{content:attr(data-l);color:#4A5650;font-size:12px;text-align:right;flex:none}.xtw{border:none}.xwk{grid-template-columns:repeat(2,1fr)}.xkc strong{font-size:23px}.xdl{grid-template-columns:1fr}}' +
'@media (max-width:480px){.xk,.xal{grid-template-columns:1fr 1fr}.xalc{flex-direction:column;align-items:flex-start;gap:4px}.xalc i{display:none}.xcmr{flex-wrap:wrap}}' +
'@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}' +
'@media print{.xn,.xex,.xtb,.xf,#demo,.xfloat{display:none!important}}';

/* ---------- smart whatsapp ---------- */
var CUST = {
  'عبدالله اليامي': { ph: '05•••••118', v: 1 }, 'منى اليامي': { ph: '05•••••462', v: 1 }, 'حمد آل عباس': { ph: '05•••••875', v: 1 },
  'سعيد آل هتيلة': { ph: '05•••••309', v: 1 }, 'نورة آل منصور': { ph: '05•••••651', v: 1 }, 'علي آل مريح': { ph: '05•••••127', v: 1 },
  'محمد آل سعيد': { ph: '05•••••984', v: 1 }, 'فهد آل منصور': { ph: '05•••••907', v: 1 }, 'ناصر الصقور': { ph: '05•••••482', v: 1 },
  'سالم الوادعي': { ph: '05•••••233', v: 1 }, 'عبدالرحمن آل حيدر': { ph: '05•••••214', v: 1 }, 'هادي اليامي': { ph: '05•••••738', v: 1 },
  'جابر آل قريع': { ph: '05•••••590', v: 0 }
};
var RENT = { 'سالم الوادعي': 'حجزك #1058 للعاملة روز (إيجار يومي) معتمد ✅ الموعد: الأحد 1/11 من 4 العصر إلى 8 المساء.', 'فهد آل منصور': 'حجزك #1052 للعاملة أمينة (إيجار أسبوعي) ساري حتى الثلاثاء 3/11. تبي تمدد؟ رد بكلمة: تمديد' };
var RULES = [
  { k: 'stamp', t: 'عند اكتمال التفييز', on: 1, x: 'تم تفييز تأشيرة عاملتك [العاملة] ✅ والخطوة الجاية حجز التذكرة.' },
  { k: 'ticket', t: 'عند صدور التذكرة · موعد ووقت الوصول', on: 1, x: 'صدرت تذكرة عاملتك [العاملة] ✈️ الرحلة [الرحلة] تصل [المطار] يوم [التاريخ] الساعة [الوقت].' },
  { k: 'pre', t: 'تذكير قبل الوصول بـ 24 ساعة', on: 1, x: 'تذكير: عاملتك [العاملة] توصل بكرة [المطار] الساعة [الوقت]. موظفنا بيستقبلها.' },
  { k: 'airport', t: 'عند وصولها للمطار', on: 1, x: 'وصلت عاملتك [العاملة] [المطار] الساعة [الوقت] ✅ موظفنا [المستلم] استلمها، وبنبلغك أول ما توصل المكتب.' },
  { k: 'office', t: 'عند وصولها للمكتب · بعد تأكيد المشرف', on: 1, x: 'وصلت عاملتك [العاملة] مقر شركة أصايل المنصورة بنجران وهي بخير ✅ تقدر تستلمها في أوقات الدوام: 9 الصبح إلى 12 الظهر، و4 العصر إلى 8 المساء. لا تنسى الهوية الوطنية.' }
];
var MSGLOG = [
  { t: 'اليوم 07:58', c: 'نيلوفر · جابر آل قريع', ph: '05•••••590', ty: 'وصول المطار', x: 'لم تُرسل: رقم العميل غير موثّق بنفاذ', st: 'محجوبة' },
  { t: 'اليوم 07:41', c: 'عبدالرحمن آل حيدر', ph: '05•••••214', ty: 'وصول المطار', x: 'وصلت عاملتك ماريتا مطار نجران الساعة 06:15 ✅', st: 'قُرئت' },
  { t: 'اليوم 07:41', c: 'هادي اليامي', ph: '05•••••738', ty: 'وصول المطار', x: 'وصلت عاملتك ديفينا مطار نجران الساعة 06:15 ✅', st: 'قُرئت' },
  { t: 'اليوم 08:20', c: 'منى اليامي', ph: '05•••••462', ty: 'تذكير قبل الوصول', x: 'تذكير: عاملتك غريس توصل بكرة مطار نجران الساعة 08:20', st: 'وصلت' },
  { t: 'أمس 22:10', c: 'نورة آل منصور', ph: '05•••••651', ty: 'صدور التذكرة', x: 'صدرت تذكرة عاملتك جوانا ✈️ الرحلة PR 658 تصل مطار نجران الخميس 29/10 الساعة 21:35', st: 'قُرئت' }
];
var CHATS = {}, WB = { cust: 'نورة آل منصور', sup: null };
function nz(s) { return String(s).replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).toLowerCase(); }
function nowT() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function msgs(k) { return k === 1 ? 'رسالة واحدة' : k === 2 ? 'رسالتين' : k + ' رسائل'; }
function first(n) { return n.split(' ')[0]; }
function arrOf(id) { return ARR.filter(function (a) { return a.id === id; })[0]; }
function fill(tpl, a) { return tpl.replace('[العاملة]', a.w).replace('[الرحلة]', a.f).replace('[المطار]', a.ap).replace('[التاريخ]', a.d.replace('اليوم · ', '').replace('غدًا · ', '')).replace('[الوقت]', a.tm).replace('[المستلم]', a.rc); }
function stageReply(v) {
  var w = v.w || 'العاملة', a = arrOf(v.id), late = v.days > 45 && v.st < 6;
  var m = [
    'طلبك رقم ' + v.id + ' وصلنا ✅ ونجهّز لك سير ذاتية من ' + v.co + ' تختار منها، بنرسلها لك خلال يومين.',
    'أرسلنا لك سير ذاتية من ' + v.co + '، وننتظر اختيارك للعاملة عشان نكمل الإجراءات.',
    'تم توقيع عقد عاملتك ' + w + ' في مساند ✅ والوكيل في ' + v.co + ' يجهّز أوراقها الحين.',
    'عاملتك ' + w + ' الحين في مرحلة الفحص الطبي في ' + v.co + ' 🩺 تاخذ عادةً من 3 إلى 5 أيام.',
    'اجتازت ' + w + ' الفحص الطبي ✅ وصدر لها الباركود، والخطوة الجاية التفييز في السفارة السعودية.',
    'تأشيرة ' + w + ' في مرحلة التفييز (الختم في السفارة السعودية في ' + v.co + ') ⏳ تاخذ عادةً من 7 إلى 10 أيام، وبنبلغك أول ما تطلع التذكرة.',
    a ? 'صدرت تذكرة ' + w + ' ✈️ الرحلة ' + a.f + ' تصل ' + a.ap + ' ' + a.d.replace('اليوم · ', 'اليوم ').replace('غدًا · ', 'بكرة ') + ' الساعة ' + a.tm + (a.s === 'متأخرة' ? ' (الرحلة متأخرة، بنحدّثك بالموعد الجديد)' : '') + '.' : 'صدرت تذكرة ' + w + ' ✈️ وبنرسل لك موعد الوصول قريب.',
    'وصلت ' + w + ' ' + (a ? a.ap + ' الساعة ' + a.tm : 'المطار') + ' ✅ موظفنا استلمها والحين في الطريق للمكتب، وبنبلغك أول ما توصل.',
    'عاملتك ' + w + ' في مقر الشركة بنجران وهي بخير ✅ تقدر تستلمها في أوقات الدوام: 9 الصبح إلى 12 الظهر، و4 العصر إلى 8 المساء. لا تنسى الهوية الوطنية.'
  ][v.st];
  return '📋 طلب ' + v.id + ' · المرحلة: ' + VSTEPS[v.st] + ' (' + (v.st + 1) + ' من ' + VSTEPS.length + ')\n' + m + (late ? '\nنعتذر عن التأخير 🙏 تابعنا مع الوكيل اليوم وبنحدّثك خلال 48 ساعة.' : '');
}
function chatOf(c) { if (!CHATS[c]) CHATS[c] = { msgs: [{ who: 'sys', x: 'محادثة واتساب مع ' + c + ' · ' + (CUST[c] ? CUST[c].ph : '') }], mode: null }; return CHATS[c]; }
function botSay(c, x, qr) { chatOf(c).msgs.push({ who: 'bot', x: x, qr: qr, t: nowT() }); }
function botAnswer(c, text) {
  var ch = chatOf(c), n = nz(text), reqs = VISA.filter(function (v) { return v.c === c; });
  var asksStatus = /وين|فين|متي|ايش صار|وش صار|حاله|حالت|وصلت|توصل|عاملت|خادمت|طلبي|التفييز|التذكره|الفحص|الباركود/.test(n);
  var pick = reqs.filter(function (v) { return n.indexOf(nz(v.id)) >= 0 || n.indexOf(v.id.replace('س-', '')) >= 0 || (v.w && n.indexOf(nz(v.w)) >= 0); })[0];
  if (/شكر|يعطيك العافيه|مشكور/.test(n)) return botSay(c, 'العفو يا ' + first(c) + '، بالخدمة دائمًا 🌷');
  if (/^(1|١)$/.test(n.trim()) || n.indexOf('استقدام') >= 0) ch.mode = 'rec';
  else if (/^(2|٢)$/.test(n.trim()) || n.indexOf('ايجار') >= 0) ch.mode = 'rent';
  else if (!ch.mode) {
    ch.pending = text;
    return botSay(c, 'حياك الله ' + first(c) + ' 👋 معك المساعد الآلي لشركة أصايل المنصورة.\nاستفسارك عن:', ['1 · استقدام', '2 · إيجار']);
  }
  if (n.indexOf('المتاحات') >= 0) { ch.mode = 'rent'; return botSay(c, 'تفضل، العاملات المتاحات اليوم مع الأسعار بالساعة واليوم والأسبوع والشهر 👇\n' + (H().rentalUrl || 'رابط برنامج الإيجار')); }
  if (ch.mode === 'rent') {
    return botSay(c, RENT[c] || 'ما عندك حجز إيجار حالي. تبي أرسل لك العاملات المتاحات اليوم؟ 🏠', RENT[c] ? null : ['العاملات المتاحات']);
  }
  if (!reqs.length) return botSay(c, 'ما لقيت طلب استقدام مسجّل على رقمك هذا. لو الطلب باسم شخص ثاني، أرسل رقم الطلب أو رقم الهوية وبيتحقق منه الموظف.');
  if (pick) return botSay(c, stageReply(pick));
  if (reqs.length > 1 && (asksStatus || ch.pending)) { ch.pending = null; return botSay(c, 'عندك ' + (reqs.length === 2 ? 'طلبين' : reqs.length + ' طلبات') + '، أي واحد تقصد؟', reqs.map(function (v) { return v.id + ' · ' + (v.w || 'بدون عاملة بعد'); })); }
  if (asksStatus || ch.pending) { ch.pending = null; return botSay(c, stageReply(reqs[0])); }
  botSay(c, 'ما فهمت عليك تمامًا 🙏 بحوّلك لموظفة خدمة العملاء سارة، ترد عليك خلال دقائق في أوقات الدوام.');
}
function chatHTML() {
  var ch = chatOf(WB.cust);
  return ch.msgs.map(function (m, i) {
    if (m.who === 'sys') return '<div class="wsys">' + esc(m.x) + '</div>';
    var qr = m.qr && i === ch.msgs.length - 1 ? '<div class="wqr">' + m.qr.map(function (q) { return '<button type="button" data-wq="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' : '';
    return '<div class="wm ' + (m.who === 'me' ? 'me' : 'bot') + (m.auto ? ' auto' : '') + '">' + (m.auto ? '<small class="wtag">رسالة تلقائية</small>' : '') + esc(m.x).replace(/\n/g, '<br>') + '<time>' + (m.t || '') + (m.who === 'me' ? ' ✓✓' : '') + '</time></div>' + qr;
  }).join('') + (WB.typing ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : '');
}
function drawChat() { var b = document.getElementById('wbchat'); if (b) { b.innerHTML = chatHTML(); b.scrollTop = b.scrollHeight; } }
function custSend(text) {
  text = String(text || '').trim(); if (!text) return;
  var c = WB.cust; chatOf(c).msgs.push({ who: 'me', x: text, t: nowT() }); WB.typing = 1; drawChat();
  setTimeout(function () { WB.typing = 0; botAnswer(c, text); drawChat(); }, 700);
}

/* supervisor commands */
function parseCmd(t) {
  var n = nz(t), p = { ap: null, ev: null, day: 'today', raw: t };
  if (n.indexOf('نجران') >= 0) p.ap = 'مطار نجران'; else if (n.indexOf('ابها') >= 0) p.ap = 'مطار أبها'; else if (n.indexOf('رياض') >= 0) p.ap = 'مطار الملك خالد · الرياض';
  if (n.indexOf('مكتب') >= 0) p.ev = 'office'; else if (/مطار|موعد|رحل|وصول/.test(n)) p.ev = 'airport';
  if (/بكر|غدا|غد /.test(n)) p.day = 'tomorrow';
  return p;
}
function planCmd(p) {
  var rows = ARR.filter(function (a) { return (!p.ap || a.ap === p.ap) && a.g === p.day; }).map(function (a) {
    var cu = CUST[a.c] || { v: 0 }, v = VISA.filter(function (x) { return x.id === a.id; })[0], checks = [];
    checks.push([!!(v && v.c === a.c), 'الطلب ' + a.id + ' مسجّل باسم العميل']);
    checks.push([!!cu.v, cu.v ? 'رقم الجوال موثّق بنفاذ' : 'رقم الجوال غير موثّق بنفاذ']);
    if (p.ev === 'office') {
      var landed = a.s === 'وصلت المطار' || a.s === 'في المكتب';
      checks.push([landed, landed ? 'الرحلة وصلت (' + a.tm + ')' : 'الرحلة لم تصل بعد (' + a.tm + ')']);
      checks.push([!a.on, a.on ? 'العميل مُبلَّغ سابقًا بوصولها للمكتب' : 'لم يُبلَّغ بالوصول للمكتب']);
    } else {
      checks.push([!a.n, a.n ? 'العميل مُبلَّغ سابقًا بالموعد' : 'لم يُبلَّغ بالموعد بعد']);
    }
    var ok = checks.every(function (c) { return c[0]; });
    return { a: a, ok: ok, checks: checks };
  });
  return { p: p, rows: rows };
}
function supHTML() {
  var S = WB.sup;
  var sug = ['أرسل للعملاء اللي عندهم وصول رحلات على نجران بوصول عاملاتهم للمكتب', 'بلّغ العملاء اللي رحلاتهم بكرة على نجران بموعد الوصول', 'أرسل للعملاء اللي وصلت عاملاتهم مطار الرياض اليوم'];
  var h = '<label class="wlab" for="wbcmd">اكتب أمرك للمساعد بلغتك العادية</label><textarea id="wbcmd" rows="3" placeholder="مثال: أرسل للعملاء اللي عندهم وصول رحلات على نجران بوصول عاملاتهم للمكتب">' + esc(S && S.p ? S.p.raw : '') + '</textarea>' +
    '<div class="wsug">' + sug.map(function (s) { return '<button type="button" data-ws="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div><div class="xrow">' + btn('افحص قبل الإرسال', 'wbplan') + '<span class="mut sm">ما يُرسل شي قبل ما تأكد أنت</span></div>';
  if (S && S.plan) {
    var P2 = S.plan, ok = P2.rows.filter(function (r) { return r.ok; }), ev = P2.p.ev === 'office' ? 'وصول العاملة للمكتب' : 'موعد الوصول';
    if (!P2.p.ev) return h + '<div class="xnote">ما فهمت نوع الرسالة. اذكر "المكتب" أو "المطار" أو "موعد الوصول".</div>';
    h += '<div class="wplan"><b>فهمت طلبك:</b> رسالة «' + ev + '» للعملاء اللي رحلاتهم ' + (P2.p.day === 'today' ? 'اليوم' : 'بكرة') + (P2.p.ap ? ' على ' + esc(P2.p.ap) : ' على كل المطارات') + '.<br>فحصت ' + P2.rows.length + ' عملاء: <b class="okc">' + ok.length + ' جاهزين للإرسال</b> · <b class="noc">' + (P2.rows.length - ok.length) + ' مستبعدين</b></div>';
    h += '<div class="wck">' + P2.rows.map(function (r) {
      return '<div class="wcr ' + (r.ok ? 'ok' : 'no') + '"><div class="xrow"><b>' + esc(r.a.c) + ' <small class="sub">العاملة ' + esc(r.a.w) + ' · ' + esc(r.a.f) + '</small></b>' + chip(r.ok ? 'سيُرسل له' : 'مستبعد', r.ok ? 'g' : 'r') + '</div><ul>' + r.checks.map(function (c) { return '<li class="' + (c[0] ? 'y' : 'n') + '">' + (c[0] ? '✓ ' : '✕ ') + esc(c[1]) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>';
    if (ok.length) {
      var rule = RULES.filter(function (x) { return x.k === (P2.p.ev === 'office' ? 'office' : 'ticket'); })[0];
      h += '<div class="wprev"><b>نص الرسالة (مثال لأول عميل):</b><p>السلام عليكم ' + esc(first(ok[0].a.c)) + '، ' + esc(fill(rule.x, ok[0].a)) + '<br>شركة أصايل المنصورة</p></div><div class="xrow">' + btn('تأكيد وإرسال لـ ' + ok.length + ' عملاء', 'wbsend') + btn('إلغاء', 'wbcancel', '', 'ghost') + '</div>';
    }
  }
  if (S && S.done) h += '<div class="xnote">✅ ' + esc(S.done) + '</div>';
  return h;
}
function drawSup() { var b = document.getElementById('wbsup'); if (b) b.innerHTML = supHTML(); }
function sendWA(c, ty, x, a) {
  var cu = CUST[c] || {};
  MSGLOG.unshift({ t: 'الآن ' + nowT(), c: c, ph: cu.ph || '', ty: ty, x: x, st: 'أُرسلت' });
  chatOf(c).msgs.push({ who: 'bot', x: 'السلام عليكم ' + first(c) + '، ' + x + '\nشركة أصايل المنصورة', t: nowT(), auto: 1 });
}

P.WhatsBot = { t: 'الواتساب الذكي', r: function () {
  var custs = Object.keys(CUST);
  var phone = '<div class="wph"><div class="wphh">' + logo(22) + '<div><b>شركة أصايل المنصورة</b><span>حساب أعمال موثّق · يرد فورًا</span></div></div>' +
    '<div class="wchat" id="wbchat" aria-live="polite">' + chatHTML() + '</div>' +
    '<form class="wfoot" id="wbform"><input id="wbin" type="text" autocomplete="off" placeholder="اكتب رسالة كأنك العميل…" aria-label="رسالة العميل"><button type="submit" aria-label="إرسال">➤</button></form></div>';
  var tries = ['وين وصلت عاملتي', 'متى توصل الخدامة؟', 'ايش صار على التفييز', 'شكرا'];
  var left = '<div class="wctl"><label class="wlab" for="wbcust">جرّب كأنك العميل</label><select id="wbcust" class="xsel">' + custs.map(function (c) { return '<option' + (c === WB.cust ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select><div class="wsug">' + tries.map(function (s) { return '<button type="button" data-wt="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div>' + phone;
  var rules = '<div class="wrules">' + RULES.map(function (r, i) { return '<div class="wrl"><button type="button" role="switch" aria-checked="' + (r.on ? 'true' : 'false') + '" class="wsw' + (r.on ? ' on' : '') + '" data-wr="' + i + '" aria-label="' + esc(r.t) + '"><i></i></button><div><b>' + esc(r.t) + '</b><p>' + esc(r.x) + '</p></div></div>'; }).join('') + '</div>';
  return head('الواتساب الذكي', 'يرد على «وين وصلت عاملتي» من مرحلة الطلب الفعلية · ويرسل إشعارات الوصول بعد التحقق من كل عميل', chip('رقم رسمي يُضاف لاحقًا', 'a')) +
    kpis([{ l: 'رسائل اليوم', v: MSGLOG.filter(function (m) { return /اليوم|الآن/.test(m.t); }).length }, { l: 'استفسارات رُد عليها آليًا', v: 37, s: 'بدون تدخل موظف', tone: 'g' }, { l: 'حُوّلت لموظف', v: 3, tone: 'a' }, { l: 'رسائل محجوبة', v: MSGLOG.filter(function (m) { return m.st === 'محجوبة'; }).length, s: 'رقم غير موثّق', tone: 'r' }]) +
    '<div class="wgrid"><section class="xcd"><div class="xcdh"><h2>محادثة العميل</h2>' + chip('تجربة حيّة', 'b') + '</div>' + left + '</section>' +
    '<section class="xcd"><div class="xcdh"><h2>أوامر المشرف</h2>' + chip('أنت تأمر · المساعد يفحص ويرسل', 'g') + '</div><div id="wbsup">' + supHTML() + '</div></section></div>' +
    card('مراحل طلب الاستقدام التي يعرفها المساعد', '<div class="wst">' + VSTEPS.map(function (s, i) { return '<span><b>' + (i + 1) + '</b>' + esc(s) + '</span>'; }).join('<i aria-hidden="true">←</i>') + '</div>') +
    card('الإشعارات التلقائية', rules, '<span class="mut sm">تُرسل وحدها عند تغيّر المرحلة</span>') +
    card('سجل الرسائل', table([{ l: 'الوقت', k: 't' }, { l: 'العميل', k: 'c' }, { l: 'الجوال', k: 'ph' }, { l: 'النوع', r: function (m) { return chip(m.ty, 'b'); } }, { l: 'النص', k: 'x' }, { l: 'الحالة', r: function (m) { return chip(m.st, m.st === 'محجوبة' ? 'r' : m.st === 'قُرئت' ? 'g' : 'n'); } }], MSGLOG, { title: 'سجل رسائل الواتساب', ph: 'ابحث باسم العميل أو نوع الرسالة' }));
} };
ACT.wbplan = function () { var t = (document.getElementById('wbcmd') || {}).value || ''; if (!t.trim()) { toast('اكتب الأمر أولًا'); return; } var p = parseCmd(t); WB.sup = { p: p, plan: planCmd(p) }; drawSup(); };
ACT.wbcancel = function () { WB.sup = null; drawSup(); };
ACT.wbsend = function () {
  var P2 = WB.sup.plan, ok = P2.rows.filter(function (r) { return r.ok; }), office = P2.p.ev === 'office';
  var rule = RULES.filter(function (x) { return x.k === (office ? 'office' : 'ticket'); })[0];
  ok.forEach(function (r) {
    var a = r.a; sendWA(a.c, office ? 'وصول المكتب' : 'موعد الوصول', fill(rule.x, a), a);
    if (office) { a.s = 'في المكتب'; a.on = 1; VISA.forEach(function (v) { if (v.id === a.id) v.st = 8; }); } else a.n = 1;
  });
  log('إضافة', 'الواتساب الذكي', 'أمر المشرف: ' + P2.p.raw, '—', 'أُرسلت ' + msgs(ok.length));
  toast('أُرسلت ' + msgs(ok.length) + ' واتساب ✅'); WB.sup = { done: 'أُرسلت ' + msgs(ok.length) + ': ' + ok.map(function (r) { return r.a.c; }).join('، ') + '. المستبعدون ما وصلتهم رسالة وتلقى السبب فوق.' };
  rerender();
};
function wbBind(root) {
  root.addEventListener('submit', function (e) { if (e.target.id === 'wbform') { e.preventDefault(); var i = document.getElementById('wbin'); custSend(i.value); i.value = ''; i.focus(); } });
  root.addEventListener('click', function (e) {
    var q = e.target.closest('[data-wq]'); if (q) { custSend(q.dataset.wq); return; }
    var t = e.target.closest('[data-wt]'); if (t) { custSend(t.dataset.wt); return; }
    var s = e.target.closest('[data-ws]'); if (s) { var c = document.getElementById('wbcmd'); c.value = s.dataset.ws; c.focus(); return; }
    var r = e.target.closest('[data-wr]'); if (r) { var R = RULES[+r.dataset.wr]; R.on = R.on ? 0 : 1; r.classList.toggle('on', !!R.on); r.setAttribute('aria-checked', R.on ? 'true' : 'false'); log('تعديل', 'الواتساب الذكي', 'إشعار: ' + R.t, R.on ? 'موقوف' : 'مفعّل', R.on ? 'مفعّل' : 'موقوف'); toast(R.on ? 'تم تفعيل الإشعار' : 'تم إيقاف الإشعار'); }
  });
  root.addEventListener('change', function (e) { if (e.target.id === 'wbcust') { WB.cust = e.target.value; drawChat(); } });
}
CSS += '.wgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:16px;align-items:start}' +
'.wctl{display:flex;flex-direction:column;gap:8px}.wlab{font-size:13px;color:#4A5650;font-weight:600}.wsug{display:flex;gap:6px;flex-wrap:wrap}.wsug button{background:#F5EFE2;border:1px solid #E2D9C6;border-radius:999px;padding:5px 12px;font:13px "IBM Plex Sans Arabic",sans-serif;cursor:pointer;color:#1F2A24;text-align:right}.wsug button:hover{background:#EFE3C9}' +
'.wph{margin:6px auto 0;width:100%;max-width:380px;height:560px;border:8px solid #1F2A24;border-radius:30px;overflow:hidden;display:flex;flex-direction:column;background:#ECE5DA;box-shadow:0 10px 30px #1F2A2422}' +
'.wphh{background:#1F6B4F;color:#fff;display:flex;gap:10px;align-items:center;padding:10px 14px}.wphh div{display:flex;flex-direction:column}.wphh b{font-size:14px}.wphh span{font-size:11px;opacity:.85}' +
'.wchat{flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px;background:#ECE5DA radial-gradient(#E2D8C8 1px,transparent 1px) 0 0/14px 14px}' +
'.wsys{align-self:center;background:#FFF3C8;color:#5A4A1A;font-size:11.5px;border-radius:8px;padding:4px 10px;margin-bottom:4px}' +
'.wm{max-width:85%;padding:8px 10px 18px;border-radius:12px;font-size:13.5px;line-height:1.6;position:relative;box-shadow:0 1px 1px #0001;animation:xin .2s ease}.wm time{position:absolute;bottom:3px;left:8px;font-size:10.5px;color:#7A857F}' +
'.wm.bot{align-self:flex-start;background:#fff;border-top-right-radius:3px}.wm.me{align-self:flex-end;background:#D7F2D3;border-top-left-radius:3px}.wm.auto{border:1.5px solid #A9CDB8}.wtag{display:block;color:#1F6B4F;font-weight:600;font-size:11px}' +
'.wm.typing{display:flex;gap:4px;padding:12px}.wm.typing i{width:7px;height:7px;border-radius:50%;background:#9AA59F;animation:xpl 1s infinite}.wm.typing i:nth-child(2){animation-delay:.2s}.wm.typing i:nth-child(3){animation-delay:.4s}' +
'.wqr{align-self:flex-start;display:flex;flex-direction:column;gap:4px;max-width:85%;width:100%}.wqr button{background:#fff;border:none;border-radius:10px;padding:9px;color:#1F6B4F;font:600 13.5px "IBM Plex Sans Arabic",sans-serif;cursor:pointer;box-shadow:0 1px 1px #0001}.wqr button:hover{background:#F2FBF5}' +
'.wfoot{display:flex;gap:6px;padding:8px;background:#F4EFE6}.wfoot input{flex:1;min-width:0;height:40px;border:none;border-radius:999px;padding:0 14px;font:14px "IBM Plex Sans Arabic",sans-serif;background:#fff}.wfoot button{width:40px;height:40px;border-radius:50%;border:none;background:#1F6B4F;color:#fff;font-size:16px;cursor:pointer;transform:scaleX(-1)}' +
'#wbcmd{width:100%;box-sizing:border-box;border:1.5px solid #E2D9C6;border-radius:12px;padding:10px 12px;font:14px "IBM Plex Sans Arabic",sans-serif;resize:vertical;background:#FDFBF7}#wbcmd:focus{outline:none;border-color:#1F6B4F}#wbsup{display:flex;flex-direction:column;gap:10px}' +
'.wplan{background:#F2F7F4;border:1.5px solid #A9CDB8;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.8}.okc{color:#164D39}.noc{color:#A3261B}' +
'.wck{display:flex;flex-direction:column;gap:8px}.wcr{border:1.5px solid #E2D9C6;border-radius:12px;padding:10px 12px;font-size:13.5px}.wcr.ok{border-color:#A9CDB8;background:#FAFDFB}.wcr.no{border-color:#EDB7B0;background:#FFF9F8}.wcr ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px}.wcr li.y{color:#164D39}.wcr li.n{color:#A3261B;font-weight:600}' +
'.wprev{background:#D7F2D3;border-radius:12px;padding:10px 14px;font-size:13.5px}.wprev p{margin:4px 0 0;line-height:1.7}' +
'.wst{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.wst span{display:flex;gap:6px;align-items:center;background:#F7F2E8;border-radius:999px;padding:5px 12px 5px 6px;font-size:13px}.wst span b{background:#1F6B4F;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px}.wst i{font-style:normal;color:#B5A88F}' +
'.wrules{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}.wrl{display:flex;gap:12px;align-items:flex-start;border:1.5px solid #E2D9C6;border-radius:12px;padding:12px}.wrl b{font-size:14px}.wrl p{margin:4px 0 0;font-size:12.5px;color:#4A5650;line-height:1.6}' +
'.wsw{flex:none;width:44px;height:26px;border-radius:999px;border:none;background:#D9D2C3;position:relative;cursor:pointer;transition:background .2s}.wsw i{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:right .2s;box-shadow:0 1px 3px #0003}.wsw.on{background:#1F6B4F}.wsw.on i{right:21px}' +
'@media (max-width:1000px){.wgrid{grid-template-columns:1fr}}@media (max-width:480px){.wph{height:520px;border-width:6px}}';

var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

window.XP = {
  pages: NEW,
  has: function (n) { return !!P[n]; },
  title: function (n) { return P[n].t; },
  render: function (n) { TID = 0; var w = document.createElement('div'); w.innerHTML = shell(n); var root = w.firstElementChild; bindRoot(root); return root; },
  after: function (root) { var wc = root.querySelector('#wbchat'); if (wc) wc.scrollTop = wc.scrollHeight; countUp(root); root.querySelectorAll('.xt').forEach(function (t) { filterTable(t.id); }); },
  enhance: enhance,
  log: log
};
})();
