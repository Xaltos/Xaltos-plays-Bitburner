export async function main(ns: NS) {


   // Staneks Gift (Raster) abrufen
   const fragments: ActiveFragment[] = ns.stanek.activeFragments();

   if (fragments.length === 0) {
      ns.tprint("ERROR: Du hast keine Fragmente auf dem Stanek-Raster platziert!");
      return;
   }


   for (const frag of fragments) {
      ns.tprint("Fargment:"
         + " Typ: " + frag.type
         + " x: " + frag.x
         + " y: " + frag.y
         + " r: " + frag.rotation
         + " id: " + frag.id
      )


      ns.stanek.placeFragment(1,1,1,1);

   }
   // Kurzer Sleep zur Entlastung der CPU


}