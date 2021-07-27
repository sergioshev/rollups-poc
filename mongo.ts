
import mongoose, { Mongoose } from "mongoose";

import { MONGO_URI } from "./config";

export class MongoDB {
  private connectionUri: string;
  private options: { poolSize: number };
  private mongoose: Mongoose;

  constructor(mongoose: Mongoose, connectionUri: string, options: { poolSize: number }) {
    this.mongoose = mongoose;
    this.connectionUri = connectionUri;
    this.options = { poolSize: options.poolSize };
  }

  disconnect(): Promise<void> {
    return this.mongoose.disconnect();
  }

  async connect(): Promise<void> {
    await this.mongoose
      .connect(this.connectionUri, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        poolSize: this.options.poolSize
      })
      .catch(err => {
        // TODO add health check state updated here telling that mongodb connection error
        console.error("MongoDB connection error. Please make sure MongoDB is running and mongodb env configuration valid.  ", err);
      });
  }
}

let MONGO: MongoDB;

export default async function (): Promise<MongoDB> {
  if (MONGO) return MONGO;
  MONGO = new MongoDB(mongoose, MONGO_URI, { poolSize: undefined });
  await MONGO.connect();
  if (!MONGO) throw new Error(`Can't connect to ${MONGO_URI}`);

  return MONGO;
}