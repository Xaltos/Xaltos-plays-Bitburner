//import { getAllServers } from "getServers.js";

export function main(ns) {


   const contracts = getAllServers(ns, "home").flatMap((server) => {
      const onServer = ns.ls(server, ".cct").map((contract) => {
         const type = ns.codingcontract.getContractType(contract, server);
         const data = ns.codingcontract.getData(contract, server);
         const didSolve = solve(type, data, server, contract, ns);
         return `${server} - ${contract} - ${type} - ${didSolve || `FAILED! ${data}`}`;
      });
      return onServer;
   });

   ns.tprint(` **** Found ${contracts.length} contracts ****`);
   contracts.forEach((contract) => void ns.print(contract));
}

function solve(type, data, server, contract, ns) {
   let solution = "";
   ns.print(type);
   let ErgType = "string";
   switch (type) {
      case "Algorithmic Stock Trader I":
         solution = maxProfit([1, data]);
         break;
      case "Algorithmic Stock Trader II":
         solution = maxProfit([Math.ceil(data.length / 2), data]);
         break;
      case "Algorithmic Stock Trader III":
         solution = maxProfit([2, data]);
         break;
      case "Algorithmic Stock Trader IV":
         solution = maxProfit(data);
         break;
      case "Minimum Path Sum in a Triangle":
         solution = solveTriangleSum(data, ns);
         break;
      case "Unique Paths in a Grid I":
         solution = uniquePathsI(data);
         break;
      case "Unique Paths in a Grid II":
         solution = uniquePathsII(data);
         break;
      case "Generate IP Addresses":
         solution = generateIps(data);
         break;
      case "Find Largest Prime Factor":
         solution = factor(data);
         break;
      case "Spiralize Matrix":
         solution = spiral(data);
         break;
      case "Merge Overlapping Intervals":
         solution = mergeOverlap(data);
         break;
      case "Total Ways to Sum":
         solution = TotalWaystoSum(data, ns);
         break;
      case "Total Ways to Sum II":
         solution = TotalWaystoSum2(data, ns);
         break;
      case "Compression I: RLE Compression":
         solution = RLECompression(data, ns);
         break;
      case "Array Jumping Game":
         solution = ArrayJumpingGame(data, ns);
         break;
      case "Total Number of Primes":
         solution = countPrimesInRange(data, ns);
         //ErgType = "Number";
         break;
      case "Encryption I: Caesar Cipher":
         solution = CaesarCipher(data, ns);
         break;
      case "Encryption II: Vigenère Cipher":
         solution = decryptVigenere(data, ns);
         break;

      case "Subarray with Maximum Sum":
         solution = SubarrayWithMaximumSum(data, ns);
         ErgType = "Number";
         break;
      case "Square Root":
         solution = bigIntSqrt(data, ns);
         break;
      case "Shortest Path in a Grid":
         solution = solveShortestPath(data, ns);
         break;
      case "Maximum Value in a Grid":   // KI freiflug
         solution = maxValueInGrid(data);
         ErgType = "Number";
         break;
      case "Encryption II: Vigenère Cipher":
         solution = encryptVigenere(data[0], data[1], ns);
         break;
      case "Compression II: RLE Decompression": // KI freiflug
         solution = RLEDecompression(data);
         break;
      /* ----------------------------------------------------------------- */
      case "Largest Rectangle in a Matrix":
         solution = "";
         break;
      case "Proper 2-Coloring of a Graph":
         solution = "1";
         break;
      default:
         // Unknown type – leave solution empty
         //solution=""

         // Falsche Antwort senden. Damit werden die Verträge verbrauct und wir bekommen hoffentlich neue
         solution = ""
         break;
   }
   if (solution != "") {
      let erg;
      if (ErgType == "Number")
         erg = ns.codingcontract.attempt(Number(solution), contract, server /*, [true]*/);
      else
         erg = ns.codingcontract.attempt(solution, contract, server/*, [true]*/);

      if (erg == "") {
         ns.print("Die Lösung vom Typ: '" + type + "' ist falsch.");
         ns.print("  Eingabe: " + data + "  Meine Antwort: " + solution);
      }

      return erg;
   }
   else {
      ns.print("Der Vertrag vom Typ: '" + type + "' ist unbekannt oder hat keine Lösung gefunden.")
   }
}

