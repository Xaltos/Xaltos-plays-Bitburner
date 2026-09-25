// Das Programm kann af zwei arten verwenmdet werden.

// Die Weg über getStockDataFromGUI() benötigt das "4S Market Data UI Access"      Feat  (1b)
// Man muss aber die ganze Zeit die Stock Market Daten anzeigen lassen.
// Die Weg über getStockData()        benötigt das "4S Market Data TIX API Access" Feat  (25b)

// Das Programm such nach Aktionen mit einem "++" oder "--" Rating zum kaufen.
// Wenn der Forecast  auf "-" oder "+ wechslt , wird verkauft.

interface GUIStockData {
   ticker: string;
   volatility: number;
   forecast: string;
   forecast2: number;
}

/**  HELPER FÜR DIE DURCHSCHNITTS‑ANZEIGE   */
function formatDuration(seconds: number): string {
   const d = Math.floor(seconds / 86400);
   const h = Math.floor((seconds % 86400) / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = Math.floor(seconds % 60);
   return `${d}d ${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**-Liest die aktuellen Volatilitäts- und Prognosewerte direkt aus der Bitburner GUI.  */
function getStockDataFromGUI(): GUIStockData[] {
   const stockMarketData: GUIStockData[] = [];
   const doc: Document = eval("document");

   const paragraphs = Array.from(doc.querySelectorAll("p"));
   const stockParagraphs = paragraphs.filter(p => p.textContent && p.textContent.includes("Volatility:"));

   for (const p of stockParagraphs) {
      const text = p.textContent;
      if (!text) continue;

      // Regex kann ggf. an Ihre GUI‑Ausgabe angepasst werden
      const regex =
         /([A-Z]{3,6})\s*-\s*[\d,k\s€.-]+\s*Volatility:\s*([\d,.]+)\s*%\s*-\s*Price Forecast:\s*([+-]+)$/;
      const match = text.match(regex);

      if (match) {
         const ticker = match[1];
         var volatility = parseFloat(match[2].replace(",", "."));
         var forecast = match[3];
         var forecast2 = 1;

         stockMarketData.push({ ticker, volatility, forecast, forecast2 });
      }

   }
   return stockMarketData;
}

/**-Liest die aktuellen Volatilitäts- und Prognosewerte über dir API  */
function getStockData(ns: NS): GUIStockData[] {

   const stockMarketData: GUIStockData[] = [];
   const symbols: string[] = ns.stock.getSymbols();
   for (const ticker of symbols) {
      const volatility = ns.stock.getVolatility(ticker) * 100;

      var forecast = "0";
      const fc = ns.stock.getForecast(ticker);
      // > 0 + > 60 ++  > 70 +++
      // <0    < 40 --  < 30 ---
      /*
      if (fc > 0.50) forecast = "+";
      if (fc > 0.60) forecast = "++";
      if (fc > 0.70) forecast = "+++";
      if (fc < 0.50) forecast = "-";
      if (fc < 0.40) forecast = "--";
      if (fc < 0.30) forecast = "---";
      */

      // leicht verschobene Grenzwerte (2%), damit wir mehr ++ Werte bekommen
      if (fc > 0.50) forecast = "+";
      if (fc > 0.58) forecast = "++";
      if (fc > 0.70) forecast = "+++";
      if (fc < 0.50) forecast = "-";
      if (fc < 0.42) forecast = "--";
      if (fc < 0.30) forecast = "---";

      var forecast2 = fc;

      stockMarketData.push({ ticker, volatility, forecast, forecast2 });
   }
   return stockMarketData;
}

/*** ---------- Konstanten --------------------------------------- ***/
const MIN_TRADE_VALUE = 5_000_000;          // Unter diesem Wert wird nicht gehandelt
const FEE_PER_TRANSACTION = 100_000;
const NICHT_AUSGEBEN = 2_000_000            // Betrag der reserviert ist und nicht für Shares ausgegeben wird.
//const NICHT_AUSGEBEN = 10_000_000_000         // Extra hoch, für Grafting

export async function main(ns: NS): Promise<void> {
   ns.disableLog("ALL");
   ns.ui.openTail();

   /* ──────────────────────  START‑TIME, START‑CAPITAL  ────────────────────── */
   const scriptStartTime = Date.now();            // Zeitpunkt des Skriptstarts (ms)
   const symbols: string[] = ns.stock.getSymbols();
   const fee = FEE_PER_TRANSACTION;

   // Startkapital ermitteln
   const startCash: number = ns.getServerMoneyAvailable("home");
   let startStockValue = 0;
   for (const sym of symbols) {
      const pos = ns.stock.getPosition(sym);
      startStockValue += (pos[0] * pos[1]) + (pos[2] * pos[3]);
   }
   const startTotalNetWorth = startCash + startStockValue;

   // Historie-Objekt für Forecast-Verläufe
   const forecastHistory: { [key: string]: string[] } = {};
   for (const sym of symbols) {
      forecastHistory[sym] = [];
   }

   ns.tprint("📈 BN8-GUI-Trading-Bot gestartet. Überwachung läuft...");

   /* ---------- Haupt‑Loop ------------------------------------------- */
   while (true) {

      const currentCash: number = ns.getServerMoneyAvailable("home");
      let currentStockValue = 0;
      const activePositionsRows: string[] = [];         // Dashboard‑Einträge

      /* ---------- GUI‑Daten auslesen ------------------------------- */
      var guiData: GUIStockData[];
      if (ns.stock.hasTixApiAccess())    // Mit API  (besser)
         guiData = getStockData(ns);
      else
         guiData = getStockDataFromGUI();  // Ohne API aber mit GUI Feature ...   (man muss den Tab immer aufgerufen)


      if (guiData.length === 0) {
         ns.print("⚠️ WARNUNG: Bitte das 'Stock Market'-Menü in der GUI öffnen!");
         await ns.sleep(1000);
         continue;
      }

      /* ---------- Forecast‑Historie befüllen ----------------------- */
      for (const guiStock of guiData) {
         const sym = guiStock.ticker;
         if (forecastHistory[sym]) {
            forecastHistory[sym].unshift(guiStock.forecast);

            if (forecastHistory[sym].length > 2) {
               forecastHistory[sym].pop();
            }
         }
      }

      /* ---------- Positionen analysieren & Dashboard‑Einträge -------- */
      for (const sym of symbols) {
         const pos = ns.stock.getPosition(sym);
         const longShares = pos[0];
         const avgLongPrice = pos[1];
         const shortShares = pos[2];
         const avgShortPrice = pos[3];

         const currentGui = guiData.find(g => g.ticker === sym);
         const fc = currentGui ? currentGui.forecast : "?";
         const volatility = (currentGui ? currentGui.volatility : 0) / 100;

         const fc2 = ns.stock.getForecast(sym);
         //const fc2 = 0;

         if (longShares > 0 && avgLongPrice > 0) {
            const saleGain = ns.stock.getSaleGain(sym, longShares, "L");
            const cost = longShares * avgLongPrice;
            const profit = saleGain - cost - fee;
            currentStockValue += saleGain;

            activePositionsRows.push(` ${sym.padEnd(5)} | LONG  | ${ns.format.number(saleGain, 0).toString().padStart(7)} | ${fc.padStart(3)} ${ns.format.percent(fc2)}| ${ns.format.percent(volatility).toString().padStart(5)} | Profit: ${ns.format.number(profit).toString().padStart(9)}`);

         }
         if (shortShares > 0 && avgShortPrice > 0) {
            const saleGain = ns.stock.getSaleGain(sym, shortShares, "S");
            const cost = shortShares * avgShortPrice;
            const profit = saleGain - cost - fee;
            currentStockValue += saleGain;

            activePositionsRows.push(` ${sym.padEnd(5)} | SHORT | ${ns.format.number(saleGain, 0).toString().padStart(7)} | ${fc.padStart(3)} ${ns.format.percent(fc2)}| ${ns.format.percent(volatility).toString().padStart(5)} | Profit: ${ns.format.number(profit).toString().padStart(9)}`);
         }
      }

      /* ---------- Sortierung nach Volatilität --------------------- */
      //const sortedStocks = [...guiData].sort((a, b) => b.volatility - a.volatility);
      const sortedStocks = [...guiData].sort((a, b) => (Math.abs(b.forecast2 - 0.5) * 2 * b.volatility) -
         (Math.abs(a.forecast2 - 0.5) * 2 * a.volatility));




      // Vorloop , damit wir gleich das passende Geld ausgeben und nicht zu viele Gebüren anfallen
      var Teiler = 1;    // Wir können 100% der Aktien erreichen.  da macht die Teiler Logik probleme
      const investMoney = (ns.getServerMoneyAvailable("home") - NICHT_AUSGEBEN) / Teiler;

      /* ---------- Handels‑Logik ------------------------------------ */
      for (const guiStock of sortedStocks) {
         const sym = guiStock.ticker;
         const history = forecastHistory[sym];
         if (!history) continue;

         const isDoublePlus = history.length >= 2 && history[0].startsWith("++") && history[1].startsWith("++");
         const isDoubleMinus = history.length >= 2 && history[0].startsWith("--") && history[1].startsWith("--");

         const pos = ns.stock.getPosition(sym);
         const longShares = pos[0];
         const avgLongPrice = pos[1];
         const shortShares = pos[2];
         const avgShortPrice = pos[3];
         const price = ns.stock.getPrice(sym);

         /* ---- Kapital‑Allokation (für jeden Ticker) ---------------- */


         /* ------------------ LONG STRATEGIE ------------------------ */
         if (isDoublePlus) {                                 // Long bei stabilem „++“
            if (longShares < ns.stock.getMaxShares(sym)) {
               const maxBuy = ns.stock.getMaxShares(sym) - longShares;
               const affordBuy = Math.floor((investMoney - fee) / price);
               const toBuy = Math.min(maxBuy, affordBuy);

               // Mindestwert prüfen
               if (toBuy > 0 && (toBuy * price) >= MIN_TRADE_VALUE) {
                  const buyPrice = ns.stock.buyStock(sym, toBuy);
                  if (buyPrice > 0) {
                     ns.tprint(`🟩 [LONG KAUF] ${sym} – gekauft: ${ns.format.number(toBuy)} @ ${buyPrice} = ${ns.format.number(toBuy * buyPrice)}`);
                  }
               }
            }
         } else if (guiStock.forecast.startsWith("-") && longShares > 0) {   // Trend‑Bruch → Verkauf
            const saleGain = ns.stock.getSaleGain(sym, longShares, "L");
            if ((saleGain - fee) >= 0) {
               const sellPrice = ns.stock.sellStock(sym, longShares);
               if (sellPrice > 0) {
                  ns.tprint(`🟥 [LONG VERKAUF] ${sym} – Trend gebrochen. Verkauft für ${ns.format.number(sellPrice * longShares)}`);
               }
            }
         }

         /* ------------------ SHORT STRATEGIE ----------------------- */
         if (isDoubleMinus) {                                 // Short bei stabilem „--“
            if (shortShares < ns.stock.getMaxShares(sym)) {
               const maxShort = ns.stock.getMaxShares(sym) - shortShares;
               const affordShort = Math.floor((investMoney - fee) / price);
               const toShort = Math.min(maxShort, affordShort);

               if (toShort > 0 && (toShort * price) >= MIN_TRADE_VALUE) {
                  const shortPrice = ns.stock.buyShort(sym, toShort);
                  if (shortPrice > 0) {
                     ns.tprint(`🟢 [SHORT EINSTIEG] ${sym} – eröffnet: ${ns.format.number(toShort)} @ ${shortPrice} = ${ns.format.number(toShort * shortPrice)}`);
                  }
               }
            }
         } else if (guiStock.forecast.startsWith("+") && shortShares > 0) {   // Trend‑Bruch → Short‑Ausstieg
            const saleGain = ns.stock.getSaleGain(sym, shortShares, "S");
            if ((saleGain - fee) >= 0) {
               const sellShortPrice = ns.stock.sellShort(sym, shortShares);
               if (sellShortPrice > 0) {
                  ns.tprint(`🔴 [SHORT AUSSTIEG] ${sym} – Trend gebrochen.  Verkauft für ${ns.format.number(sellShortPrice * shortShares)}`);
               }
            }
         }
      }

      /* ----------------- Dashboard‑Ausgabe ----------------------- */
      const totalNetWorth = currentCash + currentStockValue;
      const netProfit = totalNetWorth - startTotalNetWorth;

      /* --------- Zeit‑ und Leistungsdaten berechnen ---------------- */
      const elapsedMs = Date.now() - scriptStartTime;          // seit Start in ms
      const elapsedSeconds = elapsedMs / 1000;                // …in s
      const formattedRuntime = formatDuration(elapsedSeconds);

      const percentProfit = (netProfit / startTotalNetWorth) * 100;
      const moneyPerSecond =
         elapsedSeconds > 0 ? netProfit / elapsedSeconds : 0;

      const BonusTime = ns.stock.getBonusTime();

      /* --------- Anzeige ---------- */
      ns.clearLog();
      ns.print(` Bargeld:         ${ns.format.number(currentCash, 3)} `);
      ns.print(` Depot:           ${ns.format.number(currentStockValue, 3)} `);
      ns.print(` GESAMTVERMÖGEN:  ${ns.format.number(totalNetWorth, 3)} `);
      ns.print(` Gewinn/Verlust:  ${ns.format.number(netProfit, 3)} `);
      ns.print(` Laufzeit:        ${formattedRuntime} | €/Sek: ${ns.format.number(moneyPerSecond, 2)} | % Gewinn: ${percentProfit.toFixed(2)}%`);
      ns.print(` BonusTime:       ${formatDuration(BonusTime / 1000)}`);
      ns.print("=========================================================");

      if (activePositionsRows.length === 0) {
         ns.print("  [Keine aktiven Positionen. Warte auf Daten...]");
      } else {
         for (const row of activePositionsRows) {
            ns.print(row);
         }
      }

      /* ----------------- Tick‑Synchronisation ---------------------- */
      const sampleSym = symbols[0];
      const oldPrice = ns.stock.getPrice(sampleSym);
      while (oldPrice === ns.stock.getPrice(sampleSym)) {
         await ns.sleep(200);
      }
   } // while
}
