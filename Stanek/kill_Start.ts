export async function main(ns: NS) {
   // Der Name des zu tödenden Scripts
   const targetScript = "Stanek/Start.ts";

   // Alle erreichbaren Server sammeln
   const allServers = getAllServers(ns);

   // Für jeden Server prüfen, ob das Skript läuft und ggf. killen
   for (const srv of allServers) {

      const wasKilled = ns.scriptKill(targetScript, srv);
      if (wasKilled) {
         ns.tprint(`🔪  ${targetScript} beendet auf ${srv}`);
      }
   }

   ns.tprint(`✅  Fertig: Alle Instanzen von ${targetScript} wurden beendet.`);
}

/**
 * Rekursive Tiefensuche – Liefert ein Array aller Server,
 * die über `ns.scan()` vom Home‑Computer erreichbar sind.
 *
 * @param {NS} ns
 * @param {string} host   Start‑Host (Standard: "home")
 * @param {Set<string>} visited  (intern verwendet)
 * @returns {string[]}
 */
function getAllServers(ns: NS, host = "home", visited = new Set()) {
   if (visited.has(host)) return [];
   visited.add(host);

   const servers = [host];
   const neighbours = ns.scan(host);

   for (const s of neighbours) {
      if (!visited.has(s)) {
         servers.push(...getAllServers(ns, s, visited));
      }
   }
   return servers;
}
