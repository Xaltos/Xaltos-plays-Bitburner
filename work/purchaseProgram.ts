/** @param {NS} ns */
export async function main(ns: NS) {
   const programs = [
      "BruteSSH.exe",
      "FTPCrack.exe",
      "relaySMTP.exe",
      "HTTPWorm.exe",
      "SQLInject.exe"
   ];

   for (const prog of programs) {
      // Versuch, das Programm zu kaufen
      const success: boolean = ns.singularity.purchaseProgram(prog);

      if (success) {
         // Kauf war erfolgreich – positives Feedback
         ns.tprint(`✅ Erfolgreich gekauft: ${prog}`);
      } else {
         // Kauf fehlgeschlagen – ggf. bereits besitzt oder nicht genug Geld
         ns.tprint(`❌ Kauf fehlgeschlagen (${prog})`);
      }
   }
}
