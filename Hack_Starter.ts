// Wichtig:  Vor dem Uebertragen die erste Zeile loeschen
//import { NS, NodeStats } from "./NetscriptDefinitions";

export async function main(ns: NS) {
   ServerdataListe = [];    // Variablen sicher leeren

   ns.ui.openTail();
   InitBasic(ns);
   UpdateServerdataListe(ns);   // Alle Server merken und mit Verarbeitungsdaten anreichern
   await MainLoop(ns);
   ns.print("--- Ende ---")
}

/* ------------------------------------------------------------ */
/*                         MainLoop                             */
/* ------------------------------------------------------------ */
async function MainLoop(ns: NS) {

   OutOfResourcesFlag = false;

   var Counter = 0;
   while (true) {
      Counter++;
      if (Counter % 100 == 0)                  // Die Serverliste muss nur ab und zu aktualisiert werden
         UpdateServerdataListe(ns);

      // Es wird nach einem Hackbarem Server fuer die naechste Aktion gesucht
      let NextServerdata: Serverdata | null = GetNextServer(ns)
      if (NextServerdata != null) {
         ExecuteBatch(ns, NextServerdata);
      }

      if (OutOfResourcesFlag) {
         OutOfResourcesFlag = false;
         ns.print("Alle Resourcen belegt.")
         UpdateServerdataListe(ns);         // Zeitfenster nutzen
         Counter == 1;
         await ns.sleep(5000);              // 5 sec Pause

      }
      else
         await ns.sleep(20);
   }
}
/* ------------------------------------------------------------ */
/*                   Initialisation                             */
/* ------------------------------------------------------------ */

function InitBasic(ns: NS) {
   // Ein paar Funktionen ausschalten, damit das Log übersichtlicher wird
   //ns.disableLog('ALL');
   ns.disableLog('disableLog');
   ns.disableLog('scan');
   ns.disableLog('getServerMaxRam');
   ns.disableLog('getServerUsedRam');
   ns.disableLog('scp');
   ns.disableLog('getServerMinSecurityLevel');
   ns.disableLog('getServerSecurityLevel');
   ns.disableLog('getServerMoneyAvailable');
   ns.disableLog('getServerMaxMoney');
   ns.disableLog('getServerRequiredHackingLevel');
   ns.disableLog('brutessh');
   ns.disableLog('ftpcrack');
   ns.disableLog('relaysmtp');
   ns.disableLog('httpworm');
   ns.disableLog('nuke');
   ns.disableLog('getHackingLevel');
   ns.disableLog('sleep');
   ns.disableLog('exec');

   //ns.disableLog('sleep');
}

function UpdateServerdataListe(ns: NS): void {
   // Alle Server im Netzwerk finden und fuer das Ausfuehren von Scripten vorbereiten.
   // Kann mehrfach aufgerufen werden: Neue Server werden ergaenzt, bestehende bleiben erhalten.

   // Alle Server einsammeln
   const servers: string[] = ["home"];
   for (let i = 0; i < servers.length; i++) {
      const next: string[] = ns.scan(servers[i]);
      for (const s of next) {
         if (!servers.includes(s) && s !== "home") {
            servers.push(s);
         }
      }
   }

   for (const server of servers) {

      //ns.tprint (server);
      // Root-Rechte vorbereiten (immer versuchen, da Programme spaeter dazukommen koennen)
      if (!ns.hasRootAccess(server) && server !== "home") {
         if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(server);
         if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(server);
         if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(server);
         if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(server);
         if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(server);
         ns.nuke(server);
      }

      // Pruefen ob der Server bereits in der Liste ist
      if (ServerdataListe.find(s => s.ServerName === server)) continue;

      // Arbeitsdateien auf die Server verteilen
      for (const scriptName of Scripte) {
         ns.scp(scriptName, server);
      }

      // Neuen Eintrag anlegen
      const entry = new Serverdata(server, ns);
      ServerdataListe.push(entry);
   }

   // Vorsortieren der Resourcen
   ServerdataListeHighCoresFirst = [...ServerdataListe].sort((a, b) => {
      const serverA = ns.getServer(a.ServerName);
      const serverB = ns.getServer(b.ServerName);
      return serverA.cpuCores - serverB.cpuCores
   });

   lowCoreServersLowCoresFirst = [...ServerdataListe].sort((a, b) => {
      const serverA = ns.getServer(a.ServerName);
      const serverB = ns.getServer(b.ServerName);
      return serverB.cpuCores - serverA.cpuCores
   });




   // Daten in Datei schreiben
   ns.write("work/ServerdataListe.txt", JSON.stringify(ServerdataListe, null, 3), "w");

}

