"use strict";
const PROGS = { 0: "Pazar", 6: "Cumartesi" }; // diğerleri Haftaiçi
const DEFAULT_SEL = [{ h: "193", y: 2 }, { h: "224", y: 2 }, { h: "588", y: 2 }];
let DATA = null;
let SEL = loadSel();

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function loadSel() {
  try {
    const s = JSON.parse(localStorage.getItem("sel"));
    if (Array.isArray(s) && s.length) return s;
  } catch {}
  return DEFAULT_SEL;
}
function saveSel() { localStorage.setItem("sel", JSON.stringify(SEL)); }

// Test için: ?t=2026-11-28T07:05:00+03:00 ile saati taklit et
function now() {
  const t = new URLSearchParams(location.search).get("t");
  return t ? new Date(t) : new Date();
}

// Europe/Istanbul duvar saati parçaları
function ist(d) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", hour12: false,
    hour: "2-digit", minute: "2-digit", weekday: "short",
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { dow, min: (+p.hour % 24) * 60 + +p.minute };
}

const toMin = (s) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

// Yön 1: a -> b, Yön 2: b -> a
function route(h, y) {
  const l = DATA.lines[h];
  if (!l) return null;
  return y === 1 ? { from: l.a, to: l.b } : { from: l.b, to: l.a };
}

function next(h, y, st) {
  const d = DATA.lines[h]?.d[y];
  if (!d) return null;
  const prog = (dow) => PROGS[dow] || "Haftaiçi";
  const today = d[prog(st.dow)] || [];
  const t = today.find((s) => toMin(s) >= st.min);
  if (t) return { saat: t, kalan: toMin(t) - st.min, yarin: false };
  const tomorrow = d[prog((st.dow + 1) % 7)] || [];
  if (!tomorrow.length) return null;
  return { saat: tomorrow[0], kalan: 1440 - st.min + toMin(tomorrow[0]), yarin: true };
}

function fmtKalan(m) {
  return m < 60 ? `${m} dk` : `${Math.floor(m / 60)} sa ${m % 60} dk`;
}

const rt = (r) => (r ? `${r.from} → ${r.to}` : "");

function render() {
  if (!DATA) return;
  const st = ist(now());
  const list = SEL
    .map((s) => ({ ...s, r: route(s.h, s.y), ...next(s.h, s.y, st) }))
    .filter((x) => x.saat)
    .sort((a, b) => a.kalan - b.kalan);

  if (!list.length) {
    $("heroLine").textContent = "–";
    $("heroMin").textContent = "";
    $("heroSub").textContent = "Hat seçilmedi";
    $("others").innerHTML = "";
  } else {
    const [first, ...rest] = list;
    $("heroLine").textContent = first.h;
    $("heroMin").textContent = fmtKalan(first.kalan);
    $("heroSub").textContent = `${first.saat} kalkış${first.yarin ? " (yarın)" : ""}`;
    $("heroRoute").textContent = rt(first.r);
    $("hero").classList.toggle("soon", first.kalan <= 3);
    $("others").innerHTML = rest.map((x) =>
      `<li><span><span class="n">${esc(x.h)}</span><small>${esc(rt(x.r))}</small></span>` +
      `<span class="r">${fmtKalan(x.kalan)}<small>${x.saat}${x.yarin ? " (yarın)" : ""}</small></span></li>`
    ).join("");
  }
  $("foot").textContent = `Planlanan kalkış saatleri, canlı değil · veri: ${new Date(DATA.updated).toLocaleDateString("tr-TR")}`;
}

// ---- Hat ekle / çıkar paneli ----
function renderSel() {
  $("selList").innerHTML = SEL.map((s, i) =>
    `<li><span><b>${esc(s.h)}</b> <small>${esc(rt(route(s.h, s.y)))}</small></span>` +
    `<button data-rm="${i}" aria-label="Kaldır">✕</button></li>`
  ).join("") || `<li class="empty">Hiç hat yok</li>`;
}

const norm = (s) => String(s).toLocaleLowerCase("tr");

function renderResults() {
  const q = norm($("q").value.trim());
  if (!q) { $("results").innerHTML = ""; return; }
  const hits = Object.entries(DATA.lines)
    .filter(([h, l]) => h.startsWith(q) || norm(l.n).includes(q))
    .sort((a, b) => (a[0] === q ? -1 : b[0] === q ? 1 : +a[0] - +b[0]))
    .slice(0, 20);
  $("results").innerHTML = hits.map(([h, l]) =>
    `<li><div><b>${esc(h)}</b> <small>${esc(l.n)}</small></div><div class="dirs">` +
    [1, 2].filter((y) => l.d[y]).map((y) => {
      const r = route(h, y);
      const on = SEL.some((s) => s.h === h && s.y === y);
      return `<button data-add="${esc(h)}|${y}" ${on ? "disabled" : ""}>${esc(r.from)} → ${esc(r.to)}${on ? " ✓" : ""}</button>`;
    }).join("") + `</div></li>`
  ).join("") || `<li class="empty">Hat bulunamadı</li>`;
}

$("toggle").addEventListener("click", () => {
  const p = $("panel");
  p.hidden = !p.hidden;
  if (!p.hidden) { renderSel(); renderResults(); $("q").focus(); }
});
$("q").addEventListener("input", renderResults);
$("selList").addEventListener("click", (e) => {
  const i = e.target.dataset?.rm;
  if (i === undefined) return;
  SEL.splice(+i, 1);
  saveSel(); renderSel(); renderResults(); render();
});
$("results").addEventListener("click", (e) => {
  const v = e.target.dataset?.add;
  if (!v) return;
  const [h, y] = v.split("|");
  SEL.push({ h, y: +y });
  saveSel(); renderSel(); renderResults(); render();
});

async function load() {
  try {
    const r = await fetch("data.json", { cache: "no-cache" });
    DATA = await r.json();
  } catch {
    return; // ağ yoksa service worker önbelleği devreye girer
  }
  // Silinmiş/yeni olmayan hatları temizle
  SEL = SEL.filter((s) => DATA.lines[s.h]?.d[s.y]);
  render();
}

load();
setInterval(render, 10000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
