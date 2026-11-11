/* z9 — new home-page hero («من بلدها… إلى بيتك بأمان»): flags map to Najran + «رحلة طلبك» steps; replaces the old hero entirely */
(function () {
  var F = {
    in: '<rect width="30" height="7" fill="#FF9933"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="13" width="30" height="7" fill="#138808"/><circle cx="15" cy="10" r="2.4" fill="none" stroke="#000080" stroke-width=".8"/>',
    ph: '<rect width="30" height="10" fill="#0038A8"/><rect y="10" width="30" height="10" fill="#CE1126"/><path d="M0 0L14 10 0 20z" fill="#fff"/><circle cx="4.6" cy="10" r="2" fill="#FCD116"/>',
    pk: '<rect width="30" height="20" fill="#01411C"/><rect width="7.5" height="20" fill="#fff"/><circle cx="18.5" cy="10" r="5" fill="#fff"/><circle cx="20" cy="9" r="4.3" fill="#01411C"/><path d="M22.6 6.2l.5 1.5 1.6 0-1.3.9.5 1.5-1.3-.9-1.3.9.5-1.5-1.3-.9 1.6 0z" fill="#fff"/>',
    bd: '<rect width="30" height="20" fill="#006A4E"/><circle cx="13.5" cy="10" r="5.6" fill="#F42A41"/>',
    bi: '<rect width="30" height="20" fill="#CE1126"/><path d="M0 0L15 10 0 20zM30 0L15 10 30 20z" fill="#1EB53A"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="3"/><circle cx="15" cy="10" r="5" fill="#fff"/><g fill="#CE1126"><circle cx="15" cy="7.8" r=".9"/><circle cx="13" cy="11.2" r=".9"/><circle cx="17" cy="11.2" r=".9"/></g>',
    ke: '<rect width="30" height="20" fill="#fff"/><rect width="30" height="6" fill="#000"/><rect y="7" width="30" height="6" fill="#BB0000"/><rect y="14" width="30" height="6" fill="#006600"/><ellipse cx="15" cy="10" rx="2.6" ry="5.4" fill="#BB0000" stroke="#000" stroke-width=".6"/><path d="M15 4.6v10.8" stroke="#fff" stroke-width=".6"/>',
    et: '<rect width="30" height="7" fill="#078930"/><rect y="7" width="30" height="6" fill="#FCDD09"/><rect y="13" width="30" height="7" fill="#DA121A"/><circle cx="15" cy="10" r="4" fill="#0F47AF"/><path d="M15 7.2l.8 2.3h2.4l-1.9 1.4.7 2.3-2-1.4-2 1.4.7-2.3-1.9-1.4h2.4z" fill="#FCDD09"/>',
    lk: '<rect width="30" height="20" fill="#FFBE29"/><rect x="1.2" y="1.2" width="4" height="17.6" fill="#00534E"/><rect x="5.2" y="1.2" width="4" height="17.6" fill="#EB7400"/><rect x="10.4" y="1.2" width="18.4" height="17.6" fill="#8D153A"/><path d="M15.5 13.5c0-3 1.5-5 3.6-5.6.6-1.6 2.2-1.9 3.1-.8 1.7.3 2.6 1.9 2.2 3.6l-.6 2.8z" fill="#FFBE29"/><path d="M14 15h10" stroke="#FFBE29" stroke-width="1.3"/>'
  };
  function flag(k) { return '<svg class="z9f" viewBox="0 0 30 20" aria-hidden="true">' + F[k] + '</svg>'; }
  /* map coordinates in a 800×600 box; Najran is the destination */
  var NJ = [665, 345];
  var C = [['in', 'الهند', 425, 40], ['ph', 'الفلبين', 180, 108], ['pk', 'باكستان', 345, 198], ['bd', 'بنغلاديش', 170, 285], ['bi', 'بوروندي', 190, 370], ['ke', 'كينيا', 198, 455], ['et', 'إثيوبيا', 398, 520], ['lk', 'سريلانكا', 636, 520]];
  function curve(x, y) {
    var dx = NJ[0] - x, dy = NJ[1] - y, cx = (x + NJ[0]) / 2 + dy * 0.22, cy = (y + NJ[1]) / 2 - dx * 0.22;
    return 'M' + x + ' ' + y + ' Q' + cx.toFixed(0) + ' ' + cy.toFixed(0) + ' ' + NJ[0] + ' ' + NJ[1];
  }
  var I = {
    pick: '<rect x="7" y="11" width="34" height="24" rx="4"/><circle cx="17" cy="21" r="4"/><path d="M11 31c1.5-4 10.5-4 12 0M27 19h9M27 25h6"/>',
    doc: '<path d="M12 8h17l7 7v25H12z"/><path d="M18 18h12M18 24h12M18 30h7"/><path d="M28 36l10-10 3 3-10 10-4 1z"/>',
    med: '<path d="M14 8v10a8 8 0 0 0 16 0V8"/><path d="M22 26v5a7 7 0 0 0 14 0v-3"/><circle cx="36" cy="25" r="3"/>',
    visa: '<rect x="10" y="7" width="26" height="34" rx="3"/><circle cx="23" cy="19" r="6"/><path d="M17 19h12M23 13c-2.5 3-2.5 9 0 12M23 13c2.5 3 2.5 9 0 12"/><rect x="22" y="29" width="20" height="10" rx="2" fill="#071B33"/><text x="32" y="37" text-anchor="middle" font-size="7" font-weight="800" stroke="none" fill="#3FE0F0" font-family="Arial">VISA</text>',
    plane: '<g transform="translate(25 3) rotate(55 0 0) scale(1.45)"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke-width="1.6"/></g><path d="M9 38c9 4 21 3 31-4"/>',
    home: '<path d="M8 24L24 10l16 14"/><path d="M13 20v18h11"/><path d="M24 38v-9h6"/>'
  };
  function ico(k, chk) { return '<svg viewBox="0 0 48 48" aria-hidden="true">' + I[k] + '</svg>' + (chk ? '<em aria-hidden="true">✓</em>' : ''); }
  var STEPS = [['pick', 'اختيار العاملة', 1], ['doc', 'عقد مساند'], ['med', 'الفحص الطبي'], ['visa', 'التأشير'], ['plane', 'الرحلة'], ['home', 'الاستلام', 1]];

  function html() {
    var svg = '<svg class="z9ln" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true">' + C.map(function (c) { return '<path d="' + curve(c[2], c[3]) + '"/>'; }).join('') + '</svg>';
    var pills = C.map(function (c) { return '<span class="z9p" style="left:' + (c[2] / 8) + '%;top:' + (c[3] / 6) + '%">' + flag(c[0]) + '<b>' + c[1] + '</b></span>'; }).join('');
    return '<div class="z9w"><div class="z9tx">' +
      '<span class="z9pl"><b>استقدام العمالة المنزلية</b> لجميع مناطق المملكة</span>' +
      '<h1>من بلدها…<br><span>إلى بيتك</span> بأمان</h1>' +
      '<p>نتابع طلبك من اختيار السيرة الذاتية حتى وصول العاملة واستلامها.</p>' +
      '<div class="z9bt"><a class="z9b1" href="#/CustomerLogin">ابدأ طلب الاستقدام</a><a class="z9b2" href="#/CustomerLogin">طلب خدمة التأجير</a></div></div>' +
      '<div class="z9map" aria-label="الدول التي نستقدم منها إلى نجران" role="img">' + svg +
      '<span class="z9pln" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></span>' + pills +
      '<span class="z9nj" style="left:' + (NJ[0] / 8) + '%;top:' + (NJ[1] / 6) + '%"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>نجران</span></div>' +
      '<div class="z9tr"><b class="z9tt">رحلة طلبك</b><ol>' + STEPS.map(function (s, i) { return '<li><i>' + ico(s[0], s[2]) + '</i><span>' + (i + 1) + '. ' + s[1] + '</span></li>'; }).join('') + '</ol></div></div>';
  }

  var css = '.z9h{position:relative;overflow:hidden;color:#fff;font-family:Tajawal,"IBM Plex Sans Arabic",sans-serif;background:radial-gradient(60% 55% at 0% 0%,rgba(22,140,150,.55),transparent 60%),radial-gradient(45% 60% at 100% 85%,rgba(22,140,150,.38),transparent 62%),linear-gradient(180deg,#0A2340,#061A31)!important;padding:34px max(28px,calc((100% - 1240px)/2)) 30px!important;max-width:none!important;margin:0!important}' +
    '.z9w{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);grid-template-areas:"tx map" "tr tr";gap:22px 30px;align-items:center}' +
    '.z9tx{grid-area:tx}.z9map{grid-area:map}.z9tr{grid-area:tr}' +
    '.z9pl{display:inline-block;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.05);border-radius:999px;padding:9px 20px;font-size:15px;color:#E6EEF8}.z9pl b{font-weight:800;color:#fff}' +
    '.z9tx h1{font-size:clamp(40px,5.6vw,78px);line-height:1.18;font-weight:900;margin:22px 0 16px;color:#fff;letter-spacing:0}.z9tx h1 span{color:#3DA5FF}' +
    '.z9tx p{font-size:clamp(15px,1.4vw,19px);color:#DCE6F2;margin:0 0 26px;line-height:1.8}' +
    '.z9bt{display:flex;gap:14px;flex-wrap:wrap}.z9bt a{flex:1 1 200px;max-width:330px;text-align:center;font-weight:800;font-size:clamp(16px,1.5vw,20px);padding:17px 22px;border-radius:14px;text-decoration:none;color:#fff!important;transition:transform .15s,filter .15s}.z9bt a:hover{transform:translateY(-2px);filter:brightness(1.08)}' +
    '.z9b1{background:linear-gradient(180deg,#2F7BFF,#1259F0);box-shadow:0 10px 28px rgba(31,107,255,.45)}.z9b2{background:linear-gradient(180deg,#1FA374,#12855C);box-shadow:0 10px 28px rgba(18,133,92,.35);border:1px solid rgba(255,255,255,.18)}' +
    '.z9map{position:relative;aspect-ratio:4/3;width:100%;background-image:radial-gradient(rgba(255,255,255,.09) 1px,transparent 1.2px);background-size:22px 22px;border-radius:20px}' +
    '.z9ln{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.z9ln path{fill:none;stroke:#2ED3E6;stroke-width:2;stroke-dasharray:6 6;opacity:.85;vector-effect:non-scaling-stroke}' +
    '.z9p{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:9px;background:#fff;color:#0B1B2E;border-radius:999px;padding:7px 16px 7px 10px;font-weight:800;font-size:clamp(11px,1.25vw,17px);box-shadow:0 8px 22px rgba(0,0,0,.35);white-space:nowrap;z-index:2}' +
    '.z9f{width:2.1em;height:1.4em;border-radius:4px;box-shadow:0 0 0 1px rgba(0,0,0,.08);flex:none}' +
    '.z9nj{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#FFD26A,#F2B544);color:#0B1B2E;font-weight:900;font-size:clamp(15px,1.8vw,24px);padding:12px 26px;border-radius:999px;box-shadow:0 0 0 12px rgba(242,181,68,.16),0 0 0 26px rgba(242,181,68,.07),0 12px 30px rgba(0,0,0,.4);z-index:3}.z9nj svg{width:1.05em;height:1.05em;fill:#0B1B2E}' +
    '.z9pln{position:absolute;left:55%;top:19%;width:clamp(30px,4vw,54px);transform:translate(-50%,-50%) rotate(62deg);z-index:2}.z9pln svg{width:100%;fill:#E6F6FF;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))}' +
    '.z9tr{display:flex;align-items:center;gap:24px;border:1px solid rgba(63,224,240,.28);background:rgba(16,58,82,.45);border-radius:26px;padding:24px 28px}' +
    '.z9tt{color:#F2B544;font-size:clamp(18px,1.9vw,26px);font-weight:900;white-space:nowrap;padding-inline-end:22px;border-inline-end:2px solid rgba(255,255,255,.18)}' +
    '.z9tr ol{list-style:none;margin:0;padding:0;flex:1;display:grid;grid-template-columns:repeat(6,1fr);position:relative}' +
    '.z9tr ol:before{content:"";position:absolute;top:calc(clamp(56px,6.6vw,104px)/2);inset-inline:8%;height:2px;background:#2ED3E6;opacity:.8}' +
    '.z9tr li{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}' +
    '.z9tr li i{position:relative;width:clamp(56px,6.6vw,104px);aspect-ratio:1;border-radius:50%;border:3px solid #2ED3E6;background:#0A2340;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(46,211,230,.25)}' +
    '.z9tr li i svg{width:58%;fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}' +
    '.z9tr li i em{position:absolute;bottom:14%;inset-inline-start:12%;width:28%;aspect-ratio:1;border-radius:50%;background:#2ED3E6;color:#071B33;font-style:normal;font-weight:900;font-size:clamp(10px,1.1vw,16px);display:flex;align-items:center;justify-content:center;border:2px solid #0A2340}' +
    '.z9tr li span{font-weight:800;font-size:clamp(12px,1.25vw,18px);color:#fff}' +
    '@media (max-width:860px){.z9h{padding:20px 14px 22px!important}.z9w{grid-template-columns:1fr;grid-template-areas:"tx" "map" "tr";gap:18px}.z9tx{text-align:center}.z9pl{font-size:13px;padding:7px 14px}.z9tx h1{margin:14px 0 10px}.z9bt{justify-content:center}.z9bt a{padding:14px 12px;flex:1 1 140px}' +
    '.z9p{padding:4px 9px 4px 6px;gap:5px;font-size:10.5px}.z9nj{padding:7px 14px;box-shadow:0 0 0 7px rgba(242,181,68,.16),0 0 0 15px rgba(242,181,68,.07)}' +
    '.z9tr{flex-direction:column;align-items:stretch;padding:16px 12px;gap:14px}.z9tt{border:0;padding:0;text-align:center}.z9tr ol{grid-template-columns:repeat(3,1fr);row-gap:16px}.z9tr ol:before{display:none}.z9tr li i{width:62px}.z9tr li span{font-size:13px}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function swap() {
    var old = document.querySelector('section.hx:not(.z9h)'); if (!old) return;
    var s = document.createElement('section'); s.className = 'hx z9h'; s.setAttribute('aria-label', 'الواجهة الرئيسية'); s.innerHTML = html();
    old.parentNode.replaceChild(s, old);
  }
  new MutationObserver(swap).observe(document.documentElement, { childList: true, subtree: true });
  swap();
})();
