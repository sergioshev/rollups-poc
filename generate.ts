import faker from "faker";
import dayjs  from "dayjs";
import { FileHandle, open } from "fs/promises";

import { DIMENSIONS, DOCS_NUMBER } from "./config";

function generateDoc(): any {
  return DIMENSIONS.reduce((acc: any, dimension: string): any => {
    let value;
    let week;
    let month;

    if (["week", "month"].includes(dimension)) return acc;

    switch (dimension) {
      case "device": value = faker.vehicle.model(); break;
      case "region": value = faker.address.state(); break;
      case "asset": value = faker.commerce.department(); break;
      case "value1": value = faker.random.word(); break;
      case "value2": value = faker.random.word(); break;
      case "day":
        value = faker.date.between(new Date("2020-01-01"), new Date("2021-01-01")).toISOString().slice(0, 10);
        week = dayjs(value).startOf("week").format("YYYY-MM-DD");
        month = dayjs(value).startOf("month").format("YYYY-MM-DD");
        acc["week"] = week;
        acc["month"] = month;
        break;
    }

    acc[dimension] = value;
    return acc;
  }, {});
}

async function generateDocuments(): Promise<any> {
  const fh: FileHandle = await open("analytic-messages.jsons", "w+");
  for (let i = 0; i < DOCS_NUMBER; i++) {
    const doc = JSON.stringify(generateDoc());
    await fh.appendFile(doc + ( i+1 < DOCS_NUMBER ? "\n": ""));
  }

  fh.close();
}

generateDocuments();
