export async function main(ns: NS) {
   try {
      if (ns.singularity.purchaseTor())
         ns.tprint("✅ ok")
      else
         ns.tprint("❌ nok")
   }
   catch {
      ns.tprint("❌ Fehler")
   }
}