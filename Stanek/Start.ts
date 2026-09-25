export async function main(ns: NS) {

   // Koordinaten für die Charge-Funktion werden als Argumente übergeben.
   const args = ns.args as number[];

   if (args.length % 2 !== 0) {
      ns.tprint("❌ Ungültige Argumente: Erwartet Paare von x und y");
      return;
   }

   var Counter = 0;
   // Endlosschleife zum Aufladen der Fragmente
   while (true) {
      for (let i = 0; i < args.length; i += 2) {
         const x = args[i];
         const y = args[i + 1];
         await ns.stanek.chargeFragment(x, y);

      }
      //Counter++;
      //if (Counter > 1000)   // Das Script soll nicht endlos laufen 
//         break;

      // Kurzer Sleep zur Entlastung der CPU
      await ns.sleep(10);
   }

   ns.tprint("Stanek/Start.ts hat sich beendet");

}