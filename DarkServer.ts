// Eine Zentrale Server Instanz um die Programmen im Darkweb zu steueren
// Aufgaben
// Speichern der gefunden Passwörter


const RESET = "\u001b[0m";
const ROT = "\u001b[31m";
const GRUEN = "\u001b[32m";
const GELB = "\u001b[33m";
const BLAU = "\u001b[34m";
const LILA = "\u001b[35m";
const CYAN = "\u001b[36m";


const IN_PORT = 1;
const OUT_PORT = 2;

const DATEI_NAME = "work/DarkServer.txt";

// Das Interface für Die Serverdaten
interface ServerDatabaseInterface {
   timestamp: number;
   details: DarknetServerDetails;
   password: string;
   free: number;
}

const ServerDatabase: Record<string, ServerDatabaseInterface> = {};  // Das Dictionary: Key ist der Hostname (string), Value ist das obige Interface



export async function main(ns: NS) {
   ns.disableLog("ALL");

   if (ns.fileExists(DATEI_NAME)) {
      const jsonString = ns.read(DATEI_NAME);
      try {
         // Wandelt den Text zurück in ein JavaScript-Objekt
         const geladeneDaten = JSON.parse(jsonString);
         ns.tprint(`✔ ${Object.keys(geladeneDaten).length} Server erfolgreich geladen.`);
      } catch (error) {
         ns.tprint(`❌ Fehler beim Parsen der Datei: ${error}`);
      }

   }


   ns.tprint("🖥️ Dark Server gestartet. Warte auf Anfragen...");



   const InHandle = ns.getPortHandle(IN_PORT);

   // Hauptloop - Es wird ein Port geöffnet und wir warten auf anfragen
   var loop = 0;
   while (true) {
      loop++;
      if (InHandle.empty()) {
         printServerStats(ns);
         if (loop % 2 == 0) {
            await DirektAttack(ns);
            ns.write(DATEI_NAME, JSON.stringify(ServerDatabase, null, 3), "w");
         }
         await ns.sleep(50); // CPU schonen
         continue;
      }

      // Anfrage auslesen und parsen
      const Data = InHandle.read();
      //ns.tprint(Data);

      if (Data.action == "SendServerDetails") {
         SendServerDetails(ns, Data);
      }
      if (Data.action == "SendPassword") {
         SendPassword(ns, Data);
      }

      await ns.sleep(10);
   }
}



export const SendServerDetails = (ns: NS, Data: { action: string, hostname: string, details: DarknetServerDetails, requestId: string }) => {

   if (Data.hostname in ServerDatabase) {        // Alten Datensatz updaten

      // Haben sich wichtige Parameter verändert ?
      if (Data.details.passwordLength != ServerDatabase[Data.hostname].details.passwordLength ||
         Data.details.modelId != ServerDatabase[Data.hostname].details.modelId ||
         Data.details.passwordFormat != ServerDatabase[Data.hostname].details.passwordFormat) {
         // Das ist vermutlich ein neuer Server und das alte Passwort nicht mehr gültig
         ns.print("Neue Details für Server " + Data.hostname + " gefunden. Das alte Password wird gelöscht");
         ServerDatabase[Data.hostname].password = "";
      }

      ServerDatabase[Data.hostname].details = Data.details;
      ServerDatabase[Data.hostname].timestamp = Date.now();
      ServerDatabase[Data.hostname].free = ns.getServerMaxRam(Data.hostname);
   }
   else {
      // Neuen Datensatz anlegen
      ServerDatabase[Data.hostname] = {
         timestamp: Date.now(),
         details: Data.details,
         password: "",
         free: ns.getServerMaxRam(Data.hostname)
      };
   }

   //ns.tprint(" # Server:" + Object.keys(ServerDatabase).length)

   // Antwort Senden
   const outHandle = ns.getPortHandle(OUT_PORT);
   const Antwort =
   {
      requestId: Data.requestId,
      password: ServerDatabase[Data.hostname].password,
      timestamp: Date.now()                     // Timestamp, damit Nachrichten die nicht abgeholt werden nicht die Que verstopfen
   };
   outHandle.write(Antwort);
   //ns.tprint("Server:" + Data.hostname + " PW:" + ServerDatabase[Data.hostname].password + " als Antwort geschickt.");

}