/* ------------------------------------------------------------------------ */
/* ---------------------------- ALGORITHMIC STOCK TRADER -------------------- */
function maxProfit(arrayData) {
   let i, j, k;

   let maxTrades = arrayData[0];
   let stockPrices = arrayData[1];

   // WHY?
   let tempStr = "[0";
   for (i = 0; i < stockPrices.length; i++) {
      tempStr += ",0";
   }
   tempStr += "]";
   let tempArr = "[" + tempStr;
   for (i = 0; i < maxTrades - 1; i++) {
      tempArr += "," + tempStr;
   }
   tempArr += "]";

   let highestProfit = JSON.parse(tempArr);

   for (i = 0; i < maxTrades; i++) {
      for (j = 0; j < stockPrices.length; j++) { // Buy / Start
         for (k = j; k < stockPrices.length; k++) { // Sell / End
            if (i > 0 && j > 0 && k > 0) {
               highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
            } else if (i > 0 && j > 0) {
               highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
            } else if (i > 0 && k > 0) {
               highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
            } else if (j > 0 && k > 0) {
               highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
            } else {
               highestProfit[i][k] = Math.max(highestProfit[i][k], stockPrices[k] - stockPrices[j]);
            }
         }
      }
   }
   return highestProfit[maxTrades - 1][stockPrices.length - 1];
}

/* ------------------------------------------------------------------------ */
/* ------------------------------ SMALL TRIANGLE SUM ----------------------- */
function solveTriangleSum(arrayData, ns) {
   let triangle = arrayData;
   let nextArray;
   let previousArray = triangle[0];

   for (let i = 1; i < triangle.length; i++) {
      nextArray = [];
      for (let j = 0; j < triangle[i].length; j++) {
         if (j == 0) {
            nextArray.push(previousArray[j] + triangle[i][j]);
         } else if (j == triangle[i].length - 1) {
            nextArray.push(previousArray[j - 1] + triangle[i][j]);
         } else {
            nextArray.push(Math.min(previousArray[j], previousArray[j - 1]) + triangle[i][j]);
         }

      }

      previousArray = nextArray;
   }

   return Math.min.apply(null, nextArray);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------ UNIQUE PATHS ---------------------------- */
function uniquePathsI(grid) {
   const rightMoves = grid[0] - 1;
   const downMoves = grid[1] - 1;

   return Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));
}

function factorial(n) {
   return factorialDivision(n, 1);
}

function factorialDivision(n, d) {
   if (n == 0 || n == 1 || n == d)
      return 1;
   return factorialDivision(n - 1, d) * n;
}

function uniquePathsII(grid, ignoreFirst = false, ignoreLast = false) {
   const rightMoves = grid[0].length - 1;
   const downMoves = grid.length - 1;

   let totalPossiblePaths = Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));

   for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {

         if (grid[i][j] == 1 && (!ignoreFirst || (i != 0 || j != 0)) && (!ignoreLast || (i != grid.length - 1 || j != grid[i].length - 1))) {
            const newArray = [];
            for (let k = i; k < grid.length; k++) {
               newArray.push(grid[k].slice(j, grid[i].length));
            }

            let removedPaths = uniquePathsII(newArray, true, ignoreLast);
            removedPaths *= uniquePathsI([i + 1, j + 1]);

            totalPossiblePaths -= removedPaths;
         }
      }

   }

   return totalPossiblePaths;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------ GENERATE IP ADDRESSES ------------------- */
function generateIps(num) {
   num = num.toString();

   const length = num.length;

   const ips = [];

   for (let i = 1; i < length - 2; i++) {
      for (let j = i + 1; j < length - 1; j++) {
         for (let k = j + 1; k < length; k++) {
            const ip = [
               num.slice(0, i),
               num.slice(i, j),
               num.slice(j, k),
               num.slice(k, num.length)
            ];
            let isValid = true;

            ip.forEach(seg => {
               isValid = isValid && isValidIpSegment(seg);
            });

            if (isValid) ips.push(ip.join("."));

         }

      }
   }

   return ips;

}

function isValidIpSegment(segment) {
   if (segment[0] == "0" && segment != "0") return false;
   segment = Number(segment);
   if (segment < 0 || segment > 255) return false;
   return true;
}

