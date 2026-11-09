/* Zerosolved reel engine.
 * Every motion is a paused Web Animation or a "ticker" function of time,
 * so window.__seek(t) renders any frame deterministically. */
(() => {
  const anims = [];
  const tickers = [];
  let scenes = [];
  let DATA = null;

  const EASE = "cubic-bezier(.2,.8,.2,1)";
  const EASE_IN = "cubic-bezier(.5,0,.75,0)";

  // ---------- helpers ----------
  function h(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  /** Markup: [lime words]  {orange words}  **bold**  \n = line break */
  function md(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]/g, '<span class="lime">$1</span>')
      .replace(/\{([^}]+)\}/g, '<span class="orange">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
  }
  /** Split markup into [{text, cls}] segments (only lime/orange). */
  function segments(s) {
    const out = [];
    const re = /\[([^\]]+)\]|\{([^}]+)\}|([^[{]+)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1] != null) out.push({ text: m[1], cls: "lime" });
      else if (m[2] != null) out.push({ text: m[2], cls: "orange" });
      else out.push({ text: m[3], cls: "" });
    }
    return out;
  }
  function icon(name) {
    return (DATA.icons && DATA.icons[name]) || DATA.icons.check || "";
  }
  /** Animate el. The first animation on an element fills both ways; later ones only forwards. */
  function A(el, keyframes, at, dur, easing = EASE) {
    const a = el.animate(keyframes, {
      duration: Math.max(1, dur * 1000),
      delay: at * 1000,
      fill: el.__animated ? "forwards" : "both",
      easing,
    });
    a.pause();
    el.__animated = true;
    anims.push(a);
    return a;
  }
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);

  function rise(el, at, dur = 0.65, dist = 36) {
    A(el, [{ opacity: 0, transform: `translateY(${dist}px)` }, { opacity: 1, transform: "none" }], at, dur);
  }
  function pop(el, at, dur = 0.65) {
    A(el, [{ opacity: 0, transform: "translateY(24px) scale(.97)" }, { opacity: 1, transform: "none" }], at, dur);
  }
  function slideIn(el, at, dur = 0.6) {
    A(el, [{ opacity: 0, transform: "translateX(-32px)" }, { opacity: 1, transform: "none" }], at, dur);
  }

  /** Typewriter over segments, with a block cursor that blinks then hides. */
  function typewriter(el, text, at, cps = 38, opts = {}) {
    const segs = typeof text === "string" ? segments(text) : text;
    const total = segs.reduce((n, s) => n + s.text.length, 0);
    const holdCursor = opts.holdCursor ?? 0.9;
    let last = "";
    tickers.push((t) => {
      const n = Math.floor(clamp((t - at) * cps, 0, total));
      let left = n, html = "";
      for (const s of segs) {
        if (left <= 0) break;
        const part = s.text.slice(0, left);
        left -= part.length;
        const safe = esc(part).replace(/·/g, '<span class="sep">·</span>');
        html += s.cls ? `<span class="${s.cls}">${safe}</span>` : safe;
      }
      const doneAt = at + total / cps;
      const showCursor = opts.cursor !== false && t >= at - 0.2 && t < doneAt + holdCursor && (t < doneAt || Math.floor((t - doneAt) / 0.25) % 2 === 0);
      if (showCursor) html += '<span class="cursor"></span>';
      if (html !== last) { el.innerHTML = html; last = html; }
    });
    return at + total / cps;
  }

  function countUp(el, to, at, dur = 1, suffix = "") {
    let last = "";
    tickers.push((t) => {
      const v = Math.round(to * easeOut((t - at) / dur));
      const s = v + suffix;
      if (s !== last) { el.textContent = s; last = s; }
    });
  }

  /** Masked word-by-word headline reveal. */
  function headline(parent, text, at) {
    const el = h("div", "headline");
    const lines = text.split("\n");
    let i = 0;
    lines.forEach((line, li) => {
      for (const seg of segments(line)) {
        for (const word of seg.text.split(/(\s+)/)) {
          if (!word) continue;
          if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(" ")); continue; }
          const w = h("span", "w");
          const inner = h("span", seg.cls, esc(word));
          w.appendChild(inner);
          el.appendChild(w);
          A(inner, [{ transform: "translateY(110%)" }, { transform: "none" }], at + i * 0.055, 0.65);
          i++;
        }
      }
      if (li < lines.length - 1) el.appendChild(h("br"));
    });
    parent.appendChild(el);
    return at + i * 0.055 + 0.5;
  }

  function header(content, s, t0) {
    let next = t0 + 0.15;
    if (s.kicker) {
      const k = h("div", "kicker");
      const bar = h("span", "bar");
      const txt = h("span", "k-text");
      k.append(bar, txt);
      content.appendChild(k);
      A(bar, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], t0 + 0.05, 0.3);
      typewriter(txt, s.kicker, t0 + 0.15, 42);
      next = t0 + 0.35;
    }
    if (s.headline) next = headline(content, s.headline, next);
    return next;
  }

  function addGlows(root, s, t0, t1) {
    const spec = s.glow || "lime";
    const limeOnly = DATA.palette === "lime-only";
    let list = spec === "both" ? ["lime", "orange"] : spec === "none" ? [] : [spec];
    if (limeOnly) list = list.includes("lime") || list.includes("orange") ? ["lime"] : list;
    list.forEach((c, i) => {
      const g = h("div", `glow ${c}`);
      const size = 1100;
      const y = s.glowY ?? (s.type === "end" || s.type === "intro" ? 760 : 900);
      const x = list.length === 2 ? (i === 0 ? -300 : 380) : 0;
      Object.assign(g.style, { width: size + "px", height: size + "px", left: `${(1080 - size) / 2 + x}px`, top: `${y - size / 2}px` });
      root.appendChild(g);
      A(g, [{ opacity: 0, transform: "scale(.8)" }, { opacity: 0.85, transform: "scale(1)" }], t0, 0.9);
      A(g, [{ transform: "scale(1) translate(0,0)" }, { transform: `scale(1.05) translate(${i ? -20 : 20}px, -24px)` }], t0 + 0.9, Math.max(0.1, t1 - t0 - 0.9), "ease-in-out");
    });
  }

  /** 3D card entrance + slow drift (outer = entrance, inner = drift). */
  function card3d(parent, cls, at, t1) {
    const outer = h("div", "card3d");
    outer.style.perspective = "1800px";
    const inner = h("div", "card " + cls);
    outer.appendChild(inner);
    parent.appendChild(outer);
    A(outer, [
      { opacity: 0, transform: "translateY(90px) rotateX(8deg) scale(.97)" },
      { opacity: 1, transform: "none" },
    ], at, 0.9);
    A(inner, [{ transform: "rotateX(0deg) rotateY(0deg)" }, { transform: "rotateX(1deg) rotateY(-1.2deg) translateY(-6px)" }], at + 0.9, Math.max(0.1, t1 - at - 0.9), "ease-in-out");
    return inner;
  }

  // ---------- scene builders ----------
  const B = {};

  B.intro = (root, s, t0, t1) => {
    const wrap = h("div", "introwrap");
    const wm = h("div", "wordmark");
    const dot = h("span", "dot");
    const word = h("span", "");
    wm.append(dot, word);
    const l1 = h("div", "l1");
    const l2 = h("div", "l2");
    wrap.append(wm, l1, l2);
    root.appendChild(wrap);
    A(dot, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], t0 + 0.05, 0.4);
    const wDone = typewriter(word, "zerosolved", t0 + 0.3, 22, { cursor: false });
    let next = wDone + 0.1;
    if (s.line1) next = typewriter(l1, s.line1, next, 56) + 0.05;
    if (s.line2) typewriter(l2, s.line2, next, 75);
  };

  B.today = (root, s, t0, t1) => {
    const content = h("div", "content");
    root.appendChild(content);
    const next = header(content, s, t0);
    const c = s.card || {};
    const slot = h("div", "");
    slot.style.marginTop = "56px";
    content.appendChild(slot);
    const card = card3d(slot, `navy grid-bg today glow-${c.glow || "orange"}`, next - 0.25, t1);
    const top = h("div", "top");
    top.append(h("span", "pill orange", `${icon("sparkles")}&nbsp;${esc(c.badge || "/today · problem of the day")}`), h("span", "meta", esc(c.meta || "")));
    top.querySelector("svg") && (top.querySelector("svg").style.cssText = "width:22px;height:22px");
    card.appendChild(top);
    const tr = h("div", "title-row");
    const title = h("div", "title", md(c.title || ""));
    tr.appendChild(title);
    if (c.score != null) {
      const ring = h("div", "ring");
      const R = 66, C = 2 * Math.PI * R;
      ring.innerHTML = `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="9"/><circle class="arc" cx="75" cy="75" r="${R}" fill="none" stroke="#88ae1b" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div class="num"><span>0</span><small>zero score</small></div>`;
      tr.appendChild(ring);
      const arc = ring.querySelector(".arc");
      const at = next + 0.5;
      tickers.push((t) => arc.setAttribute("stroke-dashoffset", String(C * (1 - (c.score / 100) * easeOut((t - at) / 1.2)))));
      countUp(ring.querySelector(".num span"), c.score, at, 1.2);
    }
    card.appendChild(tr);
    if (c.bars && c.bars.length) {
      const bars = h("div", "bars");
      c.bars.forEach((b, i) => {
        const row = h("div", "barrow");
        const lab = h("div", "lab");
        const val = h("span", `val ${b.color || "lime"}`, "0" + (b.suffix ?? "%"));
        lab.append(h("span", "", md(b.label)), val);
        const track = h("div", "track");
        const fill = h("div", `fill ${b.color || "lime"}`);
        track.appendChild(fill);
        row.append(lab, track);
        bars.appendChild(row);
        const at = next + 0.8 + i * 0.45;
        rise(row, at - 0.2, 0.45, 24);
        A(fill, [{ width: "0%" }, { width: `${Math.min(100, b.value)}%` }], at, 1.1);
        countUp(val, b.value, at, 1.1, b.suffix ?? "%");
      });
      card.appendChild(bars);
    }
    if (c.source) {
      const src = h("div", "source", md(c.source));
      card.appendChild(src);
      rise(src, next + 2.0, 0.5, 16);
    }
  };

  B.rows = (root, s, t0, t1) => {
    const content = h("div", "content");
    root.appendChild(content);
    const next = header(content, s, t0);
    const slot = h("div", "");
    slot.style.marginTop = "52px";
    content.appendChild(slot);
    const card = card3d(slot, `navy grid-bg rows ${s.cardGlow ? "glow-" + s.cardGlow : ""}`, next - 0.3, t1);
    (s.rows || []).forEach((r, i) => {
      const row = h("div", "row");
      const ic = h("div", `ico ${r.color || "lime"}`, icon(r.icon));
      const body = h("div", "");
      body.append(h("div", `lab ${r.labelColor || r.color || "lime"}`, md(r.label)), h("div", "txt", md(r.text)));
      row.append(ic, body);
      card.appendChild(row);
      slideIn(row, next + 0.25 + i * (s.stagger ?? 0.5), 0.55);
    });
  };

  B.list = (root, s, t0, t1) => {
    const content = h("div", "content");
    root.appendChild(content);
    const next = header(content, s, t0);
    const items = h("div", "items");
    items.style.marginTop = "48px";
    content.appendChild(items);
    let at = next - 0.1;
    (s.items || []).forEach((it, i) => {
      const el = h("div", "item");
      const body = h("div", "");
      body.append(h("div", `tag ${it.tagColor || it.color || "lime"}`, md(it.tag || "")), h("div", "t", md(it.title)));
      el.append(h("div", `ico ${it.color || "lime"}`, icon(it.icon)), body);
      if (it.id) el.appendChild(h("div", "id", esc(it.id)));
      items.appendChild(el);
      slideIn(el, at, 0.5);
      at += s.stagger ?? 0.3;
    });
    if (s.benefits && s.benefits.length) {
      const g = h("div", "benefits");
      g.style.marginTop = "26px";
      content.appendChild(g);
      at += 0.15;
      s.benefits.forEach((b) => {
        const el = h("div", `benefit ${b.color || "lime"}`, `${icon(b.icon)}<span>${md(b.text)}</span>`);
        g.appendChild(el);
        pop(el, at);
        at += 0.18;
      });
    }
    if (s.footer) {
      const f = h("div", "footline");
      f.style.marginTop = "24px";
      content.appendChild(f);
      f.innerHTML = md(s.footer);
      rise(f, at + 0.2, 0.5, 20);
    }
  };

  B.cards = (root, s, t0, t1) => {
    const content = h("div", "content");
    root.appendChild(content);
    const next = header(content, s, t0);
    const g = h("div", "tgrid");
    g.style.marginTop = "48px";
    content.appendChild(g);
    let at = next - 0.1;
    (s.cards || []).forEach((c) => {
      const el = h("div", `tcard ${c.variant || "navy"}`);
      el.innerHTML = `<span class="pill">${md(c.tag || "")}</span><div class="t">${md(c.title)}</div>${c.sub ? `<div class="s">${md(c.sub)}</div>` : ""}${c.foot ? `<div class="f">${md(c.foot)}</div>` : ""}<div class="bgicon">${icon(c.icon)}</div>`;
      g.appendChild(el);
      pop(el, at);
      at += s.stagger ?? 0.28;
    });
    if (s.footer) {
      const f = h("div", "footline");
      f.style.marginTop = "34px";
      f.innerHTML = md(s.footer);
      content.appendChild(f);
      rise(f, at + 0.2, 0.5, 20);
    }
  };

  B.compare = (root, s, t0, t1) => {
    const content = h("div", "content");
    root.appendChild(content);
    const next = header(content, s, t0);
    const slot = h("div", "");
    slot.style.marginTop = "46px";
    content.appendChild(slot);
    const card = card3d(slot, "navy grid-bg compare", next - 0.3, t1);
    const head = h("div", "head");
    head.append(h("span", ""), h("span", "", `<span style="color:var(--muted)">${esc(s.left || "a chat answer")}</span>`), h("span", "lime", esc(s.right || "this case file")));
    card.appendChild(head);
    let at = next + 0.2;
    (s.rows || []).forEach((r) => {
      const row = h("div", "crow");
      row.append(h("div", "c1", md(r.k)), h("div", "c2", md(r.chat)), h("div", "c3", `<span class="ck">✓</span> ${md(r.file)}`));
      card.appendChild(row);
      slideIn(row, at, 0.5);
      at += s.stagger ?? 0.42;
    });
    if (s.modules) {
      const mods = s.modules === true ? ["Overview", "Strength", "Evidence", "Market", "Timing", "Customers", "Money & Moat", "Playbook", "Live Tracking"] : s.modules;
      const g = h("div", "modules");
      g.style.marginTop = "34px";
      content.appendChild(g);
      at += 0.1;
      mods.forEach((m, i) => {
        const el = h("div", "module");
        const hl = h("div", "hl");
        const n = h("span", "n", String(i + 1).padStart(2, "0"));
        const lab = h("span", "", esc(m));
        el.append(hl, n, lab);
        g.appendChild(el);
        pop(el, at + i * 0.07, 0.45);
        const sweep = at + 0.8 + i * 0.2;
        A(hl, [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], sweep, 0.6, "linear");
        A(lab, [{ color: "#e6eaf0" }, { color: "#0c1200", offset: 0.35 }, { color: "#e6eaf0" }], sweep, 0.6, "linear");
        A(n, [{ color: "#8a93a0" }, { color: "#0c1200", offset: 0.35 }, { color: "#8a93a0" }], sweep, 0.6, "linear");
      });
      at += 0.8 + mods.length * 0.2;
    }
    if (s.footer) {
      const f = h("div", "footline");
      f.style.marginTop = "30px";
      f.innerHTML = md(s.footer);
      content.appendChild(f);
      rise(f, Math.min(at, t1 - 1), 0.5, 20);
    }
  };

  B.end = (root, s, t0, t1) => {
    const wrap = h("div", "endwrap");
    root.appendChild(wrap);
    const wm = h("div", "wordmark", '<span class="dot"></span><span>zerosolved</span>');
    wrap.appendChild(wm);
    A(wm, [{ opacity: 0, transform: "scale(.97)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], t0 + 0.1, 0.7);
    const big = h("div", "big");
    wrap.appendChild(big);
    const lines = (s.headline || "Stop guessing.\n[Start solving.]").split("\n");
    lines.forEach((line, i) => {
      const l = h("div", "", md(line));
      big.appendChild(l);
      rise(l, t0 + 0.7 + i * 0.45, 0.6, 50);
    });
    let at = t0 + 0.7 + lines.length * 0.45 + 0.3;
    if (s.sub) {
      const sub = h("div", "sub", md(s.sub));
      wrap.appendChild(sub);
      rise(sub, at, 0.6, 30);
      at += 0.6;
    }
    if (s.cta) {
      const cta = h("div", "cta", `<span class="dot"></span><span>${md(s.cta)}</span>`);
      wrap.appendChild(cta);
      pop(cta, at, 0.6);
      A(cta, [{ boxShadow: "0 0 40px rgba(136,174,27,.6), 0 0 100px rgba(136,174,27,.25)" }, { boxShadow: "0 0 55px rgba(136,174,27,.75), 0 0 130px rgba(136,174,27,.32)" }, { boxShadow: "0 0 40px rgba(136,174,27,.6), 0 0 100px rgba(136,174,27,.25)" }], at + 0.7, 1.6, "ease-in-out");
      at += 0.6;
    }
    if (s.stats) {
      const st = h("div", "stats");
      wrap.appendChild(st);
      typewriter(st, s.stats, at + 0.1, 60);
    }
  };

  // ---------- init / seek / lint ----------
  window.__init = (data) => {
    DATA = data;
    if (data.palette === "lime-only") document.body.classList.add("lime-only");
    const stage = document.getElementById("stage");
    document.querySelector("#chrome .count").textContent = data.headerStat || "971 case files";
    let t = 0;
    scenes = data.scenes.map((s, idx) => {
      const el = h("div", "scene");
      el.dataset.type = s.type;
      stage.insertBefore(el, document.getElementById("chrome"));
      const t0 = t, t1 = t + s.duration;
      t = t1;
      addGlows(el, s, t0, t1);
      const fn = B[s.type];
      if (!fn) throw new Error("Unknown scene type: " + s.type);
      fn(el, s, t0, t1);
      A(el, [{ opacity: 0 }, { opacity: 1 }], t0, idx === 0 ? 0.01 : 0.3, "linear");
      if (idx < data.scenes.length - 1) {
        A(el, [{ opacity: 1, filter: "blur(0px)", transform: "none" }, { opacity: 0, filter: "blur(6px)", transform: "translateY(-24px)" }], t1 - 0.4, 0.4, EASE_IN);
      }
      const chrome = s.chrome ?? !(s.type === "intro" || s.type === "end");
      return { el, t0, t1, chrome, type: s.type };
    });
    const chromeEl = document.getElementById("chrome");
    tickers.push((tt) => {
      // chrome fades with 0.3s ramps at scene boundaries where it changes
      let o = 0;
      for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        if (tt >= s.t0 && tt < s.t1) {
          if (!s.chrome) { o = 0; break; }
          const prevOn = i > 0 && scenes[i - 1].chrome;
          const nextOn = i < scenes.length - 1 && scenes[i + 1].chrome;
          o = 1;
          if (!prevOn) o = Math.min(o, clamp((tt - s.t0) / 0.3));
          if (!nextOn) o = Math.min(o, clamp((s.t1 - tt) / 0.3));
          break;
        }
      }
      chromeEl.style.opacity = String(o);
    });
    window.__seek(0);
    return { duration: t, cuts: scenes.map((s) => s.t0) };
  };

  window.__seek = (t) => {
    for (const s of scenes) s.el.style.visibility = t >= s.t0 - 0.001 && t < s.t1 + 0.001 ? "visible" : "hidden";
    for (const a of anims) a.currentTime = t * 1000;
    for (const f of tickers) f(t);
  };

  /** Layout check: run after a scene has fully built in (just before its exit). */
  window.__lint = (safeTop = 250, safeBottom = 1570) => {
    const warnings = [];
    scenes.forEach((s, i) => {
      window.__seek(Math.max(s.t0, s.t1 - 0.45));
      const nodes = s.el.querySelectorAll(".content *, .endwrap *, .introwrap *");
      let maxBottom = 0;
      nodes.forEach((n) => {
        if (n.closest(".glow, .bgicon")) return;
        const r = n.getBoundingClientRect();
        if (!r.width || !r.height) return;
        maxBottom = Math.max(maxBottom, r.bottom);
        if (r.right > 1032 || r.left < 48) warnings.push(`scene ${i + 1} (${s.type}): element runs off the side (x ${Math.round(r.left)}–${Math.round(r.right)}): "${(n.textContent || "").trim().slice(0, 50)}"`);
        if (n.scrollWidth > n.clientWidth + 2 && getComputedStyle(n).whiteSpace === "nowrap") warnings.push(`scene ${i + 1} (${s.type}): text clipped: "${(n.textContent || "").trim().slice(0, 50)}"`);
      });
      if (maxBottom > safeBottom) warnings.push(`scene ${i + 1} (${s.type}): content reaches y=${Math.round(maxBottom)} (safe bottom is ${safeBottom}) — cut text or items`);
      else if (!["intro", "end"].includes(s.type) && maxBottom < 1180) warnings.push(`scene ${i + 1} (${s.type}): content ends at y=${Math.round(maxBottom)} — lots of empty space; add a row/item or shorten the scene`);
    });
    window.__seek(0);
    return [...new Set(warnings)];
  };
})();
