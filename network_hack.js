/** @param {NS} ns */
/** @param {NS} ns **/
export async function main(ns) {

   let UseHacknetServer = false;

   ns.tprint("Start");

   //ns.singularity.purchaseTor();  

   let servers = ["home"]; // Start mit 'home'
   let scanned = [];

   let HackSkill = ns.getHackingLevel(); //   getPlayer.HackSkill;
   ns.tprint(" Aktuelle Hack Skill:" + HackSkill);

   let AnzahlOK = 0;
   let AnzahlNOK = 0;
   let AnzahlPortZuNiedrieg = 0;

   let Anzahl = 0;
   // Netzwerk-Scan (einfacher Tree-Traversal)
   for (let i = 0; i < servers.length; i++) {
      let current = servers[i];
      let next = ns.scan(current);
      for (let s of next) {
         if (!servers.includes(s) && s !== "home" && (s.startsWith("hacknet") == false || UseHacknetServer)) {
            servers.push(s);
            Anzahl++;
         }
      }
   }
   ns.tprint("  Scan: " + Anzahl + " Server gefunden");




   // Server-Liste durchgehen
   for (let server of servers) {
      // Server vorbereiten
      if (server != "home") {

         // Ports öffnen, falls möglich
         if (!ns.hasRootAccess(server)) {
            if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(server);
            if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(server);
            if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(server);
            if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(server);
            if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(server);

            // Rooten -  Es gibt Server die man Rooten kann aber nicht Hacken
            //ns.tprint("Root Versuch auf " + server + " -Braucht Hacking:" + ns.getServerRequiredHackingLevel(server) + " und " + ns.getServerNumPortsRequired(server) + " Ports");
            try {
               let result = ns.nuke(server);
               if (result == true) {
                  //               ns.tprint("OK");
               }
               else {
                  //               ns.tprint("NOK");
                  AnzahlPortZuNiedrieg++;
               }
            } catch (e) {
               ns.tprint("==> Roote: Fail");
            }
         }
      }


      // Root vorhanden
      if (ns.hasRootAccess(server)) {
         AnzahlOK++;
         if (server !== "home") {
            await ns.scp("basic_hack.ts", server);
         }
      }
      else {
         AnzahlNOK++;
      }


      // Hacken, wenn Root-Zugriff da ist
      if (ns.hasRootAccess(server) /*&& ns.getServerMaxMoney(server) > 0*/) {

         ns.scriptKill("basic_hack.ts", server)

         let ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
         let scriptRam = ns.getScriptRam("basic_hack.ts");
         var threads = Math.floor(ramAvailable / scriptRam);

         let pos = 1;
         while (threads > 0) {
            let server2 = GetServer(pos);

            let threads2 = threads;
            if (threads2 > 250)
               threads2 = 250;


            ns.exec("basic_hack.ts", server, threads2, /* Arg0*/ server2,/* Arg1*/threads2);
            ns.tprint(`Starte Script auf Server ${server} mit ${threads2} threads.  Zielsystem: ${server2}`);
            threads = threads - threads2;
            pos++;
         }

      }

      if (server == "home") {
         //ns.killall(server, true);
         ns.scriptKill("basic_hack.ts", server)

         let ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
            - 28;  // 28 MB Platz lassen
         let scriptRam = ns.getScriptRam("basic_hack.ts");
         var threads = Math.floor(ramAvailable / scriptRam);

         let pos = 1;
         while (threads > 0) {
            let server2 = GetServer(pos);

            let threads2 = threads;
            if (threads2 > 2250)
               threads2 = 2250;


            ns.exec("basic_hack.ts", server, threads2, /* Arg0*/ server2,/* Arg1*/threads2);
            ns.tprint(`Starte Script auf Server ${server} mit ${threads2} threads.  Zielsystem: ${server2}`);
            threads = threads - threads2;
            pos++;
         }

      }

      // ausgabe
      //ns.tprint("Final: "+ server + " "+ ns.getServerUsedRam(server) +"/"+ ns.getServerMaxRam(server));


   }
   ns.tprint("OK:" + AnzahlOK)
   ns.tprint("NOK:" + AnzahlNOK)
   ns.tprint("NOK Port zu niedrieg:" + AnzahlPortZuNiedrieg)


   function GetServer(pos) {

      //return "fulcrumassets";   // Für STock3
      return "foodnstuff";

      // Hacking XP farmen
      switch (pos % 3) {
         case 0:
            return "n00dles";
         case 1:
            return "foodnstuff";
         case 2:
            return "sigma-cosmetics";
      }



      /* Schneller Geld / Level up
           switch (pos % 7) {
              case 0:
                 return "harakiri-sushi";
              case 1:
                 return "neo-net";
              case 2:
                 return "zer0";
              case 3:
                 return "iron-gym";
              case 4:
                 return "max-hardware";
              case 5:
                 return "zer0";
              case 6:
                 return "phantasy"
           }
           */

      // -- 

      if (HackSkill <= 100) {
         return "n00dles";
      }
      else if (HackSkill <= 300) {
         return "foodnstuff";
      }
      else if (HackSkill <= 400) {
         switch (pos % 3) {
            case 0:
               return "harakiri-sushi";
            case 1:
               return "neo-net";
            case 2:
               return "zer0";
         }
      }
      else if (HackSkill <= 800) {

         switch (pos % 4) {
            case 0:
               return "iron-gym";
            case 1:
               return "max-hardware";
            case 2:
               return "zer0";
            case 3:
               return "phantasy"
         }
      }
      else if (HackSkill <= 1400) {
         switch (pos % 9) {
            case 0:
               return "iron-gym";
            case 1:
               return "max-hardware";
            case 2:
               return "zer0";
            case 3:
               return "phantasy"
            case 4:
               return "microdyne"
            case 5:
               return "catalyst"
            case 6:
               return "syscore"
            case 7:
               return "snap-fitness"
            case 8:
               return "applied-energetics"
         }
      }
      else {
         switch (pos % 11) {
            case 0:
               return "clarkinc";
            case 1:
               return "kuai-gong";
            case 2:
               return "nwo";
            case 3:
               return "blade"
            case 4:
               return "megacorp"
            case 5:
               return "ecorp"
            case 6:
               return "syscore"
            case 7:
               return "snap-fitness"
            case 8:
               return "applied-energetics"
            case 9:
               return "iron-gym";
            case 10:
               return "max-hardware";

         }
      }

   }
}