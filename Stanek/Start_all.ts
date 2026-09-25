export async function main(ns: NS) {
   /* ------------------------------------------------------------------
      1️⃣  Parameter‑Verarbeitung
      ------------------------------------------------------------------ */
   let percentArg = ns.args[0];          // erstes Argument

   // Wenn kein Argument → 100 % Verweden
   if (percentArg === undefined) {
      percentArg = 100;
   }

   // Nur positive, ≤ 100 Prozent zulassen
   const percent = Number(percentArg);
   if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      ns.tprint(`❌ Ungültiger Prozentsatz: "${percentArg}"`);
      return;
   }

   /* ------------------------------------------------------------------
      2️⃣  Netzwerk‑Scan
      ------------------------------------------------------------------ */
   const scriptName = "Stanek/Start.ts";

   // ------------------------------------------------------------------
   // 0️⃣  Fragmente ermitteln – diese werden später als Argumente an Start.ts übergeben
   // ------------------------------------------------------------------
   const fragments: ActiveFragment[] = ns.stanek.activeFragments();
   if (fragments.length === 0) {
      ns.tprint("❌ Keine Stanek‑Fragmente gefunden – Skript abgebrochen.");
      return;
   }

   // Koordinaten als flache Zahlensammlung vorbereiten
   const fragmentArgs: number[] = [];
   for (const frag of fragments) {
      if (frag.type !== 18) { // nur nicht‑Charged Fragmente
         fragmentArgs.push(frag.x, frag.y);
      }
   }
   const hosts = ["home"];   // Speicher für alle Server

   function scanNetwork2(current: any, prefix = "") {
      let nodes = ns.scan(current);

      // Knoten filtern die noch nicht besucht wurden
      let targets = nodes.filter(node => !hosts.includes(node));

      for (let i = 0; i < targets.length; i++) {
         const node = targets[i];
         hosts.push(node);
         const isLast = i === targets.length - 1;
         const pointer = isLast ? "└── " : "├── ";
         //ns.tprint(prefix + pointer + node);

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
         // Übergabe der Fragmentkoordinaten an Start.ts
         const execResult = await ns.exec(
            scriptName,
            server,
            threads,
            ...fragmentArgs
         );
         if (!execResult) {
            ns.tprint(`❌ Fehler beim Starten von ${scriptName} auf ${server}`);
         } else {
            ns.tprint(`Starte ${threads} Threads auf ${server}`);
         }
      }
   }


}