/* ------------------------------------------------------------------------ */
/* --------------------------------- FACTOR -------------------------------- */
function factor(num) {
   for (let div = 2; div <= Math.sqrt(num); div++) {
      if (num % div != 0) {
         continue;
      }
      num = num / div;
      div = 2;
   }
   return num;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------ SPIRALIZE MATRIX ------------------------ */
function spiral(arr, accum = []) {
   if (arr.length === 0 || arr[0].length === 0) {
      return accum;
   }
   accum = accum.concat(arr.shift());
   if (arr.length === 0 || arr[0].length === 0) {
      return accum;
   }
   accum = accum.concat(column(arr, arr[0].length - 1));
   if (arr.length === 0 || arr[0].length === 0) {
      return accum;
   }
   accum = accum.concat(arr.pop().reverse());
   if (arr.length === 0 || arr[0].length === 0) {
      return accum;
   }
   accum = accum.concat(column(arr, 0).reverse());
   if (arr.length === 0 || arr[0].length === 0) {
      return accum;
   }
   return spiral(arr, accum);
}

function column(arr, index) {
   const res = [];
   for (let i = 0; i < arr.length; i++) {
      const elm = arr[i].splice(index, 1)[0];
      if (elm) {
         res.push(elm);
      }
   }
   return res;
}

/* ------------------------------------------------------------------------ */
/* -------------------------- MERGE OVERLAPPING INTERVALS ----------------- */
function mergeOverlap(intervals) {
   intervals.sort(([minA], [minB]) => minA - minB);
   for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
         const [min, max] = intervals[i];
         const [laterMin, laterMax] = intervals[j];
         if (laterMin <= max) {
            const newMax = laterMax > max ? laterMax : max;
            const newInterval = [min, newMax];
            intervals[i] = newInterval;
            intervals.splice(j, 1);
            j = i;
         }
      }
   }
   return intervals;
}

function getAllServers(ns, rootHost = 'home') {
   ns.disableLog('scan')
   let pendingScan = [rootHost]
   const list = new Set(pendingScan)

   while (pendingScan.length) {
      const hostname = pendingScan.shift()
      list.add(hostname)

      pendingScan.push(...ns.scan(hostname))
      pendingScan = pendingScan.filter(host => !list.has(host))
   }

   return [...list]
}
/* ------------------------------------------------------------------------ */
/* ------------------------------- TOTAL WAY TO SUM ---------------------- */

function TotalWaystoSum(n, ns) {
   //ns.tprint ("Debug: TotalWaystoSum:" + n)

   let dp = new Array(n + 1).fill(0);
   dp[0] = 1; // Basiszahl

   // Schleife über alle Summanden von 1 bis n-1 (da mindestens zwei Zahlen benötigt werden)
   for (let i = 1; i < n; i++) {
      for (let j = i; j <= n; j++) {
         dp[j] += dp[j - i];
      }
   }
   //ns.tprint ("Debug1: TotalWaystoSum:" + dp[n])   
   return dp[n];
}

/* ------------------------------------------------------------------------ */
/* -------------------------------- RLE COMPRESSION ----------------------- */
function RLECompression(input, ns) {
   //ns.tprint("Debug: RLECompression:" + input)

   if (!input) return "";

   let result = "";
   let i = 0;

   while (i < input.length) {
      let char = input[i];
      let runLength = 0;

      // Zähle, wie oft sich das aktuelle Zeichen wiederholt
      while (i < input.length && input[i] === char) {
         runLength++;
         i++;
      }

      // Teile Läufe, die länger als 9 Zeichen sind, in 9er-Blöcke auf
      while (runLength > 0) {
         let currentChunk = Math.min(runLength, 9);
         result += currentChunk + char;
         runLength -= currentChunk;
      }
   }

   // ns.tprint("Debug1: RLECompression:" + result)
   return result;
}

/* ------------------------------------------------------------------------ */
/* --------------------------------- ARRAY JUMPING ------------------------ */
function ArrayJumpingGame(nums, ns) {
   //ns.tprint("Debug: ArrayJumpingGame:" + nums)
   let maxReach = 0;

   for (let i = 0; i < nums.length; i++) {
      // Wenn die aktuelle Position nicht mehr erreichbar ist, brich ab
      if (i > maxReach)
         return 0;

      // Aktualisiere die maximale Reichweite
      maxReach = Math.max(maxReach, i + nums[i]);

      // Wenn das Ende oder darüber hinaus erreicht werden kann
      if (maxReach >= nums.length - 1)
         return 1;
   }
   return 0;
}

