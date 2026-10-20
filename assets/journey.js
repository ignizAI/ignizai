/* =====================================================================
   IgnizAI — Process page: scroll-driven journey (#journey)
   A winding gold path links the five stages. As the visitor scrolls,
   the path draws itself, a glowing marker travels along it, and each
   stage's icon and card light up when the marker reaches it. Everything
   is tied to scroll position, so scrolling back up rewinds the journey.
   Reduced motion: the whole journey is shown, fully lit, without motion.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('journey');
  if (!root) return;
  var svg = root.querySelector('.journey__svg'), track = root.querySelector('.journey__track'),
      fill = root.querySelector('.journey__fill'), marker = root.querySelector('.journey__marker'),
      steps = [].slice.call(root.querySelectorAll('.jstep')), nodes = steps.map(function (s) { return s.querySelector('.jstep__node'); });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEN = 0, FR = [], raf = 0;

  /* Build a smooth winding path through the centre of every node */
  function build() {
    var r = root.getBoundingClientRect();
    svg.setAttribute('width', r.width); svg.setAttribute('height', r.height);
    svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
    var pts = nodes.map(function (n) {
      var b = n.getBoundingClientRect();
      return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top];
    });
    if (!pts.length) return;
    var startY = Math.max(0, pts[0][1] - 90), endY = Math.min(r.height, pts[pts.length - 1][1] + 90);
    var d = 'M' + pts[0][0] + ' ' + startY + ' L' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], my = (a[1] + b[1]) / 2;
      d += ' C' + a[0] + ' ' + my + ' ' + b[0] + ' ' + my + ' ' + b[0] + ' ' + b[1];
    }
    d += ' L' + pts[pts.length - 1][0] + ' ' + endY;
    track.setAttribute('d', d); fill.setAttribute('d', d);
    LEN = fill.getTotalLength();
    fill.style.strokeDasharray = LEN + ' ' + LEN;
    /* where along the path each node sits (0…1) */
    FR = pts.map(function (p) {
      var best = 0, bd = 1e9;
      for (var s = 0; s <= 400; s++) {
        var q = fill.getPointAtLength(LEN * s / 400), dd = Math.abs(q.x - p[0]) + Math.abs(q.y - p[1]);
        if (dd < bd) { bd = dd; best = s / 400; }
      }
      return best;
    });
    update();
  }

  /* Scroll position → journey progress (works the same scrolling down or up) */
  function update() {
    raf = 0;
    if (!LEN) return;
    var r = root.getBoundingClientRect(), vh = window.innerHeight;
    var p;
    if (reduce) p = 1;
    else {
      /* the marker sits at ~60% of the viewport height */
      var focus = vh * 0.6, y = focus - r.top;
      var pt0 = fill.getPointAtLength(0).y, pt1 = fill.getPointAtLength(LEN).y;
      /* convert the focus line to a length along the path by searching the (monotonic in y) path */
      if (y <= pt0) p = 0;
      else if (y >= pt1) p = 1;
      else {
        var lo = 0, hi = LEN;
        for (var k = 0; k < 18; k++) { var mid = (lo + hi) / 2; if (fill.getPointAtLength(mid).y < y) lo = mid; else hi = mid; }
        p = lo / LEN;
      }
    }
    fill.style.strokeDashoffset = LEN * (1 - p);
    var m = fill.getPointAtLength(LEN * p);
    marker.style.transform = 'translate(' + m.x + 'px,' + m.y + 'px)';
    marker.classList.toggle('is-on', p > 0.001 && p < 0.999);
    var current = -1;
    steps.forEach(function (s, i) {
      var on = p >= FR[i] - 0.004;
      s.classList.toggle('is-active', on);
      if (on) current = i;
    });
    steps.forEach(function (s, i) { s.classList.toggle('is-current', i === current); });
    root.style.setProperty('--journey-p', p.toFixed(3));
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }

  build();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { build(); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(function () { build(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.addEventListener('load', build);
})();
