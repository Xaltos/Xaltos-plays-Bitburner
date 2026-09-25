/** @param {NS} ns */
export async function main(ns: NS) {
   ns.disableLog("ALL")
   let index = "FSIG";   //ns.args[0] // should be FSIG or FLCM
   let history = []
   let max_shares = ns.stock.getMaxShares(index)
   let max_history = 40
   let fee = 100000
   while (true) {
      let money = (ns.getServerMoneyAvailable("home") - fee) * 0.9
      let price = ns.stock.getPrice(index)
      let my_shares = ns.stock.getPosition(index)[0]
      ns.clearLog()
      if (history.length > (max_history - 1)) {
         if (price > Math.max(...history)) 
         {
            let buy = Math.floor((money / price))
            if ((buy + my_shares) > max_shares) {
               buy = max_shares - my_shares
            }
            if (buy > 0 && (price * buy) > 10000000) {
               ns.print("Buy(Long): " + ns.stock.buyStock(index, buy))
            }
         } else if (price < Math.min(...history)) {
            if (my_shares > 0) {
               ns.print("Sell(Long): " + ns.stock.sellStock(index, my_shares))
            }
         }
      }
      history.splice(0, 0, price)
      if (history.length > max_history) {
         history.pop()
      }
      let profit = ns.stock.getSaleGain(index, my_shares, "L")
      ns.print("Index: " + index)
      ns.print("Max Shares: " + round(max_shares))
      ns.print("My Long Shares: " + round(ns.stock.getPosition(index)[0]))
      ns.print("Price: $" + round(price))
      ns.print("History saved: " + history.length)
      ns.print("Highest Price: $" + round(Math.max(...history)))
      ns.print("Lowest Price: $" + round(Math.min(...history)))
      ns.print("-------------------------")
      ns.print("Profit: $" + round(profit))
      ns.print("-------------------------")
      while (price == ns.stock.getPrice(index)) {
         await ns.sleep(100)
      }
   }
}

function round(value) {
   let signs = ["", "k", "m", "b", "t"]
   let which = 0
   while (value > 999 || value < -999) {
      value = Math.round(value / 10) / 100
      ++which
   }
   return value + signs[which]
}
