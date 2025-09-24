// ===== In-memory data =====
let securities = [];
let prices = [];
let holdingsMin = [];
let countryAllocations = [];
let sectorAllocations = [];

let countryChart, sectorChart;

// ===== CSV helpers =====
function parseCsv(text) {
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

async function loadFileToVar(inputId, targetArray) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return false;
  const text = await file.text();
  const rows = parseCsv(text);
  targetArray.length = 0;
  targetArray.push(...rows);
  return true;
}

// ===== Domain helpers =====
function toNumber(v) {
  if (v == null) return 0;
  const s = String(v).replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function latestPriceMap() {
  const map = {};
  for (const r of prices) {
    const t = (r.ticker || "").trim();
    if (!t) continue;
    const d = (r.date || "").trim();
    const p = toNumber(r.price);
    if (!map[t] || d > map[t].date) {
      map[t] = { price: p, date: d };
    }
  }
  return map;
}

function computeHoldingsEnriched() {
  const last = latestPriceMap();
  return holdingsMin.map((h) => {
    const tkr = (h.ticker || "").trim();
    const qty = toNumber(h.quantity ?? h.units ?? h.qty);
    const sec = securities.find((s) => (s.ticker || "").trim() === tkr);
    const lp = last[tkr]?.price ?? toNumber(h.last_price ?? 0);
    const mvFromCsv = toNumber(h.market_value);
    const marketValue = mvFromCsv > 0 ? mvFromCsv : qty * (lp || 0);
    return {
      ticker: tkr,
      quantity: qty,
      last_price: lp || null,
      market_value: marketValue,
      type: sec?.type || "Unknown",
      country: sec?.country || "Unknown",
      sector: sec?.sector || "Unknown",
    };
  });
}

function lookThroughByCountry() {
  const out = {};
  const rows = computeHoldingsEnriched();
  for (const h of rows) {
    const weight = toNumber(h.market_value);
    if (!weight) continue;

    if ((h.type || "").toUpperCase() === "ETF") {
      const allocs = countryAllocations.filter((a) => (a.ticker || "").trim() === h.ticker);
      if (allocs.length) {
        for (const a of allocs) {
          const country = (a.country || "Unknown").trim();
          const pct = toNumber(a.weight) / 100;
          out[country] = (out[country] || 0) + weight * pct;
        }
        continue;
      }
    }
    const country = (h.country || "Unknown").trim();
    out[country] = (out[country] || 0) + weight;
  }
  return out;
}

function lookThroughBySector() {
  const out = {};
  const rows = computeHoldingsEnriched();
  for (const h of rows) {
    const weight = toNumber(h.market_value);
    if (!weight) continue;

    if ((h.type || "").toUpperCase() === "ETF") {
      const allocs = sectorAllocations.filter((a) => (a.ticker || "").trim() === h.ticker);
      if (allocs.length) {
        for (const a of allocs) {
          const sec = (a.sector || "Unknown").trim();
          const pct = toNumber(a.weight) / 100;
          out[sec] = (out[sec] || 0) + weight * pct;
        }
        continue;
      }
    }
    const sec = (h.sector || "Unknown").trim();
    out[sec] = (out[sec] || 0) + weight;
  }
  return out;
}

// ===== Rendering =====
function formatEUR(n) {
  const v = Number(n || 0);
  return v.toLocaleString("fi-FI", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function renderTable(rows) {
  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");

  const cols = ["ticker", "quantity", "last_price", "market_value", "type", "country", "sector"];
  thead.innerHTML = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;

  tbody.innerHTML = "";
  let total = 0;
  for (const r of rows) {
    total += Number(r.market_value || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.ticker ?? ""}</td>
      <td style="text-align:right">${r.quantity ?? ""}</td>
      <td style="text-align:right">${r.last_price == null ? "" : Number(r.last_price).toLocaleString("fi-FI")}</td>
      <td style="text-align:right">${formatEUR(r.market_value)}</td>
      <td>${r.type ?? ""}</td>
      <td>${r.country ?? ""}</td>
      <td>${r.sector ?? ""}</td>
    `;
    tbody.appendChild(tr);
  }
  document.getElementById("totalValue").textContent = formatEUR(total);
}

function renderPie(canvasId, dataObj, existingChartRefSetter) {
  const labels = Object.keys(dataObj);
  const data = Object.values(dataObj);
  const ctx = document.getElementById(canvasId).getContext("2d");

  const prev = existingChartRefSetter("get");
  if (prev) prev.destroy();

  const chart = new Chart(ctx, {
    type: "pie",
    data: { labels, datasets: [{ data }] },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  existingChartRefSetter(chart);
}

// ===== Main actions =====
document.getElementById("loadFiles").addEventListener("click", async () => {
  await loadFileToVar("secFile", securities);
  await loadFileToVar("priceFile", prices);
  await loadFileToVar("holdMinFile", holdingsMin);
  await loadFileToVar("countryFile", countryAllocations);
  await loadFileToVar("sectorFile", sectorAllocations);

  const rows = computeHoldingsEnriched();
  renderTable(rows);
  renderPie("byCountry", lookThroughByCountry(), (v) => {
    if (v === "get") return countryChart;
    countryChart = v;
  });
  renderPie("bySector", lookThroughBySector(), (v) => {
    if (v === "get") return sectorChart;
    sectorChart = v;
  });
});

// ===== Samples =====
const SAMPLE_SECURITIES = `ticker,type,country,sector
AAPL,Stock,USA,Technology
MSFT,Stock,USA,Technology
NOKIA,Stock,Finland,Technology
ETF1,ETF,USA,
`;

const SAMPLE_PRICES = `ticker,date,price
AAPL,2025-09-01,210
MSFT,2025-09-01,420
NOKIA,2025-09-01,3.5
ETF1,2025-09-01,100
`;

const SAMPLE_HOLDINGS_MIN = `ticker,quantity
AAPL,10
MSFT,5
ETF1,20
`;

const SAMPLE_COUNTRY_ALLOC = `ticker,country,weight
ETF1,USA,60
ETF1,Finland,25
ETF1,Germany,15
`;

const SAMPLE_SECTOR_ALLOC = `ticker,sector,weight
ETF1,Technology,50
ETF1,Health Care,20
ETF1,Industrials,30
`;

document.getElementById("loadSamples").addEventListener("click", () => {
  securities = parseCsv(SAMPLE_SECURITIES);
  prices = parseCsv(SAMPLE_PRICES);
  holdingsMin = parseCsv(SAMPLE_HOLDINGS_MIN);
  countryAllocations = parseCsv(SAMPLE_COUNTRY_ALLOC);
  sectorAllocations = parseCsv(SAMPLE_SECTOR_ALLOC);

  const rows = computeHoldingsEnriched();
  renderTable(rows);
  renderPie("byCountry", lookThroughByCountry(), (v) => {
    if (v === "get") return countryChart;
    countryChart = v;
  });
  renderPie("bySector", lookThroughBySector(), (v) => {
    if (v === "get") return sectorChart;
    sectorChart = v;
  });
});
