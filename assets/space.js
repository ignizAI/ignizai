/* =====================================================================
   IgnizAI — deep-sky backdrop for the home-page statement / quiz section
   (#growth-quiz).

   Rendered to look photographic rather than illustrated:
   - star field with a real magnitude distribution and stellar colours,
     a faint Milky Way band with dust lanes, a few bright stars with
     soft bloom and fine diffraction spikes
   - two galaxies built from thousands of particles (one spiral, one edge-on)
   - two planets ray-shaded per pixel from procedural textures: a banded
     gas giant and a ringed giant with Cassini division, ring shadow on
     the globe and the globe's shadow on the rings; both rotate slowly
   - small shaded asteroids, meteors from a common radiant, and a rare
     comet whose green coma and twin tails always point away from the sun
   - constellations use real star positions (RA/Dec, magnitude, colour).
     The stars are always in the sky; click / tap the sky (or the
     "Reveal constellations" button) to trace the figures like a star atlas.

   Calm by design: ~30 fps, long gaps between events, pauses off screen
   and in background tabs; reduced-motion users get a still sky.
   ===================================================================== */
(function () {
  'use strict';
  var section = document.getElementById('growth-quiz');
  if (!section) return;
  /* Stars + constellations only. Set extras to true to bring back the planets,
     galaxies, asteroids, meteors and comet (all code is kept below). */
  var SHOW = { extras: false };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- DOM ---------- */
  var cv = document.createElement('canvas');
  cv.className = 'space-bg';
  cv.setAttribute('aria-hidden', 'true');
  section.insertBefore(cv, section.firstChild);
  var hint = document.createElement('button');
  hint.type = 'button';
  hint.className = 'space-hint';
  hint.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="17" r="1.6" fill="currentColor"/><circle cx="11" cy="9" r="1.6" fill="currentColor"/><circle cx="19" cy="5" r="1.6" fill="currentColor"/><circle cx="17" cy="15" r="1.2" fill="currentColor"/><path d="M5 17L11 9L19 5M11 9L17 15" stroke="currentColor" stroke-width=".9" opacity=".7"/></svg><span>Reveal constellations</span>';
  section.appendChild(hint);
  var ctx = cv.getContext('2d');

  /* ---------- maths helpers ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function R(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function gauss(rr) { var u = rr() || 1e-9, v = rr(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function h3(x, y, z, s) {
    var n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s, 1103515245);
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296;
  }
  function noise3(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    function L(a, b, t) { return a + (b - a) * t; }
    return L(L(L(h3(xi, yi, zi, s), h3(xi + 1, yi, zi, s), u), L(h3(xi, yi + 1, zi, s), h3(xi + 1, yi + 1, zi, s), u), v),
             L(L(h3(xi, yi, zi + 1, s), h3(xi + 1, yi, zi + 1, s), u), L(h3(xi, yi + 1, zi + 1, s), h3(xi + 1, yi + 1, zi + 1, s), u), v), w);
  }
  function fbm(x, y, z, s, oct) { var a = 0.5, f = 1, t = 0, n = 0; for (var i = 0; i < oct; i++) { t += a * noise3(x * f, y * f, z * f, s + i); n += a; a *= 0.5; f *= 2.03; } return t / n; }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

  /* stellar colours by spectral class (approximate blackbody tints) */
  var SPEC = { b: [196, 212, 255], a: [222, 230, 255], w: [248, 247, 255], f: [255, 248, 236], g: [255, 238, 214], k: [255, 214, 170], m: [255, 186, 132] };
  function starTint(rr) { var p = rr(); return p < 0.10 ? SPEC.b : p < 0.30 ? SPEC.a : p < 0.62 ? SPEC.w : p < 0.80 ? SPEC.f : p < 0.90 ? SPEC.g : p < 0.97 ? SPEC.k : SPEC.m; }

  /* light comes from the upper left, a little in front (screen y points down) */
  var SUN = (function () { var x = -0.62, y = -0.42, z = 0.66, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();

  /* ---------- sprites built once ---------- */
  var GLOW = (function () {                                        /* soft stellar bloom */
    var c = mkCanvas(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.08, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  })();

  /* ---------- planet textures (equirectangular, generated once) ---------- */
  function makeTexture(kind) {
    var TW = 256, TH = 128, img = new Uint8ClampedArray(TW * TH * 3);
    var jup = [[0, [190, 178, 160]], [0.12, [168, 140, 112]], [0.22, [236, 226, 204]], [0.3, [178, 120, 82]], [0.38, [214, 188, 152]],
               [0.46, [242, 232, 212]], [0.54, [238, 226, 204]], [0.62, [160, 104, 70]], [0.7, [226, 206, 172]], [0.8, [188, 150, 112]],
               [0.9, [210, 196, 172]], [1, [170, 162, 148]]];
    var sat = [[0, [168, 166, 146]], [0.15, [196, 180, 140]], [0.3, [226, 206, 160]], [0.42, [212, 186, 132]], [0.5, [236, 218, 172]],
               [0.6, [218, 196, 146]], [0.72, [230, 212, 168]], [0.85, [200, 182, 140]], [1, [176, 172, 150]]];
    var pal = kind === 'jupiter' ? jup : sat;
    function sample(t) {
      t = clamp(t, 0, 1);
      for (var i = 1; i < pal.length; i++) if (t <= pal[i][0]) {
        var a = pal[i - 1], b = pal[i], k = (t - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k];
      }
      return pal[pal.length - 1][1];
    }
    var turb = kind === 'jupiter' ? 0.05 : 0.018, seed = kind === 'jupiter' ? 41 : 77;
    for (var y = 0; y < TH; y++) {
      var lat = (y / (TH - 1)) * 2 - 1;
      for (var x = 0; x < TW; x++) {
        var th = x / TW * 6.2832, cx = Math.cos(th) * 1.6, sx = Math.sin(th) * 1.6;
        var warp = (fbm(cx, sx, lat * 6, seed, 4) - 0.5) * turb * 2;
        var streak = (fbm(cx * 3, sx * 3, lat * 40, seed + 9, 3) - 0.5);
        var c = sample(0.5 + 0.5 * (lat + warp));
        var k = 1 + streak * (kind === 'jupiter' ? 0.22 : 0.12);
        if (kind === 'saturn') {                                       /* longitudinal swirls + a pale storm so the spin reads */
          k *= 1 + (fbm(cx * 2.2, sx * 2.2, lat * 5, seed + 21, 3) - 0.5) * 0.22;
          var sdx = Math.atan2(Math.sin(th - 1.0), Math.cos(th - 1.0)) / 0.38, sdy = (lat + 0.42) / 0.06, sd = sdx * sdx + sdy * sdy;
          if (sd < 1.5) k *= 1 + smooth(1.5, 0.2, sd) * 0.22;
        }
        if (kind === 'jupiter') {                                        /* Great Red Spot */
          var dx = Math.atan2(Math.sin(th - 2.2), Math.cos(th - 2.2)) / 0.32, dy = (lat - 0.36) / 0.075;
          var d = dx * dx + dy * dy;
          if (d < 1.6) { var m = smooth(1.6, 0.3, d) * 0.85; c = [c[0] + (192 - c[0]) * m, c[1] + (104 - c[1]) * m, c[2] + (78 - c[2]) * m]; }
        }
        var pole = smooth(0.78, 1, Math.abs(lat)) * (kind === 'jupiter' ? 0.25 : 0.18);
        var o = (y * TW + x) * 3;
        img[o] = c[0] * k * (1 - pole) + 120 * pole; img[o + 1] = c[1] * k * (1 - pole) + 128 * pole; img[o + 2] = c[2] * k * (1 - pole) + 130 * pole;
      }
    }
    return { w: TW, h: TH, d: img };
  }
  var TEX = {};

  /* ray-shade a planet (and optional rings) into its own canvas */
  var RING_E = 0.30;                                                  /* ring opening angle (rad) */
  function ringProfile(rho) {                                         /* rho = radius / planet radius → opacity, brightness */
    if (rho < 1.24 || rho > 2.27) return null;
    if (rho < 1.53) return [0.16 + 0.04 * Math.sin(rho * 21), 0.62];   /* C ring, faint */
    if (rho < 1.95) return [0.74 + 0.1 * Math.sin(rho * 26) + 0.05 * Math.sin(rho * 57), 1.0];  /* B ring */
    if (rho < 2.03) return [0.06, 0.6];                                /* Cassini division */
    if (rho > 2.205 && rho < 2.222) return [0.05, 0.6];                /* Encke gap */
    return [0.56 + 0.06 * Math.sin(rho * 33), 0.88];                  /* A ring */
  }
  function makePlanet(kind, r, tilt) {
    var ring = kind === 'saturn', s = DPR;
    var ext = ring ? 2.32 : 1.04;
    var hw = Math.ceil(r * ext * s) + 2, hh = Math.ceil(r * (ring ? Math.max(1.04, 2.32 * Math.sin(RING_E)) : 1.04) * s) + 2;
    var c = mkCanvas(hw * 2, hh * 2), g = c.getContext('2d'), id = g.createImageData(c.width, c.height);
    var ct = Math.cos(-tilt), st = Math.sin(-tilt);                   /* sun direction in the planet's (untilted) frame */
    var L = [SUN[0] * ct - SUN[1] * st, SUN[0] * st + SUN[1] * ct, SUN[2]];
    return { kind: kind, r: r, tilt: tilt, c: c, g: g, id: id, hw: hw, hh: hh, L: L, ring: ring, rot: R(0, 6.28) };
  }
  function renderPlanet(p) {
    var tex = TEX[p.kind] || (TEX[p.kind] = makeTexture(p.kind));
    var d = p.id.data, Wc = p.c.width, Hc = p.c.height, rr = p.r * DPR, L = p.L, se = Math.sin(RING_E), ce = Math.cos(RING_E);
    var N = [0, ce, -se];                                             /* ring-plane normal */
    var LN = L[0] * N[0] + L[1] * N[1] + L[2] * N[2];
    for (var j = 0; j < Hc; j++) {
      var y = (j + 0.5 - p.hh) / rr;
      for (var i = 0; i < Wc; i++) {
        var x = (i + 0.5 - p.hw) / rr, o = (j * Wc + i) * 4;
        var R2 = x * x + y * y, cr = 0, cg = 0, cb = 0, ca = 0;
        /* ring sample at this pixel */
        var ringA = 0, ringC = 0, ringFront = false;
        if (p.ring) {                                                 /* 2×2 supersampled for smooth ring edges */
          var aS = 0, cS = 0, fS = 0;
          for (var sub = 0; sub < 4; sub++) {
            var sxp = x + ((sub & 1) - 0.5) * 0.5 / rr, syp = y + ((sub >> 1) - 0.5) * 0.5 / rr;
            var w = -syp / se, rho = Math.sqrt(sxp * sxp + w * w), pr = ringProfile(rho);
            if (!pr) continue;
            var Z = -w * ce, front = Z > 0;
            if (!front && sxp * sxp + syp * syp <= 1) continue;      /* hidden behind the globe */
            var b = sxp * L[0] + syp * L[1] + Z * L[2], cc = sxp * sxp + syp * syp + Z * Z - 1, disc = b * b - cc;
            var shadow = disc > 0 && (-b - Math.sqrt(disc)) > 0 ? 0.12 : 1;   /* globe's shadow on the rings */
            aS += pr[0]; cS += pr[0] * pr[1] * shadow * (0.55 + 0.45 * Math.abs(LN)); if (front) fS++;
          }
          if (aS > 0) { ringA = aS / 4; ringC = cS / aS; ringFront = fS > 0; }
        }
        if (R2 < 1.02) {                                              /* globe */
          var edge = clamp((1 - Math.sqrt(R2)) * rr + 0.5, 0, 1);
          if (edge > 0) {
            var nz = Math.sqrt(Math.max(0, 1 - R2)), nx = x, ny = y;
            var lat = Math.asin(clamp(-ny, -1, 1)), lon = Math.atan2(nx, nz) + p.rot;
            var u = ((lon / 6.2832) % 1 + 1) % 1 * tex.w, v = (0.5 - lat / Math.PI) * (tex.h - 1);
            var ui = u | 0, vi = v | 0, uf = u - ui, vf = v - vi, u2 = (ui + 1) % tex.w, v2 = Math.min(tex.h - 1, vi + 1);
            var a0 = (vi * tex.w + ui) * 3, a1 = (vi * tex.w + u2) * 3, a2 = (v2 * tex.w + ui) * 3, a3 = (v2 * tex.w + u2) * 3, td = tex.d;
            var tr = (td[a0] * (1 - uf) + td[a1] * uf) * (1 - vf) + (td[a2] * (1 - uf) + td[a3] * uf) * vf;
            var tg = (td[a0 + 1] * (1 - uf) + td[a1 + 1] * uf) * (1 - vf) + (td[a2 + 1] * (1 - uf) + td[a3 + 1] * uf) * vf;
            var tb = (td[a0 + 2] * (1 - uf) + td[a1 + 2] * uf) * (1 - vf) + (td[a2 + 2] * (1 - uf) + td[a3 + 2] * uf) * vf;
            var ndl = nx * L[0] + ny * L[1] + nz * L[2];
            var lit = smooth(-0.08, 0.35, ndl) * Math.pow(Math.max(ndl, 0.02), 0.55);
            var limb = 0.45 + 0.55 * Math.pow(nz, 0.45);
            var sh = 1;
            if (p.ring && Math.abs(LN) > 1e-3) {                       /* ring shadow on the globe */
              var t = -(nx * N[0] + ny * N[1] + nz * N[2]) / LN;
              if (t > 0) { var q0 = nx + L[0] * t, q1 = ny + L[1] * t, q2 = nz + L[2] * t, prs = ringProfile(Math.sqrt(q0 * q0 + q1 * q1 + q2 * q2)); if (prs) sh = 1 - prs[0] * 0.75; }
            }
            var k = lit * limb * sh * 1.08 + 0.012;
            var rim = Math.pow(1 - nz, 3) * Math.max(0, ndl + 0.2) * 0.35;
            cr = tr * k + 255 * rim * 0.9; cg = tg * k + 240 * rim * 0.9; cb = tb * k + 215 * rim * 0.9; ca = edge;
          }
        }
        if (ringA > 0 && (ringFront || ca === 0)) {                   /* composite ring over (or instead of) the globe */
          var rcR = 214 * ringC, rcG = 196 * ringC, rcB = 160 * ringC;
          cr = rcR * ringA + cr * (1 - ringA); cg = rcG * ringA + cg * (1 - ringA); cb = rcB * ringA + cb * (1 - ringA);
          ca = ringA + ca * (1 - ringA);
        }
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = ca * 255;
      }
    }
    p.g.putImageData(p.id, 0, 0);
  }

  /* ---------- particle galaxies ---------- */
  function makeGalaxy(size, incl, pa, seed, arms) {
    var S = Math.ceil(size * DPR), c = mkCanvas(S, S), g = c.getContext('2d'), rr = mulberry(seed), cx = S / 2;
    var ci = Math.cos(incl), cp = Math.cos(pa), sp = Math.sin(pa);
    function put(x, y, rad, col, a) { var X = x * cp - y * ci * sp, Y = x * sp + y * ci * cp; g.fillStyle = 'rgba(' + col + ',' + a + ')'; g.beginPath(); g.arc(cx + X * S * 0.5, cx + Y * S * 0.5, rad, 0, 6.2832); g.fill(); }
    g.globalCompositeOperation = 'lighter';
    /* exponential disk */
    for (var i = 0; i < 5200; i++) { var rad = -Math.log(1 - rr() * 0.985) * 0.17, an = rr() * 6.2832; put(Math.cos(an) * rad, Math.sin(an) * rad, (0.5 + rr() * 0.9) * DPR, '210,214,226', 0.03 + rr() * 0.035); }
    /* spiral arms: young blue stars + pink HII knots */
    if (arms) {
      var pitch = 0.32;
      for (var k = 0; k < 4200; k++) {
        var spur = rr() < 0.3, arm = k % 2, r1 = 0.06 + Math.pow(rr(), 0.75) * 0.8 * (spur ? 0.9 : 1);
        var th = Math.log(r1 / 0.06) / Math.tan(spur ? pitch * 1.4 : pitch) + arm * Math.PI + (spur ? 0.9 : 0) + gauss(rr) * (0.3 + r1 * 0.25);
        r1 *= 1 + gauss(rr) * 0.06;
        put(Math.cos(th) * r1, Math.sin(th) * r1, (0.45 + rr() * 0.8) * DPR, rr() < 0.04 ? '255,170,196' : '186,204,250', 0.035 + rr() * 0.07);
      }
    }
    /* bulge */
    for (var b = 0; b < 1400; b++) { var br = Math.abs(gauss(rr)) * 0.07, ba = rr() * 6.2832; put(Math.cos(ba) * br, Math.sin(ba) * br * (arms ? 1 : 1.6), (0.5 + rr() * 0.8) * DPR, '255,228,186', 0.05 + rr() * 0.07); }
    var core = g.createRadialGradient(cx, cx, 0, cx, cx, S * 0.07);
    core.addColorStop(0, 'rgba(255,236,200,0.42)'); core.addColorStop(1, 'rgba(255,236,200,0)');
    g.fillStyle = core; g.fillRect(0, 0, S, S);
    /* dust: inner edges of the arms, or the mid-plane lane of an edge-on disk */
    g.globalCompositeOperation = 'source-over';
    if (arms) {
      for (var q = 0; q < 900; q++) { var a2 = q % 2, r2 = 0.08 + Math.pow(rr(), 0.9) * 0.6, t2 = Math.log(r2 / 0.06) / Math.tan(0.32) + a2 * Math.PI - 0.28 + gauss(rr) * 0.08; put(Math.cos(t2) * r2, Math.sin(t2) * r2, (0.6 + rr()) * DPR, '8,22,16', 0.06); }
    } else {
      for (var e = 0; e < 700; e++) { var ex = gauss(rr) * 0.28, ey = gauss(rr) * 0.012; put(ex, ey / Math.max(ci, 0.05), (0.6 + rr()) * DPR, '8,22,16', 0.16 * Math.exp(-ex * ex * 8)); }
    }
    var out = mkCanvas(S, S), og = out.getContext('2d');
    if ('filter' in og) { og.filter = 'blur(' + (1.6 * DPR) + 'px)'; og.globalAlpha = 0.9; og.drawImage(c, 0, 0); og.filter = 'none'; og.globalAlpha = 0.45; }
    og.drawImage(c, 0, 0); og.globalAlpha = 1;
    return out;
  }

  /* ---------- asteroids: tiny lumpy rocks, shaded per pixel ---------- */
  function makeRock(rad, seed) {
    var S = Math.ceil(rad * 2.6 * DPR), c = mkCanvas(S, S), g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data, h = S / 2, rp = rad * DPR;
    for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
      var x = (i + 0.5 - h) / rp, y = (j + 0.5 - h) / rp, an = Math.atan2(y, x);
      var lump = 1 + (fbm(Math.cos(an) * 1.3, Math.sin(an) * 1.3, 0.5, seed, 3) - 0.5) * 0.7;
      var rr2 = Math.sqrt(x * x + y * y) / lump; if (rr2 >= 1) continue;
      var nz = Math.sqrt(1 - rr2 * rr2), nx = x / lump, ny = y / lump;
      var bump = fbm(x * 3, y * 3, seed, seed + 3, 3);
      var ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2] + (bump - 0.5) * 0.5);
      var al = 0.75 + 0.5 * bump, k = (ndl * 0.95 + 0.03) * al, o = (j * S + i) * 4;
      d[o] = 132 * k; d[o + 1] = 122 * k; d[o + 2] = 108 * k; d[o + 3] = clamp((1 - rr2) * rp, 0, 1) * 255;
    }
    g.putImageData(id, 0, 0); return c;
  }

  /* ---------- constellations: real positions (RA°, Dec°, magnitude, colour) ---------- */
  var CONST = [
    { name: 'Orion', slot: 'left', s: [
        ['Betelgeuse', 88.793, 7.407, 0.45, 'm'], ['Rigel', 78.634, -8.202, 0.18, 'b'], ['Bellatrix', 81.283, 6.350, 1.64, 'b'],
        ['', 83.002, -0.299, 2.25, 'b'], ['', 84.053, -1.202, 1.69, 'b'], ['', 85.190, -1.943, 1.74, 'b'],
        ['', 86.939, -9.670, 2.07, 'b'], ['', 83.784, 9.934, 3.39, 'b']],
      l: [[7, 0], [7, 2], [0, 2], [0, 5], [2, 3], [3, 4], [4, 5], [5, 6], [3, 1]] },
    { name: 'Ursa Major', slot: 'topR', s: [
        ['Dubhe', 165.932, 61.751, 1.79, 'k'], ['Merak', 165.460, 56.383, 2.37, 'a'], ['', 178.458, 53.695, 2.44, 'a'], ['', 183.857, 57.033, 3.31, 'a'],
        ['', 193.507, 55.960, 1.77, 'a'], ['Mizar', 200.981, 54.925, 2.27, 'a'], ['Alkaid', 206.885, 49.313, 1.86, 'b']],
      l: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
    { name: 'Cassiopeia', slot: 'topL', s: [
        ['', 2.295, 59.150, 2.28, 'f'], ['Schedar', 10.127, 56.537, 2.24, 'k'], ['', 14.177, 60.717, 2.15, 'b'], ['', 21.454, 60.235, 2.66, 'a'], ['', 28.599, 63.670, 3.35, 'b']],
      l: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { name: 'Cygnus', slot: 'right', s: [
        ['Deneb', 310.358, 45.280, 1.25, 'a'], ['', 305.557, 40.257, 2.23, 'f'], ['', 311.553, 33.970, 2.48, 'k'], ['', 296.244, 45.131, 2.87, 'b'],
        ['Albireo', 292.680, 27.960, 3.05, 'k'], ['', 318.234, 30.227, 3.20, 'g'], ['', 294.110, 53.370, 3.80, 'k']],
      l: [[0, 1], [1, 4], [3, 1], [1, 2], [2, 5], [3, 6]] },
    { name: 'Scorpius', slot: 'bottom', s: [
        ['Antares', 247.352, -26.432, 1.06, 'm'], ['', 241.359, -19.806, 2.62, 'b'], ['', 240.083, -22.622, 2.29, 'b'], ['', 239.713, -26.114, 2.89, 'b'],
        ['', 245.297, -25.593, 2.89, 'b'], ['', 248.971, -28.216, 2.82, 'b'], ['', 252.541, -34.293, 2.29, 'k'], ['', 252.968, -38.048, 3.00, 'b'],
        ['', 254.655, -42.362, 3.60, 'k'], ['', 258.038, -43.239, 3.30, 'f'], ['', 264.330, -42.998, 1.86, 'f'], ['', 266.896, -40.127, 3.00, 'f'],
        ['', 265.622, -39.030, 2.40, 'b'], ['Shaula', 263.402, -37.104, 1.62, 'b'], ['', 262.691, -37.296, 2.70, 'b']],
      l: [[1, 2], [2, 3], [2, 4], [4, 0], [0, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]] }
  ];
  /* gnomonic projection around each figure's centre, north up, east left */
  CONST.forEach(function (c) {
    var ra0 = 0, de0 = 0, sx = 0, sy = 0;
    c.s.forEach(function (s) { sx += Math.cos(s[1] * Math.PI / 180); sy += Math.sin(s[1] * Math.PI / 180); de0 += s[2]; });
    ra0 = Math.atan2(sy, sx); de0 = de0 / c.s.length * Math.PI / 180;
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    c.xy = c.s.map(function (s) {
      var ra = s[1] * Math.PI / 180, de = s[2] * Math.PI / 180, cosc = Math.sin(de0) * Math.sin(de) + Math.cos(de0) * Math.cos(de) * Math.cos(ra - ra0);
      var x = -Math.cos(de) * Math.sin(ra - ra0) / cosc, y = -(Math.cos(de0) * Math.sin(de) - Math.sin(de0) * Math.cos(de) * Math.cos(ra - ra0)) / cosc;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      return [x, y];
    });
    c.bw = maxX - minX; c.bh = maxY - minY;
    c.xy = c.xy.map(function (p) { return [p[0] - minX, p[1] - minY]; });
  });

  /* ---------- layout: keep figures, planets and galaxies in the free sky around the card ---------- */
  var W = 0, H = 0, DPR = 1;
  var sky = document.createElement('canvas'), sctx = sky.getContext('2d');
  var cardTop = 200, twinklers = [], brights = [], galaxies = [], planets = [], rocks = [], placed = [];

  function relRect(el) {
    if (!el) return null; var a = el.getBoundingClientRect(), b = section.getBoundingClientRect();
    return { l: a.left - b.left, t: a.top - b.top, r: a.right - b.left, b: a.bottom - b.top };
  }
  function layout() {
    var card = relRect(section.querySelector('.gq')) || { l: W * 0.1, t: H * 0.28, r: W * 0.9, b: H * 0.86 };
    var head = relRect(section.querySelector('.statement__text'));
    var hb = relRect(hint);
    var narrow = W < 720, pad = 12, slots = {};
    var topB = head && head.t - 18 > 70 ? head.t - 18 : card.t - 14;
    var x0 = narrow ? W * 0.04 : W * 0.2, x1 = narrow ? W * 0.96 : W * 0.86, mid = narrow ? W * 0.5 : W * 0.5;
    slots.topL = { l: x0, t: pad, r: mid - 10, b: topB };
    slots.topR = { l: mid + 10, t: pad, r: x1, b: topB };
    slots.left = { l: pad, t: card.t + (card.b - card.t) * 0.22, r: card.l - 16, b: card.b - 10 };
    slots.right = { l: card.r + 16, t: card.t + 4, r: W - pad, b: card.t + (card.b - card.t) * 0.5 };
    slots.bottom = { l: Math.max(hb ? hb.r + 24 : 0, W * 0.42), t: card.b + 12, r: W - pad, b: H - pad };
    placed = [];
    CONST.forEach(function (c) {
      var s = slots[c.slot]; if (!s) return;
      var bw = s.r - s.l, bh = s.b - s.t - 16;                        /* 16px reserved for the label */
      if (bw < 70 || bh < 50) return;
      var k = Math.min(bw / c.bw, bh / c.bh, 300 / Math.max(c.bw, c.bh));
      if (Math.max(c.bw, c.bh) * k < 60) return;
      var ox = s.l + (bw - c.bw * k) / 2, oy = s.t + (bh - c.bh * k) / 2;
      placed.push({ c: c, P: c.xy.map(function (p) { return [ox + p[0] * k, oy + p[1] * k]; }), ph: Math.random() * 6.28 });
    });
    return { card: card, narrow: narrow, hint: hb };
  }

  function build() {
    var rect = section.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(rect.width)); H = Math.max(1, Math.round(rect.height));
    cv.width = sky.width = Math.round(W * DPR); cv.height = sky.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var rr = mulberry(7), lay = layout(), unit = Math.min(W, H);
    cardTop = lay.card.t;

    /* deep forest-green sky */
    var g = sctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#163327'); g.addColorStop(0.6, '#10281E'); g.addColorStop(1, '#091811');
    sctx.fillStyle = g; sctx.fillRect(0, 0, W, H);

    /* Milky Way: faint diagonal band with dust lanes (low-res noise, smoothly upscaled) */
    var q = 4, mw = mkCanvas(W / q, H / q), mg = mw.getContext('2d'), id = mg.createImageData(mw.width, mw.height), md = id.data;
    var ax = 1 / Math.hypot(1, 0.62), ay = -0.62 * ax;                /* band runs lower-left → upper-right */
    for (var j = 0; j < mw.height; j++) for (var i = 0; i < mw.width; i++) {
      var X = i * q / unit, Y = j * q / unit, cxv = X - W / unit * 0.5, cyv = Y - H / unit * 0.5;
      var across = cxv * -ay + cyv * ax, along = cxv * ax + cyv * ay;
      var n = fbm(along * 2.2, across * 2.2, 0.3, 5, 5), n2 = fbm(along * 5, across * 7, 1.7, 15, 4);
      var band = Math.exp(-Math.pow(across / (0.20 + 0.05 * n), 2)) * (0.35 + 0.9 * n);
      var lane = Math.exp(-Math.pow((across - 0.02 - (n2 - 0.5) * 0.12) / 0.03, 2)) * smooth(0.35, 0.65, n2);
      var dens = clamp(band * (1 - lane * 0.85), 0, 1), o = (j * mw.width + i) * 4;
      md[o] = 226; md[o + 1] = 222; md[o + 2] = 196; md[o + 3] = dens * 30;
    }
    mg.putImageData(id, 0, 0);
    sctx.imageSmoothingEnabled = true; sctx.drawImage(mw, 0, 0, W, H);

    /* star field: magnitude power law, many faint, few bright */
    twinklers = []; brights = [];
    var count = Math.round(W * H / 700);
    for (var s = 0; s < count; s++) {
      var x = rr() * W, y = rr() * H;
      var cxv2 = x / unit - W / unit * 0.5, cyv2 = y / unit - H / unit * 0.5, acr = cxv2 * -ay + cyv2 * ax;
      if (Math.exp(-Math.pow(acr / 0.22, 2)) < rr() * 0.9 && rr() < 0.35) continue;   /* thicker toward the band */
      var mag = Math.pow(rr(), 3.2), tint = starTint(rr);
      var a = 0.18 + mag * 0.8, rad = 0.35 + mag * 0.9;
      if (mag > 0.3) { twinklers.push({ x: x, y: y, r: rad, a: a, c: tint, ph: rr() * 6.28, sp: 0.7 + rr() * 1.8, col: 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' }); continue; }
      sctx.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + a + ')';
      if (rad < 0.7) sctx.fillRect(x, y, rad * 1.4, rad * 1.4);
      else { sctx.beginPath(); sctx.arc(x, y, rad, 0, 6.2832); sctx.fill(); }
    }
    /* a handful of bright field stars with bloom (+ fine spikes on the brightest) */
    for (var b = 0; b < Math.round(W * H / 160000) + 3; b++) brights.push({ x: rr() * W, y: rr() * H, m: 0.5 + rr() * 0.5, c: starTint(rr), spike: b < 3 });

    galaxies = []; planets = []; rocks = []; comet = null;
    if (SHOW.extras) {
    /* galaxies */
    var gS = clamp(unit * 0.22, 90, 200);
    var gS1 = lay.narrow ? gS * 0.7 : gS;
    galaxies.push({ img: makeGalaxy(gS1, 0, 0, 3, true), S: gS1, x: lay.narrow ? W * 0.84 : W * 0.93, y: lay.narrow ? lay.card.b + (H - lay.card.b) * 0.5 : Math.max(gS * 0.3, lay.card.t * 0.45),
                    incl: 0.95, pa: -0.5, spin: 0.05, a: 0.9 });               /* ~2 min per turn */
    var eS = clamp(unit * 0.17, 80, 160);
    if (!lay.narrow) galaxies.push({ img: makeGalaxy(eS, 0, 0, 11, true), S: eS, x: W * 0.32, y: lay.card.b + (H - lay.card.b) * 0.55,
                    incl: 1.2, pa: 0.35, spin: -0.04, a: 0.8 });

    /* planets */
    var rs = clamp(unit * 0.034, 15, 34), rj = clamp(unit * 0.02, 9, 20);
    planets = [makePlanet('saturn', rs, -0.42), makePlanet('jupiter', rj, 0.05)];
    planets[0].x = lay.narrow ? W - rs * 0.7 : (lay.card.r + W) / 2 + rs * 0.2; planets[0].y = lay.card.t + (lay.card.b - lay.card.t) * 0.72;
    planets[1].x = lay.narrow ? rj * 0.9 : Math.max(rj * 1.6, lay.card.l * 0.5); planets[1].y = lay.card.t + (lay.card.b - lay.card.t) * 0.1;
    planets.forEach(renderPlanet);

    /* asteroids */
    rocks = [];
    for (var k = 0; k < 3; k++) rocks.push(newRock(true));
    placeComet(lay);
    }
  }
  function newRock(anywhere) {
    var rad = R(2.2, 4.2), img = makeRock(rad, (Math.random() * 1000) | 0);
    return { img: img, S: img.width / DPR, x: anywhere ? R(0, W) : -20, y: R(H * 0.05, H * 0.95), vx: R(3, 8), vy: R(-1.5, 1.5), rot: R(0, 6.28), vr: R(-0.25, 0.25), a: R(0.55, 0.85) };
  }

  /* ---------- reveal state ---------- */
  var reveal = 0, revealTarget = 0, revealTimer = 0;
  function setReveal(on) {
    revealTarget = on ? 1 : 0;
    hint.classList.toggle('is-on', on);
    section.classList.toggle('is-stargazing', on);
    hint.setAttribute('aria-pressed', on ? 'true' : 'false');
    kick();
  }
  function toggleReveal() {
    clearTimeout(revealTimer);
    layout();
    setReveal(!revealTarget);
    if (revealTarget) revealTimer = setTimeout(function () { setReveal(false); }, 10000);   /* fade away after 10s */
  }

  function drawStar(x, y, mag, c, alpha, spike) {                   /* mag: 0 faint … 1 brilliant */
    var s = 8 + mag * 22;
    ctx.globalAlpha = Math.min(1, alpha * (0.5 + mag * 0.5));
    ctx.drawImage(tinted(c), x - s / 2, y - s / 2, s, s);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,' + alpha * 0.95 + ')';
    ctx.beginPath(); ctx.arc(x, y, 0.75 + mag * 1.1, 0, 6.2832); ctx.fill();
    if (spike) {
      var len = 6 + mag * 12;
      ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha * 0.32 + ')'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x + len, y); ctx.moveTo(x, y - len); ctx.lineTo(x, y + len); ctx.stroke();
    }
  }
  var tintCache = {};
  function tinted(c) {
    var key = c.join(','); if (tintCache[key]) return tintCache[key];
    var t = mkCanvas(64, 64), g = t.getContext('2d');
    g.drawImage(GLOW, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(' + key + ')'; g.fillRect(0, 0, 64, 64);
    return (tintCache[key] = t);
  }

  function drawConstellations(a, t) {
    /* the stars themselves are always there */
    placed.forEach(function (pc) {
      pc.c.s.forEach(function (s, i) {
        var m = clamp((3.9 - s[3]) / 3.6, 0, 1), tw = reduce ? 1 : 0.76 + 0.16 * Math.sin(t * (1.1 + i * 0.13) + pc.ph + i) + 0.08 * Math.sin(t * 2.9 + i);
        drawStar(pc.P[i][0], pc.P[i][1], 0.15 + m * 0.75, SPEC[s[4]], (0.7 + m * 0.3) * tw, false);
      });
    });
    if (a <= 0.01) return;
    ctx.save();
    ctx.lineCap = 'round';
    placed.forEach(function (pc, ci) {
      var k = clamp(a * 1.5 - ci * 0.1, 0, 1); if (k <= 0) return;
      var c = pc.c, P = pc.P, n = c.l.length;
      ctx.lineWidth = 0.75; ctx.strokeStyle = 'rgba(214,226,206,' + 0.36 * Math.min(1, k * 1.4) + ')';
      c.l.forEach(function (ln, li) {                                /* segments draw in one after another, with gaps at the stars */
        var lk = clamp(k * n - li, 0, 1); if (lk <= 0) return;
        var p = P[ln[0]], q = P[ln[1]], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy), gap = 5;
        if (len < gap * 2 + 2) return;
        var ux = dx / len, uy = dy / len, sx = p[0] + ux * gap, sy = p[1] + uy * gap, el = (len - gap * 2) * lk;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + ux * el, sy + uy * el); ctx.stroke();
      });
      /* labels: figure name in the site serif, a couple of star names in small sans */
      var minX = 1e9, maxY = -1e9; P.forEach(function (p) { minX = Math.min(minX, p[0]); maxY = Math.max(maxY, p[1]); });
      ctx.globalAlpha = smooth(0.4, 1, k);
      ctx.fillStyle = 'rgba(228,198,120,0.85)'; ctx.font = 'italic 400 13px Fraunces, Georgia, serif';
      ctx.fillText(c.name, clamp(minX, 8, W - 90), Math.min(H - 6, maxY + 17));
      ctx.fillStyle = 'rgba(214,226,206,0.55)'; ctx.font = '400 9.5px Inter, system-ui, sans-serif';
      c.s.forEach(function (s, i) {
        if (!s[0] || s[3] >= 2.0) return;
        var tw2 = ctx.measureText(s[0]).width, nx = P[i][0] + 7, ny = P[i][1] + 3;
        if (nx + tw2 > W - 6) nx = P[i][0] - 7 - tw2;
        ctx.fillText(s[0], nx, clamp(ny, 10, H - 4));
      });
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  /* ---------- transient events ---------- */
  var meteors = [], comet = null, nextMeteor = 0;
  function spawnMeteor(now) {
    var rx = -0.15 * W, ry = -0.25 * H;                               /* shower radiant, off screen upper-left */
    var sx = R(W * 0.15, W * 0.95), sy = R(0, H * 0.55), dx = sx - rx, dy = sy - ry, l = Math.hypot(dx, dy), sp = R(900, 1400);
    meteors.push({ x: sx, y: sy, vx: dx / l * sp, vy: dy / l * sp, life: 0, max: R(0.35, 0.75), len: R(90, 180), train: Math.random() < 0.3, pts: [] });
    nextMeteor = now + R(7000, 14000);
  }
  /* A comet is drawn the way it looks in a long-exposure photo: it hangs
     still in the sky (comets don't visibly move), with a soft coma, a broad
     curved dust tail and a faint straight ion tail, pointing away from the sun. */
  function makeComet(Lt) {
    var Hh = Lt * 0.5, c = mkCanvas((Lt + 30) * DPR, Hh * DPR), g = c.getContext('2d'), hx = 14, cy = Hh * 0.38;
    var raw = mkCanvas(c.width, c.height), r = raw.getContext('2d');
    r.scale(DPR, DPR);
    /* dust tail: a curved, widening fan filled with a fading gradient */
    var dg = r.createLinearGradient(hx, cy, hx + Lt, cy + Lt * 0.18);
    dg.addColorStop(0, 'rgba(255,246,226,0.55)'); dg.addColorStop(0.25, 'rgba(255,242,218,0.22)'); dg.addColorStop(1, 'rgba(255,240,214,0)');
    r.fillStyle = dg; r.beginPath(); r.moveTo(hx, cy - 1.2);
    r.quadraticCurveTo(hx + Lt * 0.5, cy - Lt * 0.02, hx + Lt, cy - Lt * 0.01);
    r.lineTo(hx + Lt * 0.92, cy + Lt * 0.30);
    r.quadraticCurveTo(hx + Lt * 0.45, cy + Lt * 0.12, hx, cy + 1.2); r.closePath(); r.fill();
    /* ion tail: straight, narrow, faint blue */
    var ig = r.createLinearGradient(hx, cy, hx + Lt, cy - Lt * 0.04);
    ig.addColorStop(0, 'rgba(170,200,255,0.35)'); ig.addColorStop(1, 'rgba(170,200,255,0)');
    r.strokeStyle = ig; r.lineWidth = 1.4; r.beginPath(); r.moveTo(hx, cy); r.lineTo(hx + Lt, cy - Lt * 0.04); r.stroke();
    /* coma */
    var cg = r.createRadialGradient(hx, cy, 0, hx, cy, 9);
    cg.addColorStop(0, 'rgba(236,255,240,0.9)'); cg.addColorStop(0.3, 'rgba(196,236,212,0.35)'); cg.addColorStop(1, 'rgba(170,225,195,0)');
    r.fillStyle = cg; r.beginPath(); r.arc(hx, cy, 9, 0, 6.2832); r.fill();
    /* soften everything like a photograph, then add a crisp nucleus */
    if ('filter' in g) { g.filter = 'blur(' + (2.2 * DPR) + 'px)'; g.drawImage(raw, 0, 0); g.filter = 'none'; g.globalAlpha = 0.35; }
    g.drawImage(raw, 0, 0); g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,250,0.95)'; g.beginPath(); g.arc(hx * DPR, cy * DPR, 1.1 * DPR, 0, 6.2832); g.fill();
    return { img: c, w: Lt + 30, h: Hh, hx: hx, hy: cy };
  }
  function placeComet(lay) {
    var Lt = lay.narrow ? 60 : clamp(W * 0.085, 70, 125);
    comet = { spr: makeComet(Lt), narrow: lay.narrow, top: lay.card.t, active: false, next: comet ? comet.next : 0, ph: Math.random() * 6.28 };
  }
  function startComet(now) {
    var c = comet;
    c.x0 = W * (c.narrow ? 0.98 : 0.68); c.x1 = W * (c.narrow ? 0.02 : 0.05);
    c.y0 = Math.max(14, c.top * (c.narrow ? 0.08 : 0.3)); c.rise = c.narrow ? 6 : 22;
    c.dur = (c.x0 - c.x1) / (c.narrow ? 10 : 17) * 1000;            /* ~45 s across a desktop screen */
    c.t0 = now; c.active = true;
  }

  /* ---------- frame ---------- */
  var glint = null, last = 0, raf = 0, visible = false, t0 = performance.now(), planetTick = 0;
  var ANTI = Math.atan2(-SUN[1], -SUN[0]);                           /* comet tails point away from the sun */
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (now - last < 32 && !reduce) { raf = requestAnimationFrame(frame); return; }   /* ~30 fps */
    var dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    var t = (now - t0) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(sky, 0, 0, W, H);

    /* galaxies — slow rotation in their own (inclined) disk plane */
    galaxies.forEach(function (gx) {
      ctx.save(); ctx.globalAlpha = gx.a; ctx.translate(gx.x, gx.y); ctx.rotate(gx.pa); ctx.scale(1, Math.cos(gx.incl));
      ctx.rotate(reduce ? 0 : t * gx.spin); ctx.drawImage(gx.img, -gx.S / 2, -gx.S / 2, gx.S, gx.S); ctx.restore();
    });

    /* scintillating stars */
    for (var i = 0; i < twinklers.length; i++) {
      var s = twinklers[i];
      var a = Math.min(1, s.a * (reduce ? 1 : 0.55 + 0.45 * (0.6 * Math.sin(t * s.sp + s.ph) + 0.4 * Math.sin(t * s.sp * 2.7 + s.ph * 1.7))) * 1.15);
      ctx.fillStyle = s.col + a + ')';
      if (s.r < 0.75) ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      else { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }
    }
    /* every few seconds one star briefly glints */
    if (!reduce && twinklers.length) {
      if (!glint || now > glint.t + 900) { if (!glint || now > glint.t + glint.gap) glint = { s: twinklers[(Math.random() * twinklers.length) | 0], t: now, gap: R(2500, 6000) }; }
      var gp = (now - glint.t) / 900;
      if (gp < 1) { var gs = glint.s, gk = Math.sin(gp * Math.PI); drawStar(gs.x, gs.y, 0.35 + 0.3 * gk, gs.c, 0.9 * gk, gk > 0.5); }
    }
    brights.forEach(function (b, bi) { drawStar(b.x, b.y, b.m, b.c, reduce ? 0.9 : 0.66 + 0.22 * Math.sin(t * 1.1 + bi * 2.3) + 0.1 * Math.sin(t * 3.4 + bi), b.spike); });

    /* planets — slow rotation, re-shaded a few times a second */
    if (!reduce && now - planetTick > 66) { var pdt = Math.min(0.25, (now - planetTick) / 1000); planetTick = now; planets.forEach(function (p) { p.rot += (p.kind === 'jupiter' ? 0.16 : 0.115) * pdt; renderPlanet(p); }); }
    planets.forEach(function (p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.tilt);
      ctx.drawImage(p.c, -p.hw / DPR, -p.hh / DPR, p.c.width / DPR, p.c.height / DPR); ctx.restore();
    });

    /* comet — glides slowly across the upper sky, fades in and out, tail gently flickers */
    if (comet) {
      var cm = comet, cs = cm.spr, cp = 0.5, fade = 0.6;
      if (!reduce) {
        if (!cm.active) { if (!cm.next) cm.next = now + 2500; if (now > cm.next) startComet(now); }
        if (cm.active) {
          cp = (now - cm.t0) / cm.dur;
          if (cp >= 1) { cm.active = false; cm.next = now + R(12000, 22000); }
          fade = smooth(0, 0.1, cp) * (1 - smooth(0.88, 1, cp));
        } else fade = 0;
      } else { cm.x0 = W * 0.4; cm.x1 = W * 0.4; cm.y0 = Math.max(14, cm.top * 0.3); cm.rise = 0; }
      if (fade > 0.01) {
        var cx = cm.x0 + (cm.x1 - cm.x0) * cp, cy = cm.y0 - cm.rise * cp;
        var flick = reduce ? 1 : 1 + 0.10 * Math.sin(t * 1.3 + cm.ph) + 0.05 * Math.sin(t * 3.7);
        var stretch = reduce ? 1 : 1 + 0.05 * Math.sin(t * 0.8 + cm.ph);
        ctx.save(); ctx.globalAlpha = clamp(0.62 * fade * flick, 0, 1);
        ctx.translate(cx, cy); ctx.rotate(ANTI); ctx.scale(stretch, 1);
        ctx.drawImage(cs.img, -cs.hx, -cs.hy, cs.w, cs.h); ctx.restore();
      }
    }

    /* asteroids */
    rocks.forEach(function (a, i) {
      if (!reduce) { a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; }
      if (a.x > W + 20 || a.y < -20 || a.y > H + 20) rocks[i] = newRock(false);
      ctx.save(); ctx.globalAlpha = a.a; ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.drawImage(a.img, -a.S / 2, -a.S / 2, a.S, a.S); ctx.restore();
    });

    if (!reduce) {
      /* meteors */
      if (!nextMeteor) nextMeteor = now + R(3000, 6000);
      if (SHOW.extras && now > nextMeteor) spawnMeteor(now);
      meteors = meteors.filter(function (m) {
        m.life += dt;
        var live = m.life < m.max;
        if (live) { m.x += m.vx * dt; m.y += m.vy * dt; }
        var p = Math.min(1, m.life / m.max), k = live ? Math.pow(Math.sin(p * Math.PI), 0.7) : 0, sp = Math.hypot(m.vx, m.vy);
        var tl = m.len * (0.4 + 0.6 * Math.min(1, p * 3)), tx = m.x - m.vx / sp * tl, ty = m.y - m.vy / sp * tl;
        if (live) {
          var mg = ctx.createLinearGradient(m.x, m.y, tx, ty);
          mg.addColorStop(0, 'rgba(240,255,244,' + 0.85 * k + ')'); mg.addColorStop(0.15, 'rgba(255,246,222,' + 0.45 * k + ')'); mg.addColorStop(1, 'rgba(255,246,222,0)');
          ctx.strokeStyle = mg; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          if (m.train) { m.tx = tx; m.ty = ty; m.hx = m.x; m.hy = m.y; }
        }
        if (m.train && !live && m.hx != null) {                       /* faint persistent train */
          var f = 1 - (m.life - m.max) / 1.4;
          if (f > 0) { ctx.strokeStyle = 'rgba(180,230,210,' + 0.12 * f + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.hx, m.hy); ctx.lineTo(m.tx, m.ty); ctx.stroke(); return true; }
          return false;
        }
        return live;
      });
    }

    /* constellations */
    reveal += (revealTarget - reveal) * Math.min(1, dt * (reduce ? 10 : 1.6));
    drawConstellations(reveal, t);

    var settling = Math.abs(revealTarget - reveal) > 0.005;
    if (!reduce || settling) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }

  /* ---------- wiring ---------- */
  build();
  var rto = 0;
  function rebuild() { clearTimeout(rto); rto = setTimeout(function () { build(); kick(); }, 120); }
  var ro = 'ResizeObserver' in window ? new ResizeObserver(rebuild) : null;
  if (ro) { ro.observe(section); var gq = section.querySelector('.gq'); if (gq) ro.observe(gq); } else window.addEventListener('resize', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  if ('IntersectionObserver' in window) {
    var settled = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { kick(); if (!settled) { settled = true; setTimeout(rebuild, 1400); } } }).observe(section);
  } else { visible = true; kick(); }
  document.addEventListener('visibilitychange', kick);

  /* click / tap on empty sky (not on the quiz card, links or buttons) reveals constellations */
  section.addEventListener('click', function (e) {
    if (e.target.closest('.gq, a, button, input, select, textarea, label, .gq-modal')) return;
    toggleReveal();
  });
  hint.addEventListener('click', function (e) { e.stopPropagation(); toggleReveal(); });
  hint.setAttribute('aria-pressed', 'false');

  if (window.IgnizAII18n && window.IgnizAII18n.extend) window.IgnizAII18n.extend({ 'Reveal constellations': 'اكشف الأبراج النجمية' });
})();
