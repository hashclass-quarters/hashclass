// Tiny sound effects (made with the Web Audio API, no audio files needed).
(function () {
  var ctx = null;
  function getCtx() {
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  // notes: [[frequency, startSeconds, durationSeconds], ...]
  function play(notes, type, volume) {
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;
    notes.forEach(function (n) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(n[0], now + n[1]);
      g.gain.setValueAtTime(0.0001, now + n[1]);
      g.gain.exponentialRampToValueAtTime(volume || 0.18, now + n[1] + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
      o.connect(g); g.connect(c.destination);
      o.start(now + n[1]); o.stop(now + n[1] + n[2] + 0.02);
    });
  }
  // browsers only allow sound after the first tap/click: unlock it early
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { getCtx(); }, { once: true, passive: true });
  });
  window.HCSound = {
    like: function () { play([[660, 0, 0.12], [990, 0.07, 0.2]], 'sine', 0.2); },           // bright rising "pop"
    unlike: function () { play([[520, 0, 0.1], [340, 0.06, 0.18]], 'sine', 0.16); },         // soft falling tone
    send: function () { play([[500, 0, 0.06], [760, 0.045, 0.1]], 'sine', 0.17); },          // short upward "swoosh" when you send a chat message
    incoming: function () { play([[880, 0, 0.09], [660, 0.1, 0.16]], 'sine', 0.2); },        // "pop-pop" for a message arriving while the chat is open
    notify: function () { play([[988, 0, 0.12], [1319, 0.13, 0.12], [988, 0.28, 0.2]], 'triangle', 0.18); }, // bell-like ping for a new unread message
    comment: function () { play([[784, 0, 0.1], [1047, 0.09, 0.1], [1319, 0.18, 0.22]], 'triangle', 0.16); } // little "sent" chime
  };
})();