/* ------------------------------------------------------------ */
/*                      GetNextServer                           */
/* ------------------------------------------------------------ */


function GetNextServer(ns: NS): Serverdata | null {

   // Es wird der Server gesucht der als nächstes bearbeitet werden soll.
   // Vorrausetzung: 
   // * Hack-level passt
   // * Hat Geld   (Kein Cloud-Server oder Hacknet-Server))
   //  Die gefundenen Server werden bewertet.  Dabei die benötigte Zeit ( inc Wartezeit ) und das zu erwartende Geld berücksichtigt.  Es wird der Server mit dem besten Verhältnis ausgewählt.

   let HackSkill = ns.getHackingLevel();
   let aktTime = Date.now();

   var BestServer: Serverdata | null = null;
   var BestGeldProMS = 0;
   var BestQuotent = 0;

   let Vorauswahl = [];
   for (var curServer of ServerdataListe) {
      if (curServer.HackLevel > HackSkill)        // Bedingung Benötigtes Hack-Level ist höher als das aktuelle Spieler-Level
         continue;

      if (curServer.ServerName.startsWith("hacknet-server"))   // Bedingung Kein Geld auf dem Server (Hacknet-Server oder Cloud-Server)
         continue;

      if (ns.getServerMaxMoney(curServer.ServerName) == 0)   // Bedingung Kein Geld auf dem Server (Hacknet-Server oder Cloud-Server)
         continue;

      if ((curServer.NextStep == "init" || curServer.NextStep == "wait") && curServer.BlockedBis > aktTime)
         continue;    // Der Server wird vorbereitet und ist noch nicht fertig

      // Zeitbedarf einschätzen  (ink Wartezeit auf Server-Freigabe))
      var extraWartezeit = 0;

      var Zeitbedarf = 0;
      //var Weaktime = ns.getWeakenTime(curServer.ServerName);  // Zeit in ms
      var maxGeld = ns.getServerMaxMoney(curServer.ServerName);

      // Hackchance für Server auf Minimalem Security Wert berechnen.
      const serverObj = ns.getServer(curServer.ServerName);
      serverObj.hackDifficulty = serverObj.minDifficulty;
      const hackChance = ns.formulas.hacking.hackChance(serverObj, ns.getPlayer());
      const Weaktime = ns.formulas.hacking.weakenTime(serverObj, ns.getPlayer());

      if (Weaktime / 1000 / 60 > 10)                          // Mehr als 510 min?  Erst mal nicht. Das Bremst sonst zu massive
         continue;


      if (curServer.BlockedBis <= aktTime + Weaktime)           // Ist der Server noch blockiert?
         Zeitbedarf = Weaktime + (SpanTime * 4);                          // Nein , er wird zum Ende der Weaken-Aktion frei sein.  Also Zeitbedarf ist die Weaken Aktion
      else
         Zeitbedarf = curServer.BlockedBis - aktTime + (SpanTime * 4);   // ja , wir müssen auf den Server warten.  Also rechnen wir mit der Zeit wannn der server frei wird.

      if (Zeitbedarf == 0) Zeitbedarf = (SpanTime * 4);   // Sollte es nicht geben

      var GeldProMS = (maxGeld / Zeitbedarf) * hackChance;   // Bewertung des Servers: Je mehr Geld und je schneller er verfügbar ist, desto höher die Bewertung.  Es könnte noch andere Faktoren geben, z.B. die Anzahl der Threads, die benötigt werden, um das Geld zu hacken.  Aber das könnte

      var Quotent = (curServer.BlockedBis - aktTime) / 1000;


      //ns.tprint("Server: " + curServer.ServerName + " GeldProMS: " + GeldProMS.toFixed(4));

      if (GeldProMS > BestGeldProMS) {
         BestGeldProMS = GeldProMS;
         BestServer = curServer;
         BestQuotent = Quotent;
      }
   }

   if (Debug > 0 && BestServer != null) {
      ns.print("BestServer: " + BestServer.ServerName + " GeldProMS: " + BestGeldProMS.toFixed(4) + " NextStep:" + BestServer.NextStep + " Block:" + GetTimeString(BestServer.BlockedBis) + " Quote:" + BestQuotent);
   }
   return BestServer;

}

