import fs from "fs";
import readline from "readline";
import md5 from "md5";
import { sha512_256 } from "js-sha512"

import { DIMENSIONS } from "./config";

let collections: any = {}

// function generateCombinations(startingIndex: number, total: number, combination: number[] = []): number[][] {
//   const combinations: number[][] = [];
//   if (combination.length > 0) combinations.push(combination);

//   for (let j = startingIndex ; j < total ; j++) {
//     combinations.push(...generateCombinations(j+1, total, [...combination, j]));
//   }

//   return combinations;
// }

function generateCombinations2(startingIndex: number, total: number, combination: string[] = []): string[] {
  const combinations: string[] = [];

  if (combination.length > 0) combinations.push(combination.join("."));

  for (let j = startingIndex; j < total; j++) {
    combinations.push(...generateCombinations2(j + 1, total, [...combination, DIMENSIONS[j]]));
  }

  return combinations;
}

const combinations = generateCombinations2(0, DIMENSIONS.length);

combinations.forEach((combination: string) => {
  collections[combination] = { };
});

function generateDocId(doc: any, combination: string): { id: string, payload: string } {
  const keys = combination.split(".");
  let payload = keys.sort().map(key => `${doc[key]}`).join();
  payload = payload.toLowerCase();
  payload = payload.replace(/[^a-z0-9@.-]/, '');
    
  return {
    id: sha512_256(payload),  //md5(payload),
    payload
  }
}

function routesToRollups(doc: any, combinations: string[]): {
  collection: string,
  id: string,
  payload: string
}[] {
  return combinations.map(combination => ({
    ...generateDocId(doc, combination),
    collection: combination
  }));
}

function buildRollups(doc: any, combinations: string[]): void {
  const routes = routesToRollups(doc, combinations);

  routes.forEach(({ id, collection, payload }) => {
    let docRollups = collections[collection][id];

    if (!!docRollups) {
      collections[collection][id].count +=1
    } else {
      collections[collection][id] = { count: 1, payload }
    }
  })

}

async function readDocsAndBuildRollups(): Promise<void> {
  const fileStream = fs.createReadStream("analytic-messages.jsons");

  const rli = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rli) {
    const doc = JSON.parse(line)
    buildRollups(doc, combinations);
  }
}

(async function () {
  await  readDocsAndBuildRollups();
  //console.log(collections);
})()

