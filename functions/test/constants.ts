import config from "../../firebase.json";

export const api = "api";
export const project = "demo-test";
export const region = "asia-southeast1";
export const batchName = "test-batch";
export const whitelistName = "test-whitelist";
export const whitelistName1 = "test-whitelist-1";
export const urls = {
  functions: `http://localhost:${config.emulators.functions.port}/${project}/${region}/${api}`,
  auth: `http://localhost:${config.emulators.auth.port}/identitytoolkit.googleapis.com/v1`,
  // eslint-disable-next-line max-len
  flushDb: `http://localhost:${config.emulators.firestore.port}/emulator/v1/projects/${project}/databases/(default)/documents`,
};
export const whitelistPath = `${urls.functions}/admin/whitelist/${batchName}/${whitelistName}`;
export const whitelistPath1 = `${urls.functions}/admin/whitelist/${batchName}/${whitelistName1}`;
export const addressPath = `${urls.functions}/admin/address/${batchName}/${whitelistName}`;
export const salePath = `${urls.functions}/admin/sale`;
export const batchPath = `${urls.functions}/admin/batch`;
export const clientSalePath = `${urls.functions}/client/sale`;
export const proofPath = `${urls.functions}/client/proof`;

export const addresses = [
  "0x99F06C58fF3F51b3fd7e39d8A5FADd7BDd456562",
  "0x83F433e18491356Ad5Eb8eEc683436a710735a08",
  "0x964aAFA718C83Df1d163580c638Cfd5E6A2a0fCf",
  "0xBDF166fD508F020a3c7F6D3BA0d26C8bC174fA53",
];

export const extraAddresses = [
  "0xDBC05B1ECB4FDAEF943819C0B04E9EF6DF4BABD6",
  "0x721B68FA152A930F3DF71F54AC1CE7ED3AC5F867",
];

export const whitelist = {
  tierCode: 0,
  allocation: 40000,
  addresses: addresses,
};

export const sale = {
  type: "pre-sale",
  batch: batchName,
  startTimestamp: 0,
  endTimestamp: 1,
};

export const malformedTimestampSale = {
  type: "first-come",
  batch: batchName,
  startTimestamp: 1,
  endTimestamp: 0,
};

export const malformedTypeSale = {
  type: "foo",
  batch: batchName,
  startTimestamp: 1,
  endTimestamp: 0,
};
