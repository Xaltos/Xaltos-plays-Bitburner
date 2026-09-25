/** @param {NS} ns */
export async function main(ns) {
   const ziel = ns.args[0];
   if (!ziel) {
      ns.tprint("Fehler: Bitte gib einen Servernamen an. Beispiel: run jump.js w0r1d_d43m0n");
      return;
   }

   const pfad = [];
   const besucht = new Set();

   // Funktion zur Breitensuche (BFS) im Netzwerk
   function findePfad(aktuell, zielServer) {
      if (aktuell === zielServer) return true;
      besucht.add(aktuell);

      const nachbarn = ns.scan(aktuell);
      for (const nachbar of nachbarn) {
         if (!besucht.has(nachbar)) {
            pfad.push(nachbar);
            if (findePfad(nachbar, zielServer)) return true;
            pfad.pop();
         }
      }
      return false;
   }

   // Pfad suchen
   if (findePfad("home", ziel)) {
      // Generiert die Befehlskette: connect server1; connect server2; ...
      let befehl = "home; ";
      for (const knoten of pfad) {
         befehl += `connect ${knoten}; `;
      }


      // Injiziert den fertigen Befehl direkt in dein Terminal
      const terminalInput = document.getElementById("terminal-input");
      if (terminalInput) {
         
         // 1. Trick: Reacts internen Setter holen, um den Wert manipulationssicher zu schreiben
         const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
         valueSetter.call(terminalInput, befehl);
         
         // 2. Ein echtes Input-Event auslösen, damit React den State aktualisiert
         terminalInput.dispatchEvent(new Event('input', { bubbles: true }));

         // 3. React-Ereignishandler suchen
         const handlerKey = Object.keys(terminalInput).find(k => k.startsWith("__reactProps") || k.startsWith("__reactFiber"));
         if (handlerKey && terminalInput[handlerKey]) {
            
            // 4. Fokus auf das Terminal setzen
            terminalInput.focus();
            
            // 5. Enter simulieren (mit allen relevanten Feldern für die Event-Validierung)
            const enterEvent = {
               key: 'Enter',
               keyCode: 13,
               which: 13,
               bubbles: true,
               cancelable: true,
               preventDefault: () => {},
               stopPropagation: () => {}
            };
            
            if (terminalInput[handlerKey].onKeyDown) {
               terminalInput[handlerKey].onKeyDown(enterEvent);
            }
         }
      } else {
         ns.tprint(`Pfad gefunden, aber Terminal nicht aktiv. Nutze diesen Pfad manuell:\nhome -> ${pfad.join(" -> ")}`);
      }


   } else {
      ns.tprint(`Fehler: Server '${ziel}' wurde im Netzwerk nicht gefunden.`);
   }
}