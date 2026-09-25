export async function main(ns: NS): Promise<void> {

   while (true) {
      // Holt alle verfügbaren Aktien-Kürzel im Spiel
      const symbols = ns.stock.getSymbols();

      // Array zum Zwischenspeichern aller Aktiendaten für die Sortierung
      const stockData = [];

      for (const sym of symbols) {
         // Firmenname und aktueller Preis
         const organization = ns.stock.getOrganization(sym);
         const price = ns.stock.getPrice(sym);

         // Maximale Aktienanzahl und Berechnung des Gesamtwerts bei 100% Besitz
         const maxShares = ns.stock.getMaxShares(sym);
         const totalMaxPrice = price * maxShares;

         const pos = ns.stock.getPosition(sym);
         const longShares = pos[0];
         const avgLongPrice = pos[1];
         const shortShares = pos[2];
         const avgShortPrice = pos[3];

         const ProzentOwned = (longShares + shortShares) / maxShares;


         // Trend-Berechnung über die Forecast-Wahrscheinlichkeit (TIX API benötigt)
         const forecast = ns.stock.getForecast(sym);
         const vol = ns.stock.getVolatility(sym);
         let trend = "➡️ [0  ]";

         if (forecast >= 0.70) trend = "🟩 [+++]";
         else if (forecast >= 0.60) trend = "🟩 [++ ]";
         else if (forecast > 0.53) trend = "🟩 [+  ]";
         else if (forecast <= 0.30) trend = "🟥 [---]";
         else if (forecast <= 0.40) trend = "🟥 [-- ]";
         else if (forecast < 0.47) trend = "🟥 [-  ]";

         var score = Math.abs(forecast - 0.5) * 2 * vol;



         // Daten als Objekt in das Array pushen
         stockData.push({
            organization,
            sym,
            totalMaxPrice,
            trend,
            forecast,
            vol,
            ProzentOwned,
            score
         });
      }

      // Sortiert das Array nach dem Forecast-Wert absteigend (beste Trends ganz oben)
      //stockData.sort((a, b) => b.forecast - a.forecast);
      stockData.sort((a, b) => b.score - a.score);

      // Ausgabe im Terminal
      ns.tprint("------------------------------------------------------------------------------------------------------");
      ns.tprint(`${"Firma".padEnd(25)} | ${"Kürzel".padEnd(6)} | ${"Gesamtwert (Max)".padStart(14)} | ${"Trend"}            | Volatility`);
      ns.tprint("------------------------------------------------------------------------------------------------------");

      for (const stock of stockData) {
         ns.tprint(
            `${stock.organization.padEnd(25)} | ` +
            `${stock.sym.padEnd(6)} | ` +
            `${ns.format.number(stock.totalMaxPrice, 1).padStart(8)} ${ns.format.percent(stock.ProzentOwned, 0).padStart(5)} | ` +
            `${stock.trend} ${ns.format.percent(stock.forecast)} | ` +
            `${ns.format.percent(stock.vol)} | ` +
            `${ns.format.percent(stock.score)}`
         );
      }
      ns.tprint("------------------------------------------------------------------------------------------------------");
      await ns.sleep(1000);
   }
}
