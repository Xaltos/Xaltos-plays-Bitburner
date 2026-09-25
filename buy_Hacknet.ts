// Wichtig:  Vor dem Uebertragen die erste Zeile loeschen
//import { NS, NodeStats } from "./NetscriptDefinitions";


let Counter = 0;
export async function main(ns: NS) {


   //ns.scriptKill("buy_Hacknet.js");
   ns.disableLog('ALL');

   ns.print("Start");

   // Endlosschleife zur Überwachung
   while (true) {
      Counter++;
      let hashCapacity = ns.hacknet.hashCapacity();
      let numHashes = ns.hacknet.numHashes();


      // Bevore wir Punkte verlieren , werden die Punkte in Geld umgewandelt.
      if (numHashes + 50 >= hashCapacity)  // Fast voll
      {
         if (ns.hacknet.spendHashes("Sell for Money", "10")) {
            ns.hacknet.spendHashes("Sell for Money", "1000");
         }
      }

      /*
      type HacknetServerHashUpgrade =
        | "Sell for Money"
        | "Sell for Corporation Funds"
        | "Reduce Minimum Security"
        | "Increase Maximum Money"
        | "Improve Studying"
        | "Improve Gym Training"
        | "Exchange for Corporation Research"
        | "Exchange for Bladeburner Rank"
        | "Exchange for Bladeburner SP"
        | "Generate Coding Contract"
        | "Company Favor";
        */

      /*   Die Namen für Favor !!
      const companies = [
         "ECorp", "MegaCorp", "KuaiGong International", "Four Sigma", "NWO", 
         "Blade Industries", "OmniTek Incorporated", "Bachman & Associates", 
         "Clarke Incorporated", "Fulcrum Technologies", "Aevum Police Headquarters", 
         "Chao Systems", "SysCore Securities", "Universal Energy", "LexoCorp", 
         "Rho Construction", "Alpha Enterprises", "Omega Software", "Icarus Microsystems", 
         "Galactic Cybersystems", "DefComm", "Global Pharmaceuticals", "Solaris Space Systems", 
         "Central Intelligence Agency", "National Security Agency", "Watchdog Security", 
         "Quantum Force Capabilities", "CompuTek", "NetLink Technologies", "Joe's Guns", 
         "Iron Gym", "Max Hydroponics", "FoodNStuff"
      ];
      */


      //let fraction = "phantasy";
      /*
      let fraction = "b-and-a";

      if (ns.hacknet.spendHashes("Increase Maximum Money", fraction)) {
         ns.tprint("Increase Maximum Money");
      }

      if (ns.hacknet.spendHashes("Reduce Minimum Security", fraction)) {
         ns.tprint("Reduce Minimum Security");
      }*/

      /*
            if (ns.hacknet.spendHashes("Increase Maximum Money", "megacorp")) {
               ns.tprint("Increase Maximum Money");
            }
      
            if (ns.hacknet.spendHashes("Reduce Minimum Security", "megacorp")) {
               ns.tprint("Reduce Minimum Security");
            }
      */


      /*        
            if (ns.hacknet.spendHashes("Improve Studying"))
            {
               ns.tprint(timeStr + " Improve Studying.");
            }
            */


      /*
            if (ns.hacknet.spendHashes("Improve Studying")) {
               ns.tprint("Improve Studying");
            }
      
      
            if (ns.hacknet.spendHashes("Improve Gym Training")) {
               ns.tprint("Improve Gym Training");
            }
      */
      /*
            if (ns.hacknet.spendHashes("Company Favor","Four Sigma")) {
               ns.tprint("Company Favor "+" four sigma");
            }
      */
      /*
            if (ns.hacknet.spendHashes("Company Favor", "ECorp")) {
               ns.tprint("Company Favor " + "ECorp");
            }
      */
      /*
            if (ns.hacknet.spendHashes("Company Favor", "Computek")) {
               ns.tprint("Company Favor " + " computek");
            }
            */

      /*
            if (ns.hacknet.spendHashes("Sell for Money", "10")) {
               ns.print("Quick Money:Sell for Money.");
            }*/


      BuyUpdates4Hacknet(ns);

      // Kurze Pause, um die CPU zu schonen
      await ns.sleep(100);
   }
}