// -----------------------------------------------------------------------
// HWGW System: Es werden 4 Aktionen geplant: Hack, Weaken, Grow, Weaken.
// Dabei werden die Aktionen so geplant das sie bei einem niedrigem Sicherheitswert anfangen und entsprechend schnell sind.
// Die Aktionen enden alle innerhalb einer Sekunde mit minimalem Abstand zueinander.
// Ueber die Liste ServerdataListe wird das ganze ueber die Felder BlockedBis und NextStep gesteuert.
// Die Zeitberechnung wird mit Core = 1 durchgefuehrt. Wenn der ausfuehrende Server mehr Cores hat, wird die Anzahl der Threads bei weaken und grow reduziert.
// Wenn der Server noch nicht auf ServerMin ist oder Money Max, werden nur diese Aktionen einzeln ausgefuehrt.
// -----------------------------------------------------------------------

function ExecuteBatch(ns: NS, serverdata: Serverdata): void {

   const target = serverdata.ServerName;
   const f = ns.formulas.hacking;

   const maxMoney = ns.getServerMaxMoney(target);
   const minSec = ns.getServerMinSecurityLevel(target);
   const aktTime = Date.now();

   var AktionsFlagWeaken = false;
   var AktionsFlagGrown = false;
   // Was wollen wir machen ?
   if (serverdata.NextStep === "none" || serverdata.NextStep === "init" || serverdata.NextStep === "wait") {
      if (ns.getServerSecurityLevel(target) > minSec + 0.5) {
         AktionsFlagWeaken = true;
      }

      if (ns.getServerMoneyAvailable(target) < maxMoney * 0.95) {
         AktionsFlagGrown = true;
      }

      if (AktionsFlagWeaken || AktionsFlagGrown)    // der Server ist bereit für den BatchModus
      {
         serverdata.NextStep = "init";

         // Aktion basierend auf NextStep ausfuehren
         if (AktionsFlagWeaken)
            ExecuteSingleWeaken(ns, serverdata, target);
         else if (AktionsFlagGrown)
            ExecuteSingleGrow(ns, serverdata, target);
         return; // Nach der Vorbereitung wird der Server in der naechsten Runde erneut bewertet.  Es wird erst dann mit Batch begonnen, wenn der Server bereit ist.
      }
   }
   serverdata.NextStep = "batch";

   // --- HWGW Batch ---
   const player = ns.getPlayer();
   const server = ns.getServer(target);
   server.hackDifficulty = minSec;

   // Hack-Berechnung
   const hackPercentPerThread = f.hackPercent(server, player);
   const hackThreads = Math.max(1, Math.floor(targetHackPercent / hackPercentPerThread));
   const hackSecurityDebuff = ns.hackAnalyzeSecurity(hackThreads, target);

   // Erstes Weaken (gleicht Hack aus)
   let weakenThreads1 = 0;
   while (ns.weakenAnalyze(weakenThreads1) < hackSecurityDebuff) {
      weakenThreads1++;
   }

   // Grow-Berechnung
   const actualHackPercent = hackThreads * hackPercentPerThread;
   let growThreads = 0;
   let growSecurityDebuff = 0;

   if (actualHackPercent < 1 && actualHackPercent > 0) {
      const growMultiplier = 1 / (1 - actualHackPercent);
      const moneyAfterHack = maxMoney * (1 - actualHackPercent);
      server.moneyAvailable = moneyAfterHack;
      growThreads = Math.ceil(f.growThreads(server, player, maxMoney, 1));
      growSecurityDebuff = ns.growthAnalyzeSecurity(growThreads);
   }

   // Zweites Weaken (gleicht Grow aus)
   let weakenThreads2 = 0;
   while (ns.weakenAnalyze(weakenThreads2) < growSecurityDebuff) {
      weakenThreads2++;
   }

   // Timing berechnen
   const hackTime = f.hackTime(server, player);
   const growTime = f.growTime(server, player);
   const weakenTime = f.weakenTime(server, player);

   const timeWeaken1 = weakenTime;
   const timeHack = timeWeaken1 - SpanTime;
   const timeGrow = timeWeaken1 + SpanTime;
   const timeWeaken2 = timeWeaken1 + (2 * SpanTime);

   // Zeiten wenn wir sofort anfangen können
   var hackDelay = timeHack - hackTime;
   var weakenDelay1 = 0;
   var growDelay = timeGrow - growTime;
   var weakenDelay2 = timeWeaken2 - weakenTime;

   if (aktTime + weakenDelay1 < serverdata.BlockedBis) {
      // Wir haben eine Überlappung und müssen noch etwas warten
      var extraDelay = serverdata.BlockedBis - (aktTime + weakenDelay1) + SpanTime;
      hackDelay += extraDelay;
      weakenDelay1 += extraDelay;
      growDelay += extraDelay;
      weakenDelay2 += extraDelay;
   }

   var totalFreeThreads = GetTotalFreeThreads(ns)
   if (totalFreeThreads < hackThreads + weakenThreads1 + growThreads + weakenThreads2) {
      OutOfResourcesFlag = true;
      ns.print("Nicht genung Platz: frei:" + totalFreeThreads + "  Bedarf:" + hackThreads + weakenThreads1 + growThreads + weakenThreads2);
      return;
   }

   // Startpunkt für zwangspause setzen, damit es zu keiner Überlappung kommt
   if (serverdata.BlockedFrom == 0)
      serverdata.BlockedFrom = Date.now() + hackDelay - 1;

   if (Date.now() + hackThreads > serverdata.BlockedFrom) {
      // Zwangspause notwendig      
      serverdata.BlockedFrom = 0;
      serverdata.BlockedBis = Date.now() + timeWeaken2;
      serverdata.NextStep = "wait";
      ns.print("Zwangspause für " + serverdata.ServerName + " bis " + GetTimeString(serverdata.BlockedBis));
   }


   // Scripts ueber CallManager verteilen
   if (hackThreads > 0) CallManager(ns, "work/DelayHack.js", serverdata, hackThreads, hackDelay, hackTime);
   if (weakenThreads1 > 0) CallManager(ns, "work/DelayWeaken.js", serverdata, weakenThreads1, weakenDelay1, weakenTime);
   if (growThreads > 0) CallManager(ns, "work/DelayGrow.js", serverdata, growThreads, growDelay, growTime);
   if (weakenThreads2 > 0) CallManager(ns, "work/DelayWeaken.js", serverdata, weakenThreads2, weakenDelay2, weakenTime);

   // Server als blockiert markieren
   serverdata.BlockedBis = Date.now() + timeWeaken2;

   // Statistik flegen
   serverdata.BatchCounter++;

   //if (Debug > 0) ns.print(`HWGW Batch gestartet fuer ${target}. Fertig um ${GetTimeString(serverdata.BlockedBis)}`);
}

