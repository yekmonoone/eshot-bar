# Sıradaki Otobüs

Seçtiğin ESHOT hatlarının bir sonraki kalkışını gösterir (planlanan saatler, canlı konum değil).
Hatlar sayfadaki "Hat ekle / çıkar" düğmesiyle seçilir; seçim telefonda saklanır.

## Saatler
`node scripts/fetch.mjs` tüm hatların saatlerini `public/data.json`'a yazar.
GitHub Actions bunu her pazartesi kendisi yapıp siteyi yeniler.

## Yayın
GitHub Pages: https://yekmonoone.github.io/eshot-bar/ (main'e push edilince otomatik).

## Yerelde dene
    npx serve public

Saati taklit etmek için: `/?t=2026-11-28T07:05:00+03:00`
