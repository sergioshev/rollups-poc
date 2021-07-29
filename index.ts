import fs from "fs";
import readline from "readline";
import md5 from "md5";
import { sha512_256 } from "js-sha512"

import getCombinations from "./combinations";

let collections: any = {}
const combinations = getCombinations();

collections["collectionsMetadata"] = {}
combinations.forEach((combination: string) => {
  collections[combination] = {};
  collections["collectionsMetadata"][combination] = {};
});

function generateDocId(doc: any, combination: string): { id: string, payload: string } {
  const keys = combination.split(".");
  let payload = keys.sort().map(key => `${doc[key] || ''}`).join();
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

function buildRollups(doc: any, combinations: string[], aggFunctions: CallableFunction[]): void {
  const routes = routesToRollups(doc, combinations);
  
  routes.forEach(({ id, collection, payload }) => {
    const rollupExists = !!collections[collection][id];

    if (! rollupExists) {
      collections[collection][id] = { doc };
    }

    aggFunctions.forEach((fn) => fn(doc, collection, collections[collection][id], collections["collectionsMetadata"][collection]));
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
    const countFn = (doc, collectionName, rollup, metadata) => {
      if (!rollup.count) { rollup.count = 0 }

      rollup.count++
    };

    const maxFn = (doc, collectionName, rollup, metadata) => {
      const field = collectionName.split(".").slice(-1)[0];
      if (!metadata.max) { metadata.max = doc[field] }

      if (metadata.max < doc[field]) { metadata.max = doc[field] }
    };


    buildRollups(doc, combinations, [countFn, maxFn]);
  }
}


function top5Assets(): any[] {
  const assets = collections.asset;
  const assetsCandidates = Object.keys(assets).map((id) => ({id, count: assets[id].count, doc: assets[id].doc }));

  return assetsCandidates.sort((a, b) => b.count - a.count).slice(0, 5).map(a => [a.count, a.doc.asset]);
}

function top10DeviceRegion(): any[] {
  const deviceRegions = collections["device.region"];
  const deviceRegionsCandidates = Object.keys(deviceRegions).map((id) => ({ id, count: deviceRegions[id].count, doc: deviceRegions[id].doc }));

  return deviceRegionsCandidates.sort((a, b) => b.count - a.count).slice(0, 10).map(a => [a.count, a.doc.device, a.doc.region]);
}

function top10AssetMonth(): any[] {
  const collection = collections["asset.month"];
  const collectionCandidates = Object
    .keys(collection)
    .map((id) => ({
      id,
      count: collection[id].count,
      doc: collection[id].doc
    }))
    .filter(e => ([
      "2021-01-01",
      "2020-01-01",
      "2021-02-01",
      "2020-02-01",
      "2021-03-01",
      "2020-03-01"].includes(e.doc.month)
    ));

  return collectionCandidates
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(a => [a.count, a.doc.asset, a.doc.month]);
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
  console.log(collections["collectionsMetadata"]);
  
  console.log("top 5 by Assets");
  console.log(top5Assets())

  console.log("top 10 by Device and Region");
  console.log(top10DeviceRegion())

  console.log("top 10 by Asset and month between January and March");
  console.log(top10AssetMonth())

  console.log("top 10 by Asset and month");
  console.log(top10AssetMonth2());

})()

