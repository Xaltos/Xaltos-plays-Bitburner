/** @param {NS} ns */
/** This lets you tab-complete putting "--tail" on the run command so you can see the script logs as it runs, if you want
 *  If you add support to the script to take other arguments, you can add them here as well for convenience
 *  @param {AutocompleteData} data */
export async function main(ns: NS) {

   var LoopCounter = 0;
   while (true) {
      const nearbyServers = ns.dnet.probe();      // Get a list of all darknet hostnames directly connected to the current server

      // Attempt to authenticate with each of the nearby servers, and spread this script to them

      for (const hostname of nearbyServers) {

         if (LoopCounter == 0)   // Beim ersten Loop werden schon gehackte Server übersprungen.  Später aber schon angesprungen
         {
            if (ns.hasRootAccess(hostname)) {  // Wurde der Server schon gehackt ?  Speedup, damit wir erst mal etwas Strecke schaffen
               continue;
            }
         }

         const authenticationSuccessful = await serverSolver(ns, hostname);
         if (!authenticationSuccessful) {
            continue; // If we failed to auth, just move on to the next server
         }

         // If we have successfully authenticated, we can now copy and run this script on the target server
         ns.scp(ns.getScriptName(), hostname);
         ns.scp("/work/setStasisLink.ts", hostname);
         ns.exec(ns.getScriptName(), hostname, {
            preventDuplicates: true, // This prevents running multiple copies of this script
         });
      }
      LoopCounter++;

      var thisHostname = ns.getHostname();


      if (ns.dnet.isDarknetServer(thisHostname)) {

         // Speicher freigeben
         if (ns.dnet.getBlockedRam(thisHostname) > 0) {
            await ns.dnet.memoryReallocation(thisHostname);
         }

         // Dateien kopieren

         let filesOnServer = ns.ls(thisHostname);    // Holt die Dateinamen des aktuellen Servers
         ns.print(`Dateien auf ${thisHostname}: ${filesOnServer}`);

         for (var filename of filesOnServer) {
            if (filename.endsWith(".cache")) {
               let cacheData = ns.dnet.openCache(filename);
               ns.print("Inhalt des Caches: " + JSON.stringify(cacheData, null, 2));
            } else if (filename.endsWith(".txt") || filename.endsWith(".lit")) {
               // wird aktuell nicht gebraucht
               //ns.print("Copy Datei : " + filename);
               //await ns.scp(filename, "home", thisHostname);
            }
            else if (filename.endsWith(".ts") || filename.endsWith(".js")) {
               // Nichts, das ist ganz normal
            }
            else {
               // todo:  Wann wollen wir die Storm.exe ausführen ==> Mehr Geld / mehr chaos
               // ns.tprint("Unbekannte Datei: " + filename + " gefunden");
               // ns.dnet.unleashStormSeed();
               // Erst mal nicht
            }
         }

         // Link starten wenn es geht
         // 1.)  Wo gibt es schon Links?
         var LinkServerList = ns.dnet.getStasisLinkedServers();
         var maxdepth = 0;
         for (var hostname of LinkServerList) {
            const details = ns.dnet.getServerDetails(hostname);
            if (details.depth > maxdepth) {
               maxdepth = details.depth;
            }
         }

         // 2.) neuen Link setzen ,aber nur wenn wir entsprechend hoch sind.
         const details = ns.dnet.getServerDetails(thisHostname);
         if (details.depth >= maxdepth && ns.getServerMaxRam(thisHostname) > 18) {
            try {
               ns.exec("/work/setStasisLink.ts", thisHostname);
            }
            catch (Error) {
               // Nicht schlimm wenn es nicht klappt
            }
         }
      }

      // TODO: take advantage of the extra ram on darknet servers to run ns.dnet.phishingAttack calls for money
      try {
         var erg = await ns.dnet.phishingAttack();
         if (erg.success) {
            ns.tprint("phishingAttack: " + JSON.parse(erg));
         }
      }
      catch (Error) {
         // Nichts
      }

      await ns.sleep(2000);
   }
}

export const serverSolver = async (ns: NS, hostname: string) => {
   // Get key info about the server, so we know what kind it is and how to authenticate with it
   const details = ns.dnet.getServerDetails(hostname);

   if (!details.isConnectedToCurrentServer || !details.isOnline) {
      // If the server isn't connected or is offline, we can't authenticate
      return false;
   }

   var password = await SendServerDetails(ns, hostname, details);

   // If you are already authenticated to that server with this script, you don't need to do it again
   if (details.hasSession) {
      return true;
   }

   if (password != undefined && password != null && password != "") {
      const result = await ns.dnet.authenticate(hostname, password);    // Einloggen
      if (result.success) {
         //ns.tprint("Hurra- Gespeichertes Passwort für " + hostname + " hat geklappt. :)")
         return true;
      }
      //else
      //ns.tprint("Oh gespeichertes Passwort für " + hostname + " hat nicht eklappt. :(")
   }
   //   else
   //      ns.tprint("Kein PW für " + hostname + " erhalten")


   switch (details.modelId) {
      case "ZeroLogon":
         return authenticateWithNoPassword(ns, hostname);
      case "CloudBlare(tm)":
         return authenticateCloudBlare(ns, hostname);
      case "FreshInstall_1.0":
      case "TopPass":
         return authenticateFreshInstall10(ns, hostname);
      case "DeskMemo_3.1":
         return authenticateDeskMemo31(ns, hostname);
      case "Laika4":
         return authenticateLaika4(ns, hostname);
      case "OctantVoxel":
         return authenticateOctantVoxel(ns, hostname);
      case "BellaCuore":
         return authenticateBellaCuore(ns, hostname);
      case "KingOfTheHill":
         return authenticateKingOfTheHill(ns, hostname);
      case "Pr0verFl0":             // Buffer Overflow
         return authenticatePr0verFl0(ns, hostname);
      case "DeepGreen":
         return authenticateDeepGreen(ns, hostname);
      case "Factori-Os":
         return authenticateFactoriOs(ns, hostname);
      case "AccountsManager_4.2":
         return authenticateAccountsManager42(ns, hostname);
      case "EuroZone Free":
         return authenticateEuroZoneFree(ns, hostname);
      case "110100100":
         return authenticateBin2Ascii(ns, hostname);
      case "NIL":                   // yes , yes Feedback
         return authenticateNIL(ns, hostname);
      case "OpenWebAccessPoint":     // Feedback auswerten, das Passwort ist da im Text
         return authenticateOpenWebAccessPoint(ns, hostname);
      case "OrdoXenos":
         return authenticateOrdoXenos(ns, hostname);
      case "MathML":
         return authenticateMathML(ns, hostname);
      case "PrimeTime 2":
         return authenticatePrimeTime2(ns, hostname);
      case "BigMo%od":
         return authenticateBigMood(ns, hostname);
      case "RateMyPix.Auth":
         return authenticateRateMyPix(ns, hostname);
      case "PHP 5.4":          // Suffel
         return authenticatePHP54(ns, hostname);
      case "OctantVoxel":
      case "2G_cellular":      // Zeit der Antwort auswerten
         // Bekannt aber noch ohne Logik
         return false;

      case "(The Labyrinth)":
         return authenticateTheLabyrinth(ns, hostname);
      default:
         ns.tprint(`Unbekannte Daten bei Server ${hostname} Datentyp: ${details.modelId}`);
         return false;
   }
};

// -------------------------------------
// ------  Hacken der Server -----------
// -------------------------------------

const authenticateWithNoPassword = async (ns: NS, hostname: string) => {
   const details = ns.dnet.getServerDetails(hostname);
   var password = "";
   const result = await ns.dnet.authenticate(hostname, password);    // Einloggen
   //ShowData(ns, hostname, details, result);
   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }
   return false;
};

const authenticateCloudBlare = async (ns: NS, hostname: string) => {


   const details = ns.dnet.getServerDetails(hostname);
   const digits = details.data.match(/\d/g);

   if (!digits) {
      throw new Error("Keine Zahlen im Input-String gefunden.");
   }
   const password = digits.join('');
   const result = await ns.dnet.authenticate(hostname, password);         // Einloggen
   //ShowData(ns, hostname, details, result);
   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }

   return result.success;
};


