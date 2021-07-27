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
      collections[collection][id] = { count: 1, doc }
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


function top5Assets(): any[] {
  const assets = collections.asset;
  const assetsCandidates = Object.keys(assets).map((id) => ({id, count: assets[id].count, doc: assets[id].doc }));

  return assetsCandidates.sort((a, b) => b.count - a.count).slice(0, 5).map(a => [a.count, a.doc.asset]);
}

function top10DeviceRegion(): any[] {
  const  deviceRegions = collections["device.region"];
  const deviceRegionsCandidates = Object.keys(deviceRegions).map((id) => ({ id, count: deviceRegions[id].count, doc: deviceRegions[id].doc }));

  return deviceRegionsCandidates.sort((a, b) => b.count - a.count).slice(0, 10).map(a => [a.count, a.doc.device, a.doc.region]);
}

function top10AssetMonth(): any[] {
  const collection = collections["asset.month"];
  const collectionCandidates = Object
    .keys(collection)
    .map((id) => ({ id, count: collection[id].count, doc: collection[id].doc }))
    .filter(e => ["January", "February", "March"].includes(e.doc.month));

  return collectionCandidates.sort((a, b) => b.count - a.count).slice(0, 10).map(a => [a.count, a.doc.asset, a.doc.month]);
}

function top10AssetMonth2(): any[] {
  const collection = collections["asset.month"];
  const collectionCandidates = Object
    .keys(collection)
    .map((id) => ({ id, count: collection[id].count, doc: collection[id].doc }));

  return collectionCandidates.sort((a, b) => b.count - a.count).slice(0, 10).map(a => [a.count, a.doc.asset, a.doc.month]);
}


(async function () {
  await  readDocsAndBuildRollups();
  // console.log(collections)
  console.log("top 5 by Assets");
  console.log(top5Assets())

  console.log("top 10 by Device and Region");
  console.log(top10DeviceRegion())

  console.log("top 10 by Asset and month between January and March");
  console.log(top10AssetMonth())

  console.log("top 10 by Asset and month");
  console.log(top10AssetMonth2())
})()

