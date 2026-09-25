/** @param {NS} ns */
export async function main(ns:NS) {

   const args = ns.flags([['help', false]]);
   const hostname = args._[0];
   let AnzahlThreads = parseInt(args._[1]) || 1; 


   ns.print("Aufrufparameter:" + hostname + " " + AnzahlThreads);

   // Onlinehilfe
   if (args.help || !hostname) {
      ns.tprint("This script will generate money by hacking a target server.");
      ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`);
      ns.tprint("Example:");
      ns.tprint(`> run ${ns.getScriptName()} n00dles`);
      return;
   }

   let hackCount = 0;
   let weakenCount = 0;
   let growCount = 0;

   //ns.disableLog('ALL');
   //ns.disableLog('getServerSecurityLevel');
   //ns.disableLog('getServerMinSecurityLevel');
   //ns.disableLog('getServerMoneyAvailable');
   //ns.disableLog('getServerMaxMoney');

   let ServerMinSecurity = ns.getServerMinSecurityLevel(hostname);
   let ServerMaxMoney = ns.getServerMaxMoney(hostname);
   let WeakStrength = 0.05 * AnzahlThreads;
   let GrowMultilier = 1.04;
   let HackResult = 0;
   let WeakenResult = 0;

   let ServerSecurity = 0;
   let ServerMoney = 0;

   let LastServerSecurity = 0;
   let LastServerMoney = 0;


   while (true) {

      LastServerSecurity = ServerSecurity
      LastServerMoney = ServerMoney;
      ServerSecurity = ns.getServerSecurityLevel(hostname);
      ServerMoney = ns.getServerMoneyAvailable(hostname);


      let timeStr = new Date().toLocaleTimeString('sv-SE');


      ns.print(timeStr + " / HWG: " + hackCount + "/" + weakenCount + "/" + growCount +
         " / Sec: " + ServerSecurity.toFixed(4) + "/" + ServerMinSecurity +
         "   Money:" + ns.format.number(ServerMoney) + " / " + ns.format.number(ServerMaxMoney) +
         //" / HackResult: " + Math.round(HackResult).toLocaleString('de-DE') +
         " / Delta(Sec/Mon): " + (ServerSecurity - LastServerSecurity).toFixed(4) +
         " / " + ns.format.number(ServerMoney - LastServerMoney)
      );

      /*
            if (HackResult > 0)
            {
               ns.tprint(timeStr + " Hack: "+ ns.getHostname() +" - " +AnzahlThreads + " "+ns.format.number(HackResult))
            }
            */

      HackResult = 0;


      var GrowSetting = { stock: true };
      var HackSetting = { stock: false };


      if (ServerSecurity - WeakStrength > ServerMinSecurity)   // Keinen Aufruf verschwenden. Nur wenn die Punkte auch gebraucht werden
      {
         WeakenResult = await ns.weaken(hostname);
         weakenCount++;
      } else if (ServerMoney * GrowMultilier < ServerMaxMoney) {
         GrowMultilier = await ns.grow(hostname, GrowSetting);
         growCount++;

      } else {
         HackResult = await ns.hack(hostname, HackSetting);
         hackCount++;
      }


      // Scripte aus dem Sync bringen
      await ns.sleep(Math.random() * 20);

   }
}