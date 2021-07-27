import { DIMENSIONS } from "./config";

function generateCombinations(startingIndex: number, total: number, src: string[], combination: string[] = []): string[] {
  const combinations: string[] = [];

  if (combination.length > 0) combinations.push(combination.join("."));

  for (let j = startingIndex; j < total; j++) {
    combinations.push(...generateCombinations(j + 1, total, src,  [...combination, src[j]]));
  }

  return combinations;
}

export default function (elements: string[] = DIMENSIONS): string[] {
  return generateCombinations(0, elements.length, elements);
}