function ExecuteSingleWeaken(ns: NS, serverdata: Serverdata, target: string): void {

   const weakenTime = ns.getWeakenTime(target);
   const aktTime = Date.now();

   // Delay berechnen: Weaken soll nach BlockedBis enden
   const fruehestesEnde = Math.max(serverdata.BlockedBis, aktTime) + SpanTime;
   const weakenDelay = Math.max(0, fruehestesEnde - aktTime - weakenTime);
   const endeZeit = aktTime + weakenDelay + weakenTime;

   // Thread-Anzahl: so viele wie noetig um auf MinSecurity zu kommen
   const curSec = ns.getServerSecurityLevel(target);
   const minSec = ns.getServerMinSecurityLevel(target);
   const secDiff = curSec - minSec;
   let threads = Math.ceil(secDiff / weakenSecurityPotency);
   if (threads <= 0) threads = 1;

   const laufzeit = GetTimeString(aktTime + weakenDelay + weakenTime);
   CallManager(ns, "work/DelayWeaken.js", serverdata, threads, weakenDelay, weakenTime);

   if (serverdata.BlockedBis < aktTime + weakenDelay + weakenTime + SpanTime)
      serverdata.BlockedBis = aktTime + weakenDelay + weakenTime + SpanTime;


   if (Debug > 0) ns.print(`Weaken gestartet fuer ${target} mit ${threads} Threads. Fertig um ${laufzeit}`);
}