/** Alle möglichen Passwörter (keine Schleifen‑Konstruktion). */
const ALL_PASSWORDS_FreshInstall10 = [
   "password", "admin123", "0000", "12345", "666666", "123321", "654321", "121212", "7777777",
   "123qwe", "master", "qazwsx", "mustang", "michael", "superman", "1qaz2wsx", "qwertyuiop", "1234567890",
   "root", "abc", "abcdef", "system", "admin", "123456",
   "12345678", "qwerty", "123456789", "1234", "111111", "1234567", "dragon", "123123", "baseball", "abc123",
   "football", "monkey", "letmein", "696969", "shadow", "0", "trustno1", "jordan", "jennifer", "zxcvbnm",
   "asdfgh", "hunter", "buster", "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou",
   "2000", "charlie", "robert", "thomas", "hockey", "ranger", "daniel", "starwars", "112233", "george",
   "computer", "michelle", "jessica", "pepper", "1111", "zxcvbn", "555555", "11111111", "131313",
   "freedom", "777777", "pass", "maggie", "159753", "aaaaaa", "ginger", "princess", "joshua",
   "cheese", "amanda", "summer", "love", "ashley", "6969", "nicole", "chelsea", "biteme", "matthew", "access",
   "yankees", "987654321", "dallas", "austin", "thunder", "taylor", "matrix"
];


const authenticateFreshInstall10 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Wir kennen die Länge

   for (const pwd of ALL_PASSWORDS_FreshInstall10) {
      if (pwd.length !== neededLen) continue;   // Nicht passen → überspringen

      try {
         const result = await ns.dnet.authenticate(hostname, pwd);
         //         ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe
         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }
      } catch (e: any) {
         ns.print(`Fehler bei ${pwd}: ${e.message}`);
      }
   }
   return false;   // Kein Passwort hat geklappt
};


function ShowData(ns: NS, hostname: string, details: DarknetServerDetails, result: DarknetResult, password: string) {


   const RESET = "\u001b[0m";
   const ROT = "\u001b[31m";
   const GRUEN = "\u001b[32m";
   const GELB = "\u001b[33m";
   const BLAU = "\u001b[34m";
   const LILA = "\u001b[35m";
   const CYAN = "\u001b[36m";


   if (result.success == false) {     // Feedback nur bei Problemen
      ns.tprint("--- vorher ---");
      ns.tprint("Hostname:" + hostname);
      ns.tprint("modelId:" + details.modelId)
      ns.tprint("hint:" + details.passwordHint);
      ns.tprint("passwordLength:" + details.passwordLength);
      ns.tprint("passwordFormat:" + details.passwordFormat);
      ns.tprint("data:" + details.data);
      ns.tprint("Difficulty:" + details.difficulty);

      ns.tprint("message:" + result.message);
      ns.tprint("code:" + result.code);
      ns.tprint("success:" + result.success);
      ns.tprint("PW:" + password);
   }
   else {
      ns.tprint(GRUEN + hostname + " " + details.modelId + " " + password + " " + result.message + RESET);
   }
}



const authenticateDeskMemo31 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);

   const digits = details.passwordHint.match(/\d/g);
   if (digits == null)
      return false
   const password = digits.join('');

   const result = await ns.dnet.authenticate(hostname, password);
   //ShowData(ns, hostname, details, result, password);  // Debug‑Ausgabe
   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }

   return false;   // Kein Passwort hat geklappt
};

/** Alle möglichen Passwörter (keine Schleifen‑Konstruktion). */
const ALL_PASSWORDS_Laika4 = [
   "fido", "spot", "rover", "max", "charlie", "bella", "daisy", "milo", "lucy", "cooper", "sadie",
   "duke", "laika", "belka", "strelka", "buddy", "rocky", "buster", "jake", "toby", "lucky", "rex"];

const authenticateLaika4 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Wir kennen die Länge

   for (const pwd of ALL_PASSWORDS_Laika4) {
      if (pwd.length !== neededLen) continue;   // Nicht passen → überspringen

      try {
         const result = await ns.dnet.authenticate(hostname, pwd);
         //         ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe
         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }
      } catch (e: any) {
         ns.print(`Fehler bei ${pwd}: ${e.message}`);
      }
   }
   return false;   // Kein Passwort hat geklappt
};

const authenticateBellaCuore = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Die gesuchte Passwortlänge

   // String am Komma splitten
   const rZahlenListe = details.data.split(",");

   // Funktion zur Umwandlung einer einzelnen römischen Zahl
   const wandleRoemischUm = (romStr: string): number => {
      let rZahl = romStr.trim();
      let wert = 0;
      while (rZahl.length > 0) {
         if (rZahl.startsWith("CM")) { wert += 900; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("M")) { wert += 1000; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("CD")) { wert += 400; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("D")) { wert += 500; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("XC")) { wert += 90; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("C")) { wert += 100; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("XL")) { wert += 40; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("L")) { wert += 50; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("IX")) { wert += 9; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("X")) { wert += 10; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("IV")) { wert += 4; rZahl = rZahl.substring(2); }
         else if (rZahl.startsWith("V")) { wert += 5; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("I")) { wert += 1; rZahl = rZahl.substring(1); }
         else if (rZahl.startsWith("nulla")) { wert += 0; rZahl = "" }
         else { rZahl = rZahl.substring(1); }
      }
      return wert;
   };

   let startWert = wandleRoemischUm(rZahlenListe[0]);
   let endWert = startWert;

   // Wenn zwei Zahlen existieren, haben wir einen Bereich
   if (rZahlenListe.length > 1) {
      endWert = wandleRoemischUm(rZahlenListe[1]);
   }

   // Alle Zahlen im Bereich (von startWert bis endWert) durchlaufen
   for (let i = startWert; i <= endWert; i++) {
      const pwd = i.toString();


      try {
         const result = await ns.dnet.authenticate(hostname, pwd);
         if (result.code == 351)   // Schnelles Ende bei "Direct Connection Required"
            return false
         //ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe
         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }
      } catch (e: any) {
         ns.print(`Fehler bei ${pwd}: ${e.message}`);
      }
      await ns.sleep(1);
   }

   return false;   // Kein Passwort im Bereich war erfolgreich
}

/**
 * Löst das King-of-the-Hill Passwort-Rätsel mittels Bergsteiger- und Binärsuche.
 */
export const authenticateKingOfTheHill = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;

   // 1. Suchbereich definieren (z.B. 000000 bis 999999)
   const maxCombination = 10 ** neededLen;

   ns.print(`Starte King of the Hill Suche für ${hostname} (Länge: ${neededLen})`);

   // 2. Grober Raster-Scan (Grid Search)
   // Wir tasten den Bereich ab, um den höchsten Hügel (die >3% Zone) zu finden.
   // Ein Schrittweite von ~1% des Gesamtraums stellt sicher, dass wir den Hauptberg nicht verpassen.
   const step = Math.max(Math.floor(maxCombination * 0.0025), 1);
   let bestX = 0;
   let maxAltitude = -1;

   var loop = 0;
   for (let i = 0; i < maxCombination; i += step) {

      loop++;
      if (loop % 5000 == 0)
         await ns.sleep(20);

      const pwd = i.toString().padStart(neededLen, '0');

      try {
         const result = await ns.dnet.authenticate(hostname, pwd);

         // Falls wir durch Zufall direkt treffen
         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }

         // Wir merken uns die Position mit der höchsten gemessenen Höhe
         if (result.data > maxAltitude) {
            maxAltitude = result.data;
            bestX = i;
         }
      } catch (e: any) {
         ns.print(`Fehler im Scan bei ${pwd}: ${e.message}`);
         await ns.sleep(50);
      }
   }

   // 3. Binäre Suche im Zielbereich
   // Durch den Code-Trick im Server sind in der Nähe des Passworts (<3% Abweichung) 
   // alle Nebenhügel ausgeblendet. Die Kurve steigt hier streng monoton bis zum Peak (10000) an.
   // Wir suchen jetzt im Bereich um unseren besten Fund herum.
   let left = Math.max(0, bestX - Math.floor(maxCombination * 0.04));
   let right = Math.min(maxCombination - 1, bestX + Math.floor(maxCombination * 0.04));

   ns.print(`Hauptgipfel lokalisiert nahe ${bestX}. Starte finale Annäherung...`);

   while (left <= right) {

      loop++;
      if (loop % 5000 == 0)
         await ns.sleep(20);


      // Bestimme die Mitte des aktuellen Suchfensters
      const mid = Math.floor((left + right) / 2);

      // Teste die Mitte (mid) und einen Punkt direkt daneben (mid + 1), um die Steigung zu bestimmen
      const pwdMid = mid.toString().padStart(neededLen, '0');
      const pwdNext = (mid + 1).toString().padStart(neededLen, '0');

      try {
         const resMid = await ns.dnet.authenticate(hostname, pwdMid);
         if (resMid.success) return true;

         // Falls wir am rechten Rand sind, brechen wir ab, um Out-of-Bounds zu verhindern
         if (mid >= right) break;

         const resNext = await ns.dnet.authenticate(hostname, pwdNext);
         if (resNext.success) {
            ns.tprint("King of the Hill gefunden.")
            SendPassword(ns, hostname, pwdNext);
            return true;
         }



         // Vergleiche die Höhen: Steigt die Kurve nach rechts an?
         if (resNext.data > resMid.data) {
            // Der Gipfel liegt weiter rechts
            left = mid + 1;
         } else {
            // Der Gipfel liegt weiter links
            right = mid - 1;
         }

      } catch (e: any) {
         ns.print(`Fehler in Binärsuche: ${e.message}`);
         await ns.sleep(50);
      }

      // Kleiner Yield, um das Spiel bei extrem langen Schleifen nicht einzufrieren
      await ns.sleep(1);
   }

   ns.tprint(`King of the hill - Passwort für ${hostname} konnte nicht ermittelt werden.`);
   return false;
};