/* ------------------------------------------------------------------------ */
/* --------------------------------- PRIMES -------------------------------- */
function countPrimesInRange(data, ns) {
   let start = data[0];
   let end = data[1];

   ns.print(start + "-" + end);

   let result = 0;
   for (var x = start; x <= end; x++) {
      if (isPrime(x)) {
         result++;
      }
   }
   ns.print(result);
   return result;
}

function isPrime(num) {
   var sqrtnum = Math.floor(Math.sqrt(num));
   var prime = num != 1;
   for (var i = 2; i < sqrtnum + 1; i++) {
      if (num % i == 0) {
         prime = false;
         break;
      }
   }
   return prime;
}



function TotalWaystoSum2(data, ns) {

   let target = data[0];
   let candidates = data[1];

   // Erstellt ein Array mit der Größe target + 1, gefüllt mit 0
   const dp = new Array(target + 1).fill(0);

   // Basis-Fall: Es gibt genau 1 Möglichkeit, die Summe 0 zu bilden
   dp[0] = 1;

   // Berechne die Kombinationen für jede Zahl im Set
   for (const num of candidates) {
      for (let i = num; i <= target; i++) {
         dp[i] += dp[i - num];
      }
   }

   return dp[target];
}

/* ------------------------------------------------------------------------ */
/* -------------------------------- CAESAR CIPHER -------------------------- */
function CaesarCipher(data, ns) {
   const text = data[0];
   const shift = data[1] % 26;
   let ciphertext = "";

   ns.print("input:" + data);
   for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === " ") {
         ciphertext += " ";
         continue;
      }

      let code = text.charCodeAt(i);
      let newCode = code - shift;
      if (newCode < 65) newCode += 26;
      if (newCode > 90) newCode -= 26;

      ciphertext += String.fromCharCode(newCode);
   }

   return ciphertext;
}

/* ------------------------------------------------------------------------ */
/* ----------------------- SUBARRAY WITH MAXIMUM SUM ---------------------- */
function SubarrayWithMaximumSum(data, ns) {

   // Falls das Array leer ist, direkt 0 zurückgeben
   if (!data || data.length === 0) return 0;

   // Initialisierung mit dem ersten Element des Arrays
   let maxSoFar = data[0];
   let currentMax = data[0];

   // Schleife startet beim zweiten Element (Index 1)
   for (let i = 1; i < data.length; i++) {
      // Entscheide: Aktuelles Element zum bestehenden Teilarray hinzufügen,
      // oder ein völlig neues Teilarray ab diesem Element beginnen?
      currentMax = Math.max(data[i], currentMax + data[i]);

      // Aktualisiere das historische Maximum, falls der neue Wert höher ist
      maxSoFar = Math.max(maxSoFar, currentMax);
   }
   return maxSoFar;


}

/* ------------------------------------------------------------------------ */
/* -------------------------------- SQUARE ROOT --------------------------- */
function bigIntSqrt(n, ns) {
   if (n < 0n) throw new Error("Keine Wurzel aus negativen Zahlen möglich");
   if (n === 0n || n === 1n) return n;

   // 1. Compute floor square root (Heron's method)
   let x0 = n / 2n;
   let x1 = (x0 + n / x0) / 2n;
   while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + n / x0) / 2n;
   }

   // 2. Check rounding threshold: (x0 + 0.5)^2 = x0^2 + x0 + 0.25
   // If n > (x0^2 + x0), it is closer to the next integer.
   if (n > (x0 * x0 + x0)) {
      return (x0 + 1n).toString();
   }
   return x0.toString();
}

