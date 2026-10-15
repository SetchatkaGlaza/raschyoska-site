/* Расчёска — поведение страницы: меню, цены, галерея, форма записи. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Шапка и мобильное меню */
  const hd = $("#hd"), bg = $("#bg"), nv = $("#nv");
  addEventListener("scroll", () => hd.classList.toggle("s", scrollY > 10), { passive: true });
  bg.addEventListener("click", () => {
    const on = bg.classList.toggle("on");
    nv.classList.toggle("on", on);
    bg.setAttribute("aria-expanded", on);
  });
  $$("nav a").forEach((a) => a.addEventListener("click", () => {
    bg.classList.remove("on");
    nv.classList.remove("on");
  }));

  /* Появление блоков при прокрутке */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".rv").forEach((el) => io.observe(el));

  /* Снимки в первом экране: лёгкий сдвиг за курсором */
  const stack = $("#stack");
  if (stack && !reduce && matchMedia("(hover: hover)").matches) {
    const pols = $$(".pol");
    stack.addEventListener("pointermove", (e) => {
      const r = stack.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      pols.forEach((p) => {
        const d = +p.dataset.d;
        p.style.setProperty("--mx", x * d + "px");
        p.style.setProperty("--my", y * d + "px");
      });
    });
    stack.addEventListener("pointerleave", () => $$(".pol").forEach((p) => {
      p.style.removeProperty("--mx");
      p.style.removeProperty("--my");
    }));
  }

  /* Цены */
  const tabs = $("#tabs"), list = $("#pl"), q = $("#q"), note = $("#nt");
  let cat = 0;
  const price = (p) => (p === "в подарок" ? p : p + " ₽");
  const row = (r, from) =>
    `<div class="row"><span class="n">${r[0]}${from ? `<small>${from}</small>` : ""}</span><i></i><b>${price(r[1])}</b></div>`;
  function draw() {
    const s = q.value.trim().toLowerCase();
    let html = "", text = "";
    if (s) {
      PRICES.forEach((c) => c.rows.filter((r) => r[0].toLowerCase().includes(s)).forEach((r) => (html += row(r, c.name))));
      if (!html) html = '<div class="row"><span class="n">Такой услуги не нашли. Позвоните, подскажем.</span></div>';
    } else {
      PRICES[cat].rows.forEach((r) => (html += row(r)));
      text = PRICES[cat].note;
    }
    list.innerHTML = html;
    note.textContent = text;
    $$("#pl .row").forEach((el, i) => (el.style.animationDelay = Math.min(i * 30, 400) + "ms"));
  }
  PRICES.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "tab" + (i ? "" : " on");
    b.textContent = c.name;
    b.addEventListener("click", () => {
      cat = i; q.value = "";
      $$("#tabs .tab").forEach((x, k) => x.classList.toggle("on", k === i));
      draw();
    });
    tabs.append(b);
  });
  q.addEventListener("input", draw);
  draw();

  /* Список услуг в форме записи */
  $("#fs").innerHTML = "<option>Пока не знаю, подскажите</option>" +
    PRICES.map((c) => `<optgroup label="${c.name}">${c.rows.map((r) => `<option>${r[0]}</option>`).join("")}</optgroup>`).join("");

  /* Форма: текст заявки копируется, откроется сообщество во ВКонтакте */
  $("#fm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = `Здравствуйте! Хочу записаться.\nИмя: ${$("#fn").value}\nТелефон: ${$("#fp").value}\nУслуга: ${$("#fs").value}\nВремя: ${$("#fc").value || "подскажите свободное"}`;
    window.open("https://vk.ru/hairbrush35", "_blank", "noopener");
    try { navigator.clipboard.writeText(text); } catch (_) { /* копирование недоступно */ }
    const ok = $("#ok");
    ok.style.display = "block";
    ok.textContent = "Открыли сообщество во ВКонтакте. Нажмите «Написать сообщение» и вставьте текст заявки (он уже скопирован):";
    const pre = document.createElement("pre");
    pre.textContent = text;
    ok.append(pre);
  });

  /* Галерея: фильтры и просмотр */
  const figs = $$("#gl figure");
  const lb = $("#lb"), li = lb.querySelector("img");
  let cur = 0;
  /* На телефоне показываем половину работ, остальное по кнопке */
  const narrow = matchMedia("(max-width: 900px)");
  const gmore = $("#gmore");
  let gOpen = false;
  function applyLimit() {
    const shown = figs.filter((f) => !f.classList.contains("h"));
    const limit = narrow.matches && !gOpen ? Math.ceil(shown.length / 2) : shown.length;
    shown.forEach((f, i) => f.classList.toggle("x", i >= limit));
    gmore.parentElement.hidden = !(narrow.matches && shown.length > 2);
    gmore.textContent = gOpen ? "Свернуть" : "Показать ещё " + (shown.length - limit);
  }
  gmore.addEventListener("click", () => {
    gOpen = !gOpen;
    applyLimit();
    if (!gOpen) $("#gallery").scrollIntoView();
  });
  narrow.addEventListener("change", applyLimit);
  const visible = () => figs.filter((f) => !f.classList.contains("h") && !f.classList.contains("x"));
  $$("#gf .tab").forEach((b) => b.addEventListener("click", () => {
    $$("#gf .tab").forEach((x) => x.classList.toggle("on", x === b));
    figs.forEach((f) => f.classList.toggle("h", b.dataset.f !== "all" && f.dataset.c !== b.dataset.f));
    gOpen = false;
    applyLimit();
  }));
  function show(i) {
    const v = visible();
    cur = (i + v.length) % v.length;
    li.src = v[cur].querySelector("img").src;
    lb.classList.add("on");
  }
  figs.forEach((f) => f.addEventListener("click", () => show(visible().indexOf(f))));
  const close = () => lb.classList.remove("on");
  lb.querySelector(".x").addEventListener("click", close);
  lb.querySelector(".pv").addEventListener("click", (e) => { e.stopPropagation(); show(cur - 1); });
  lb.querySelector(".nx").addEventListener("click", (e) => { e.stopPropagation(); show(cur + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("on")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  applyLimit();
  let sx = 0;
  lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const d = e.changedTouches[0].clientX - sx;
    if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1));
  });

  /* Отзывы: две бегущие ленты на широких экранах, список с кнопкой на узких */
  const fd = $("#fd");
  const cards = [...fd.children];
  const dup = (c) => { const n = c.cloneNode(true); n.classList.add("dup"); n.setAttribute("aria-hidden", "true"); return n; };
  const lane = (items, cls) => {
    const l = document.createElement("div"), t = document.createElement("div");
    l.className = "lane " + cls; t.className = "trk";
    t.append(...items); l.append(t);
    return l;
  };
  const shifted = cards.slice(4).concat(cards.slice(0, 4));
  fd.append(
    lane([...cards, ...cards.map(dup)], "r1"),
    lane([...shifted.map(dup), ...shifted.map(dup)], "r2")
  );
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); }
  }), { threshold: 0.2 });
  cards.forEach((c) => rio.observe(c));
  const rmore = $("#rmore");
  rmore.addEventListener("click", () => {
    const open = fd.classList.toggle("open");
    rmore.textContent = open ? "Свернуть отзывы" : "Показать ещё отзывы";
    if (!open) $("#reviews").scrollIntoView();
  });

  /* Скидки: переворот купонов на сенсорных экранах и калькулятор */
  if (!matchMedia("(hover: hover)").matches) {
    $$(".tk").forEach((t) => t.addEventListener("click", () => t.classList.toggle("f")));
  }
  const cs = $("#cs"), cd = $("#cd"), cres = $("#cres");
  if (cs && cd && cres) {
    const singles = [];
    PRICES.forEach((c) => c.rows.forEach((r) => { if (/^\d+$/.test(r[1]) && +r[1] >= 300) singles.push([r[0], +r[1]]); }));
    cs.innerHTML = singles.map((s, i) => `<option value="${i}">${s[0]}, ${s[1]} ₽</option>`).join("");
    function calc() {
      const [, p] = singles[cs.value];
      let off = 0, msg = "";
      if (cd.value === "new") off = 100;
      if (cd.value === "soc") off = p > 1000 ? 200 : 50;
      if (cd.value === "bd") { if (p >= 1000) off = Math.round(p * 0.1); else msg = "Скидка 10% действует при чеке от 1000 ₽."; }
      cres.innerHTML = off ? `${p - off} ₽<small>вместо ${p} ₽, скидка ${off} ₽</small>` : `${p} ₽<small>${msg}</small>`;
    }
    cs.addEventListener("change", calc);
    cd.addEventListener("change", calc);
    calc();

  }
})();
