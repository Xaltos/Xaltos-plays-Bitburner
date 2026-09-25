//import { NS, NodeStats } from "../NetscriptDefinitions";

export async function main(ns: NS): Promise<void> {

   // Logs ausschalten, um die Ausgabe zu reduzieren
   ns.disableLog("ALL");


   const numSleeves = ns.sleeve.getNumSleeves();                   // Ermittelt automatisch, wie viele Sleeves du aktuell besitzt

   for (let i = 0; i < numSleeves; i++) {
      // Holt die aktuellen Werte des jeweiligen Sleeves
      const stats = ns.sleeve.getSleeve(i);

      // 1. Priorität: Hat der Sleeve noch Schock, muss er sich erholen.
      if (stats.shock > 0) {
         ns.sleeve.setToShockRecovery(i);
         ns.print(`Sleeve ${i}: Schock abbauen (${stats.shock.toFixed(1)}% übrig)`);
      }
      // 2. Priorität: Ist der Sync unter 100%, muss er synchronisieren.
      else if (stats.sync < 100) {
         ns.sleeve.setToSynchronize(i);
         ns.print(`Sleeve ${i}: Sync aufbauenn (${stats.sync.toFixed(1)}% erreicht)`);
      }
      // 3. Jetzt können wir den Sleeve sinnvoll einsetzen. Hier kannst du die gewünschte Fraktion und Arbeitstyp anpassen.
      else {
         // Versucht den Sleeve der Fraktion zuzuweisen
         const success = ns.sleeve.setToCommitCrime(i, "Rob Store");
      }
   }
}