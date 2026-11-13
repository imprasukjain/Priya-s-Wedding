// Coordinator announcements page. Everything is saved on this phone only
// (localStorage); nothing is sent anywhere. "Open WhatsApp" is a real link, so
// phones never block it, and WhatsApp itself asks which chat to send to.
(function () {
  'use strict';

  var KEY = 'announce:v1';
  var IST_OFFSET_MS = 330 * 60 * 1000;

  function nowIst() {
    var override = new URLSearchParams(location.search).get('now');
    if (override && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(override)) return override;
    return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 16);
  }
  function clock12(hhmm) {
    var p = hhmm.split(':'), h = parseInt(p[0], 10);
    return (h % 12 || 12) + ':' + p[1] + (h >= 12 ? ' PM' : ' AM');
  }
  function stampNow() { return clock12(nowIst().slice(11, 16)); }
  // Minutes between two "YYYY-MM-DDTHH:MM" IST times.
  function minutesBetween(from, to) { return (Date.parse(to + ':00Z') - Date.parse(from + ':00Z')) / 60000; }
  // A function that started this long ago leaves "Ready now" (it can still be sent).
  var STALE_AFTER_MINUTES = 180;

  var state = { items: {}, log: [] };
  try { state = JSON.parse(localStorage.getItem(KEY)) || state; } catch (e) {}
  state.items = state.items || {};
  state.log = state.log || [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function item(id) { return state.items[id] || (state.items[id] = {}); }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.ann'));
  var titles = {};
  cards.forEach(function (c) { titles[c.dataset.id] = c.querySelector('.ann__title').textContent; });

  function record(id, action) {
    state.log.unshift({ at: nowIst(), id: id, action: action });
    state.log = state.log.slice(0, 100);
    save();
  }

  function render() {
    var now = nowIst();
    var clock = document.querySelector('[data-clock]');
    if (clock) clock.textContent = 'Now: ' + now.slice(0, 10) + ', ' + clock12(now.slice(11, 16)) + ' IST';

    var ready = [];
    cards.forEach(function (card) {
      var id = card.dataset.id;
      var s = item(id);
      var isFood = card.dataset.food === 'true';
      var due = now >= card.dataset.due;
      var past = minutesBetween(card.dataset.start, now) >= STALE_AFTER_MINUTES;
      var sent = Boolean(s.sentAt);
      var foodOk = !isFood || Boolean(s.foodAt);

      var status = card.querySelector('[data-status]');
      var label = 'Upcoming';
      var cls = 'upcoming';
      if (sent) { label = 'Sent ' + s.sentAt; cls = 'sent'; }
      else if (past) { label = 'Past · not sent'; cls = 'past'; }
      else if (due && !foodOk) { label = 'Due · confirm food'; cls = 'ready'; }
      else if (due) { label = 'Ready now'; cls = 'ready'; }
      status.textContent = label;
      status.className = 'ann__status ann__status--' + cls;
      card.classList.toggle('ann--ready', due && !sent && !past);
      card.classList.toggle('ann--sent', sent);
      if (due && !sent && !past) ready.push(card);

      var wa = card.querySelector('[data-wa]');
      wa.hidden = sent;
      wa.classList.toggle('is-disabled', !foodOk);
      wa.setAttribute('aria-disabled', String(!foodOk));
      card.querySelector('[data-mark-sent]').hidden = sent;
      card.querySelector('[data-reopen]').hidden = !sent;
      card.querySelector('[data-copy]').hidden = sent || !navigator.clipboard;

      var foodBtn = card.querySelector('[data-food-confirm]');
      var foodNote = card.querySelector('[data-food-note]');
      if (foodBtn) {
        foodBtn.hidden = Boolean(s.foodAt);
        foodNote.hidden = !s.foodAt;
        foodNote.textContent = s.foodAt ? '✓ Food confirmed ready at ' + s.foodAt : '';
      }

      var note = card.querySelector('[data-note]');
      var msg = '';
      if (!sent && s.openedAt) msg = 'Opened in WhatsApp at ' + s.openedAt + '. Sent it? Tap Mark sent.';
      if (!foodOk && !sent) msg = 'Confirm the food is ready before announcing it.';
      note.hidden = !msg;
      note.textContent = msg;

      card.querySelector('[data-reset]').hidden = s.msg === undefined;
    });

    var readyBox = document.querySelector('[data-ready]');
    var readyList = document.querySelector('[data-ready-list]');
    readyBox.hidden = !ready.length;
    readyList.innerHTML = '';
    ready.forEach(function (card) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + card.id;
      a.textContent = titles[card.dataset.id] + ' · ' + card.querySelector('.ann__when').textContent;
      li.appendChild(a);
      readyList.appendChild(li);
    });

    var log = document.querySelector('[data-log]');
    log.innerHTML = '';
    if (!state.log.length) log.innerHTML = '<li>Nothing yet.</li>';
    state.log.forEach(function (entry) {
      var li = document.createElement('li');
      li.textContent = entry.at.slice(5, 10) + ' ' + clock12(entry.at.slice(11, 16)) + ' · ' + (titles[entry.id] || entry.id) + ' · ' + entry.action;
      log.appendChild(li);
    });
    document.querySelector('[data-reset-all]').hidden = !state.log.length && !Object.keys(state.items).length;
  }

  // Grow the message box to show the whole message.
  function fit(box) { box.style.height = 'auto'; box.style.height = box.scrollHeight + 2 + 'px'; }

  function setLink(card) {
    var text = card.querySelector('[data-msg]').value;
    card.querySelector('[data-wa]').href = 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  cards.forEach(function (card) {
    var id = card.dataset.id;
    var box = card.querySelector('[data-msg]');
    var original = card.querySelector('[data-original]').content.textContent;
    if (item(id).msg !== undefined) box.value = item(id).msg;
    setLink(card);
    fit(box);

    box.addEventListener('input', function () {
      if (box.value === original) delete item(id).msg; else item(id).msg = box.value;
      save(); setLink(card); fit(box); render();
    });
    card.querySelector('[data-reset]').addEventListener('click', function () {
      delete item(id).msg; box.value = original; save(); setLink(card); fit(box); render();
    });

    card.querySelector('[data-wa]').addEventListener('click', function (e) {
      if (this.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
      item(id).openedAt = stampNow(); record(id, 'opened WhatsApp'); render();
    });
    card.querySelector('[data-mark-sent]').addEventListener('click', function () {
      item(id).sentAt = stampNow(); record(id, 'marked sent'); render();
    });
    card.querySelector('[data-reopen]').addEventListener('click', function () {
      delete item(id).sentAt; delete item(id).openedAt; record(id, 'reopened'); render();
    });
    var food = card.querySelector('[data-food-confirm]');
    if (food) food.addEventListener('click', function () {
      item(id).foodAt = stampNow(); record(id, 'food confirmed ready'); render();
    });
    card.querySelector('[data-copy]').addEventListener('click', function () {
      var btn = this;
      navigator.clipboard.writeText(box.value).then(function () {
        btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy text'; }, 1500);
      }, function () { box.select(); });
    });
  });

  document.querySelector('[data-reset-all]').addEventListener('click', function () {
    if (!window.confirm('Clear every tick, edit and log entry on this phone?')) return;
    state = { items: {}, log: [] }; save(); location.reload();
  });

  render();
  setInterval(render, 30000);
})();
