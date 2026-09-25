// share-all.js
/** @param {NS} ns */
export async function main(ns) {
   /* ------------------------------------------------------------------
      1️⃣  Parameter‑Verarbeitung
      ------------------------------------------------------------------ */
   const percentArg = ns.args[0];          // erstes Argument

   // Wenn kein Argument → Hilfe ausgeben und abbruch
   if (percentArg === undefined) {
      printHelp();
      return;
   }

   // Nur positive, ≤ 100 Prozent zulassen
   const percent = Number(percentArg);
   if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      ns.tprint(`❌ Ungültiger Prozentsatz: "${percentArg}"`);
      printHelp();
      return;
   }

   /* ------------------------------------------------------------------
      2️⃣  Netzwerk‑Scan
      ------------------------------------------------------------------ */
   const scriptName = "work/share_Ram.js";
   const hosts = ["home"];   // Speicher für alle Server

   function scanNetwork2(current, prefix = "") {
      let nodes = ns.scan(current);

      // Knoten filtern die noch nicht besucht wurden
      let targets = nodes.filter(node => !hosts.includes(node));

      for (let i = 0; i < targets.length; i++) {
         const node = targets[i];
         hosts.push(node);
         const isLast = i === targets.length - 1;
         const pointer = isLast ? "└── " : "├── ";
         ns.tprint(prefix + pointer + node);

         const newPrefix = prefix + (isLast ? "    " : "│   ");
         scanNetwork2(node, newPrefix);
      }
   }

   scanNetwork2("home");

   /* ------------------------------------------------------------------
      3️⃣  Skript‑Start auf allen Servern
      ------------------------------------------------------------------ */
   for (const server of hosts) {
      if (!ns.hasRootAccess(server)) continue;

      // Auf Zielserver kopieren (außer home)
      if (server !== "home") await ns.scp(scriptName, server);

      // RAM‑Berechnung – 32 GB von “home” freihalten
      let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (server === "home") freeRam -= 32;

      // Nur ein Teil des freien RAMs verwenden
      freeRam *= percent / 100;

      if (server.startsWith("hacknet")) continue;   // nicht für Hacknet‑Server

      const scriptRam = ns.getScriptRam(scriptName);
      const threads = Math.floor(freeRam / scriptRam);

      if (threads >= 1) {
         await ns.exec(scriptName, server, threads);
         ns.tprint(`Starte ${threads} Threads auf ${server}`);
      }
   }

   /* ------------------------------------------------------------------
      4️⃣  Hilfe‑Ausgabe
      ------------------------------------------------------------------ */
   function printHelp() {
      ns.tprint("Syntax:");
      ns.tprint("   share_RAM_all.js <Prozentsatz>");
      ns.tprint("");
      ns.tprint("Beispiel:  share-all.js 80  →  80 % des verfügbaren RAMs");
      ns.tprint("          wird für die Skriptausführung auf jedem Server genutzt.");
      ns.tprint("");
      ns.tprint("Hinweise:");
      ns.tprint("- Auf 'home' werden stets 32 GB RAM freigelassen, um andere Skripte laufen zu lassen.");
      ns.tprint("- Hacknet‑Server werden ignoriert");

   }
}
