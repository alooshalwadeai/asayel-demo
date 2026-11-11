/* z5 — rental flow polish: the booking page shows the worker the customer picked · day = 8 hours */
(function () {
  /* insurance strip: no «عدم الكفاءة المهنية», coverage per the agreed insurer's terms */
  var sti = document.createElement('style'); sti.textContent = '.z6insn{flex-basis:100%;color:#F2B544;font-size:13px;font-weight:600}'; (document.head || document.documentElement).appendChild(sti);
  function insFix() {
    document.querySelectorAll('.z6ins').forEach(function (b) {
      b.querySelectorAll('li').forEach(function (li) { if (/الكفاءة/.test(li.textContent)) li.remove(); });
      if (!b.querySelector('.z6insn')) { var s = document.createElement('small'); s.className = 'z6insn'; s.textContent = 'حسب شروط شركة التأمين المتفق عليها'; b.appendChild(s); }
    });
  }
  /* «طريقك إلى الاستقدام» — Musaned steps on the home page, above «عروضنا الحالية» */
  var RD = [
    ['ما هي طريقة سداد التأشيرة؟', 'من تطبيق بنكك ← المدفوعات الحكومية (سداد) ← الاستقدام ← تأشيرة عمل، ثم سجّل رقم هوية صاحب التأشيرة، وحدّد عدد التأشيرات، وادفع.'],
    ['ما هي طريقة إصدار التأشيرة؟', 'ادخل منصة مساند (الأفراد) ← التأشيرات ← تأشيرة عمالة منزلية، ثم اختر المهنة والجنسية والجنس ووافق على الإقرار، وأرفق تعريف الراتب أو كشف الحساب البنكي، وبعدها سدّد رسوم منصة مساند لإصدار التأشيرة وقدرها 172.5 ريال.'],
    ['ما هي طريقة إرسال العقد عن طريق مساند؟ (حسب المواصفات)', 'في مساند: العقود ← التعاقد ← استقدام حسب المواصفات، ثم اختر المهنة والجنسية والجنس ومدينة الوصول، وابحث عن «أصايل المنصورة للاستقدام»، واختر الديانة والمواصفات المطابقة للسيرة الذاتية التي اخترتها، ثم أكّد إرسال الطلب.'],
    ['ما هي طريقة إرسال العقد عن طريق مساند؟ عامل/ة (معيّن بالاسم)', 'في مساند: العقود ← التعاقد ← استقدام معيّن بالاسم، ثم عبّئ بيانات العامل/ة المطلوبة، وحدّد مدينة الوصول، وابحث عن «أصايل المنصورة للاستقدام»، ثم أكّد إرسال الطلب.', '#/RecNamed', 'أرسل لنا بيانات العامل وصورة جوازه ←']
  ];
  var str = document.createElement('style');
  str.textContent = '.z5rd{background:#0E2747;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:22px}.z5rd h2{margin:0 0 4px}.z5rd>p{margin:0 0 14px;color:#9FB3CC!important}' +
    '.z5rd details{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.03);margin-top:10px;overflow:hidden}.z5rd details[open]{border-color:rgba(242,181,68,.45)}' +
    '.z5rd summary{list-style:none;cursor:pointer;padding:14px 16px;font-weight:700;font-size:16px;color:#fff;display:flex;align-items:center;gap:10px}.z5rd summary::-webkit-details-marker{display:none}' +
    '.z5rd summary i{font-style:normal;width:26px;height:26px;border-radius:50%;background:rgba(242,181,68,.15);color:#F2B544;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto}.z5rd summary i:before{content:"+"}.z5rd details[open] summary i:before{content:"−"}' +
    '.z5rd .z5a{padding:2px 16px 16px 52px;color:#F2B544;font-weight:600;line-height:1.9;font-size:15px}.z5rd .z5a a{display:inline-block;margin-top:6px;color:#9CC6FF;font-weight:700;text-decoration:none}' +
    '@media (max-width:640px){.z5rd{padding:16px}.z5rd summary{font-size:15px;padding:12px}.z5rd .z5a{padding:0 12px 14px 12px;font-size:14.5px}}';
  (document.head || document.documentElement).appendChild(str);
  function esc5(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function roadFix() {
    var of = document.getElementById('lof'); if (!of || document.getElementById('lroad')) return;
    var s = document.createElement('section'); s.className = 'lsec'; s.id = 'lroad';
    s.innerHTML = '<div class="z5rd"><h2>طريقك إلى الاستقدام</h2><p class="mut">خطوات منصة مساند من سداد التأشيرة حتى إرسال العقد لمكتبنا</p>' + RD.map(function (r, i) {
      return '<details' + (i === 0 ? ' open' : '') + '><summary><i aria-hidden="true"></i>' + esc5(r[0]) + '</summary><div class="z5a">' + esc5(r[1]) + (r[2] ? '<br><a href="' + r[2] + '">' + esc5(r[3]) + '</a>' : '') + '</div></details>';
    }).join('') + '</div>';
    of.parentNode.insertBefore(s, of);
  }
  var PICK = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#/Booking"]'); if (!a || !/AvailableWorkers/.test(location.hash)) return;
    var card = a.parentElement; while (card && card.parentElement && card.innerText.split('\n').filter(Boolean).length < 4) card = card.parentElement;
    if (!card) return;
    var L = card.innerText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var nat = L.filter(function (s) { return / · \d+ سنة/.test(s); })[0];
    if (L[0] && nat) PICK = L[0] + ' · ' + nat.split(' · ')[0];
  }, true);
  function fix() {
    if (!/^#\/Booking$/.test(location.hash)) return;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, ch = [];
    while ((n = w.nextNode())) {
      var t = n.nodeValue;
      if (PICK && /^\s*ماريا · الفلبين\s*$/.test(t) && t.trim() !== PICK) ch.push([n, t.replace('ماريا · الفلبين', PICK)]);
      else if (/يوم كامل(?! \()/.test(t)) ch.push([n, t.replace(/يوم كامل(?! \()/, 'يوم كامل (8 ساعات)')]);
    }
    ch.forEach(function (x) { x[0].nodeValue = x[1]; });
  }
  new MutationObserver(function () { fix(); insFix(); roadFix(); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', function () { setTimeout(fix, 0); });
  /* a re-render requested before the first page is ready is skipped (the first route renders it anyway) */
  (function wrap() { var H = window.XP_HOST; if (!H || !H.reopen) return setTimeout(wrap, 30); var o = H.reopen; H.reopen = function () { try { return o.apply(this, arguments); } catch (e) { } }; })();
})();
