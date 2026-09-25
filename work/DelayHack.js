/** @param {NS} ns **/
export async function main(ns) {
   const target = ns.args[0];
   const delay = ns.args[1];
   let Endzeit = "-";
   if (ns.args.length >= 3)
      Endzeit = ns.args[2];


   //ns.tprint("Start Hack");
   // Warte die berechnete Zeit ab, bevor der Hack startet
   if (delay > 0) {
      await ns.sleep(delay);
   }

   var GrowSetting = { stock: true };

   // Jetzt startet der Hack und kommt exakt zur richtigen Zeit an
   var Wert = await ns.hack(target, GrowSetting);
   //ns.tprint("End Hack: " + Wert + " (Soll:" + Endzeit + ")");
}