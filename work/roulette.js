/** @param {NS} ns */
export async function main(ns) {
   // Überschreiben von 2 Funktionen ?
   Math.floor = (number) => { return 1 };
   Math.random = () => { return 0 };
}