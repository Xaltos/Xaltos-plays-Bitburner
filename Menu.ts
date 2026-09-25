//import { NS, NodeStats } from "./NetscriptDefinitions";

export interface MenuItem {

   number: number;   /** Die sichtbare Nummer im Menü. */
   path: string;     /** Relativer Pfad zum Skript – genau der String, den du später in ns.exec übergibst. */
   label?: string;   /** Optionaler kurzer beschreibender Text (wenn anders als `path`). */
   Arg?: ScriptArg[];
}

export interface MenuSection {
   /** Titel einer Menü‑Sektion, z.B. "Start/Buy". */
   title: string;
   /** Alle Items dieser Sektion. */
   items: MenuItem[];
}

/* ------------------------------------------------------------
    Exportiere hier deine komplette Menü‑Liste.
    ----------------------------------------------- */
export const menuSections: MenuSection[] = [
   {
      title: "",
      items: [
         { number: 1, path: "work/purchaseProgram.ts" },
         { number: 2, path: "DarkServer.ts" },
         { number: 3, path: "Darkweb.ts" },
         { number: 31, path: "Stanek/Start_all.ts", Arg: ["100"] },
         { number: 32, path: "Stanek/kill_Start.ts" },
         { number: 35, path: "InstallBackdoor.ts" },
      ]
   },
   {
      title: "",
      items: [
         { number: 41, path: "sleeves/LevelupSleeves.ts", label: "Sleeves Levelup" },
         { number: 42, path: "sleeves/ExecuteHack.ts", label: "Sleeves Hack (teuer)" },
         { number: 43, path: "sleeves/ExecuteCrime.ts", label: "Sleeves Crime" },
      ]
   },

   {
      title: "",
      items: [
         { number: 5, path: "Hack_Starter.ts" },
         { number: 6, path: "network_hack.js" }
      ]
   },

   {
      title: "",
      items: [
         { number: 7, path: "Gang_Manager.ts" },
         { number: 8, path: "Gang_Warfare.ts" },
         { number: 9, path: "buy_Cloud.js" },
         { number: 10, path: "buy_Hacknet.ts" },
         { number: 11, path: "share_RAM_all.js", label: "share_RAM_all.js 20", Arg: ["20"] }
      ]
   },
   {
      title: "",
      items: [
         { number: 12, path: "scan_running_prog.ts" }
      ]
   }
];

/* --------------------------------------------------------------
   menu.ts
   --------------------------------------------- */
//import { NS } from "@ns";
//import { MenuItem, MenuSection, menuSections } from "./menu-data";

/** ------------------------------------------------------------------
    Hilfsfunktionen – Starten / Stoppen eines Skripts.
    ------------------------------------------------------------------- */
async function startScript(ns: NS, scriptPath: string, Arg: ScriptArg[] | undefined): Promise<void> {
   let pid = 0;
   if (Arg && Arg.length == 2)
      pid = await ns.exec(scriptPath, "home", 1, Arg[0], Arg[1]);
   else if (Arg && Arg.length == 1)
      pid = await ns.exec(scriptPath, "home", 1, Arg[0]);
   else
      pid = await ns.exec(scriptPath, "home", 1);

   if (pid === -1)
      ns.tprint(`⚠️  Kann ${scriptPath} nicht starten!`);
   else
      ns.tprint(`🟢  Starte ${scriptPath} (PID=${pid})`);
}

async function stopScript(ns: NS, scriptPath: string): Promise<void> {
   const running = ns.ps();          // Alle Prozesse im lokalen Server
   let stopped = false;

   for (const p of running) if (p.filename === scriptPath) {
      await ns.kill(p.pid);
      ns.tprint(`⛔️  Stoppe ${scriptPath} (PID=${p.pid})`);
      stopped = true;
   }

   if (!stopped)
      ns.tprint(`⚠️  Keine laufende Instanz von ${scriptPath}.`);
}

/** ------------------------------------------------------------------
    Menü‑Text aus den Daten bauen.
    ------------------------------------------------------------------- */
function buildMenuString(
   sections: MenuSection[],
   runningSet: Set<string>
): string {
   let out = "";
   for (const sec of sections) {
      if (sec.title.length > 0)
         out += `${sec.title}\n`;
      sec.items.forEach(it => {
         const suffix = runningSet.has(it.path) ? " (läuft)" : "";
         out += `${it.number}. ${it.label ?? it.path}${suffix}\n`;
      });
      out += "\n";
   }
   return out + "q = Exit\n";
}

/** ------------------------------------------------------------------
    Hauptloop.
    ------------------------------------------------------------------- */
/* ----------  Hauptloop ----------
   Wir bauen das Menü jedes Mal neu – so bleibt der Status aktuell. ------- */
export async function main(ns: NS): Promise<void> {
   ns.disableLog("ALL");

   while (true) {
      /* ----- 1️⃣ Laufende Skripte erfassen ---- */
      const runningSet = new Set<string>(ns.ps().map(p => p.filename));

      /* ----- 2️⃣ Menü‑Text generieren ---- */
      const menuText = buildMenuString(menuSections, runningSet);

      /* ----- 3️⃣ Prompt & Eingabe verarbeiten ---- */
      let raw = await ns.prompt(menuText, { type: "text" });
      if (raw == "" || raw == false)
         raw = "q";   // Alternative Weg das Progrmm zu beenden

      if (!raw) continue;                 // Leere Eingabe ignorieren
      if (/^q$/i.test(raw.toString().trim())) break; // Exit

      const choice = parseInt(raw.toString().trim(), 10);
      if (isNaN(choice)) {
         ns.tprint(`❌ Unbekannter Befehl: ${raw}`);
         continue;
      }

      /* ----- 4️⃣ Menü‑Item finden ---- */
      const absNum = Math.abs(choice);
      let selected: MenuItem | undefined;
      for (const sec of menuSections)
         if ((selected = sec.items.find(i => i.number === absNum))) break;

      if (!selected) {
         ns.tprint(`❌ Keine Einträge mit Nummer ${choice}.`);
         continue;
      }

      /* ----- 5️⃣ Starten / Stoppen ---- */
      if (choice < 0) await stopScript(ns, selected.path);
      else await startScript(ns, selected.path, selected.Arg);
   }

   ns.tprint("🛑 Menü beendet.");
}
