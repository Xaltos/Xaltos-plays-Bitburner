// analyze.ts
/**
 * Analyse aller laufenden Skripte in Bitburner.
 *
 * Gruppiert die Daten nach dem ersten Argument (Ziel‑Server).
 *
 * Ausgabe:
 *   ServerName   Hack   Grow   Weak   MinStart-MaxEnd
 *   iron-gym     1      0      0      16:37:15.787-16:48:58.166
 */

//import { NS } from "@ns";

/* ---------- Typdefinitionen ---------- */
interface DelayInfo {
   pid: number;
   threadCount: number;
   scriptName: string;   // z. B. "work/DelayHack.js"
   targetServer: string; // Arg(1)
   delayMs: number;      // Arg(2) in ms
   combinedArg: string;  // Arg(3)
}

interface ServerReport {
   hackCount: number;
   growCount: number;
   weakCount: number;
   minStart?: string; // hh:mm:ss.ms
   maxEnd?: string; // hh:mm:ss.ms
}

/* ---------- Hilfsfunktionen ---------- */

/** Rekursiver Scan aller erreichbaren Server. */
function getAllServers(ns: NS, start = "home"): string[] {
   const stack = [start];
   const seen: Set<string> = new Set();

   while (stack.length) {
      const srv = stack.pop()!;
      if (!seen.has(srv)) {
         seen.add(srv);
         for (const child of ns.scan(srv))
            if (!seen.has(child)) stack.push(child);
      }
   }

   return Array.from(seen).sort();
}

/**
 * Parst den kombinierten Arg3:
 *   "Start:hh:mm:ss.ms_Scharf:hh:mm:ss.ms-hh:mm:ss.ms"
 */
function parseCombinedArg(arg: string) {
   const m = arg.match(
      /Start:(\d{1,2}:\d{2}:\d{2}\.\d+)_Scharf:(\d{1,2}:\d{2}:\d{2}\.\d+)-(\d{1,2}:\d{2}:\d{2}\.\d+)/
   );
   if (!m) return null;
   const [, startTime, delayedStart, endTime] = m;
   return { startTime, delayedStart, endTime };
}

/** Vergleicht zwei Zeit‑Strings (hh:mm:ss.ms). */
function compareTimes(a: string, b: string): number {
   // einfach String‑Vergleich reicht, weil gleiche Formate
   return a.localeCompare(b);
}


function getFormattedTime(): string {
   const d = new Date();                 // aktuelles Datum/Zeit

   // Stunden, Minuten, Sekunden & Millisekunden mit führenden Nullen
   const hh = String(d.getHours()).padStart(2, '0');
   const mm = String(d.getMinutes()).padStart(2, '0');
   const ss = String(d.getSeconds()).padStart(2, '0');
   const ms = String(d.getMilliseconds()).padStart(3, '0');

   return `${hh}:${mm}:${ss}.${ms}`;
}

/**
 * Konvertiert einen Zeitstring im Format "hh:mm:ss.ms" in Millisekunden seit Mitternacht.
 */
function timeStringToMs(timeStr: string): number {
   const [hms, msPart] = timeStr.split('.');
   const [hh, mm, ss] = hms.split(':').map(Number);
   return (((hh * 60 + mm) * 60 + ss) * 1000) + Number(msPart || '0');
}

/**
 * Formatiert Millisekunden in hh:mm:ss.
 */
function msToHMS(ms: number): string {
   const totalSec = Math.floor(ms / 1000);
   const ss = (totalSec % 60).toString().padStart(2, '0');
   const mm = Math.floor((totalSec / 60) % 60).toString().padStart(2, '0');
   const hh = Math.floor(totalSec / 3600).toString().padStart(2, '0');
   return `${hh}:${mm}:${ss}`;
}

export function calcServerPercents(ns: NS, srvName: string): {
   moneyPct: number;   // Prozent des Max‑Geldes
   secClosePct: number;   // % Nähe zum Minimum-Security
} {

   /* --- Daten aus dem Server holen --- */
   const currMoney = ns.getServerMoneyAvailable(srvName);
   const maxMoney = ns.getServerMaxMoney(srvName);

   const currSec = ns.getServerSecurityLevel(srvName);
   const minSec = ns.getServerMinSecurityLevel(srvName);

   /* --- 1) Geld‑Prozent (%) --- */
   // (maxMoney kann bei einigen Servern 0 sein – dann einfach 0%)
   const moneyPct = maxMoney > 0
      ? Math.round((currMoney / maxMoney) * 100)
      : 0;

   /* --- 2) Security‑Nähe (%) --- */
   // Sicherheitswert ist nie 0, aber wir prüfen trotzdem.
   const secClosePct = currSec > 0
      ? Math.round((minSec / currSec) * 100)
      : 0;

   return { moneyPct, secClosePct };
}

/* ---------- Hauptfunktion ---------- */

