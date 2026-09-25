
import { Serverdata } from "./Hack_Starter";
import { GetTimeString } from "./Hack_Starter";



export async function main(ns: NS) {
   const servers = new Set(["home"]);


   // Definition der Farbcodes (ANSI-Escape-Sequenzen)
   const RESET = "\u001b[0m";
   const ROT = "\u001b[31m";
   const GRUEN = "\u001b[32m";
   const GELB = "\u001b[33m";
   const BLAU = "\u001b[34m";
   const LILA = "\u001b[35m";
   const CYAN = "\u001b[36m";

   const filePath = "work/ServerdataListe.txt";

   // Eigenes Hacking-Level
   const myHackLevel = ns.getHackingLevel();

   var ServerdataListe: Serverdata[] = [];

   if (ns.fileExists(filePath)) {
      const dateiInhalt = ns.read(filePath);
      ServerdataListe = JSON.parse(dateiInhalt);
   }

   // Rekursiver Scan durch das gesamte Netzwerk
   for (const server of servers) {
      ns.scan(server).forEach(neighbor => {
         // Ignoriere eigene gekaufte Server
         if (neighbor.startsWith("MyCloud")) return;

         // Ignoriere Hacknet-Server
         if (neighbor.startsWith("hacknet")) return;

         // Füge neue Server zum Set hinzu (erweitert die Schleife automatisch)
         servers.add(neighbor);
      });
   }




   // Set in ein Array umwandeln und nach maximalem Geld absteigend sortieren
   const sortedServers = Array.from(servers).sort((a, b) => {
      return ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a);
   });

   // Header-Ausgabe (angepasst)
   ns.tprint(ns.sprintf("%-20s | %-15s | %-21s | %-8s | %-1s |%-6s| %-10s",
      "Server", "Security", "Money", "Weak", "P", "Level", "HackChance"));
   ns.tprint("-----------------------------------------------------------------------------------------------------------------------------");

   for (const server of sortedServers) {
      // Daten abrufen

      if (server.startsWith("MyCloud"))
         continue;

      if (server.startsWith("hacknet"))
         continue;


      const curMoney = ns.getServerMoneyAvailable(server);
      const maxMoney = ns.getServerMaxMoney(server);

      const curSec = ns.getServerSecurityLevel(server);
      const Sec = ns.getServerMinSecurityLevel(server);


      const hackTime = ns.getHackTime(server);
      const growTime = ns.getGrowTime(server);
      const weakenTime = ns.getWeakenTime(server);
      const Ports = ns.getServerNumPortsRequired(server);
      const HackLevel = ns.getServerRequiredHackingLevel(server);
      const hackChance = ns.hackAnalyzeChance(server);
      let Dateien = ns.ls(server);
      Dateien = Dateien.filter(datei => datei.endsWith(".js") == false && datei.endsWith(".exe") == false);   // Ohne Scripte


      // Formatierung
      const curmoneyFormatted = ns.format.number(curMoney);
      const moneyFormatted = ns.format.number(maxMoney);

      const curSecFormatted = ns.format.number(curSec);
      const SecFormatted = ns.format.number(Sec);

      const timeFormatted1 = formatHMS(hackTime);
      const timeFormatted2 = formatHMS(growTime);
      const timeFormatted3 = formatHMS(weakenTime);
      // Farbige Ausgabe für HackLevel
      const hackLevelColor = HackLevel > myHackLevel ? ROT : GRUEN;
      const hackLevelStr = hackLevelColor + HackLevel.toString().padStart(4, " ") + RESET;

      // Farbige Ausgabe für Ports (rot, wenn kein Root-Zugriff)
      const hasRoot = ns.hasRootAccess(server);
      // Port-Ausgabe immer auf 6 Zeichen rechtsbündig formatieren, auch mit Farbe
      const portRaw = Ports.toString();
      const portsStr = hasRoot ? (GRUEN + portRaw + RESET) : (ROT + portRaw + RESET);

      // Formatierung HackChance
      const hackChanceFormatted = (hackChance * 100).toFixed(1) + "%";

      let NextStep = "";
      let BatchCounter = 0;
      let BlockedBisStr = ""
      for (const server2 of ServerdataListe) {
         if (server == server2.ServerName) {
            BatchCounter = server2.BatchCounter;
            NextStep = server2.NextStep;
            if (Date.now() < server2.BlockedBis)
               BlockedBisStr = GetTimeString(server2.BlockedBis).substring(0,8);
         }
      }

      // GeldProMS berechnen   
      var Zeitbedarf = 0;
      var Weaktime = ns.getWeakenTime(server);  // Zeit in ms
      var maxGeld = ns.getServerMaxMoney(server);
      var Zeitbedarf = Weaktime;
      // Hackchance für Server auf Minimalem Security Wert berechnen.
      const serverObj = ns.getServer(server);
      serverObj.hackDifficulty = serverObj.minDifficulty;
      const hackChance2 = ns.formulas.hacking.hackChance(serverObj, ns.getPlayer());
      const Weaktime2 = ns.formulas.hacking.weakenTime(serverObj, ns.getPlayer());
      var GeldProMS = (maxGeld / Weaktime2) * hackChance2;



      // Ausgabe der sortierten Zeile
      ns.tprint(ns.sprintf("%-20s | %-7s/%-7s | %-10s/%-10s | %-8s | %1s | %-4s | %-10s| %-4s %-6s %-6s %-6s",
         server,
         SecFormatted, curSecFormatted,
         curmoneyFormatted, moneyFormatted,
         /*timeFormatted1, timeFormatted2,*/ timeFormatted3,
         portsStr, hackLevelStr,
         hackChanceFormatted,
         NextStep,
         BatchCounter, GeldProMS.toFixed(0), BlockedBisStr
         //"Score ="+maxGeld+" * "+Weaktime2+ " *  "+hackChance2
      ));
   }

   function formatHMS(ms: number) {
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
   }
}