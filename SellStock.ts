export async function main(ns: NS) {
   // Gebühr für jede Transaktion im Spiel (Kauf und Verkauf kostet je 100k)
   const transactionFee = 100000;

   // Holt alle Aktien-Kürzel
   const stockSymbols = ns.stock.getSymbols();
   let totalSoldCount = 0;

   ns.tprint("Starte automatischen Aktien-Verkauf bei Profit (Long & Short)...");

   for (const symbol of stockSymbols) {
      // Position abfragen: [0]=Long-Menge, [1]=Long-Schnitt, [2]=Short-Menge, [3]=Short-Schnitt
      const position = ns.stock.getPosition(symbol);
      const sharesLong = position[0];
      const avgPriceLong = position[1];
      const sharesShort = position[2];
      const avgPriceShort = position[3];

      // 1. LOGIK FÜR LONG-POSITIONEN (Kauf bei niedrig, Verkauf bei hoch)
      if (sharesLong > 0) {
         const currentBidPrice = ns.stock.getBidPrice(symbol);
         const spentMoney = sharesLong * avgPriceLong;
         const currentWorth = sharesLong * currentBidPrice;
         const netProfitLong = currentWorth - spentMoney - transactionFee;

         if (netProfitLong > 0) {
            const soldPrice = ns.stock.sellStock(symbol, sharesLong);
            if (soldPrice > 0) {
               ns.tprint(`✅ LONG VERKAUFT: ${symbol} | Menge: ${sharesLong.toLocaleString()} | Profit: +$${netProfitLong.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
               totalSoldCount++;
            } else {
               ns.tprint(`❌ Fehler beim Verkauf der Long-Position von ${symbol}`);
            }
         }
      }

      // 2. LOGIK FÜR SHORT-POSITIONEN (Profit bei fallenden Kursen)
      if (sharesShort > 0) {
         // Bei Shorts kaufst du zum Ask-Preis zurück, um die Position zu schließen
         const currentAskPrice = ns.stock.getAskPrice(symbol);

         // Gewinn entsteht, wenn der Einstiegspreis (avgPriceShort) HÖHER ist als der aktuelle Ask-Preis
         const shortGainPerShare = avgPriceShort - currentAskPrice;
         const netProfitShort = (sharesShort * shortGainPerShare) - transactionFee;

         if (netProfitShort > 0) {
            // Kürzel für Shorts schließen ist sellShort
            const soldPriceShort = ns.stock.sellShort(symbol, sharesShort);
            if (soldPriceShort > 0) {
               ns.tprint(`📉 SHORT VERKAUFT: ${symbol} | Menge: ${sharesShort.toLocaleString()} | Profit: +$${netProfitShort.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
               totalSoldCount++;
            } else {
               ns.tprint(`❌ Fehler beim Verkauf der Short-Position von ${symbol}`);
            }
         }
      }
   }

   if (totalSoldCount === 0) {
      ns.tprint("ℹ️ Keine Aktien im Besitz oder keine Position wirft aktuell echten Profit ab.");
   } else {
      ns.tprint(`📊 Fertig! ${totalSoldCount} Position(en) erfolgreich liquidiert.`);
   }
}