export async function main(ns: NS): Promise<void> {

   ns.disableLog('ALL');
   ns.ui.openTail();


   // Definition der Farbcodes (ANSI-Escape-Sequenzen)
   const RESET = "\u001b[0m";
   const BLACK = "\u001b[30m";
   const ROT = "\u001b[31m";
   const GRUEN = "\u001b[32m";
   const GELB = "\u001b[33m";
   const BLAU = "\u001b[34m";
   const LILA = "\u001b[35m";
   const CYAN = "\u001b[36m";
   const WHITE = "\u001b[37m";

   const HintergrundWHITE = "\u001b[47m";


   while (true) {

      /* ---------- Schritt 1 – Daten sammeln ----------
       * Alle Prozesse durchlaufen und die relevanten Infos speichern. */
      const servers = getAllServers(ns);
      const reports: Record<string, ServerReport> = {};

      for (const srv of servers) {
         // Leere Reports für jeden Ziel‑Server
         if (!reports[srv]) {
            reports[srv] = { hackCount: 0, growCount: 0, weakCount: 0 };
         }
      }

      for (const host of servers) {
         const procList = ns.ps(host);   // Array<Process>

         for (const proc of procList) {
            const script = proc.filename.toLowerCase(); // z. B. "work/delayhack.js"
            //const { pid, threadCount } = proc;
            const args: string[] = proc.args as string[];

            /* ---------- Ziel‑Server ermitteln ----------
             * Für die meisten Programme ist das erste Argument der Server,
             * auf dem gearbeitet werden soll. Falls kein Argument vorhanden
             * bleibt das Element undefiniert – dann überspringen wir es für
             * die Gruppierung. */
            const target = args[0];
            if (!target) continue; // keine Gruppierung möglich

            /* ---------- Hack/Grow/Weak zählen ----------
             * Jeder Prozess (unabhängig vom Typ) wird dem Ziel‑Server zugeordnet
             * und entsprechend gezählt. */
            if (script.includes("weaken")) reports[target].weakCount += 1;
            else if (script.includes("hack")) reports[target].hackCount += 1;
            else if (script.includes("grow")) reports[target].growCount += 1;

            /* ---------- Delay‑Programme ----------
             * Nur Skripte, die mit "work/delay" beginnen. */
            const delayRegex = /^work\/delay.*\.js$/i;
            if (!delayRegex.test(proc.filename)) continue;

            // Arg(3) enthält die Zeiten
            const combinedArg = args[2] ?? "";
            const parsed = parseCombinedArg(combinedArg);
            if (!parsed) continue;   // unerwartetes Format

            /* Min/Max‑Berechnung für diesen Ziel‑Server */
            const currMin = reports[target].minStart;
            const currMax = reports[target].maxEnd;

            if (!currMin || compareTimes(parsed.startTime, currMin) < 0)
               reports[target].minStart = parsed.startTime;
            if (!currMax || compareTimes(parsed.endTime, currMax) > 0)
               reports[target].maxEnd = parsed.endTime;
         }
      }

      /* ---------- Schritt 2 – Ausgabe ----------
       * Tab‑getrennte Zeilen, eine pro Ziel‑Server. */

      ns.print(GELB + "");
      ns.print(GELB + "Akt Zeit: " + getFormattedTime());
      ns.print(ns.sprintf(GELB + "%-20s | %-4s | %-4s | %-4s | %4s | %4s | %s",
         "Server", "Hack", "Grow", "Weak", "Sec", "Money", "von - bis"));
      ns.print(GELB + "-------------------------------------------------------------------------");


      // Ausgabe sortiert nach Servername
      Object.keys(reports)
         .sort()
         .forEach((srv) => {
            const r = reports[srv];
            const times = r.minStart && r.maxEnd
               ? (() => {
                  const startMs = timeStringToMs(r.minStart);
                  const endMs = timeStringToMs(r.maxEnd);
                  const nowMs = timeStringToMs(getFormattedTime());
                  const remainingMs = Math.max(0, endMs - nowMs);
                  const remainingStr = msToHMS(remainingMs);
                  return `${r.minStart.substring(0, 5)}-${r.maxEnd.substring(0, 5)} (${remainingStr})`;
               })()
               : "N/A";


            if (r.hackCount + r.growCount + r.weakCount > 0) {
               const { moneyPct, secClosePct } = calcServerPercents(ns, srv);
               ns.print(ns.sprintf(GELB + "%-20s | %4s | %4s | %4s | %3s%% | %3s%% | %s",
                  srv, r.hackCount, r.growCount, r.weakCount, secClosePct, moneyPct, times));
            }

         });

      await ns.sleep(500);
      /* Optional: Ergebnis in JSON‑Datei schreiben (für spätere Analyse) */
      //   const jsonOut = JSON.stringify(reports, null, 2);
      //await ns.write("analysis.json", jsonOut, "w");
   }
}
