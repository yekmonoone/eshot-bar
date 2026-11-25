// ESHOT hareket saatlerinin TÜM hatlarını çekip public/data.json üretir.
// Kullanım: node scripts/fetch.mjs
import { writeFile } from "node:fs/promises";

const URL_ALL = "https://acikveriwapi.izmir.bel.tr/AcikVeriEshot/Seferler/HareketSaatleriniGetir";

let res;
for (let i = 1; ; i++) {
  try { res = await fetch(URL_ALL, { signal: AbortSignal.timeout(60000) }); break; }
  catch (e) { if (i >= 3) throw e; console.warn("Deneme", i, "başarısız, tekrar..."); }
}
if (!res.ok) throw new Error(`${URL_ALL} -> ${res.status}`);
const json = await res.json();
if (!Array.isArray(json.Data) || json.Data.length < 1000) {
  throw new Error("Beklenmeyen yanıt: " + JSON.stringify(json).slice(0, 200));
}

// lines[hatNo] = { n: ad, a: başlangıç, b: bitiş, d: { "1": {Haftaiçi: [...], ...}, "2": {...} } }
// Yön 1: a -> b, Yön 2: b -> a
const lines = {};
for (const x of json.Data) {
  const l = (lines[x.HatNo] ??= { n: x.HatAdi, a: x.HatBaslangic, b: x.HatBitis, d: {} });
  const prog = ((l.d[x.Yon] ??= {})[x.ProgramAdi] ??= []);
  if (!prog.includes(x.Saat)) prog.push(x.Saat);
}
for (const l of Object.values(lines))
  for (const d of Object.values(l.d)) for (const p of Object.keys(d)) d[p].sort();

const out = { updated: new Date().toISOString(), lines };
await writeFile(new URL("../public/data.json", import.meta.url), JSON.stringify(out));
console.log(Object.keys(lines).length, "hat yazıldı: public/data.json");