const authenticatePr0verFl0 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);

   // Buffer Overflow erzeugen ohne Logik
   const chars = "1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz";
   let password = chars.substring(0, details.passwordLength);
   password += password;

   const result = await ns.dnet.authenticate(hostname, password);
   if (result.success) {

      const details = ns.dnet.getServerDetails(hostname);
      ns.print("sehen wir das echte PW für den Overflow?  (authenticatePr0verFl0):" + hostname + " " + authenticatePr0verFl0 + " " + details)

      SendPassword(ns, hostname, password);
      return true;
   }
   ShowData(ns, hostname, details, result, password);  // Debug‑Ausgabe
   return false;   // Kein Passwort hat geklappt
};

const authenticateDeepGreen = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   let password = "";
   const blacklist = new Set<number>();

   for (let pos = 1; pos <= details.passwordLength; pos++) {
      let nextDigit = "";

      for (let no = 0; no <= 9; no++) {
         if (blacklist.has(no)) continue;

         const tryoutPW = password + no.toString();
         const result = await ns.dnet.authenticate(hostname, tryoutPW);

         if (result.success) {
            //ShowData(ns, hostname, details, result, tryoutPW);
            SendPassword(ns, hostname, tryoutPW);
            return true;
         }

         const recentLogResult = await ns.dnet.heartbleed(hostname);
         if (!recentLogResult?.logs?.[0]) return false;

         if (recentLogResult.code != 200) {
            ns.tprint("Error:" + recentLogResult.message);
            return false;
         }

         try {
            const logData = JSON.parse(recentLogResult.logs[0]);
            const dataParts = logData.data.split(",");
            const correctPos = parseInt(dataParts[0], 10);
            const wrongPos = parseInt(dataParts[1], 10);

            // KORREKTUR 1: Wenn correctPos kleiner als die aktuelle Position ist,
            // bedeutet das, dass DIESE spezifische Ziffer an dieser Stelle falsch ist.
            // Wenn wrongPos AUCH 0 ist, kommt sie im gesamten Rest-Passwort nicht vor -> Blacklist.
            if (correctPos < pos && wrongPos === 0) {
               blacklist.add(no);
            }

            // Nutze Array.from() um das Set lesbar im tprint auszugeben
            //ns.tprint("* " + tryoutPW + " " + logData.message + " Blacklist: " + Array.from(blacklist).join(","));

            if (correctPos === pos) {
               nextDigit = no.toString();

               // Ab Runde 2 wollen wir sofort abbrechen, sobald die Ziffer passt
               if (pos > 1) {
                  break;
               }
            }
         }
         catch (e: any) {
            ns.tprint("Exception " + e.toString());
            return false;
         }
      }

      // KORREKTUR 3: Das Passwort wird AUSSERHALB der Ziffernschleife aktualisiert.
      // Dadurch wächst das Passwort pro Position (pos) exakt um genau eine Stelle.
      if (nextDigit !== "") {
         password += nextDigit;
      } else {
         ns.tprint("Fehler: Keine passende Ziffer für Position " + pos + " gefunden." + hostname);
         return false;
      }
   }
   return false;
}

const authenticateFactoriOs = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const maxRange = Math.pow(10, details.passwordLength) - 1;

   const trueDivisors = new Set<number>([1]); // Hält alle bestätigten Teiler (True)   
   const blacklist = new Set<number>();

   var loop = 0;
   for (let i = 0; i <= maxRange; i++) {

      loop++;
      if (loop % 5000 == 0)
         await ns.sleep(20);

      // 1. Blacklist-Abgleich (Vielfache überspringen)
      let skip = false;
      if (i > 1) {
         for (const nonDiv of blacklist) {
            if (i % nonDiv === 0) {
               skip = true;
               break;
            }
         }
      }
      if (skip) continue;

      // NEW: 2. Check gegen die positive Liste (True-Werte)
      let fitsPositiveLogic = true;
      for (const dynamicTeiler of trueDivisors) {
         if (i % dynamicTeiler !== 0 && dynamicTeiler % i !== 0) {
            fitsPositiveLogic = false;
            break;
         }
      }

      if (!fitsPositiveLogic) continue;

      const tryoutPW = i.toString().padStart(details.passwordLength, "0");
      const result = await ns.dnet.authenticate(hostname, tryoutPW);

      if (result.success) {
         //ns.tprint(`[ERFOLG] Passwort gefunden: ${tryoutPW}`);
         //ShowData(ns, hostname, details, result, tryoutPW);
         SendPassword(ns, hostname, tryoutPW);
         return true;
      }

      // 2. Heartbleed mit aktivierter "peek"-Option aufrufen
      // Wir übergeben das Option-Objekt, um die Logs zerstörungsfrei für parallele Prozesse zu lesen
      const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 10, peek: true });
      if (!recentLogResult?.logs) return false;

      if (recentLogResult.code != 200) {
         ns.tprint("Error:" + recentLogResult.message);
         return false;
      }

      try {
         let foundLogForCurrentRequest = false;

         // Wir scannen die Historie nach unserem exakten i ab
         for (const logEntryRaw of recentLogResult.logs) {
            const logData = JSON.parse(logEntryRaw);

            const match = logData.message.match(/'(\d+)'/);
            if (!match) continue;

            const actualTestedNum = parseInt(match[1], 10);

            // Eintrag passt zu unserer Zahl im aktuellen Schleifendurchlauf
            if (actualTestedNum === i) {
               foundLogForCurrentRequest = true;
               const isDivisible = logData.data === true || logData.data === "true" || logData.data === 1 || logData.message.includes("IS divisible");

               //ns.tprint(`* Match gefunden für ${tryoutPW} | Teilbar: ${isDivisible}`);

               if (isDivisible) {
                  trueDivisors.add(i);
               } else if (i > 1) {
                  blacklist.add(i);
               }

               break; // Unseren Eintrag gefunden, Log-Schleife verlassen
            }
         }

         if (!foundLogForCurrentRequest) {
            ns.tprint(`[Info] Log-Eintrag für ${tryoutPW} noch nicht im Puffer sichtbar.`);
         }

      } catch (e: any) {
         ns.tprint("Exception " + e.toString());
         return false;
      }
   }
   return false;
}

