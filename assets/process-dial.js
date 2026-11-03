/* IgnizAI — How we work: scroll-driven stage dial (reversible) */
(function () {
  'use strict';
  var root = document.getElementById('how-we-work');
  if (!root || !root.classList.contains('hpx')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.add('hpx--static'); return; }
  var pin = root.querySelector('.hpx__pin'), sticky = root.querySelector('.hpx__sticky');
  var cards = [].slice.call(root.querySelectorAll('.hpx__card')),
      segs = [].slice.call(root.querySelectorAll('.hpx__seg')),
      nodes = [].slice.call(root.querySelectorAll('.hpx__node')),
      icons = [].slice.call(root.querySelectorAll('.hpx__icons i')),
      rail = [].slice.call(root.querySelectorAll('.hpx__rail-item')),
      railFill = root.querySelector('.hpx__rail-line i'),
      digits = root.querySelector('.hpx__digits-col'),
      comet = root.querySelector('.hpx__comet');
  var N = cards.length, raf = 0;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  function update() {
    raf = 0;
    var r = pin.getBoundingClientRect();
    var total = pin.offsetHeight - sticky.offsetHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    /* dwell on each stage: move only through the middle half of each step */
    var raw = p * (N - 1), i0 = Math.min(N - 2, Math.floor(raw)), f = raw - i0;
    var x = i0 + smooth(clamp((f - 0.2) / 0.6, 0, 1));
    if (raw >= N - 1) x = N - 1;
    var cur = Math.round(x);

    cards.forEach(function (c, i) {
      var d = i - x, o, ty, sc, rot;
      if (d >= 0) { o = clamp(1 - d * 1.15, 0, 1); ty = d * 90; sc = 1; rot = d * 4; }
      else { var a = -d; o = a < 2.2 ? clamp(1 - a * 0.42, 0, 1) : 0; ty = -a * 18; sc = 1 - a * 0.055; rot = 0; }
      c.style.opacity = o.toFixed(3);
      c.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
      c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10) - (d > 0 ? 5 : 0));
      c.style.pointerEvents = i === cur ? 'auto' : 'none';
      c.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
    });
    segs.forEach(function (s, i) { s.style.strokeDashoffset = (100 * (1 - clamp(x + 1 - i, 0, 1))).toFixed(2); });
    nodes.forEach(function (n, i) { n.classList.toggle('is-on', i <= x + 0.02); });
    icons.forEach(function (ic, i) { var k = clamp(1 - Math.abs(i - x) * 2.2, 0, 1); ic.style.opacity = k.toFixed(3); ic.style.transform = 'scale(' + (0.6 + 0.4 * k).toFixed(3) + ')'; });
    digits.style.transform = 'translateY(' + (-x).toFixed(4) + 'em)';
    comet.style.transform = 'rotate(' + ((x + 1) * 72 - 4).toFixed(2) + 'deg)';
    railFill.style.transform = 'scaleX(' + (x / (N - 1)).toFixed(4) + ')';
    rail.forEach(function (it, i) { it.classList.toggle('is-on', i <= x + 0.02); it.classList.toggle('is-current', i === cur); });
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
