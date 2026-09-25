/** @param {NS} ns */
export async function main(ns) {
   // Konfiguration
   let targetRam = 1; // Start-RAM (Muss eine Zweierpotenz sein: 8, 16, 32, 64...)
   const prefix = "MyCloud-"; // Name der Server

   while (true) {
      // Alle Server-Befehle nutzen jetzt konsequent die neue "ns.cloud"-API
      let maxServers = ns.cloud.getServerLimit();
      let cost = ns.cloud.getServerCost(targetRam);
      let currentServers = ns.cloud.getServerNames();




      // 1. NEUKAUF: Wenn das Limit von 25 Servern noch nicht erreicht ist
      if (currentServers.length < maxServers) {
         if (ns.getServerMoneyAvailable("home") > cost) {
            let name = prefix + currentServers.length;
            let hostname = ns.cloud.purchaseServer(name, targetRam);
            if (hostname) {
               ns.tprint(`Erfolgreich gekauft: ${hostname} mit ${targetRam}GB RAM.`);
               continue;
            }
         }
      }
      // 2. UPGRADE: Wenn das Limit erreicht ist, bestehende Server aufstufen
      else {
         let allUpgraded = true;

         for (let server of currentServers) {
            if (ns.getServerMaxRam(server) < targetRam) {
               allUpgraded = false; // Noch nicht alle Server haben das Ziel-RAM

               if (ns.getServerMoneyAvailable("home") > cost) {
                  let success = ns.cloud.upgradeServer(server, targetRam);
                  if (success) {
                     ns.tprint(`Server ${server} via ns.cloud auf ${targetRam}GB RAM aufgerüstet.`);
                  }
               }
            }
         }

         // Wenn alle Server die aktuelle Stufe erreicht haben, verdopple das Ziel
         if (allUpgraded) {
            targetRam *= 2;
            ns.tprint(`Alle Server auf aktuellem Maximum. Nächstes Ziel: ${targetRam}GB RAM.`);
            ns.tprint(`Kosten für Server: ${ns.format.number(cost)} mit ${targetRam}GB RAM.`);
            //ns.exec("network_hack.js","home");
            continue;
         }
      }

      // Wartet 2 Sekunden vor dem nächsten Durchlauf
      await ns.sleep(2000);
      //break;
   }
}
