export async function main(ns: NS) {
   // Name der Ausgabedatei
   const fileName = "work\stock_data.txt";

   // Holt alle verfügbaren Aktien-Kürzel
   const stockSymbols = ns.stock.getSymbols();

   // Erstellt die Kopfzeile für Excel (Zeitstempel + alle Aktiennamen)
   // Beispiel: Zeit;ECOR;MGCP;BLD;...
   let header = "Zeit;" + stockSymbols.join(";");

   // Falls die Datei noch nicht existiert, erstellen wir sie mit der Kopfzeile.
   // Wenn sie existiert, lassen wir sie unberührt, um alte Daten nicht zu löschen.
   if (!ns.fileExists(fileName)) {
      ns.write(fileName, header + "\n", "w");
   }

   ns.tprint("Starte Datenaufzeichnung in " + fileName + "...");

   while (true) {
      // Zeitstempel im Format HH:MM:SS für die Excel-X-Achse
      let timeString = new Date().toLocaleTimeString();
      let rowData = timeString;

      // Geht jede Aktie durch und holt den aktuellen Preis (Ask-Preis)
      for (const symbol of stockSymbols) {
         let price = ns.stock.getAskPrice(symbol);

         // Wichtig für deutsches Excel: Punkt durch Komma ersetzen,
         // damit Excel die Zahlen sofort als Währung/Zahl erkennt.
         let formattedPrice = price.toString().replace(".", ",");

         rowData += ";" + formattedPrice;
      }

      // Schreibt die Zeile in die Datei ("a" steht für append = anhängen)
      ns.write(fileName, rowData + "\n", "a");
      ns.tprint(rowData);

      // Ein Markt-Tick in Bitburner dauert ca. 4 bis 6 Sekunden.
      // Ein sleep von 5000 ms (5 Sekunden) spart Rechenleistung (RAM) im Spiel.
      await ns.sleep(5000);
   }
}