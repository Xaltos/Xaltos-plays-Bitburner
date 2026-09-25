import { NS, NodeStats } from "./NetscriptDefinitions";

export async function main(ns: NS): Promise<void> {
    let totalHashesPerSecond: number = 0;
    const numNodes: number = ns.hacknet.numNodes();

    // Schleife durch alle Hacknet-Nodes
    for (let i = 0; i < numNodes; i++) {
        const nodeStats: NodeStats = ns.hacknet.getNodeStats(i);
        totalHashesPerSecond += nodeStats.production;
    }

    ns.tprint(`Aktuelle Gesamtproduktion: ${totalHashesPerSecond.toFixed(2)} H/s`);
    var x = ns.getPlayer();

    x.city = "Aevum";

    let xx = 1;

}