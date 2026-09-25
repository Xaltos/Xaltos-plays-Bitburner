// Wichtig:  Vor dem Uebertragen die erste Zeile loeschen
//import { NS, NodeStats, BladeburnerSkillName, BladeburnerOperationName, BladeburnerContractName } from "./NetscriptDefinitions";

export async function main(ns: NS) {
   //ns.disableLog("ALL");
   ns.disableLog("sleep");
   ns.ui.openTail();

   // Tritt den Bladeburners bei, falls noch nicht geschehen
   /*    if (!ns.bladeburner.inBladeburner()) {
           ns.bladeburner.joinBladeburnerDivision;
       }    */

   // Prioritätenliste für Upgrades der aktuellen Skills

   const skillPriority: BladeburnerSkillName[] = [
      "Overclock",         // Erhöht die Aktionsgeschwindigkeit massiv
      "Blade's Intuition", // Erhöht die Erfolgschance für alles
      "Cloak",             // Verbessert Tarnung für Verträge
      "Digital Observer",  // Verbessert Operations-Erfolgschancen
      "Reaper",            // Erhöht den Kampfschaden
      "Evasive System",    // Schadensvermeidung
      "Tracer",
      "Short-Circuit",
      "Hyperdrive",
      "Datamancer",
      "Cyber's Edge",
      "Hands of Midas"
   ];

   /*
      const skillPriority: BladeburnerSkillName[] = [
         "Overclock",         // Erhöht die Aktionsgeschwindigkeit massiv
         "Hyperdrive"
      ];
      */


   // Daten im dritten Tab
   const contracts: BladeburnerContractName[] =
      ["Bounty Hunter",
         "Retirement",
         "Tracking"
      ];

   // Daten im zweitem Tab
   const operations: BladeburnerOperationName[] =
      ["Assassination",
         "Undercover Operation",
         "Investigation",
         "Sting Operation"
      ];



   let Mode = "";
   while (true) {

      const stamina = ns.bladeburner.getStamina();
      const currentStamina = stamina[0]; // Aktueller Wert
      const maxStamina = stamina[1];     // Maximaler Wert

      const hp = ns.getPlayer().hp.current;
      const hpMax = ns.getPlayer().hp.max;



      // 1. Ausdauer-Management (Heilen bei unter 50% Stamina)

      if (currentStamina / maxStamina < 0.5 || hp / hpMax < 0.8) {
         ns.print("WARNung: Ausdauer niedrig. Regneration läuft HP:" + hp + "/" + hpMax + " Stamina:" + (currentStamina / maxStamina * 100).toFixed(0) + "%");
         if (Mode != "Stamina Regeneration") {   // Nicht ständig neu starten, wenn bereits in Regeneration
            ns.bladeburner.startAction("General", "Hyperbolic Regeneration Chamber");
            Mode = "Stamina Regeneration";
         }
         await ns.sleep(10000); // Wartet 10 Sekunden vor der nächsten Prüfung
         continue;
      }

      // 2. Automatisches Skill-Upgrade über die dynamische API
      const availablePoints = ns.bladeburner.getSkillPoints();
      for (const skill of skillPriority) {
         const cost = ns.bladeburner.getSkillUpgradeCost(skill);
         // Overclock hat ein Hard-Cap bei Level 90
         if (skill === "Overclock" && ns.bladeburner.getSkillLevel("Overclock") >= 90) {
            continue;
         }
         if (cost <= availablePoints) {
            ns.bladeburner.upgradeSkill(skill);
            ns.tprint(`Upgrade durchgeführt für Skill: ${skill}`);
         }
      }


      // 3. Missions- und Vertrags-Priorisierung
      let actionStarted = false;

      // BlackOps priorisieren, falls verfügbar und machbar
      const nextBlackOp = ns.bladeburner.getNextBlackOp();
      if (nextBlackOp) {
         const boChance = ns.bladeburner.getActionEstimatedSuccessChance("Black Operations", nextBlackOp.name);
         // Wenn die Chance bei 100% liegt (oder nahe dran), direkt ausführen
         if (boChance[0] >= 0.95) {
            if (Mode != nextBlackOp.name) {
               ns.bladeburner.startAction("Black Operations", nextBlackOp.name);
               ns.print(`CRITICAL: Starte BlackOp: ${nextBlackOp.name}`);
               Mode = nextBlackOp.name;
            }
            actionStarted = true;
         }
      }


      // Falls kein BlackOp läuft, lohnende Operations oder Contracts wählen
      if (!actionStarted) {

         // Versuche erst lukrative Operations
         for (const op of operations) {
            if (ns.bladeburner.getActionCountRemaining("Operations", op) > 0) {
               const chance = ns.bladeburner.getActionEstimatedSuccessChance("Operations", op);
               if (chance[0] >= 0.85) { // Sicherer Schwellenwert von 85% Mindestchance
                  if (Mode != op) {
                     ns.bladeburner.startAction("Operations", op);
                     Mode = op;
                  }
                  actionStarted = true;
                  break;
               }
            }
         }

         // Wenn keine Operation passt, Verträge prüfen
         if (!actionStarted) {
            for (const contract of contracts) {
               if (ns.bladeburner.getActionCountRemaining("Contracts", contract) > 0) {
                  const chance = ns.bladeburner.getActionEstimatedSuccessChance("Contracts", contract);
                  if (chance[0] >= 0.85) {
                     if (Mode != contract) {
                        ns.bladeburner.startAction("Contracts", contract);
                        Mode = contract;
                     }
                     actionStarted = true;
                     break;
                  }
               }
            }
         }
      }

      // 4. Fallback-Aktion: Wenn nichts verfügbar oder sicher genug ist, Daten sammeln
      if (!actionStarted) {
         ns.bladeburner.startAction("General", "Training");
      }

      // Schleifendurchlauf alle 2 Sekunden
      await ns.sleep(10000);
   }
}