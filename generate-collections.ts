
import { model } from "mongoose";
import { Collection } from "mongodb";

import getCombinations from "./combinations";
import getMongo from "./mongo";
import { RollupsProps, RollupsSchema, MetricsSchema, MetricsProps } from "./schemas";

async function generateRollupCollection(combination: string): Promise<Collection<RollupsProps>> {
  return model<RollupsProps>(combination, RollupsSchema).createCollection();
}

async function generateMetricCollection(name: string): Promise<Collection<MetricsProps>> {
  return model<MetricsProps>(name, MetricsSchema).createCollection();
}

async function generateCollections(): Promise<void> {
  const combinations = getCombinations();
  const mongo = await getMongo();

  await Promise.all(combinations.map(generateRollupCollection));
  await generateMetricCollection("metrics");
  await mongo.disconnect();
}

generateCollections();