const authenticateAccountsManager42 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   var maxRange = Math.pow(10, details.passwordLength) - 1;

   if (Number.isNaN(maxRange))
      maxRange = 100;

   var UntereGrenzwert = 0;
   var ObereGrenzwert = maxRange;

   //ns.tprint(`[AccountsManager] Starte Suche für Länge ${details.passwordLength} für Server ${hostname}`);
   var loop = 0;
   while (true) {
      loop++;
      if (loop % 20 == 0)
         await ns.sleep(20);

      if (loop > 200)   // Sollte nie ereicht werden. 
         break;

      if (ObereGrenzwert - UntereGrenzwert <= 1)        // Kein Treffer
      {
         ns.tprint("[AccountsManager] Kein Treffer" + hostname);
         break;
      }


      var tryoutPW = Math.floor((ObereGrenzwert - UntereGrenzwert) / 2 + UntereGrenzwert);

      ns.print("authenticateAccountsManager42 ObereGrenzwert:" + ObereGrenzwert);
      ns.print("authenticateAccountsManager42 UntereGrenzwert:" + UntereGrenzwert);
      ns.print("authenticateAccountsManager42 tryoutPW:" + tryoutPW);



      //ns.tprint(`[AccountsManager] ` + UntereGrenzwert + " - " + ObereGrenzwert + "   Try:" + tryoutPW);

      const result = await ns.dnet.authenticate(hostname, tryoutPW.toString());
      if (result.success) {
         ShowData(ns, hostname, details, result, tryoutPW.toString());
         SendPassword(ns, hostname, tryoutPW.toString());
         return true;
      }
      const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 2, peek: true });

      if (recentLogResult == undefined || recentLogResult.logs == undefined || recentLogResult.logs[0] == undefined)
         continue;

      try {
         const logData = JSON.parse(recentLogResult.logs[0]);         // 1. Den JSON-String aus dem ersten Array-Element parsen

         if (logData.data == "Higher" && logData.passwordAttempted > -1) {
            UntereGrenzwert = Number(logData.passwordAttempted);
         } else if (logData.data == "Lower" && logData.passwordAttempted > -1) {
            ObereGrenzwert = Number(logData.passwordAttempted);
         }
         else {
            ns.tprint(`[AccountsManager] Unbekannte Antwort` + recentLogResult.logs[0]);
         }
      }
      catch (Error) {
         // Wenn es keine Parsebare ANtwort ist, machen wir einfach ncoh einen Loop
         continue;
      }
   }
   return false;
}

const ALL_PASSWORDS_EuroZoneFree = [
   "Austria", "Belgium", "Bulgaria", "Croatia", "Republic of Cyprus", "Czech Republic", "Denmark", "Estonia",
   "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania",
   "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
] as const;

const authenticateEuroZoneFree = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Wir kennen die Länge

   for (const pwd of ALL_PASSWORDS_EuroZoneFree) {
      if (pwd.length !== neededLen) continue;   // Nicht passen → überspringen

      try {
         const result = await ns.dnet.authenticate(hostname, pwd);
         //         ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe
         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }
      } catch (e: any) {
         ns.print(`Fehler bei ${pwd}: ${e.message}`);
      }
   }
   return false;   // Kein Passwort hat geklappt
};


const authenticateBin2Ascii = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);

   // Falls details.data nicht existiert oder leer ist, brechen wir ab
   if (!details?.data) {
      ns.tprint("Fehler: Keine Binärdaten in details.data gefunden.");
      return false;
   }

   // 1. Den String bei jedem Leerzeichen splitten (z.B. ["01111001", "01100010", ...])
   const binarySegments = details.data.split(" ");

   // 2. Jedes Segment von Basis 2 (Binär) in ein ASCII-Zeichen umwandeln
   let pwd = "";
   for (const byte of binarySegments) {
      if (byte.trim() === "") continue; // Überspringe eventuelle doppelte Leerzeichen

      const decimalValue = parseInt(byte, 2);
      pwd += String.fromCharCode(decimalValue);
   }

   // 3. Authentifizierungs-Versuch mit dem entschlüsselten Passwort
   try {
      const result = await ns.dnet.authenticate(hostname, pwd);
      // ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe
      if (result.success) {
         SendPassword(ns, hostname, pwd);
         return true;
      }
   } catch (e: any) {
      ns.print(`Fehler bei ${pwd}: ${e.message}`);
   }

   return false;   // Kein Passwort hat geklappt
};

const authenticateNilOld = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const pwdLength = details.passwordLength;

   // Array, das die korrekten Zeichen für jede Position speichert
   const passwordCharacters = new Array(pwdLength).fill("");

   // Wir testen die Ziffern 0 bis 9
   for (let digit = 0; digit <= 9; digit++) {
      // Prüfen, ob wir bereits alle Zeichen gefunden haben
      if (!passwordCharacters.includes("")) {
         break;
      }

      // Erzeuge einen Test-String, der komplett aus der aktuellen Ziffer besteht
      const currentDigitStr = digit.toString();
      const testPwd = currentDigitStr.repeat(pwdLength);

      try {
         // Sende den Authentifizierungsversuch
         const result = await ns.dnet.authenticate(hostname, testPwd);

         // Wenn es zufällig schon komplett richtig war (z.B. Passwort ist "11111")
         if (result.success) {
            SendPassword(ns, hostname, testPwd);
            return true;
         }

         // Hole das Feedback über Heartbleed
         const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 2, peek: true });
         if (!recentLogResult || !recentLogResult.logs || !recentLogResult.logs[0]) {
            continue;
         }

         const logData = JSON.parse(recentLogResult.logs[0]);

         // data enthält z.B. ["yesn't", "yes", "yesn't", "yesn't", "yesn't"]
         // Manchmal ist data ein String (kommagetrennt), daher zur Sicherheit splitten falls nötig
         const feedbackArray = Array.isArray(logData.data)
            ? logData.data
            : logData.data.split(",");

         // Überprüfe jede Position des Feedbacks
         for (let i = 0; i < pwdLength; i++) {
            if (feedbackArray[i] === "yes") {
               passwordCharacters[i] = currentDigitStr;
            }
         }

      } catch (e: any) {
         ns.print(`Fehler beim Testen von Ziffer ${digit}: ${e.message}`);
      }
   }

   // Setze das finale Passwort aus den gefundenen Zeichen zusammen
   const finalPwd = passwordCharacters.join("");

   // Überprüfung, ob das Passwort vollständig ermittelt wurde
   if (finalPwd.length === pwdLength && !passwordCharacters.includes("")) {
      const finalResult = await ns.dnet.authenticate(hostname, finalPwd);
      if (finalResult.success) {
         SendPassword(ns, hostname, finalPwd);
         //ShowData(ns, hostname, details, finalResult, finalPwd);  // Debug‑Ausgabe      
         return finalResult.success;
      }
   }

   return false;
};

const authenticateNIL = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const pwdLength = details.passwordLength;

   let zeichen = "?";
   if (details.passwordFormat === "numeric") zeichen = "1234567890";
   else if (details.passwordFormat === "alphabetic") zeichen = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
   else if (details.passwordFormat === "alphanumeric") zeichen = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

   const passwordCharacters = new Array(pwdLength).fill("");

   for (let i = 0; i < pwdLength; i++) {
      for (const ch of zeichen) {
         const testPwd = passwordCharacters
            .map((existing, idx) => (idx === i ? ch : existing || ch))
            .join("");

         try {
            const result = await ns.dnet.authenticate(hostname, testPwd);
            if (result.success) {
               SendPassword(ns, hostname, testPwd);
               return true;
            }

            const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 2, peek: true });
            if (!recentLogResult?.logs?.[0]) continue;

            const logData = JSON.parse(recentLogResult.logs[0]);
            const feedbackArray = Array.isArray(logData.data) ? logData.data : String(logData.data).split(",");

            if (feedbackArray[i] === "yes") {
               passwordCharacters[i] = ch;
               break;
            }
         } catch (e: any) {
            ns.print(`Fehler bei Position ${i}, Zeichen ${ch}: ${e.message}`);
         }
      }
   }

   const finalPwd = passwordCharacters.join("");
   if (finalPwd.length === pwdLength && !finalPwd.includes("")) {
      const finalResult = await ns.dnet.authenticate(hostname, finalPwd);
      if (finalResult.success) {
         ShowData(ns, hostname, details, finalResult, finalPwd);
         SendPassword(ns, hostname, finalPwd);
         return true;
      }
   }

   return false;
};

