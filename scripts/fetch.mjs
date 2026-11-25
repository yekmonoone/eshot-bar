// ESHOT hareket saatlerini çekip public/data.json üretir.
// Kullanım: node scripts/fetch.mjs
import { writeFile } from "node:fs/promises";

const HATLAR = [193, 224, 588];
const YON = 2; // 2 = Dönüş = KONAK'tan kalkış
const BASE = "https://acikveriwapi.izmir.bel.tr/AcikVeriEshot/Seferler/HareketSaatleriniGetir";

// Bir sonraki haftaiçi/cumartesi/pazar gününü bul (bugünden itibaren)
function sonrakiGun(dow) {
  const d = new Date();
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return d;
}
const fmt = (d) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

const PROGRAMLAR = { Haftaiçi: sonrakiGun(2), Cumartesi: sonrakiGun(6), Pazar: sonrakiGun(0) };

const out = { updated: new Date().toISOString(), lines: {} };

for (const hat of HATLAR) {
  out.lines[hat] = {};
  for (const [ad, tarih] of Object.entries(PROGRAMLAR)) {
    const url = `${BASE}?hatNo=${hat}&yon=${YON}&tarih=${fmt(tarih)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const json = await res.json();
    if (!json.Data) throw new Error(`${url} -> ${JSON.stringify(json)}`);
    const saatler = [...new Set(json.Data.map((x) => x.Saat))].sort();
    const prog = json.Data[0]?.ProgramAdi;
    if (prog && prog !== ad) console.warn(`Uyarı: hat ${hat} ${fmt(tarih)} programı "${prog}", beklenen "${ad}"`);
    out.lines[hat][ad] = saatler;
    console.log(hat, ad, fmt(tarih), saatler.length, "sefer");
  }
}

await writeFile(new URL("../public/data.json", import.meta.url), JSON.stringify(out));
console.log("public/data.json yazıldı");