export const SendPassword = (ns: NS, Data: { action: string, hostname: string, password: string }) => {
   // Passwort setzen
   if (Data.hostname in ServerDatabase) {        // Alten Datensatz updaten
      ServerDatabase[Data.hostname].password = Data.password;
      ServerDatabase[Data.hostname].timestamp = Date.now();
      //ns.tprint("Server:" + Data.hostname + " PW:" + Data.password + " gespeichert,");
   }
   else {
      //ns.tprint("Server ist unbekannt:" + Data.hostname);
   };
}


function printServerStats(ns: NS) {

   const servers = Object.values(ServerDatabase);

   // Globale Zählung
   const totalServers = servers.length;
   const totalWithPassword = servers.filter(s => s.password && s.password?.trim() !== "").length;

   ns.print("----------------------------------");
   ns.print(`server (total/mitPW) : ${totalServers}/${totalWithPassword}`);

   // Gruppierung nach modelId
   const groups = {};

   servers.forEach(server => {
      const modelId = server.details?.modelId || "Unknown";
      if (!groups[modelId]) {
         groups[modelId] = { total: 0, withPassword: 0 };
      }

      groups[modelId].total++;
      if (server.password && server.password.trim() !== "") {
         groups[modelId].withPassword++;
      }
   });

   // Ausgabe der Gruppen
   Object.keys(groups).forEach(modelId => {
      const g = groups[modelId];
      if (g.total == g.withPassword)
         ns.print(`${modelId.padEnd(20, " ")} server (total/mitPW): ${g.total}/${g.withPassword}`);
      else
         ns.print(`${modelId.padEnd(20, " ")} server (total/mitPW):${ROT} ${g.total}/${g.withPassword}${RESET}`);
   });
}


function DirektAttack(ns: NS) {
   //ns.tprint("getStasisLinkLimit: " + ns.dnet.getStasisLinkLimit());
   //ns.singularity.installBackdoor();
   //ns.getServerUsedRam().
   //ns.dnet.setStasisLink    // --> 12 GB

   // Loop 1: Durch alle Server mit einem StasisLink laufen und den Server mit der größten depth ermitteln.
   var LinkServerList = ns.dnet.getStasisLinkedServers();
   var maxdepth = 0;
   var targetServer = "";
   for (var hostname of LinkServerList) {
      const details = ns.dnet.getServerDetails(hostname);
      if (details.depth > maxdepth) {
         maxdepth = details.depth;
         targetServer = hostname; // Merkt sich den tiefsten Server
      }
   }

   // Loop 2 : StasisLink auf einem tiefem Level wieder freigeben 
   for (var hostname of LinkServerList) {
      if (hostname !== targetServer) {
         const details = ns.dnet.getServerDetails(hostname);
         if (details.depth > 24)     // Ab einer bestimmten tiefe wird nicht mehr gelöscht
            continue;
         var result = ns.dnet.connectToSession(hostname, ServerDatabase[hostname]?.password ?? "");
         if (result.success) {
            ns.exec("/work/setStasisLink.ts", hostname, { preventDuplicates: true }, "0");
         }
      }
   }


   /* 
    var LinkServerList = ns.dnet.getStasisLinkedServers();
    for (var hostname of LinkServerList)
    {
       if (ServerDatabase[hostname].password) {
 
          var result = ns.dnet.connectToSession(hostname, ServerDatabase[hostname].password);
          if (result.success) {
 
             const details = ns.dnet.getServerDetails(hostname);
             if (!details.isOnline) {
                continue;
             }
 
             ns.tprint("host/pw:" + hostname + " " + ServerDatabase[hostname].password);
 
             ns.scp("Darkweb.ts", hostname);
             ns.exec("Darkweb.ts", hostname, { preventDuplicates: true });
          }
          else {
             //ns.tprint("No suc: " + hostname + " " + result.message);
          }
 
       }
    }
    */
}