function ExecuteSingleGrow(ns: NS, serverdata: Serverdata, target: string): void {

   const weakenTime = ns.getWeakenTime(target);
   const growTime = ns.getGrowTime(target);
   const aktTime = Date.now();
   const f = ns.formulas.hacking;

   // Grow-Threads berechnen
   const player = ns.getPlayer();
   const server = ns.getServer(target);
   const maxMoney = ns.getServerMaxMoney(target);
   const growThreads = Math.ceil(f.growThreads(server, player, maxMoney, 1));
   if (growThreads <= 0) return;

   // Weaken-Threads zum Ausgleich
   const growSecDebuff = ns.growthAnalyzeSecurity(growThreads);
   let weakenThreads = 0;
   while (ns.weakenAnalyze(weakenThreads) < growSecDebuff) {
      weakenThreads++;
   }

   // GW-Timing: Weaken endet als letztes, Grow endet SpanTime davor
   const fruehestesEnde = Math.max(serverdata.BlockedBis, aktTime) + SpanTime;
   const weakenEnde = fruehestesEnde + SpanTime;
   const growEnde = weakenEnde - SpanTime;

   const weakenDelay = Math.max(0, weakenEnde - aktTime - weakenTime);
   const growDelay = Math.max(0, growEnde - aktTime - growTime);

   // Ueber CallManager verteilen
   if (growThreads > 0) CallManager(ns, "work/DelayGrow.js", serverdata, growThreads, growDelay, growTime);
   if (weakenThreads > 0) CallManager(ns, "work/DelayWeaken.js", serverdata, weakenThreads, weakenDelay, weakenTime);


   if (serverdata.BlockedBis < aktTime + weakenDelay + weakenTime + SpanTime)
      serverdata.BlockedBis = aktTime + weakenDelay + weakenTime + SpanTime;

   if (Debug > 0) ns.print(`Grow+Weaken gestartet fuer ${target}. Fertig um ${GetTimeString(Date.now() + weakenDelay + weakenTime)}`);
}

