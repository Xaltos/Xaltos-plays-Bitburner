//import { NS, NodeStats } from "../NetscriptDefinitions";
export async function main(ns: NS): Promise<void> {


   const player = ns.getPlayer();
   const numSleeves = ns.sleeve.getNumSleeves();


   // 2. Schleife für jeden einzelnen Sleeve
   for (let i = 0; i < numSleeves; i++) {
      var erg = ns.sleeve.setToUniversityCourse(i, "Rothman University", "Algorithms");
      ns.tprint("Setzte:" + i + " " + erg);
   }
}