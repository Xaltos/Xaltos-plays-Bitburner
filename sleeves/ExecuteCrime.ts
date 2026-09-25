//import { NS, NodeStats } from "../NetscriptDefinitions";
export async function main(ns: NS): Promise<void> {
   // Liste aller verfügbaren Verbrechen im Spiel
   interface CrimeData {
      name: CrimeType;
      money: number;
      difficulty: number;
      agility?: number;
      dexterity?: number;
      strength?: number;
      defense?: number;
      charisma?: number;
      hacking?: number;
   }

   const crimeData: CrimeData[] = [
      { name: "Shoplift", money: 15000, difficulty: 0.05, agility: 1, dexterity: 1 },
      { name: "Rob Store", money: 40000, difficulty: 0.10, agility: 1, dexterity: 1, charisma: 1 },
      { name: "Mug", money: 30000, difficulty: 0.20, strength: 1, defense: 1, dexterity: 1, agility: 1 },
      { name: "Larceny", money: 400000, difficulty: 0.50, agility: 1, dexterity: 1, hacking: 1 },
      { name: "Deal Drugs", money: 120000, difficulty: 1.00, charisma: 1, dexterity: 1, agility: 1 },
      { name: "Bond Forgery", money: 250000, difficulty: 2.50, hacking: 1, charisma: 1 },
      { name: "Traffick Arms", money: 600000, difficulty: 5.00, strength: 1, defense: 1, dexterity: 1, agility: 1, charisma: 1 },
      { name: "Homicide", money: 45000, difficulty: 1.00, strength: 1, defense: 1, dexterity: 1, agility: 1 },
      { name: "Grand Theft Auto", money: 1600000, difficulty: 8.00, hacking: 1, strength: 1, dexterity: 1, agility: 1, charisma: 1 },
      { name: "Kidnap", money: 12000000, difficulty: 16.00, strength: 1, defense: 1, dexterity: 1, agility: 1, charisma: 1 },
      { name: "Assassination", money: 12000000, difficulty: 30.00, strength: 1, defense: 1, dexterity: 1, agility: 1 },
      { name: "Heist", money: 120000000, difficulty: 90.00, hacking: 1, strength: 1, defense: 1, dexterity: 1, agility: 1, charisma: 1 }
   ];


   const player = ns.getPlayer();
   const numSleeves = ns.sleeve.getNumSleeves();


   // 2. Schleife für jeden einzelnen Sleeve
   for (let i = 0; i < numSleeves; i++) {
      // Holt das Sleeve-Objekt mit den individuellen Skills
      const sleeve = ns.sleeve.getSleeve(i);

      let bestCrime: CrimeType = "Shoplift";
      let maxMoney = 0;

      // Berechne die Erfolgschance für dieses spezifische Sleeve
      for (const crime of crimeData) {
         let skillSum = 0;

         // Nutze JETZT die Stats des aktuellen Sleeves
         if (crime.hacking) skillSum += sleeve.skills.hacking * crime.hacking;
         if (crime.strength) skillSum += sleeve.skills.strength * crime.strength;
         if (crime.defense) skillSum += sleeve.skills.defense * crime.defense;
         if (crime.dexterity) skillSum += sleeve.skills.dexterity * crime.dexterity;
         if (crime.agility) skillSum += sleeve.skills.agility * crime.agility;
         if (crime.charisma) skillSum += sleeve.skills.charisma * crime.charisma;

         // 1. Basis-Berechnung (SkillSum / MAX_SKILL)
         let chance = skillSum / 975;

         // 2. Division durch die Kriminalitäts-Schwierigkeit
         chance /= crime.difficulty;

         // 3. Multiplikation mit den kriminellen Erfolgs-Multiplikatoren des Spielers
         chance *= sleeve.mults.crime_success;

         // 4. Intelligenz-Bonus einrechnen (falls vorhanden)
         if (player.skills.intelligence) {
            // Das Spiel nutzt getIntelligenceBonus(1), was 1 + (intelligence^0.8) * 0.008 entspricht
            const intBonus = 1 + Math.pow(sleeve.skills.intelligence, 0.8) * 0.008;
            chance *= intBonus;
         }

         // Obergrenze festlegen (100% = 1.0)
         chance = Math.min(chance, 1)

         //ns.singularity.getCrimeChance(crime.name)

         ns.tprint(`Sleeve ${i}:  '${crime.name}' Chance von ${ns.format.percent(chance)})`);

         // Filter: Muss über 95% sein
         if (chance > 0.95) {
            if (crime.money > maxMoney) {
               maxMoney = crime.money;
               bestCrime = crime.name;
            }
         }
      }

      // 3. Weise dem Sleeve seine individuell beste Option zu
      ns.sleeve.setToCommitCrime(i, bestCrime);
      ns.tprint(`Sleeve ${i}: Setze auf '${bestCrime}' (Ertrag: ${ns.format.number(maxMoney)})`);
   }
}


