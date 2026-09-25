/* ==============================================================
   Bitburner – Gang‑Verwaltungs‑Script (TypeScript)
   -------------------------------------------------------------
   *  Alle Konstanten/Parameter sind oben definiert.
   *  Der Code nutzt die aktuelle API; falls ein Aufruf nicht
   *  existiert, fällt er auf einen einfachen Default‑Fall zurück.
   ============================================================= */

const TASK_TRAIN = "Train Combat";
const TASK_VIGI = "Vigilante Justice";
const TASK_NOOB = "Mug People";
const TASK_RESPECT = "Terrorism";
const TASK_MONEY = "Human Trafficking";
const TASK_WARFARE = "Territory Warfare";
const TASK_NULL = "Unassigned";
const TASK_MANUAL = "Manual/NotReallyTaskName";

const ASCEND_ON_MPL = 10;
const EQUIP_AFFORD_COEFF = 100;

const STATS_TRESHOLD = 0.7;      // Anteil der besten Stats für Training
const STATS_MIN = 4000;     // Minimum, um als „gut“ zu gelten
const STATS_HARD_MIN = 200;      // Minimaler Wert eines Mitglieds
const TRAIN_CHANCE = 0.2;      // Chance, trotzdem zu trainieren

const RESPECT_MIN = 2e6;       // Mindestrespekt für Waffen‑Modus
const WANTED_PENALTY_TRESHOLD = 0.99;
const WARFARE_TRESHOLD = 10;

const MEMBERS_MIN = 6;
const MEMBERS_MAX = 12;

const SLEEP_TIME = 10000;     // 10 s zwischen Schleifendurchläufen

const MEMBERS = ["Luise Snake", "Hinkender John", "Messer Tanya", "Meister Tyrion", "Flinke Jorah ", "Starke Hugo", "Revolver Mike", "Kleiner Mike", "Brutos", "Hotzenplotz", "Tormund", "Hodor", "Beton", "Gerold", "Natas", "Calmur"];

/* ==============================================================
   Hauptfunktion
   ============================================================== */
