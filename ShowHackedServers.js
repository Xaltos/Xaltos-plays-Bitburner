/* ────────────────────────────────────────────────────────────────────────────────────────────────
   ShowHackedServersWithThreads.js
   ────────────────────────────────────────────────────────────────────────────────────────────────
   • Lists every server you own (root‑access) and that has RAM.
   • For each server prints:
        - Server name
        - Free RAM (GB)
        - Max RAM (GB)
        - Used RAM (GB)
        - Number of processes
        - Total threads (sum of all thread‑counts)
   • The table is printed to the Tail (or console) in a tidy format.
   ────────────────────────────────────────────────────────────────────────────────────────────────
*/

export async function main(ns) {
   // Quiet the console – we only want the table
   ns.disableLog('ALL');
   ns.disableLog('scan');

   // ----------------------------------------------------------------------
   // 1. Find every server in the network
   const allServers = getAllHosts(ns);

   // ----------------------------------------------------------------------
   // 2. Keep only the ones we own & have RAM
   const hacked = [];
   for (const srv of allServers) {
      if (ns.hasRootAccess(srv) && ns.getServerMaxRam(srv) > 0) {
         hacked.push(srv);
      }
   }

   // ----------------------------------------------------------------------
   // 3. Sort alphabetically (or by free RAM – change the key if you wish)
   hacked.sort(compareByName);

   // ----------------------------------------------------------------------
   // 4. Print a header
   const header =
      `${pad('Name', 25)} | ${pad('Free RAM', 10)} | ${pad('Max RAM', 10)} | ${pad('Used RAM', 10)} | ${pad('Procs', 6)} | ${pad('Threads', 8)}| Cores`;
   ns.tprint(header);
   ns.tprint('────────────────────────────────────────────────────────────────────────────────────────────');

   // --------------------------------------------------------------
   // 5. Prepare variables for the sum row
   let sumFreeRam = 0;
   let sumMaxRam = 0;
   let sumUsedRam = 0;
   let sumProcCount = 0;
   let sumThreads = 0;
   let sumCores = 0;   // optional – cores are numeric as well

   // ----------------------------------------------------------------------
   // 5. Print each hacked server
   for (const srv of hacked) {
      const server = ns.getServer(srv);

      const maxRam = ns.getServerMaxRam(srv);
      const usedRam = ns.getServerUsedRam(srv);
      const freeRam = maxRam - usedRam;
      const procs = ns.ps(srv);
      const procCount = procs.length;
      const Cores = server.cpuCores;

      // Sum of all thread‑counts
      let totalThreads = 0;
      let param = "";
      for (const p of procs) {
         totalThreads += p.threads;
      }

      // --- accumulate for the summary line ---
      sumFreeRam += freeRam;
      sumMaxRam += maxRam;
      sumUsedRam += usedRam;
      sumProcCount += procCount;
      sumThreads += totalThreads;
      sumCores += Cores;

      ns.tprint(
         `${pad(srv, 25)} | ${pad(freeRam.toFixed(2) + ' GB', 10)} | ${pad(maxRam.toFixed(0) + ' GB', 10)} | ${pad(usedRam.toFixed(2) + ' GB', 10)} | ${pad(procCount.toString(), 6)} | ${pad(totalThreads.toString(), 8)}| ${Cores} `
      );

   }
   // --------------------------------------------------------------
   // 7. Print the sum row
   ns.tprint('────────────────────────────────────────────────────────────────────────────────────────────');
   ns.tprint(
      `${pad('TOTAL', 25)} | ${pad(sumFreeRam.toFixed(2) + ' GB', 10)} | ${pad(sumMaxRam.toFixed(0) + ' GB', 10)} | ${pad(sumUsedRam.toFixed(2) + ' GB', 10)} | ${pad(sumProcCount.toString(), 6)} | ${pad(sumThreads.toString(), 8)}| ${sumCores} `
   );





}

/* ─────────────────────────────────────────────────────────────────────────────────────────────
   Helper: Get all servers reachable from “home”.
   Uses a BFS to avoid revisiting nodes.
   ─────────────────────────────────────────────────────────────────────────────────────────────
*/
function getAllHosts(ns) {
   const seen = new Set(['home']);
   const stack = ['home'];
   while (stack.length) {
      const cur = stack.pop();
      for (const nxt of ns.scan(cur)) {
         if (!seen.has(nxt) && nxt !== 'home') {
            seen.add(nxt);
            stack.push(nxt);
         }
      }
   }
   return Array.from(seen);
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────
   Helper: Pad a string to a fixed width.
   ─────────────────────────────────────────────────────────────────────────────────────────────
*/
function pad(str, width) {
   const s = String(str);
   if (s.length >= width) return s.slice(0, width);
   return s + ' '.repeat(width - s.length);
}

function compareByName(a, b) {
   // `localeCompare` liefert die gewünschte Sortierreihenfolge für Strings
   return a.localeCompare(b);
}