function BuyUpdates4Hacknet(ns: NS) {
   let bestOption = null;
   let highestRoi = 0;
   let myMoney = ns.getServerMoneyAvailable("home");

   // 1. Kosten und ROI für einen komplett neuen Knoten prüfen
   let nodeCount = ns.hacknet.numNodes();
   let newNodeCost = ns.hacknet.getPurchaseNodeCost();

   // Formel: Ein neuer Basis-Knoten produziert 1.46 Hashes/s (bei standard Multiplikatoren)
   let newNodeRoi = 1.46 / newNodeCost;

   if (newNodeRoi > highestRoi) {
      highestRoi = newNodeRoi;
      bestOption = { type: "node", cost: newNodeCost };
   }

   // 2. ROI für Upgrades aller bestehenden Knoten prüfen
   for (let i = 0; i < nodeCount; i++) {
      let stats = ns.hacknet.getNodeStats(i);

      // Level Upgrade
      let levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      if (levelCost !== Infinity) {
         // Gewinn: 0.104 Hashes/s pro Level * Cores-Bonus
         let gain = 0.104 * (1 + (stats.cores - 1) * 0.2);
         let roi = gain / levelCost;
         if (roi > highestRoi && myMoney * 3 >= levelCost) {
            highestRoi = roi;
            bestOption = { type: "level", index: i, cost: levelCost };
         }
      }

      // RAM Upgrade
      let ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      if (ramCost !== Infinity) {
         // Gewinn: Verdopplung des RAM-Multiplikators (Basis 1.0)
         let gain = stats.level * 0.07 * (stats.ram * 0.148) * (1 + (stats.cores - 1) * 0.2);
         let roi = gain / ramCost;
         if (roi > highestRoi && myMoney * 3 >= ramCost) {
            highestRoi = roi;
            bestOption = { type: "ram", index: i, cost: ramCost };
         }
      }

      // Core Upgrade
      let coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      if (coreCost !== Infinity) {
         // Gewinn: +20% auf die Basis-Produktion pro Core
         let gain = stats.level * 0.104 * (1 + (stats.ram - 1) * 0.07) * 0.2;
         let roi = gain / coreCost;
         if (roi > highestRoi && myMoney * 3 >= coreCost) {
            highestRoi = roi;
            bestOption = { type: "core", index: i, cost: coreCost };
         }
      }
   }

   let buyFlag = false;
   let Text = ""
   // 3. Die profitabelste Option ausführen, sobald genug Geld da ist
   if (bestOption) {
      if (myMoney >= bestOption.cost) {
         if (bestOption.type === "node") {
            ns.hacknet.purchaseNode();
            Text = `Neuen Knoten gekauft für ${ns.format.number(bestOption.cost)}`;
            buyFlag = true;

         } else if (bestOption.type === "level") {
            ns.hacknet.upgradeLevel(bestOption.index, 1);
            Text = `Knoten ${bestOption.index} Level+1 für ${ns.format.number(bestOption.cost)}`;
            buyFlag = true;
         } else if (bestOption.type === "ram") {
            ns.hacknet.upgradeRam(bestOption.index, 1);
            Text = `Knoten ${bestOption.index} RAM+1 für ${ns.format.number(bestOption.cost)}`;
            buyFlag = true;
         } else if (bestOption.type === "core") {
            ns.hacknet.upgradeCore(bestOption.index, 1);
            Text = `Knoten ${bestOption.index} Core+1 für ${ns.format.number(bestOption.cost)}`;
            buyFlag = true;
         }
      }
   }

   if (buyFlag) {
      let totalHashesPerSecond = 0;
      const numNodes = ns.hacknet.numNodes();
      for (let i = 0; i < numNodes; i++) {
         const nodeStats = ns.hacknet.getNodeStats(i);
         totalHashesPerSecond += nodeStats.production;
      }
      ns.tprint(Text + " Neuer Wert:" + totalHashesPerSecond + "H/s");
   }
   else if (Counter % 40 == 0) {
      ns.print("Warte auf" + JSON.stringify(bestOption));
   }


}

