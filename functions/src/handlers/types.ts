import {Record, Number, String, Array, Static} from "runtypes";

export const Sale = Record({
  batch: String,
  endTimestamp: Number,
});
export type Sale = Static<typeof Sale>;

export const Whitelist = Record({
  tierCode: Number,
  allocation: Number,
  addresses: Array(String),
});
export type Whitelist = Static<typeof Whitelist>

export const Proof = Record({
  proof: Array(String),
  whitelistIdx: Array(String),
  allocation: Number,
  tiercode: Number,
});
export type Proof = Static<typeof Proof>;

export const Addresses = Array(String);
export type Addresses = Static<typeof Addresses>

export interface Error {
  error: unknown
}