export function GetTimeString(TimeInMs: number): string {

   const futureDate = new Date(TimeInMs);
   const hh = String(futureDate.getHours()).padStart(2, '0');
   const mm = String(futureDate.getMinutes()).padStart(2, '0');
   const ss = String(futureDate.getSeconds()).padStart(2, '0');
   const ms = String(futureDate.getMilliseconds()).padStart(3, '0');
   return `${hh}:${mm}:${ss}.${ms}`;
}

function GetTotalFreeThreads(ns: NS): number {

   // Wie viel Platz haben wir für neue Threads ?
   const scriptRam = ns.getScriptRam(Scripte[0]);
   var totalThreadsAvailable = 0;

   for (const curServer of ServerdataListe) {

      // Nur Server mit Rootrechten, keine Hacknet-Server, mit Memory > 0
      if (!ns.hasRootAccess(curServer.ServerName)) continue;
      if (curServer.ServerName.startsWith("hacknet")) continue;
      if (ns.getServerMaxRam(curServer.ServerName) <= 0) continue;

      let ramAvailable: number;
      if (curServer.ServerName === "home")
         ramAvailable = ns.getServerMaxRam(curServer.ServerName) - SpeicherPlatzhalter - ns.getServerUsedRam(curServer.ServerName);
      else
         ramAvailable = ns.getServerMaxRam(curServer.ServerName) - ns.getServerUsedRam(curServer.ServerName);

      const threadsAvailable = Math.floor(ramAvailable / scriptRam);
      totalThreadsAvailable += threadsAvailable;
   }
   return totalThreadsAvailable;
}

/* ------------------------------------------------------------ */
/*                        CallManager                           */
/* ------------------------------------------------------------ */
function CallManager(ns: NS, script: string, serverdata: Serverdata, threadAnzahl: number, callDelay: number, laufzeitMs: number): boolean {

   // Verteilt ein Script mit einer bestimmten Anzahl Threads auf mehrere Server.
   // Wenn die Resourcen nicht reichen, wird in serverdata.NextAnzThreads vermerkt wie viele Threads noch fehlen.
   // Gibt true zurueck wenn alle Threads verteilt werden konnten.


   const laufzeitStrStart = GetTimeString(Date.now());
   const laufzeitStrVon = GetTimeString(Date.now() + callDelay);
   const laufzeitStrBis = GetTimeString(Date.now() + callDelay + laufzeitMs);
   const laufzeit = "Start:" + laufzeitStrStart + "_Scharf:" + laufzeitStrVon + "-" + laufzeitStrBis;

   const scriptRam = ns.getScriptRam(script);
   let verbleibendeThreads = threadAnzahl;
   let verteilteThreads = 0;

   let ServerdataListe_temp = ServerdataListeHighCoresFirst;
   if (script == Scripte[0])  // Hack
      ServerdataListe_temp = lowCoreServersLowCoresFirst;

   for (const curServer of ServerdataListe) {

      // Nur Server mit Rootrechten, keine Hacknet-Server, mit Memory > 0
      if (!ns.hasRootAccess(curServer.ServerName)) continue;
      if (curServer.ServerName.startsWith("hacknet")) continue;
      if (ns.getServerMaxRam(curServer.ServerName) <= 0) continue;

      let ramAvailable: number;
      if (curServer.ServerName === "home")
         ramAvailable = ns.getServerMaxRam(curServer.ServerName) - SpeicherPlatzhalter - ns.getServerUsedRam(curServer.ServerName);
      else
         ramAvailable = ns.getServerMaxRam(curServer.ServerName) - ns.getServerUsedRam(curServer.ServerName);

      const threadsAvailable = Math.floor(ramAvailable / scriptRam);

      if (threadsAvailable <= 0) continue;

      if (verbleibendeThreads <= threadsAvailable) {
         ns.exec(script, curServer.ServerName, verbleibendeThreads, serverdata.ServerName, callDelay, laufzeit);
         return true;  // Erfolgreich alles verteilt
      } else {
         // Aufgabe aufteilen: so viele Threads wie moeglich auf diesem Server starten
         ns.exec(script, curServer.ServerName, threadsAvailable, serverdata.ServerName, callDelay, laufzeit);
         verbleibendeThreads -= threadsAvailable;
         verteilteThreads += threadsAvailable;
      }
   }


   if (Debug > 0 && verteilteThreads > 0) {
      ns.print("CallManager: Nicht genug Resourcen. Verteilt: " + verteilteThreads + " Fehlende Threads: " + verbleibendeThreads);
   }

   OutOfResourcesFlag = true;
   serverdata.NextStep = "init";   // Wir haben einen unbekannten Zustand und müssen eventuell erst fixen

   return false;   // Nicht alle Threads konnten verteilt werden
}


