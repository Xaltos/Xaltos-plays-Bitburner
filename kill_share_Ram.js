/** 
 * kill_share_ram.js
 * ---------------------------------
 * Dieses Skript sucht nach allen Servern, die vom Home‑Computer
 * erreichbar sind, und beendet dort sämtliche laufende Instanzen
 * von "work/share_Ram.js".
 *
 * Usage:
 *   ns.run("kill_share_ram.js")
 *
 * Voraussetzung: Das Skript wird von *home* gestartet und hat Root‑Zugriff
 * auf die Ziel‑Server (oder zumindest die Befehle `scriptKill` dürfen
 * ausgeführt werden).
 */

export async function main(ns) {
    // Der Name des zu tödenden Scripts
    const targetScript = "work/share_Ram.js";

    // Alle erreichbaren Server sammeln
    const allServers = getAllServers(ns);

    // Für jeden Server prüfen, ob das Skript läuft und ggf. killen
    for (const srv of allServers) {
        if (ns.isRunning(targetScript, srv)) {
            ns.scriptKill(targetScript, srv);          // Kill alle Instanzen
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
function getAllServers(ns, host = "home", visited = new Set()) {
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
