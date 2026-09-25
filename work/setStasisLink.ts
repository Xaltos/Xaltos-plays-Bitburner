export async function main(ns: NS) {

   var status = true;
   if (ns.args[0] == "1" || ns.args[0] == true || ns.args[0] == undefined) {
      status = true;
   }
   else if (ns.args[0] == "0" || ns.args[0] == false || ns.args[0] == "aus" || ns.args[0] == "off") {
      status = false;
   }

   var result = await ns.dnet.setStasisLink(status);
   if (result.success)
      ns.print("Erfolgreich setStasisLink ausgeführtr");
}