import {Record, Number, String, Array, Static} from "runtypes";

export const Batch = Record({
  tierCodes: Array(Number),
  allocations: Array(Number),
  merkleRoots: Array(String),
});
export type Batch = Static<typeof Batch>

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
  whitelistIdx: Number,
  allocation: Number,
  tiercode: Number,
});
export type Proof = Static<typeof Proof>;

export const Addresses = Array(String);
export type Addresses = Static<typeof Addresses>;