/* ------------------------------------------------------------------------ */
/* --------------------------------- PATH FINDER -------------------------- */
function solveShortestPath(grid, ns) {
   const rows = grid.length;
   const cols = grid[0].length;
   if (grid[0][0] === 1 || grid[rows - 1][cols - 1] === 1) return "";

   const queue = [[0, 0, ""]];
   const visited = new Set(["0,0"]);
   const directions = [
      { r: 1, c: 0, d: 'D' }, // Down
      { r: 0, c: 1, d: 'R' }, // Right
      { r: -1, c: 0, d: 'U' }, // Up
      { r: 0, c: -1, d: 'L' }  // Left
   ];

   while (queue.length > 0) {
      const [r, c, path] = queue.shift();

      if (r === rows - 1 && c === cols - 1) return path;

      for (const { r: dr, c: dc, d: move } of directions) {
         const nr = r + dr;
         const nc = c + dc;
         const key = `${nr},${nc}`;

         if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0 && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc, path + move]);
         }
      }
   }
   return "";
}
/* ------------------------------------------------------------------------ */
/* --------------------------- NEW: MAX VALUE IN GRID --------------------- */
function maxValueInGrid(grid) {
   const rows = grid.length;
   const cols = grid[0].length;
   const dp = Array.from({ length: rows }, () => new Array(cols).fill(-Infinity));

   dp[0][0] = grid[0][0];

   for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
         if (i === 0 && j === 0) continue;

         let maxPrev = -Infinity;
         if (i > 0) maxPrev = Math.max(maxPrev, dp[i - 1][j]);
         if (j > 0) maxPrev = Math.max(maxPrev, dp[i][j - 1]);

         dp[i][j] = grid[i][j] + maxPrev;
      }
   }

   return dp[rows - 1][cols - 1];
}
/* ------------------------------------------------------------------------ */
/* --------------------------- NEW: RLE DECOMPRESSION -------------------- */
function RLEDecompression(data) {
   let result = "";
   let i = 0;
   const len = data.length;

   while (i < len) {
      // 1. read number (may be >9)
      let numStr = "";
      while (i < len && data[i] >= "0" && data[i] <= "9") {
         numStr += data[i];
         i++;
      }
      const count = parseInt(numStr, 10);

      // 2. read the character
      const char = data[i];
      i++;

      // 3. append
      result += char.repeat(count);
   }

   return result;
}
/* ------------------------------------------------------------------------ */
/* ------------------------- VIGENÈRE DECRYPTION ------------------------- */
function decryptVigenere(data, ns) {

   let key = data[0];
   let cipherText = data[1];
   // Nur Großbuchstaben; der Key wird zyklisch wiederholt
   const keyLen = key.length;
   const cipherLen = cipherText.length;
   let plaintext = "";

   for (let i = 0; i < cipherLen; i++) {
      const cipherChar = cipherText.charCodeAt(i) - 65;   // 0‑25
      const keyChar = key.charCodeAt(i % keyLen) - 65; // 0‑25

      // Dekodieren: (cipher - key + 26) % 26
      const plainChar = (cipherChar - keyChar + 26) % 26 + 65;
      plaintext += String.fromCharCode(plainChar);
   }

   return plaintext;
}

/* ------------------------------------------------------------------------ */
/* ---------------------------- VIGENÈRE ENCRYPTION -------------------------- */
function encryptVigenere2(plainText, key) {
   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
   let cipherText = "";

   for (let i = 0; i < plainText.length; i++) {
      // Falls Bitburner ein Leerzeichen liefert, wird es unverschlüsselt übernommen,
      // ABER der Schlüssel rückt im Index (i % key.length) trotzdem weiter!
      if (plainText[i] === " ") {
         cipherText += " ";
         continue;
      }

      const plainIdx = chars.indexOf(plainText[i]);
      const keyChar = key[i % key.length];
      const keyIdx = chars.indexOf(keyChar);

      // Vigenère-Berechnung (Klartext-Index + Schlüssel-Index) mod 26
      const cipherIdx = (plainIdx + keyIdx) % 26;
      cipherText += chars[cipherIdx];
   }

   return cipherText;
}
/* ------------------------------------------------------------------------ */
function encryptVigenere(str, keyword) {

   ns.print(`Input: ${str}`);
   ns.print(`Keyword: ${keyword}`);

   let fullkeyword = keyword;
   for (let i = fullkeyword.length; i < str.length; i++) {
      fullkeyword += keyword[i % keyword.length];
   }

   ns.print(`Full Keyword: ${fullkeyword}`);

   const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;

   let answer = ``;
   for (let i = 0; i < str.length; i++) {
      const shift = chars.indexOf(str[i]);
      const end = (chars.indexOf(fullkeyword[i]) + shift) % chars.length;

      answer += chars[end];
   }
   return answer;
}