const authenticateOpenWebAccessPoint = async (ns: NS, hostname: string): Promise<boolean> => {
   const details: DarknetServerDetails = ns.dnet.getServerDetails(hostname);
   const pwdLength = details.passwordLength;

   // Erzeuge das passende Suchmuster:
   let charPattern = ".";
   if (details.passwordFormat == "numeric") charPattern = "[0-9]";
   else if (details.passwordFormat == "alphabetic") charPattern = "[a-zA-Z]";
   else if (details.passwordFormat == "alphanumeric") charPattern = "[0-9a-zA-Z]";

   const regex = new RegExp(`(${charPattern}{${pwdLength}})`, "g");

   // Start-Dummy
   let testPwd = "1";

   // Hauptschleife für die Heartbleed-Runden (max. 25 Versuche)
   for (let Counter = 0; Counter < 25; Counter++) {
      try {
         // Sende den Authentifizierungsversuch mit dem aktuellen Passwort
         const result = await ns.dnet.authenticate(hostname, testPwd);

         if (result.success) {
            //ShowData(ns, hostname, details, result, testPwd);  // Debug‑Ausgabe     
            SendPassword(ns, hostname, testPwd);
            return true;
         }

         // Hole das Feedback über Heartbleed
         const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 2, peek: true });
         if (!recentLogResult || !recentLogResult.logs || !recentLogResult.logs[0]) {
            continue;
         }

         const logString = typeof recentLogResult.logs[0] === "string"
            ? recentLogResult.logs[0]
            : JSON.stringify(recentLogResult.logs[0]);

         // Alle Kandidaten aus diesem Log-Dump sammeln
         let match;
         const candidates: string[] = [];
         regex.lastIndex = 0;

         while ((match = regex.exec(logString)) !== null) {
            candidates.push(match[1]); // match[1] enthält nur den Inhalt der Klammer
         }

         // JETZT WERDEN ALLE KANDIDATEN VERWENDET:
         // Wir arbeiten alle gefundenen Passwörter aus diesem Dump nacheinander ab
         for (const candidate of candidates) {
            ns.print(`Teste Kandidat aus Heartbleed-RAM: ${candidate}`);
            const loopResult = await ns.dnet.authenticate(hostname, candidate);

            if (loopResult.success) {
               //ShowData(ns, hostname, details, loopResult, candidate); // Debug
               SendPassword(ns, hostname, candidate);
               return true;
            }
            // Wenn falsch, merken wir uns das für den Fall, dass die Schleife endet
            testPwd = candidate;
         }

         // Falls kein Kandidat im aktuellen Dump war, setzen wir zurück für den nächsten Log-Generierungs-Versuch
         if (candidates.length === 0) {
            testPwd = "123";
         }

      } catch (e: any) {
         // Minimaler Catch-Block für niedrige RAM-Kosten
      }
   }
   return false;
}


const authenticateOrdoXenos = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);

   // Sicherheitsabfrage, falls keine Daten vorhanden sind
   if (!details || !details.data) {
      ns.tprint(`ERROR: Keine XOR-Daten für ${hostname} gefunden.`);
      return false;
   }

   // 1. Daten parsen (Beispiel: "BTvFb;00011010 00000111 ...")
   const parts = details.data.split(";");
   if (parts.length !== 2) {
      ns.tprint(`ERROR: Ungültiges Datenformat auf ${hostname}: ${details.data}`);
      return false;
   }

   const cipher = parts[0]; // Das verschlüsselte Wort (z.B. "BTvFb")
   const masks = parts[1].trim().split(" "); // Array der Binärmasken

   // 2. XOR-Entschlüsselung unter Beibehaltung der exakten Groß-/Kleinschreibung
   let password = "";
   for (let i = 0; i < cipher.length; i++) {
      if (!masks[i]) break; // Schutz vor unvollständigen Masken-Arrays

      const charCode = cipher.charCodeAt(i);
      const maskValue = parseInt(masks[i], 2);
      const decryptedCharCode = charCode ^ maskValue;

      password += String.fromCharCode(decryptedCharCode);
   }

   // 3. Authentifizierung und Debug-Ausgabe
   const result = await ns.dnet.authenticate(hostname, password);
   //ShowData(ns, hostname, details, result, password);  // Debug‑Ausgabe

   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }

   return false;   // Kein Passwort hat geklappt
};

const authenticateMathML = async (ns: NS, hostname: string): Promise<boolean> => {
   const details: DarknetServerDetails = ns.dnet.getServerDetails(hostname);

   // Sicherheitsabfrage, falls keine Daten vorhanden sind
   if (!details || !details.data) {
      //ns.tprint(`ERROR: Keine Daten für ${hostname} gefunden.`);
      return false;
   }

   let password = "";
   var data = "";
   try {
      // 1. Mathematischen Ausdruck über eval auswerten
      // eval() berechnet den String (z.B. "46 - 15 + 35" oder "2 * (10 + 5)") automatisch
      /*
            var data = details.data;
            data = data.replace("➕", "+");
            data = data.replace("➖", "-");
            data = data.replace("x", "*");
            data = data.replace("ҳ", "*");
            data = data.replace("✖", "*");
            data = data.replace("×", "*");
            data = data.replace("➗", "/");
            data = data.replace("÷", "/");
            data = data.replace("÷", "/");
            data = data.replace("ҳ", "*");
      */
      data = details.data
         .replace(/ns\.exit\(\)/g, "")
         .replace(/,/g, "")
         .replace(/➕/g, "+")
         .replace(/➖/g, "-")
         .replace(/[xҳ✖×]/g, "*") // Ersetzt alle x-Varianten in einem Schritt
         .replace(/[➗÷]/g, "/");  // Ersetzt alle geteilt-Varianten in einem Schritt      

      var pos = data.indexOf(",");
      if (pos > 1)
         data = data.substring(0, pos - 1);   // Mögliche Hacker Attacke abscheiden  z.B.  23 * 46 - 22 , !globalThis.pwn3d && (globalThis.pwn3d=true, alert("You've been hacked! You evaluated a string and let me inject code, didn't you? HAHAHAHA!") , globalThis.openDevMenu() ) , ns.e*it()

      const calculatedResult = eval(data);

      // Das Ergebnis als String für das Passwort speichern
      password = calculatedResult.toString();
   } catch (error) {
      ns.tprint(`ERROR1: Fehler beim Berechnen der Aufgabe auf ${hostname}: ${data}  Meldung:${error}`);
      ns.tprint(`ERROR2: Original: ${hostname}: ${details.data}`);
      return false;
   }

   // 2. Authentifizierung und Debug-Ausgabe
   const result = await ns.dnet.authenticate(hostname, password);
   //ShowData(ns, hostname, details, result, password);  // Debug‑Ausgabe

   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }

   return false;   // Kein Passwort hat geklappt
};

const authenticatePrimeTime2 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details: DarknetServerDetails = ns.dnet.getServerDetails(hostname);

   // Sicherheitsabfrage, falls keine Daten vorhanden sind 
   if (!details || !details.data) {
      //ns.tprint(`Error: Keine Daten für ${hostname} gefunden.`);
      return false;
   }

   // Funktion zur Berechnung des größten Primfaktors
   const getLargestPrimeFactor = (num: number): number => {
      let n = num;
      let maxPrime = -1;

      // Division durch 2
      while (n % 2 === 0) {
         maxPrime = 2;
         n /= 2;
      }

      // Division durch ungerade Zahlen
      for (let i = 3; i * i <= n; i += 2) {
         while (n % i === 0) {
            maxPrime = i;
            n /= i;
         }
      }

      // Falls der Rest größer als 2 ist, ist er selbst prim
      if (n > 2) {
         maxPrime = n;
      }

      return maxPrime;
   };

   // Extrahiere Zahl und berechne das Passwort
   const targetNumber = Number(details.data);
   const largestPrime = getLargestPrimeFactor(targetNumber);
   let password = largestPrime.toString();

   // 2. Authentifizierung und Debug-Ausgabe 
   const result = await ns.dnet.authenticate(hostname, password);
   //ShowData(ns, hostname, details, result, password); // Debug‑Ausgabe 

   if (result.success) {
      SendPassword(ns, hostname, password);
      return true;
   }
   return false; // Kein Passwort hat geklappt 
};

