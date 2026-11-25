(function () {
  'use strict';

  var destination = '#/RentSoon';
  var publicRoutes = /^#\/(?:RentSoon|Rent|Rental|AvailableWorkers|Booking|MyBookings|OffersRent|RentWorkers|RentBooking)(?:[/?#]|$)/i;
  var publicPath = /^\/(?:rent|rental|offers-rent)\/?$/i;
  var rentalLabel = /(?:إيجار|ايجار|أيجار)/;

  function isRentalRoute(href) {
    return publicRoutes.test(href || '') || publicPath.test(href || '');
  }

  function updateRentalLinks() {
    var app = document.getElementById('app');
    if (!app) return;
    var home = app.querySelector('.lpg .lcta');
    if (home && (!location.hash || /^#\/(?:Landing|LandingAd)?$/.test(location.hash)) && !home.querySelector('.rent')) {
      var link = document.createElement('a');
      link.className = 'lbig rent';
      link.href = destination;
      link.innerHTML = '<b>الإيجار</b><small>قريبًا</small>';
      home.appendChild(link);
    }
    var publicArea = app.querySelector('.lpg');
    if (!publicArea) return;
    publicArea.querySelectorAll('a[href], .lmg > button, button[data-ltab="rent"]').forEach(function (element) {
      var rentalCard = element.closest('.lbig.rent, .lsv.rent, .lsl.rent');
      if (!rentalCard && !isRentalRoute(element.getAttribute('href')) && !rentalLabel.test(element.textContent)) return;
      if (element.tagName === 'A' && element.getAttribute('href') !== destination) element.setAttribute('href', destination);
      element.removeAttribute('data-to');
      element.setAttribute('data-rental-soon', '');
      if (rentalCard && element.matches('.lbig.rent')) {
        var subtitle = element.querySelector('small');
        if (subtitle && subtitle.textContent !== 'قريبًا') subtitle.textContent = 'قريبًا';
      }
    });
  }

  document.addEventListener('click', function (event) {
    var element = event.target.closest && event.target.closest('a[href], button[data-rental-soon]');
    if (!element || (!element.hasAttribute('data-rental-soon') && !isRentalRoute(element.getAttribute('href')))) return;
    if (element.tagName === 'A' && element.getAttribute('href') === destination) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.hash = destination;
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    if (!app) return;
    new MutationObserver(updateRentalLinks).observe(app, { childList: true, subtree: true });
    updateRentalLinks();
  });

  window.asayelRentalSoon = {
    matches: function () {
      return isRentalRoute(location.hash) || (!location.hash && publicPath.test(location.pathname));
    },
    render: function (app) {
      document.title = 'الإيجار · قريبًا | شركة أصايل المنصورة';
      app.innerHTML = '<main class="z28r" dir="rtl" style="min-height:70vh;display:grid;place-items:center;text-align:center;padding:24px"><div class="z28rc"><h1>خدمة الإيجار</h1><p>قريبًا</p><a class="z28rb" href="/#/Landing">الرجوع للصفحة الرئيسية</a></div></main>';
    }
  };
})();
