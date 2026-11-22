/* z26 — نسخة المكاتب: المكتب الجديد يبدأ فارغًا تمامًا (طلب المستخدم 22/11/2026)
   - بدون حسابات عملاء أو سير ذاتية أو وكلاء أو أرقام تجريبية مدمجة في البرنامج
   - تُخفى الصفحات التي تعرض بيانات تجريبية ثابتة (لا تُحفظ في قاعدة البيانات)، وتبقى صفحات العمل الحقيقية
   - تُخفى التنويهات والعروض التجريبية في صفحات الموظفين والعملاء */
(function () {
  if (window.XP_Z26) return; window.XP_Z26 = 1;
  function hash() { return (location.hash.match(/^#\/([A-Za-z]+)/) || [])[1] || ''; }

  /* حسابات العملاء التجريبية المدمجة في البرنامج */
  var R = window.XP_RPATCH = window.XP_RPATCH || {};
  (R['r.js'] = R['r.js'] || []).push(['var ACCTS = ACDEF;', 'var ACCTS = [];']);
  try { var a = JSON.parse(localStorage.getItem('asayel-accts') || '[]'); if (a.some(function (x) { return /^0555000\d{3}$/.test(x.ph); })) localStorage.setItem('asayel-accts', JSON.stringify(a.filter(function (x) { return !/^0555000\d{3}$/.test(x.ph); }))); } catch (e) { }

  /* صفحات ببيانات تجريبية ثابتة → تتحول لصفحة عمل حقيقية */
  var GO = 'RecFlow';
  var HIDE = ('Dashboard RecReport ShelterRecords ShelterArchive ShelterReports Shelter Transfer AdsAdmin CustBase WhatsBot WhatsApp ChatArchive CustReviews ' +
    'Customers IdVerify Contracts Reviews Reports Accounts Insights TeamChat Guarantee Agents Commissions Leaves Recruitment VisaTrack Arrivals RecHolds Accountant WorkerReport Blocklist Main').split(' ');
  var CUST_HIDE = { OffersRent: 'Landing', LandingAd: 'Landing' };
  function isStaff() { try { return !!JSON.parse(localStorage.getItem('asayel-chat') || 'null'); } catch (e) { return false; } }
  function guard() {
    var h = hash();
    if (CUST_HIDE[h]) { location.replace('#/' + CUST_HIDE[h]); return; }
    if (HIDE.indexOf(h) >= 0 && isStaff()) location.replace('#/' + GO);
  }
  window.addEventListener('hashchange', guard);

  function counts() { document.querySelectorAll('nav.xn details.xg').forEach(function (g) { var sm = g.querySelector('summary small'); if (!sm) return; var n = [].filter.call(g.querySelectorAll('a'), function (x) { return getComputedStyle(x).display !== 'none'; }).length; if (sm.textContent !== String(n)) sm.textContent = n; }); }
  /* اسم المكتب بدل اسم أصايل في الصفحات المضغوطة، والإعلان الافتتاحي التجريبي يتحول للواجهة */
  function names() {
    var N = (window.XP_SAAS || {}).name; if (!N) return;
    if (/أصايل/.test(document.title)) document.title = document.title.replace(/شركة أصايل المنصورة|أصايل المنصورة/g, N);
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue;
      if (v.indexOf('أصايل') >= 0 && n.parentElement && n.parentElement.tagName !== 'SCRIPT' && n.parentElement.tagName !== 'STYLE') n.nodeValue = v.replace(/شركة أصايل المنصورة للاستقدام|مكتب أصايل المنصورة للاستقدام|شركة أصايل المنصورة|مكتب أصايل المنصورة|أصايل المنصورة/g, N);
      else if (v.indexOf('يرفعه المطوّر') >= 0 && !/^#\/Landing\b/.test(location.hash)) { location.replace('#/Landing'); return; }
    }
  }
  function tags() {
    var app = document.getElementById('app'); if (!app) return;
    var w = document.createTreeWalker(app, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (/بيانات تجريبية|أرقام تجريبية|للتجربة:/.test(n.nodeValue) && n.parentElement && n.parentElement.children.length === 0) n.parentElement.classList.add('z26h');
  }
  var pend = 0;
  function run() { pend = 0; try { guard(); names(); counts(); tags(); } catch (e) { } }
  new MutationObserver(function () { if (!pend) { pend = 1; requestAnimationFrame(run); } }).observe(document.documentElement, { childList: true, subtree: true });
  run();

  var st = document.createElement('style'); st.textContent =
    '.z9b2,#lof,.z26h,#demo,#menu,.rann{display:none!important}' +
    'details.xg[data-g="الإيواء"],details.xg[data-g="نقل الخدمات"],details.xg[data-g="الرد الآلي والدعاية"],details.xg[data-g="📣 الرد الآلي والدعاية"],details.xg[data-g="صفحات تجريبية (للمدير)"],' +
    HIDE.map(function (p) { return 'nav.xn a[href="#/' + p + '"]'; }).join(',') + '{display:none!important}';
  document.head.appendChild(st);
})();
