# Konak Otobüs

Konak'tan kalkan 193, 224 ve 588 hatlarının bir sonraki kalkışını gösterir (planlanan saatler, canlı konum değil).

## Saatleri güncelle
Tarife değişince (veya ayda bir):

    node scripts/fetch.mjs

Hatları değiştirmek için `scripts/fetch.mjs` içindeki `HATLAR` dizisini düzenle.

## Yayınla (ücretsiz)
`public/` klasörünü Netlify Drop (app.netlify.com/drop) veya GitHub Pages'e yükle. Safari'de aç → Paylaş → Ana Ekrana Ekle.

## Yerelde dene
    npx serve public

Saati taklit etmek için: `/?t=2026-11-28T07:05:00+03:00`
