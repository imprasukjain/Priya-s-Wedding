// Progressive enhancement only: the page is fully readable without this file.
(function () {
  'use strict';

  var IST_OFFSET_MS = 330 * 60 * 1000;

  // Current time in IST as "YYYY-MM-DDTHH:MM". ?now=2026-11-21T15:00 overrides it for previews.
  function istNow() {
    var override = new URLSearchParams(location.search).get('now');
    if (override && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(override)) return override;
    return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 16);
  }
  function daysBetween(fromIso, toIso) {
    return Math.round((Date.parse(toIso + 'T00:00Z') - Date.parse(fromIso + 'T00:00Z')) / 86400000);
  }

  var now = istNow();
  var today = now.slice(0, 10);

  // ── Day tabs ────────────────────────────────────────────────
  var tablist = document.querySelector('[role="tablist"]');
  var tabs = tablist ? Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')) : [];

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }

  if (tabs.length > 1) {
    tablist.hidden = false;
    var todayTab = tabs.filter(function (t) { return t.getAttribute('aria-controls') === 'day-' + today; })[0];
    select(todayTab || tabs[0], false);

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  }

  // ── Countdown ──────────────────────────────────────────────
  var countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    var start = countdown.getAttribute('data-start');
    var end = countdown.getAttribute('data-end');
    var until = daysBetween(today, start);
    var text = '';
    if (until > 1) text = until + ' days to go';
    else if (until === 1) text = 'Tomorrow';
    else if (today <= end) text = 'Day ' + (daysBetween(start, today) + 1) + ' · Happening today';
    if (text) { countdown.textContent = text; countdown.hidden = false; }
  }

  // ── "Up next" on the day itself ─────────────────────────────
  var todayPanel = document.querySelector('[data-day="' + today + '"]');
  if (todayPanel) {
    var upcoming = Array.prototype.filter.call(todayPanel.querySelectorAll('[data-start]'), function (el) {
      return el.getAttribute('data-start') > now;
    });
    if (upcoming[0]) {
      upcoming[0].classList.add('event--next');
      upcoming[0].querySelector('.event__next').hidden = false;
    }
  }

  // ── Maps: load the Google embed only when asked ────────────
  Array.prototype.forEach.call(document.querySelectorAll('[data-map-src]'), function (btn) {
    var frame = btn.closest('.map').querySelector('[data-map-frame]');
    if (!frame) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (!frame.firstChild) {
        var iframe = document.createElement('iframe');
        iframe.src = btn.getAttribute('data-map-src');
        iframe.title = btn.getAttribute('data-map-title');
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);
      }
      frame.hidden = !frame.hidden;
      btn.querySelector('span').textContent = frame.hidden ? 'Show map here' : 'Hide map';
      btn.setAttribute('aria-expanded', String(!frame.hidden));
    });
  });

  // ── RSVP: compose a WhatsApp message; nothing is stored or sent by the site ──
  var form = document.querySelector('[data-rsvp-form]');
  if (form) {
    form.hidden = false;
    var rooms = form.querySelector('[data-rooms]');
    var syncRooms = function () { rooms.hidden = form.elements.room.value !== 'Yes'; };
    Array.prototype.forEach.call(form.elements.room, function (r) { r.addEventListener('change', syncRooms); });
    syncRooms();

    Array.prototype.forEach.call(form.querySelectorAll('[data-step]'), function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentNode.querySelector('input');
        var next = (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute('data-step'), 10);
        input.value = Math.min(Number(input.max), Math.max(Number(input.min), next));
      });
    });

    // The send control is a real link (works on every phone and browser);
    // its WhatsApp text is rebuilt whenever the form changes.
    var send = form.querySelector('[data-rsvp-send]');
    var compose = function () {
      var f = form.elements;
      var lines = [
        'Hi! RSVP for ' + form.getAttribute('data-couple') + '’s wedding (' + form.getAttribute('data-dates') + ')',
        '',
        'Name: ' + f.name.value.trim(),
        'Guests (including me): ' + f.guests.value,
        'Attending: ' + f.days.value,
        'Hotel room needed: ' + f.room.value + (f.room.value === 'Yes' ? ' (' + f.rooms.value + (f.rooms.value === '1' ? ' room)' : ' rooms)') : '')
      ];
      if (f.arrival.value.trim()) lines.push('Arrival: ' + f.arrival.value.trim());
      if (f.note.value.trim()) lines.push('Note: ' + f.note.value.trim());
      send.href = form.getAttribute('data-wa-url') + '?text=' + encodeURIComponent(lines.join('\n'));
    };
    form.addEventListener('input', compose);
    form.addEventListener('change', compose);
    form.addEventListener('click', function (e) { if (e.target.closest('[data-step]')) compose(); });
    compose();

    send.addEventListener('click', function (e) {
      compose();
      if (!form.reportValidity()) e.preventDefault();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.reportValidity()) send.click();
    });
  }

  // ── Print ──────────────────────────────────────────────────
  var printBtn = document.querySelector('[data-action="print"]');
  if (printBtn && window.print) {
    printBtn.hidden = false;
    printBtn.addEventListener('click', function () { window.print(); });
  }

  // ── Share ──────────────────────────────────────────────────
  var template = document.getElementById('share-message');
  var status = document.querySelector('.share__status');
  var isHosted = location.protocol === 'https:' || location.protocol === 'http:';
  var pageUrl = isHosted ? location.origin + location.pathname : '[website link]';
  var message = template ? template.content.textContent.replace('{url}', pageUrl) : '';

  function say(msg) { if (status) status.textContent = msg; }

  var shareBtn = document.querySelector('[data-action="share"]');
  if (shareBtn && navigator.share && isHosted) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', function () {
      navigator.share({ title: document.title, text: message }).catch(function () {});
    });
  }

  var copyBtn = document.querySelector('[data-action="copy"]');
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(message).then(
        function () { say('Message copied — paste it into WhatsApp or any chat.'); },
        function () { say('Could not copy automatically. Please copy the page link instead.'); }
      );
    });
  }

  // ── Highlight the section in view ───────────────────────────
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  if ('IntersectionObserver' in window && links.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) observer.observe(target);
    });
  }
})();
