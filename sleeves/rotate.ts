/** @param {NS} ns */
export async function main(ns: NS) {

   //let faction: FactionName = "Tian Di Hui";
   //let faction: FactionName = "Netburners";
   //let faction: FactionName = "NiteSec";
   //let faction: FactionName = "The Black Hand";
   let faction: FactionName = "BitRunners";
   let factionwork: FactionWorkType = "field";


   const RESET = "\u001b[0m";
   const ROT = "\u001b[31m";
   const GRUEN = "\u001b[32m";
   const GELB = "\u001b[33m";
   const BLAU = "\u001b[34m";
   const LILA = "\u001b[35m";
   const CYAN = "\u001b[36m";


   //"Netburners"

   ns.disableLog('ALL');
   ns.ui.openTail();


   const sleeveCount = ns.sleeve.getNumSleeves()

   // Set how long (in ms) each sleeve should stay on the target task
   let cycleTime = 20000; // 1 minute

   let activeSleeve = 0;

   while (true) {
      // 1. Set all sleeves to Idle
      for (let i = 0; i < sleeveCount; i++) {
         if (i !== activeSleeve) {
            ns.sleeve.setToIdle(i);
         }
      }
      ns.sleeve.setToFactionWork(activeSleeve, faction, factionwork);

      // Pause bis Bonuszeit verbraucht ist
      while (true) {

         // Ausgabe 
         let SumZeit = 0;
         for (let i = 0; i < sleeveCount; i++) {
            var curSleeve: SleevePerson = ns.sleeve.getSleeve(i);

            if (i !== activeSleeve) {
               ns.print(`Sleeve: ${i} für ${curSleeve.storedCycles * 200 / 1000} s`);
            }
            else
               ns.print(GELB + `Sleeve: ${i} für ${curSleeve.storedCycles * 200 / 1000} s <==` + RESET);
            SumZeit += curSleeve.storedCycles;
         }
         ns.print(GRUEN + `Alle Zusammen: ${SumZeit * 200 / 1000} s` + RESET);

         if (SumZeit * 200 / 1000 < 40) { // wenn alle Zeiten extrem klein sind, mal eine Pause beim Loopen machen
            ns.print(GRUEN + "-- Kurze Pause --" + RESET);
            await ns.sleep(30000);
         }

         curSleeve = ns.sleeve.getSleeve(activeSleeve);
         if (curSleeve.storedCycles <= 6)
            break;
         await ns.sleep(1000);
      }

      activeSleeve = (activeSleeve + 1) % sleeveCount;        // Advance to the next sleeve in the loop

   }
}