
export async function main(ns: NS): Promise<void> {
   // Liste der Zielserver
   const targets: string[] = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets"];

   for (const target of targets) {
      ns.tprint(`════════════════════════════════════════`);
      ns.tprint(`Starte Prozess für: ${target}`);

      // 1. Pfad zum Zielserver finden
      const path = findPath(ns, "home", target, new Set<string>());

      if (!path) {
         ns.tprint(`❌ Fehler: Pfad zu ${target} nicht gefunden.`);
         continue;
      }

      // 2. Verbindung über den Pfad aufbauen
      ns.tprint(`✈️ Verbinde mit ${target}...`);
      for (const node of path) {
         // Überspringe das Starten auf 'home'
         if (node !== "home") {
            ns.singularity.connect(node);
         }
      }

      // 3. Root-Zugriff überprüfen / erzwingen
      if (!ns.hasRootAccess(target)) {
         ns.tprint(`🔓 Versuche Root-Zugriff auf ${target} zu erlangen...`);
         try {
            // Versuche alle Ports zu öffnen, falls Programme vorhanden sind
            if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(target);
            if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(target);
            if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(target);
            if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(target);
            if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(target);

            ns.nuke(target);
         } catch (e) {
            ns.tprint(`❌ Nuke fehlgeschlagen. Skill-Level zu niedrig oder Ports fehlen.`);
            // Zurück zu Home springen und fortfahren
            ns.singularity.connect("home");
            continue;
         }
      }

      // 4. Backdoor installieren
      if (ns.hasRootAccess(target)) {
         const server = ns.getServer(target);
         // Prüfen, ob das Hack-Level ausreicht
         const playerRequiredHack = ns.getHackingLevel();
         const serverRequiredHack = server.requiredHackingSkill ?? 0;

         if (playerRequiredHack < serverRequiredHack) {
            ns.tprint(`⚠️ Hack-Level zu niedrig (${playerRequiredHack}/${serverRequiredHack}). Überspringe Backdoor.`);
         } else {
            ns.tprint(`🛠️ Installiere Backdoor auf ${target}...`);
            await ns.singularity.installBackdoor();
            ns.tprint(`✅ Backdoor erfolgreich auf ${target} installiert!`);
         }
      }

      // 5. Zurück zur Basis
      ns.singularity.connect("home");
   }
   ns.tprint(`════════════════════════════════════════`);
   ns.tprint(`🎉 Skript beendet.`);
}

/**
 * Rekursive Funktion zur Pfadfindung im Server-Netzwerk
 */
function findPath(ns: NS, current: string, target: string, visited: Set<string>): string[] | null {
   if (current === target) return [current];

   visited.add(current);
   const connections = ns.scan(current);

   for (const next_node of connections) {
      if (!visited.has(next_node)) {
         const path = findPath(ns, next_node, target, visited);
         if (path) {
            return [current, ...path];
         }
      }
   }

   return null;
}