const authenticateBigMood = async (ns: NS, hostname: string): Promise<boolean> => {
   const details: DarknetServerDetails = ns.dnet.getServerDetails(hostname);

   // Sicherheitsabfrage, falls keine Daten vorhanden sind 
   if (!details || !details.data) {
      //ns.tprint(`Error: Keine Daten für ${hostname} gefunden.`);
      return false;
   }

   // 1. Vorab-Ergebnisse für n = 31, 30 und 29 generieren/abfragen
   // Da dnet.authenticate() asynchron ist, holen wir uns zuerst die Soll-Ergebnisse der Ziel-Gleichung.
   // Hinweis: Falls die API dafür eine andere Funktion nutzt, müsste dies angepasst werden.
   await ns.dnet.authenticate(hostname, "31");
   var recentLogResult = await ns.dnet.heartbleed(hostname);
   if (recentLogResult == undefined || recentLogResult.logs == undefined || recentLogResult.logs[0] == undefined)
      return false;
   var logData = JSON.parse(recentLogResult.logs[0]);         // 1. Den JSON-String aus dem ersten Array-Element parsen
   var target31 = logData.data;

   await ns.dnet.authenticate(hostname, "30");
   var recentLogResult = await ns.dnet.heartbleed(hostname);
   if (recentLogResult == undefined || recentLogResult.logs == undefined || recentLogResult.logs[0] == undefined)
      return false;
   var logData = JSON.parse(recentLogResult.logs[0]);         // 1. Den JSON-String aus dem ersten Array-Element parsen
   var target30 = logData.data;

   await ns.dnet.authenticate(hostname, "29");
   var recentLogResult = await ns.dnet.heartbleed(hostname);
   if (recentLogResult == undefined || recentLogResult.logs == undefined || recentLogResult.logs[0] == undefined)
      return false;
   var logData = JSON.parse(recentLogResult.logs[0]);         // 1. Den JSON-String aus dem ersten Array-Element parsen
   var target29 = logData.data;

   ns.tprint("-- authenticateBigMood ---" + target31 + " " + target31 + " " + target29);

   // Hilfsfunktion zur Überprüfung der Modulo-Formel: (Passwort % n) % (n % 32)
   const isValidCandidate = (passwordAttempt: number): boolean => {
      const check31 = (passwordAttempt % 31) % (31 % 32) === target31;
      const check30 = (passwordAttempt % 30) % (30 % 32) === target30;
      const check29 = (passwordAttempt % 29) % (29 % 32) === target29;
      return check31 && check30 && check29;
   };

   // 2. Brute-Force Schleife
   // Start- und Endwert müssen eventuell an den bekannten Passwortraum angepasst werden (z. B. details.data.maxRange)
   const maxPasswordRange = 10 ^ (details.passwordLength + 1) - 1;

   var loop = 0;
   for (let password = 0; password < maxPasswordRange; password++) {
      loop++;
      if (loop % 5000 == 0)
         await ns.sleep(20);

      // Vorab-Prüfung: Überspringe ungültige Passwörter ohne API-Call
      if (!isValidCandidate(password)) {
         continue;
      }

      // Nur potenzielle Treffer landen hier und sparen Rechenzeit
      ns.tprint("authenticateBigMood Versuch:" + password);
      const result = await ns.dnet.authenticate(hostname, password.toString());

      if (result.success) {
         //ShowData(ns, hostname, details, result, password.toString()); // Debug‑Ausgabe bei Fehlversuch im Filter 
         SendPassword(ns, hostname, password.toString());
         return true; // Erfolgreich!
      }
   }
   return false; // Kein Passwort hat geklappt 
};



const OUT_PORT = 1;    // Genau umgedreht wie beim DarkServer
const IN_PORT = 2;

const SendServerDetails = async (ns: NS, hostname: string, details: DarknetServerDetails): Promise<string> => {

   const outHandle = ns.getPortHandle(OUT_PORT);
   const InHandle = ns.getPortHandle(IN_PORT);
   const requestId = Math.random().toString(36).substring(2, 9); // Eindeutige ID   

   const Data =
   {
      action: "SendServerDetails",
      hostname: hostname,
      details: details,
      requestId: requestId
   };

   if (outHandle.tryWrite(Data))   // Daten verschicken
   {
      // Timeout-Konfiguration (z.B. max. 3000 Millisekunden warten)
      const startTime = Date.now();
      const TIMEOUT = 3000;
      while (Date.now() - startTime < TIMEOUT) {    // Wir warten nicht endlos.
         if (!InHandle.empty()) {
            const rawResponse = InHandle.read();         // Wir lesen jede Nachricht ...
            if (rawResponse.requestId === requestId) {   // .. und prüfen ob die Nachricht für uns ist
               //ns.tprint("PW Abfrage erfolgreich:" + JSON.stringify(rawResponse, null, 2));
               return rawResponse.password;
            }
            else                                         // nicht für uns..
            {
               if (rawResponse.timestamp + TIMEOUT >= Date.now())    // wie alt ist die Nachricht? wenn noch aktuell, wird die nachricht hinten in die Que geschrieben
               {
                  //ns.tprint("Pushback")
                  ns.writePort(IN_PORT, rawResponse);
               }
               else {
                  //ns.tprint("kein Pushback ... zu alt")
               }
            }

         }
         await ns.sleep(20); // Kurze Pause, um Abstürze zu verhindern
      }
   }
   return "";
}

const SendPassword = async (ns: NS, hostname: string, password: string) => {

   const outHandle = ns.getPortHandle(OUT_PORT);

   const Data =
   {
      action: "SendPassword",
      hostname: hostname,
      password: password
   };

   ; outHandle.tryWrite(Data);   // Daten verschicken

   // Keine Rückantwort
}


// todo :  Kann man bestimmt verbessern
const authenticateOctantVoxel = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Die exakte Länge des Passworts

   // Berechne die maximale Zahl für diese Länge (z.B. 4 Stellen -> 10000, also Kombinationen bis 9999)
   const maxCombination = Math.pow(10, neededLen);


   // Probiere alle Zahlen von 0 bis maxCombination - 1 aus
   var loop = 0;
   for (let i = 0; i < maxCombination; i++) {
      loop++;

      if (loop % 5000 == 0)      // Block verhindern
         await ns.sleep(20);

      // Wandle die Zahl in einen String um und fülle sie mit führenden Nullen auf die richtige Länge auf
      const pwd = i.toString().padStart(neededLen, '0');

      try {
         const result = await ns.dnet.authenticate(hostname, pwd);
         // ShowData(ns, hostname, details, result, pwd);  // Debug‑Ausgabe

         if (result.success) {
            SendPassword(ns, hostname, pwd);
            return true;
         }
      } catch (e: any) {
         ns.print(`Fehler bei ${pwd}: ${e.message}`);
      }
   }

   return false;   // Kein Passwort hat geklappt
};

