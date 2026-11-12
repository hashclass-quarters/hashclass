/* Popups grow from the spot that was tapped and shrink back when closed. */
(function () {
  var px = innerWidth / 2, py = innerHeight / 2;
  var st = document.createElement('style');
  st.textContent =
    '@keyframes hcPopIn{from{transform:scale(.15);opacity:0}to{transform:scale(1);opacity:1}}' +
    '@keyframes hcPopOut{from{transform:scale(1);opacity:1}to{transform:scale(.15);opacity:0}}' +
    '@keyframes hcFadeIn{from{opacity:0}to{opacity:1}}@keyframes hcFadeOut{from{opacity:1}to{opacity:0}}' +
    '.hc-pop-in>div{animation:hcPopIn .26s cubic-bezier(.2,.9,.3,1) both}.hc-pop-in{animation:hcFadeIn .2s ease both}' +
    '.hc-pop-out{pointer-events:none!important;animation:hcFadeOut .2s ease both}.hc-pop-out>div{animation:hcPopOut .2s ease-in both}';
  document.head.appendChild(st);
  function track(e) { var t = (e.touches && e.touches[0]) || e; if (t && t.clientX != null) { px = t.clientX; py = t.clientY; } }
  addEventListener('pointerdown', track, true);
  addEventListener('touchstart', track, true);
  addEventListener('click', track, true);
  function isPopup(n) {
    return n.nodeType === 1 && n.classList && n.classList.contains('fixed') && n.classList.contains('inset-0') &&
      n.classList.contains('items-center') && n.firstElementChild && n.id !== 'hc-splash';
  }
  function origin(n) {
    var p = n.firstElementChild, r = p.getBoundingClientRect();
    p.style.transformOrigin = Math.round(px - r.left) + 'px ' + Math.round(py - r.top) + 'px';
  }
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (!isPopup(n) || n.classList.contains('hc-pop-out')) return;
        origin(n); n.classList.add('hc-pop-in');
      });
      m.removedNodes.forEach(function (n) {
        if (!isPopup(n) || !n.classList.contains('hc-pop-in')) return;
        var c = n.cloneNode(true);
        c.classList.remove('hc-pop-in'); c.classList.add('hc-pop-out');
        document.body.appendChild(c);
        setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 230);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
