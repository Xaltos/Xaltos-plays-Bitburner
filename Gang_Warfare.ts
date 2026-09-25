/** @param {NS} ns */
export async function main(ns: NS) {
   // Falls du keine Gang hast, bricht das Skript ab
   if (!ns.gang.inGang()) {
      ns.tprint("ERROR: Du hast aktuell keine Gang!");
      return;
   }

   // KONFIGURATION: Passe diese Aufgaben an deine Wünsche an!
   const WORK_TASK = "Human Trafficking"; // Deine beste Aufgabe für Geld/Respekt
   const WAR_TASK = "Territory Warfare";   // Die Kampf-Aufgabe für den Tick

   ns.tprint("Gang-Warfare-Skript gestartet. Synchronisiere mit dem 20-Sekunden-Tick...");

   let lastPower = ns.gang.getGangInformation().power;

   // Sicherstellen, dass Territory Warfare im UI aus ist (Sicherheit gegen starke Gegner)
   // HINWEIS: Wenn deine Gewinnchancen ÜBERALL bei >95% liegen, ändere dies auf 'true'!
   //ns.gang.setTerritoryWarfare(false);

   // Beim start erst mal Territory Warfare, damit sich der Wert auch erhöht und wir die Grenze finden
   let members = ns.gang.getMemberNames();
   for (let member of members) {
      ns.gang.setMemberTask(member, WAR_TASK);
   }


   while (true) {
      let currentPower = ns.gang.getGangInformation().power;

      // 1. Erkennt den exakten Moment, in dem der 20-Sekunden-Tick passiert ist
      if (currentPower !== lastPower) {
         lastPower = currentPower;

         // Sofort nach dem Tick zurück zur normalen Arbeit wechseln
         let gangInfo = ns.gang.getGangInformation();

         for (let member of members) {
            // Wenn die Wanted Penalty zu schlecht wird, steuern einige Mitglieder dagegen
            if (gangInfo.wantedLevel > 1 && gangInfo.wantedPenalty < 0.95) {
               // Die Hälfte der Gang wäscht nun Geld / bekämpft Verbrechen
               ns.gang.setMemberTask(member, "Vigilante Justice");
            } else {
               // Alles im grünen Bereich: Normal arbeiten
               ns.gang.setMemberTask(member, WORK_TASK);
            }
         }


         // 18.5 Sekunden warten (Der Tick passiert alle 20 Sekunden)
         await ns.sleep(18500);

         // 2. Kurz VOR dem nächsten Tick alle Mitglieder auf Kampf umstellen
         members = ns.gang.getMemberNames();
         for (let member of members) {
            ns.gang.setMemberTask(member, WAR_TASK);
         }

         // Optionale Sicherheitsabfrage: Aktiviert den echten Krieg nur, wenn alle Chancen sicher sind
         // ns.gang.setTerritoryWarfare(checkWinChances(ns));

         // Kurzer Sicherheits-Sleep, um das Event-Fenster des Ticks zu treffen
         await ns.sleep(2000);
      }

      // Sehr kurzes Intervall, um den Power-Wechsel präzise zu messen
      await ns.sleep(50);
   }
}