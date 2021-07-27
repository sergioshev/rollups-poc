import { Schema, Document } from "mongoose";

export interface MetricMessage {
  device?: string;
  asset?: string;
  region?: string;
  value1?: string;
  value2?: string;
  day?: Date;
  week?: string;
  month?: string;
}

export type RollupFunction = {
  fnName: "count" | "avg";
  value: number;
}

export interface RollupsProps extends Document {
  rollups: RollupFunction[];
  doc: MetricMessage;
}

export interface MetricsProps extends Document {
  doc: MetricMessage;
}


export const RollupsSchema: Schema = new Schema({
  _id: { type:  String, required: true, auto: false },
  rollups: [{
    fnName: { type: String, enum: ["count", "avg"] },
    value: { type: Number }
  }],
  doc: Schema.Types.Mixed
}, {
  _id: true
});

export const MetricsSchema: Schema = new Schema({
  _id: { type: String, required: true, auto: false },
  doc: Schema.Types.Mixed
}, {
  _id: true
});