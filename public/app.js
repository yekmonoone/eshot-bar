"use strict";
const PROGS = { 0: "Pazar", 6: "Cumartesi" }; // diğerleri Haftaiçi
let DATA = null;

// Test için: ?t=2026-11-28T07:05 ile saati taklit et
function now() {
  const t = new URLSearchParams(location.search).get("t");
  return t ? new Date(t) : new Date();
}

// Europe/Istanbul duvar saati parçaları
function ist(d) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short",
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { dow, min: (+p.hour % 24) * 60 + +p.minute, sec: +p.second };
}

const toMin = (s) => +s.slice(0, 2) * 60 + +s.slice(3, 5);

function next(hat, st) {
  const prog = (dow) => PROGS[dow] || "Haftaiçi";
  const today = DATA.lines[hat][prog(st.dow)] || [];
  const t = today.find((s) => toMin(s) >= st.min);
  if (t) return { saat: t, kalan: toMin(t) - st.min, yarin: false };
  const tomorrow = DATA.lines[hat][prog((st.dow + 1) % 7)] || [];
  if (!tomorrow.length) return null;
  return { saat: tomorrow[0], kalan: 1440 - st.min + toMin(tomorrow[0]), yarin: true };
}

function fmtKalan(m) {
  if (m < 60) return `${m} dk`;
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
}

function render() {
  if (!DATA) return;
  const st = ist(now());
  const list = Object.keys(DATA.lines)
    .map((h) => ({ hat: h, ...next(h, st) }))
    .filter((x) => x.saat)
    .sort((a, b) => a.kalan - b.kalan);
  if (!list.length) return;

  const [first, ...rest] = list;
  document.getElementById("heroLine").textContent = first.hat;
  document.getElementById("heroMin").textContent = fmtKalan(first.kalan);
  document.getElementById("heroSub").textContent = `${first.saat} kalkış${first.yarin ? " (yarın)" : ""}`;
  document.getElementById("hero").classList.toggle("soon", first.kalan <= 3);

  document.getElementById("others").innerHTML = rest.map((x) =>
    `<li><span class="n">${x.hat}</span><span class="r">${fmtKalan(x.kalan)}<small>${x.saat}${x.yarin ? " (yarın)" : ""}</small></span></li>`
  ).join("");

  const upd = new Date(DATA.updated).toLocaleDateString("tr-TR");
  document.getElementById("foot").textContent = `Planlanan kalkış saatleri, canlı değil · veri: ${upd}`;
}

async function load() {
  try {
    const r = await fetch("data.json", { cache: "no-cache" });
    DATA = await r.json();
    localStorage.setItem("data", JSON.stringify(DATA));
  } catch {
    const c = localStorage.getItem("data");
    if (c) DATA = JSON.parse(c);
  }
  render();
}

load();
setInterval(render, 10000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