// ===========================================================
// Hilfsklasse zum verwalten der Server  (Interface /Classe)
// ==========================================================
export interface IServerdata {
   ServerName: string;
   BlockedBis: number;
   NextStep: string;
   HackLevel: number;
   BatchCounter: number;
}

export class Serverdata implements IServerdata {
   ServerName: string;
   HackLevel: number;
   BlockedBis: number;       // Wir wissen genau wie lange eine Aktion dauern wird. Nach dem Timestamp ist der Server wieder frei. 
   NextStep: string;
   // In welche Phase sind wir ?
   // "none" = Rohserver ohne Änderungen.
   // "init" = Der Server wird vorbereitet (W/G). In der Phase gibt es keine Überlappung und der Server ist bis zum "BlockedBis" geschützt.
   // "wait" = Wir haben keine Resourcen mehr. Zeit mal etwas zu warten. Vergleichbar mit "init"
   // "batch" = Es ist eine HWGW- Batch geplant."

   BatchCounter: number;    // Wie oft wurde der Batch schon aufgerufen? 

   BlockedFrom: number;
   // Die Scripte haben 1 sec Zeit für den HWGW Zyklus.  
   // Bei einem üblichen Aufruf werden ganz viele Augrufe gestackt, so das ab diesem
   // Zeitpunkt erst mal eine kleine Pause gemacht werden muss, um alles abzuarbeiten.
   // ==> "wait" Status + BlockedBis auf Weak2 einstellen
   // 0 = Wert muss gesezt werden ;  >0  = Wert nicht verändern außer nach einer Wait-Periode


   constructor(serverName: string, ns: NS) {
      this.ServerName = serverName;
      this.BlockedBis = Date.now();
      this.BlockedFrom = 0;
      this.NextStep = "none";

      if (serverName.startsWith("hacknet-server"))
         this.HackLevel = 0
      else
         this.HackLevel = ns.getServerRequiredHackingLevel(serverName);
      this.BatchCounter = 0;
   }
}



/* ------------------------------------------------------------ */
/*                Feste Werte                                   */
/* ------------------------------------------------------------ */
const Scripte = ["work/DelayHack.js", "work/DelayWeaken.js", "work/DelayGrow.js"]   // Liste der Scripte die von Home auf die Server verteilt werden

// Sicherheits-Konstanten des Spiels
const securityPerHackThread = 0.002;
const securityPerGrowThread = 0.004;
const weakenSecurityPotency = 0.05; // Ein Weaken-Thread senkt Sec um 0.05   
const Debug = 1;                    // Mehr Ausgaben freischalten
const SpanTime = 250;               // Sicherheitsabstand zwischen Aktionen   (Zeit in ms)

const targetHackPercent = 0.2;      // Wie viel wird geraubt

// Globale Var
let ServerdataListe: Serverdata[] = [];    // Liste mit allen Servern, die als Resource verwendet werden können. 
let ServerdataListeHighCoresFirst: Serverdata[] = [];   // Vorsortiere Variante
let lowCoreServersLowCoresFirst: Serverdata[] = [];           // Vorsortiere Variante

let OutOfResourcesFlag: Boolean;

let SpeicherPlatzhalter = 70;    // Platzhalter für HOME


