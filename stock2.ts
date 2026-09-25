interface StockHistory {
   [key: string]: number[];
}

export async function main(ns: NS): Promise<void> {
   ns.disableLog("ALL");
   ns.ui.openTail(); // Öffnet das Log-Fenster für das Dashboard

   const symbols: string[] = ns.stock.getSymbols();
   const max_history = 15;
   const fee = 100000;

   // Startkapital ermitteln, um den Gesamtgewinn zu berechnen
   const startCash: number = ns.getServerMoneyAvailable("home");
   let startStockValue = 0;
   for (const sym of symbols) {
      const pos = ns.stock.getPosition(sym);
      startStockValue += (pos[0] * pos[1]) + (pos[2] * pos[3]);
   }
   const startTotalNetWorth = startCash + startStockValue;

   // Initialisiere das Historie-Objekt
   const stockData: StockHistory = {};
   for (const sym of symbols) {
      stockData[sym] = [];
   }

   ns.tprint("📈 BN8-Trading-Bot gestartet. Dashboard im Log-Fenster aktiv.");

   while (true) {
      const currentCash: number = ns.getServerMoneyAvailable("home");
      let currentStockValue = 0;
      let activePositionsCount = 0;

      // Risikomanagement: 50 Mio. Reserve, Rest aufteilen
      //const investMoney: number = (currentCash - 50000000) / symbols.length;
      const investMoney: number = currentCash - 20000000;

      for (const sym of symbols) {
         const price: number = ns.stock.getPrice(sym);
         const history: number[] = stockData[sym];

         const pos: number[] = ns.stock.getPosition(sym);
         const longShares: number = pos[0];
         const shortShares: number = pos[2];

         // Aktuellen Wert der gehaltenen Positionen für die Bilanz berechnen
         if (longShares > 0) {
            currentStockValue += ns.stock.getSaleGain(sym, longShares, "L");
            activePositionsCount++;
         }
         if (shortShares > 0) {
            currentStockValue += ns.stock.getSaleGain(sym, shortShares, "S");
            activePositionsCount++;
         }

         // Handels-Logik erst nach ausreichender Historie
         if (history.length >= max_history) {
            const maxPrice: number = Math.max(...history);
            const minPrice: number = Math.min(...history);

            // --- LONG STRATEGIE ---
            if (price > maxPrice && shortShares === 0) {
               const maxBuy: number = ns.stock.getMaxShares(sym) - longShares;
               const affordBuy: number = Math.floor((investMoney - fee) / price);
               const toBuy: number = Math.min(maxBuy, affordBuy);

               if (toBuy > 0 && (toBuy * price) > 5000000) {
                  const buyPrice = ns.stock.buyStock(sym, toBuy);
                  if (buyPrice > 0) {
                     ns.tprint(`🟩 [LONG KAUF] ${sym}: ${toBuy.toLocaleString()} Anteile zu $${buyPrice.toFixed(2)} gekauft.`);
                  }
               }
            }
            else if (price < minPrice && longShares > 0) {
               const sellPrice = ns.stock.sellStock(sym, longShares);
               if (sellPrice > 0) {
                  ns.tprint(`🟥 [LONG VERKAUF] ${sym}: Alle ${longShares.toLocaleString()} Anteile zu $${sellPrice.toFixed(2)} verkauft.`);
               }
            }

            // --- SHORT STRATEGIE ---
            if (price < minPrice && longShares === 0) {
               const maxShort: number = ns.stock.getMaxShares(sym) - shortShares;
               const affordShort: number = Math.floor((investMoney - fee) / price);
               const toShort: number = Math.min(maxShort, affordShort);

               if (toShort > 0 && (toShort * price) > 5000000) {
                  const shortPrice = ns.stock.buyShort(sym, toShort);
                  if (shortPrice > 0) {
                     ns.tprint(`🟨 [SHORT EINSTIEG] ${sym}: ${toShort.toLocaleString()} Anteile zu $${shortPrice.toFixed(2)} geleert.`);
                  }
               }
            }
            else if (price > maxPrice && shortShares > 0) {
               const sellShortPrice = ns.stock.sellShort(sym, shortShares);
               if (sellShortPrice > 0) {
                  ns.tprint(`🟧 [SHORT AUSSTIEG] ${sym}: Alle ${shortShares.toLocaleString()} Short-Anteile zu $${sellShortPrice.toFixed(2)} glattgestellt.`);
               }
            }
         }

         // Historie rotieren
         history.unshift(price);
         if (history.length > max_history) {
            history.pop();
         }
      }

      // --- VERMÖGENS-DASHBOARD (ns.print) ---
      const totalNetWorth = currentCash + currentStockValue;
      const netProfit = totalNetWorth - startTotalNetWorth;
      const profitPrefix = netProfit >= 0 ? "+" : "";

      ns.clearLog();
      ns.print("==================================================");
      ns.print("               FINANZ-DASHBOARD (BN8)             ");
      ns.print("==================================================");
      ns.print(` Bargeld (Cash):      $${currentCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      ns.print(` Depotwert (Aktiven): $${currentStockValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      ns.print("--------------------------------------------------");
      ns.print(` GESAMTVERMÖGEN:     $${totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      ns.print(` Startvermögen:      $${startTotalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      ns.print(` Netto-Gewinn/Verlust: ${profitPrefix}$${netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      ns.print("--------------------------------------------------");
      ns.print(` Aktive Positionen:  ${activePositionsCount} von ${symbols.length} Aktien`);
      ns.print(` Daten-Status:       ${stockData[symbols[0]].length}/${max_history} Ticks gesammelt`);
      ns.print("==================================================");

      // Effizientes Warten auf den nächsten Markt-Tick
      const sampleSym: string = symbols[0];
      const oldPrice: number = ns.stock.getPrice(sampleSym);
      while (oldPrice === ns.stock.getPrice(sampleSym)) {
         await ns.sleep(200);
      }
   }
}