const authenticateRateMyPix = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Die exakte Länge des Passworts

   let zeichen = "?";
   if (details.passwordFormat === "numeric") zeichen = "1234567890";
   else if (details.passwordFormat === "alphabetic") zeichen = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
   else if (details.passwordFormat === "alphanumeric") zeichen = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

   let currentPassword = "";

   // Wir arbeiten uns von Position 0 bis zur benötigten Länge vor
   for (let pos = 0; pos < neededLen; pos++) {
      let charFound = false;

      for (let i = 0; i < zeichen.length; i++) {
         const testChar = zeichen[i];
         // Wir füllen den Rest des Passworts temporär auf, um die Länge zu halten
         const passwordAttempt = (currentPassword + testChar);

         // Sende den Authentifizierungsversuch
         const result = await ns.dnet.authenticate(hostname, passwordAttempt);

         // Wenn wir per Zufall schon komplett richtig liegen, beenden
         if (result.success) {
            //ShowData(ns, hostname, details, result, passwordAttempt);
            SendPassword(ns, hostname, passwordAttempt);
            return true;
         }

         // Hole die letzten Logs via Heartbleed
         const recentLogResult = await ns.dnet.heartbleed(hostname, { logsToCapture: 10, peek: true });
         if (recentLogResult.code !== 200) {
            ns.tprint("Error: " + recentLogResult.message);
            return false;
         }

         // Suche in den letzten Logs nach dem passenden Eintrag für unseren Versuch
         let chiliCount = 0;
         if (recentLogResult.logs) {
            for (const logString of recentLogResult.logs) {
               try {
                  const logData = JSON.parse(logString);
                  // Prüfen, ob das Log genau zu unserem aktuellen Versuch gehört
                  if (logData.passwordAttempted === passwordAttempt) {
                     // Extrahiere die Anzahl der Chilis aus dem "🌶️/5" Format
                     if (logData.data && logData.data.includes("🌶️")) {
                        chiliCount = (logData.data.match(/🌶️/g) || []).length;
                     }
                     break; // Passenden Log-Eintrag gefunden, Suche beenden
                  }
               } catch (e) {
                  // Ignoriere korrupte oder fremde Logs
               }
            }
         }

         // Wenn die Anzahl der Chilis größer ist als unsere aktuelle Position,
         // bedeutet das, dass das Zeichen an 'pos' korrekt ist!
         if (chiliCount > pos) {
            currentPassword += testChar;
            charFound = true;
            break; // Springe zur nächsten Passwort-Position
         }
      }

      // Sicherheitsnetz: Falls kein Zeichen matcht, abbrechen um Endlosschleifen zu verhindern
      if (!charFound) {
         ns.tprint(`Fehler: Kein passendes Zeichen für Position ${pos} gefunden.` + hostname);
         return false;
      }
   }

   // Letzter finaler Check mit dem komplett ermittelten Passwort
   const finalResult = await ns.dnet.authenticate(hostname, currentPassword);
   if (finalResult.success) {
      //ShowData(ns, hostname, details, finalResult, currentPassword);

      SendPassword(ns, hostname, currentPassword);
      return true;
   }

   return false;
}

const authenticatePHP54 = async (ns: NS, hostname: string): Promise<boolean> => {
   const details = ns.dnet.getServerDetails(hostname);
   const neededLen = details.passwordLength;   // Die exakte Länge des Passworts

   const baseData = details.data;

   // 1. Generiere alle mathematischen Permutationen aus der Basis
   const allCombinations = getPermutations(baseData);
   const validPasswords = allCombinations.filter(pwd => pwd.length === neededLen);

   //ns.tprint(`Versuche ${validPasswords.length} Kombinationen für ${hostname}...`);

   // 3. Alle Passwörter nacheinander ausprobieren
   for (const password of validPasswords) {
      const result = await ns.dnet.authenticate(hostname, password);

      if (result.success) {
         //ns.tprint(`[SUCCESS] Erfolgreich eingeloggt auf ${hostname} mit Passwort: ${password}`);
         //ShowData(ns, hostname, details, result, password);
         SendPassword(ns, hostname, password);
         return true;
      }
   }

   ns.tprint(`[ERROR] Kein Passwort war erfolgreich für ${hostname}.`);
   return false;
};

/**
 * Hilfsfunktion: Erstellt alle eindeutigen Permutationen eines Strings
 */
function getPermutations(str: string): string[] {
   if (str.length <= 1) return [str];

   const permutations: string[] = [];

   for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remainingChars = str.slice(0, i) + str.slice(i + 1);
      const subPermutations = getPermutations(remainingChars);

      for (const sub of subPermutations) {
         permutations.push(char + sub);
      }
   }

   // Verhindert Duplikate bei gleichen Zeichen
   return [...new Set(permutations)];
}


const authenticateTheLabyrinthOld = async (ns: NS, hostname: string): Promise<boolean> => {
   /** ------------------------------------------------------------
    *  Bitburner – Unbekanntes Labyrinth kartografieren & erkunden
    * ------------------------------------------------------------ */

   const mazeMap = new Map();

   // Startwerte für die Begrenzung der Map-Anzeige
   let minX = 0, maxX = 0, minY = 0, maxY = 0;

   while (true) {
      // 1. Daten abfragen

      const Time1 = Date.now();

      const report = await ns.dnet.labreport();
      const radar = await ns.dnet.labradar();

      if (!report.success) {
         return false;
      }

      const [curX, curY] = report.coords;

      // Aktuelle Position als besucht markieren
      mazeMap.set(`${curX},${curY}`, '.');

      // Map-Grenzen dynamisch anpassen
      minX = Math.min(minX, curX - 5);
      maxX = Math.max(maxX, curX + 5);
      minY = Math.min(minY, curY - 5);
      maxY = Math.max(maxY, curY + 5);

      // --- RADAR PARSEN (7x7 Grid) ---
      // Den Radar-String säubern und in Zeilen zerlegen
      if (radar.success && radar.message) {
         const radarLines = radar.message
            .split('\n')
            .map(line => line.replace(/\r/g, '')) // Windows-Zeilenumbrüche entfernen
            .filter(line => line.length > 0);    // Leere Zeilen ignorieren

         // Wir erwarten 7 Zeilen für ein 7x7 Grid
         if (radarLines.length >= 7) {
            for (let rY = 0; rY < 7; rY++) {
               const line = radarLines[rY];
               for (let rX = 0; rX < 7; rX++) {
                  const char = line[rX];

                  // Berechne die absolute Position auf der Map
                  // Spieler ist in der Mitte bei (3,3)
                  const absX = curX + (rX - 3);
                  const absY = curY + (rY - 3);

                  // Wenn es eine Wand oder ein leerer Pfad ist, in die Map eintragen
                  // Bereits besuchte Pfade ('.') überschreiben wir nicht mit ' '
                  if (char === '█') {
                     mazeMap.set(`${absX},${absY}`, '█');
                  } else if (char === ' ' || char === '@') {
                     if (mazeMap.get(`${absX},${absY}`) !== '.') {
                        mazeMap.set(`${absX},${absY}`, ' ');
                     }
                  }
               }
            }
         }
      }

      // Nachbarn aus dem Report eintragen
      mazeMap.set(`${curX},${curY - 1}`, report.north ? (mazeMap.get(`${curX},${curY - 1}`) || ' ') : '█');
      mazeMap.set(`${curX + 1},${curY}`, report.east ? (mazeMap.get(`${curX + 1},${curY}`) || ' ') : '█');
      mazeMap.set(`${curX},${curY + 1}`, report.south ? (mazeMap.get(`${curX},${curY + 1}`) || ' ') : '█');
      mazeMap.set(`${curX - 1},${curY}`, report.west ? (mazeMap.get(`${curX - 1},${curY}`) || ' ') : '█');

      // 2. Bekannte Map als String aufbauen
      let mapString = "";
      for (let y = minY; y <= maxY; y++) {
         let row = "";
         for (let x = minX; x <= maxX; x++) {
            if (x === curX && y === curY) {
               row += "@"; // Spieler-Position
            } else {
               row += mazeMap.get(`${x},${y}`) || "?"; // '?' für unbekannt
            }
         }
         mapString += row + "\n";
      }

      // 3. Mehrzeiligen String für die Ausgabe zusammenbauen
      let infoText = `=== LAB LABYRINTH NAVIGATOR ===\n`;
      infoText += `Aktuelle Position: X: ${curX}, Y: ${curY}\n`;
      infoText += `Mögliche Richtungen: ` +
         `${report.north ? 'N ' : ''}${report.east ? 'E ' : ''}` +
         `${report.south ? 'S ' : ''}${report.west ? 'W ' : ''}\n\n`;
      infoText += `--- RADAR ---\n${radar.message}\n`;
      infoText += `--- GESAMTE BEKANNTE MAP ---\n${mapString}\n`;


      // 4. Per tprint auf der Konsole ausgeben
      ns.tprint("\n" + infoText);

      // 5. Prompt für den Anwender öffnen
      let input = await ns.prompt(infoText, { type: "text" });
      if (input == "w") input = "n";
      if (input == "s") input = "s";
      if (input == "d") input = "e";
      if (input == "a") input = "w";

      if (input == "") {
         await ns.sleep(2000);  // Zwangspause  - Vermutlich auch wenn GUI überschrieben wird
      }
      if (input == "q")   // Abbrechen
      {
         return false;
      }

      const result = await ns.dnet.authenticate(hostname, input);


      // 6. Authentifizierung / Bewegung ausführen
      // Hinweis: Da ns.dnet.authenticate() das Passwort/Richtung benötigt:

      ns.tprint(`Bewege nach [${input}] -> Erfolg: ${result.success}`);

      // 7. Erfolg prüfen
      if (result.success) {
         ns.tprint("Erfolgreich! Ziel erreicht oder Befehl korrekt ausgeführt.");
         // Falls Erfolg das Spiel/Labyrinth beendet, hier abbrechen:
         return true;
      }

      // Kurze Pause gegen CPU-Spam bei schnellen Klicks
      await ns.sleep(20);
   }
   return false;
}


