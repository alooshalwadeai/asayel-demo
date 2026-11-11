/* z8 — contract policy & FAQ are customer pages: not shown on the staff «طلبات العملاء الخاصة» page */
(function () {
  function drop() {
    var w = document.getElementById('z6edwrap');
    if (w) ['z6pol', 'z6faq'].forEach(function (id) {
      var t = document.getElementById(id); if (!t) return;
      var c = t; while (c.parentNode && c.parentNode !== w) c = c.parentNode; if (c.parentNode === w) c.remove();
    });
    document.querySelectorAll('.rnote').forEach(function (n) { if (/سياسة التعاقد والأسئلة الشائعة: للمدير فقط/.test(n.textContent)) n.textContent = '✏ تعديل سعر التفويض: للمدير فقط'; });
  }
  new MutationObserver(drop).observe(document.documentElement, { childList: true, subtree: true });
})();
/* visitor statistics (Vercel Web Analytics, free) — customer pages only, never staff sessions */
(function () {
  function staff() { try { return sessionStorage.getItem('asayel-ok') === '1'; } catch (e) { return false; } }
  if (staff()) return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script'); s.defer = true; s.src = '/_vercel/insights/script.js'; s.setAttribute('data-disable-auto-track', '1');
  (document.head || document.documentElement).appendChild(s);
  var last = '';
  function pv() {
    if (staff()) return;
    var r = (location.hash.replace(/^#\/?/, '').split(/[?&]/)[0]) || 'Landing', p = '/' + r;
    if (p === last) return; last = p;
    window.va('pageview', { route: p, path: p });
  }
  window.addEventListener('hashchange', pv); pv();
})();
/* «طريقك إلى الاستقدام»: every question starts closed — opens only when the visitor taps it */
(function () {
  function close() { var r = document.getElementById('lroad'); if (!r || r.__z8) return; r.__z8 = 1; r.querySelectorAll('details[open]').forEach(function (d) { d.removeAttribute('open'); }); }
  new MutationObserver(close).observe(document.documentElement, { childList: true, subtree: true });
})();
