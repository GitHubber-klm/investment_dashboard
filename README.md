# Investor Dashboard (MVP, front-only, sector)

Tämä versio toimii **pelkästään selaimessa** – ei tarvita backend-palvelinta.  
CSV-tiedot pysyvät käyttäjän koneella, eikä niitä lähetetä verkkoon.  
Sovellus voidaan julkaista **Netlifyssä** tai avata suoraan `index.html` tiedostosta.

---

## Käyttö

1. Avaa `frontend/index.html` selaimessa (tai julkaise Netlifyssä).
2. Valitse CSV-tiedostot (securities, prices, holdings_min, country_alloc, sector_alloc).
3. Paina **"Lataa valitut tiedostot"**.
4. Näet:
   - Holdings-taulukon
   - Kokonaisarvon
   - Maa- ja sektorijakauma-kaaviot
5. Voit myös painaa **"Lataa samplet"**, jolloin demodata ilmestyy automaattisesti.

---

## CSV-formaatit

### securities.csv
ticker,type,country,sector
AAPL,Stock,USA,Technology
MSFT,Stock,USA,Technology
ETF1,ETF,USA,


### prices.csv
ticker,date,price
AAPL,2025-09-01,210
MSFT,2025-09-01,420
ETF1,2025-09-01,100


### holdings_min.csv
ticker,quantity
AAPL,10
MSFT,5
ETF1,20


### country_allocations.csv
ticker,country,weight
ETF1,USA,60
ETF1,Finland,25
ETF1,Germany,15


### sector_allocations.csv


ticker,sector,weight
ETF1,Technology,50
ETF1,Health Care,20
ETF1,Industrials,30


---

## Ominaisuudet

✅ CSV-lataus suoraan selaimessa  
✅ Holdings-taulukko + kokonaisarvo  
✅ Maa- ja sektorijakaumat (ETF look-through)  
✅ Sample-nappi nopeaan testaukseen  
✅ Ei backend-palvelinta – turvallinen ja helposti jaettavissa  

---

## Julkaisu Netlifyssä

1. Puske `frontend/` GitHubiin.
2. Luo Netlifyssä uusi sivu → liitä GitHub-repo.
3. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** *tyhjä*
   - **Publish directory:** `frontend`
4. Deploy → saat julkisen linkin esim. `https://sijoittaja-dashboard.netlify.app`.

---