const authenticateTheLabyrinth = async (ns: NS, hostname: string): Promise<boolean> => {
   /** ------------------------------------------------------------
    *  Bitburner – Unbekanntes Labyrinth kartografieren & erkunden
    * ------------------------------------------------------------ */
   return false;   //   nervt  - todo: Sinnvollen schalter finden

   const mazeMap = new Map();

   // Startwerte für die Begrenzung der Map-Anzeige
   let minX = 0, maxX = 0, minY = 0, maxY = 0;

   // HÄLT NACH, WOHER WIR GEKOMMEN SIND (wichtig für die Automatisierung)
   let lastMove: string | null = null;

   // Hilfsfunktion zum Umkehren der Richtung
   const getOppositeDirection = (dir: string): string => {
      if (dir === "n") return "s";
      if (dir === "s") return "n";
      if (dir === "e") return "w";
      if (dir === "w") return "e";
      return "";
   };

   while (true) {
      // 1. Daten abfragen
      const report = await ns.dnet.labreport();
      const radar = await ns.dnet.labradar();

      if (!report.success) {
         return false;
      }

      const [curX, curY] = report.coords;

      // Aktuelle Position als besucht markieren
      mazeMap.set(`${curX},${curY}`, '.');

      // Map-Grenzen dynamisch anpassen
      minX = Math.min(minX, curX - 5);
      maxX = Math.max(maxX, curX + 5);
      minY = Math.min(minY, curY - 5);
      maxY = Math.max(maxY, curY + 5);

      // --- RADAR PARSEN (7x7 Grid) ---
      if (radar.success && radar.message) {
         const radarLines = radar.message
            .split('\n')
            .map(line => line.replace(/\r/g, ''))
            .filter(line => line.length > 0);

         if (radarLines.length >= 7) {
            for (let rY = 0; rY < 7; rY++) {
               const line = radarLines[rY];
               for (let rX = 0; rX < 7; rX++) {
                  const char = line[rX];
                  const absX = curX + (rX - 3);
                  const absY = curY + (rY - 3);

                  if (char === '█') {
                     mazeMap.set(`${absX},${absY}`, '█');
                  } else if (char === ' ' || char === '@') {
                     if (mazeMap.get(`${absX},${absY}`) !== '.') {
                        mazeMap.set(`${absX},${absY}`, ' ');
                     }
                  }
               }
            }
         }
      }

      // Nachbarn aus dem Report eintragen
      mazeMap.set(`${curX},${curY - 1}`, report.north ? (mazeMap.get(`${curX},${curY - 1}`) || ' ') : '█');
      mazeMap.set(`${curX + 1},${curY}`, report.east ? (mazeMap.get(`${curX + 1},${curY}`) || ' ') : '█');
      mazeMap.set(`${curX},${curY + 1}`, report.south ? (mazeMap.get(`${curX},${curY + 1}`) || ' ') : '█');
      mazeMap.set(`${curX - 1},${curY}`, report.west ? (mazeMap.get(`${curX - 1},${curY}`) || ' ') : '█');

      // 2. Bekannte Map als String aufbauen
      let mapString = "";
      for (let y = minY; y <= maxY; y++) {
         let row = "";
         for (let x = minX; x <= maxX; x++) {
            if (x === curX && y === curY) {
               row += "@";
            } else {
               row += mazeMap.get(`${x},${y}`) || "?";
            }
         }
         mapString += row + "\n";
      }

      // Alle aktuell passierbaren Richtungen sammeln
      const validDirections: string[] = [];
      if (report.north) validDirections.push("n");
      if (report.east) validDirections.push("e");
      if (report.south) validDirections.push("s");
      if (report.west) validDirections.push("w");

      // Richtungen filtern, die NICHT der Rückweg sind
      const incomingDirection = lastMove ? getOppositeDirection(lastMove) : null;
      const forwardDirections = validDirections.filter(dir => dir !== incomingDirection);

      let input = "";
      let autoMove = false;

      // AUTOMATISIERUNGS-LOGIK:
      // Wenn wir eine Richtung haben, aus der wir kamen, und es gibt genau EINE Option nach vorne (sprich: Tunnel)
      if (incomingDirection && forwardDirections.length === 1) {
         input = forwardDirections[0];
         autoMove = true;
         ns.tprint(`[Auto-Nav] Tunnel erkannt. Gehe automatisch weiter nach: ${input.toUpperCase()}`);
      }

      // Falls kein automatischer Schritt möglich ist (Kreuzung, Sackgasse oder Start) -> Prompt anzeigen
      if (!autoMove) {
         let infoText = `=== LAB LABYRINTH NAVIGATOR ===\n`;
         infoText += `Aktuelle Position: X: ${curX}, Y: ${curY}\n`;
         infoText += `Mögliche Richtungen: ${validDirections.map(d => d.toUpperCase()).join(' ')}\n\n`;
         infoText += `--- RADAR ---\n${radar.message}\n`;
         infoText += `--- GESAMTE BEKANNTE MAP ---\n${mapString}\n`;

         ns.tprint("\n" + infoText);

         input = await ns.prompt(infoText, { type: "text" });

         // Eingaben vereinheitlichen
         if (input == "w") input = "n";
         if (input == "s") input = "s";
         if (input == "d") input = "e";
         if (input == "a") input = "w";

         if (input == "") {
            await ns.sleep(2000);
            continue;
         }
         if (input == "q") {
            return false;
         }
      }

      // 6. Authentifizierung / Bewegung ausführen
      const result = await ns.dnet.authenticate(hostname, input);

      if (!autoMove) {
         ns.tprint(`Bewege nach [${input}] -> Erfolg: ${result.success}`);
      }

      // 7. Erfolg prüfen
      if (result.success) {
         ns.tprint("____________________________________________________________");
         ns.tprint("Erfolgreich! Ziel erreicht oder Befehl korrekt ausgeführt.");
         ns.tprint("____________________________________________________________");

         return true;
      }

      // Wenn die Bewegung geklappt hat (und es kein Fehler war), merken wir uns den Schritt
      // Bei 'authenticate' im Labyrinth schlagen Fehlversuche meist fehl ohne die Position zu ändern
      lastMove = input;

      // Kurze Pause: Bei automatischen Schritten etwas höher (z.B. 100ms), damit man visuell folgen kann
      // und das Spiel nicht wegen zu vielen API-Aufrufen einfriert.
      await ns.sleep(autoMove ? 100 : 20);
   }
   return false;
}
/*  Übersicht der Varianten
| Name           | Depth | CHA  | MazeWidth | MazeHeight | Manual | OffsetStartAndEnd |
+----------------+-------+------+-----------+------------+--------+-------------------+
| NormalLab      |     7 |  300 |        20 |         14 | true   | false             |
| CruelLab       |    12 |  600 |        30 |         20 | true   | false             |
| MercilessLab   |    19 | 1500 |        40 |         26 | false  | false             |
| UberLab        |    23 | 2500 |        60 |         40 | false  | true              |
| EternalLab     |    29 | 3000 |        60 |         40 | false  | true              |
| EndlessLab     |    31 | 3500 |        60 |         40 | false  | true              |
| FinalLab       |    36 | 4000 |        60 |         40 | false  | true              |
| BonusLab       |    36 | 4000 |        60 |         40 | false  | true              |
*/