/*
export async function main(ns: NS): Promise<void> {
   // Liste aller relevanten Verbrechen im Spiel
   const crimeNames: CrimeType[] = [
      "Shoplift", "Rob Store", "Mug", "Larceny", "Deal Drugs",
      "Bond Forgery", "Traffick Arms", "Homicide",
      "Grand Theft Auto", "Kidnap", "Assassination", "Heist"
   ];

   const player = ns.getPlayer();
   const numSleeves = ns.sleeve.getNumSleeves();

   // 1. Hole den globalen BitNode-Erfolgsmultiplikator über die Singularity-API
   // Da es keinen direkten "getCrimeChanceMult" gibt, nutzen wir das Verhältnis 
   // beim Hauptspieler, um BitNode-Abweichungen (z.B. BN2) exakt zu kalibrieren.
   const sampleStats = ns.singularity.getCrimeStats("Shoplift");
   const playerSampleChance = ns.singularity.getCrimeChance("Shoplift");

   let playerSampleSkillSum = 0;
   playerSampleSkillSum += player.skills.agility;
   playerSampleSkillSum += player.skills.dexterity;

   let calculatedSampleChance = (playerSampleSkillSum / 975) / sampleStats.difficulty;
   calculatedSampleChance *= player.mults.crime_success;
   if (player.skills.intelligence) {
      calculatedSampleChance *= (1 + Math.pow(player.skills.intelligence, 0.8) * 0.008);
   }

   // Der bitnodeMult gleicht alle versteckten Modifikatoren des aktuellen BitNodes aus
   const bitnodeMult = calculatedSampleChance > 0 ? (playerSampleChance / calculatedSampleChance) : 1;

   // 2. Schleife für jeden einzelnen Sleeve
   for (let i = 0; i < numSleeves; i++) {
      const sleeve = ns.sleeve.getSleeve(i);

      // Überspringe Sleeves, die noch geschockt sind (Shock blockiert Kriminalitätseffizienz)

      let bestCrime: CrimeType = "Shoplift";
      let maxMoney = 0;

      for (const crimeName of crimeNames) {
         const stats = ns.singularity.getCrimeStats(crimeName);
         let skillSum = 0;

         // Gewichtungen dynamisch aus den echten Crime-Stats lesen statt statischer Liste
         if (stats.hacking_exp > 0) skillSum += sleeve.skills.hacking;
         if (stats.strength_exp > 0) skillSum += sleeve.skills.strength;
         if (stats.defense_exp > 0) skillSum += sleeve.skills.defense;
         if (stats.dexterity_exp > 0) skillSum += sleeve.skills.dexterity;
         if (stats.agility_exp > 0) skillSum += sleeve.skills.agility;
         if (stats.charisma_exp > 0) skillSum += sleeve.skills.charisma;

         // Kernberechnung der Engine (MaxSkillLevel = 975)
         let chance = (skillSum / 975) / stats.difficulty;

         // Sleeve-spezifischer Kriminalitäts-Multiplikator
         chance *= sleeve.mults.crime_success;

         // Intelligenz-Bonus einberechnen
         if (sleeve.skills.intelligence > 0) {
            const intBonus = 1 + Math.pow(sleeve.skills.intelligence, 0.8) * 0.008;
            chance *= intBonus;
         }

         // BitNode-Faktor anwenden
         chance *= bitnodeMult;

         // Grenzen einhalten (0% bis 100%)
         chance = Math.max(0, Math.min(chance, 1));

         ns.tprint(`Sleeve ${i}: '${crimeName}' berechnete Chance: ${ns.format.percent(chance)}`);

         // Filter: Erfolgswahrscheinlichkeit muss über 95% sein
         if (chance > 0.95) {
            // Nutze den echten, dynamischen Geldwert des aktuellen BitNodes
            if (stats.money > maxMoney) {
               maxMoney = stats.money;
               bestCrime = crimeName;
            }
         }
      }

      // 3. Dem Sleeve die profitabelste, sichere Option zuweisen
      ns.sleeve.setToCommitCrime(i, bestCrime);
      ns.tprint(`➔ Sleeve ${i}: Setze auf '${bestCrime}' (Ertrag: ${ns.format.number(maxMoney)})`);
   }
}*/