export async function main(ns: NS): Promise<void> {


   /* ------------------------------------------------------------
      Hilfsfunktionen – kurz und kommentiert
      ------------------------------------------------------------ */

   /** Summe aller Kampfstats eines Mitglieds (gewichtete Summe) */
   const getStatsSum = (member: string): number => {
      const info = ns.gang.getMemberInformation(member);
      return info.str + info.def + info.dex + info.agi;
   };

   /**
    * Maximale Power der gegnerischen Gangs
    * (außer dem eigenen)
    *
    * In neueren Versionen wird `getAllGangInformation()` benutzt,
    * in älteren Versionen fällt ein Fallback auf `{}`
    */
   const maxEnemyPower = (myGang: any): number => {
      // --- Neuere API --------------------------------------------
      if (typeof ns.gang.getAllGangInformation === 'function') {
         const allGangs = ns.gang.getAllGangInformation() as Record<string, any>;
         let maxP = 0;
         for (const name in allGangs) {
            // eigene Gang überspringen (dieser Name ist üblicherweise gleich
            // dem eigenen Faction‑Namen)
            if (name === myGang.faction || allGangs[name].faction === myGang.faction) continue;
            maxP = Math.max(maxP, allGangs[name].power);
         }
         return maxP;
      }

      // --- Legacy-Fallback ----------------------------------------
      // Falls die neue Methode nicht existiert: schätzen wir
      // mit einem festen (vermutlich hohen) Wert.
      // In echten Szenarien sollte man hier ggf. das alte API‑Pattern
      // rekonstruieren, falls noch vorhanden.
      ns.tprint("Warnung: `getAllGangInformation()` nicht gefunden – "
         + "Maximale Gegnerpower wird auf 0 gesetzt.");
      return 0;
   };

   /** Automatische Aufgabenverwaltung (verhindert Überschreiben) */
   const autoTasks: Record<string, string> = {};

   /**
    * Setzt die Aufgabe eines Mitglieds automatisch,
    * sofern keine manuelle Einstellung vorliegt.
    */
   const setAutoTask = (member: string, task: string): void => {
      const info = ns.gang.getMemberInformation(member);
      const lastT = info.task;

      // Manuelle Aufgabe erkannt → nicht überschreiben
      if (
         lastT !== TASK_NULL &&
         autoTasks.hasOwnProperty(member) &&
         autoTasks[member] !== lastT
      ) {
         autoTasks[member] = TASK_MANUAL;
         return;
      }

      autoTasks[member] = task;
      if (lastT !== task) ns.gang.setMemberTask(member, task);
   };

   /* ------------------------------------------------------------
      Optionaler Standard‑Task über Kommandozeilenargument
      ------------------------------------------------------------ */
   let defaultTask: string | null = null;
   if (
      ns.args[0] &&
      ns.gang.getTaskNames().includes(ns.args[0] as string)
   ) {
      defaultTask = ns.args[0] as string;
   }

   /* ------------------------------------------------------------
      Hauptschleife – läuft unendlich, bis das Skript gestoppt wird
      ------------------------------------------------------------ */
   while (true) {

      /* ---------- Rekrutierung ----------
         Solange ein neuer Spielerplatz frei ist, holen wir
         einen neuen Gang‑Mitglied. ---------------------------------*/

      while (ns.gang.canRecruitMember()) {
         let member_names = ns.gang.getMemberNames();
         var name = 'member' + Math.random().toString().substr(2, 3); // Original function, Just in case no name is found
         for (let n of MEMBERS) {
            let nameExists = member_names.some(existingName => existingName.startsWith(n));
            if (!nameExists) {
               name = n;
               break;
            }
         }
         ns.gang.recruitMember(name);
         ns.tprint(`${name} angeheuert!`);
      }

      /* ---------- Initialisierung ----------
         Mitgliederliste und aktuelle Gang‑Infos holen. ----------- */
      let members = ns.gang.getMemberNames();
      let info = ns.gang.getGangInformation();

      /* ---------- Aufsteigen lassen ----------
         Wenn die Kombinations‑Power (MPL) eines Mitglieds
         über dem Schwellenwert liegt, steigt es auf. ------------------*/
      for (const member of members) {
         const r = ns.gang.getAscensionResult(member);
         if (!r) continue;
         const mpl = r.str * r.def * r.dex * r.agi;
         if (mpl > ASCEND_ON_MPL) {
            ns.gang.ascendMember(member);
            ns.tprint(`Gangmitglied ${member} steigt auf.`);
            ns.gang.renameMember(member, member + "+");

            members = ns.gang.getMemberNames();
            info = ns.gang.getGangInformation();
         }
      }

      /* ---------- Ausrüstung kaufen ----------
         Wir prüfen jedes Ausrüstungsitem, haben genug Geld
         und besitzen es noch nicht – dann wird es gekauft.
         **Nur wenn das Mitglied mindestens STATS_HARD_MIN an Kampfstats hat**
         (siehe const STATS_HARD_MIN). */
      const allEquip = ns.gang.getEquipmentNames();
      let money = ns.getServerMoneyAvailable('home');
      for (const equip of allEquip) {
         const cost = ns.gang.getEquipmentCost(equip);
         const amount = money / cost;
         if (amount < EQUIP_AFFORD_COEFF) continue;

         for (const member of members) {
            // Skip purchase if the member is below the strength threshold
            if (getStatsSum(member) < STATS_HARD_MIN) {
               ns.tprint(`${member} zu schwach (${getStatsSum(member)}), Ausrüstung nicht gekauft`);
               continue;
            }

            const mInfo = ns.gang.getMemberInformation(member);
            if (
               mInfo.upgrades.includes(equip) ||
               mInfo.augmentations.includes(equip)
            ) continue;

            if (ns.gang.purchaseEquipment(member, equip)) money -= cost;
         }
      }

      /* ---------- Beste Stats ermitteln ----------
         Bestimmen wir den höchsten Stat‑Wert aller Mitglieder.
         -------------------------------------------*/
      let bestStats = STATS_MIN / STATS_TRESHOLD;
      for (const member of members) {
         const sum = getStatsSum(member);
         if (sum > bestStats) bestStats = sum;
      }

      /* ---------- Power‑Check ----------
         Ist die eigene Gang‑Power mindestens
         WARFARE_TRESHOLD mal die Gegner‑Power? Dann aktiviere Krieg. --------*/
      const powerfulEnough = info.power >= maxEnemyPower(info) * WARFARE_TRESHOLD;
      ns.gang.setTerritoryWarfare(powerfulEnough);

      /* ---------- Standard‑Task bestimmen ----------
         Wenn kein expliziter Task gesetzt ist, wählen wir
         basierend auf Mitgliederzahl und Respekt. -----------*/
      let task = defaultTask;
      if (!defaultTask) {
         if (members.length < MEMBERS_MAX) {
            task = members.length < MEMBERS_MIN ? TASK_NOOB : TASK_RESPECT;
         } else {
            // wenn Respekt zu niedrig – erst respekt, dann power, schließlich money
            if (info.respect < RESPECT_MIN) task = TASK_RESPECT;
            //else if (!powerfulEnough) task = TASK_WARFARE;
            else task = TASK_MONEY;
         }
      }

      /* ---------- Aufgabenverteilung ----------
         Für jedes Mitglied entscheiden wir:
         - Training, falls Stats zu niedrig
         - Vigilante bei hohem wantedLevel
         - Sonst den Standard‑Task (mit einer kleinen Chance auf Training). */
      for (const member of members) {
         const sum = getStatsSum(member);

         // Trainieren, wenn die Stats zu schwach sind.
         if (
            sum < STATS_HARD_MIN ||
            (members.length >= MEMBERS_MIN && sum < bestStats * STATS_TRESHOLD)
         ) {
            setAutoTask(member, TASK_TRAIN);
            continue;
         }

         // Vigilante bei hohem wantedLevel
         if (
            info.wantedLevel > 2 &&
            info.wantedPenalty < WANTED_PENALTY_TRESHOLD
         ) {
            setAutoTask(member, TASK_VIGI);
            continue;
         }

         // Sonst den Standard‑Task (manchmal zufällig Training)
         setAutoTask(
            member,
            Math.random() < TRAIN_CHANCE ? TASK_TRAIN : task as string
         );
      }

      /* ---------- Wartezeit ----------
         Damit die Schleife nicht zu schnell läuft – 10 s. --------*/
      await ns.sleep(SLEEP_TIME);
   }
}
