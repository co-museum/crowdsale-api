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
  "0x99f06c58ff3f51b3fd7e39d8a5fadd7bdd456562",
  "0x83f433e18491356ad5eb8eec683436a710735a08",
  "0x964aafa718c83df1d163580c638cfd5e6a2a0fcf",
  "0xbdf166fd508f020a3c7f6d3ba0d26c8bc174fa53",
];

export const extraAddresses = [
  "0xdbc05b1ecb4fdaef943819c0b04e9ef6df4babd6",
  "0x721b68fa152a930f3df71f54ac1ce7ed3ac5f867",
];

export const invalidAddresses = [
  "invalidAddress1",
  "invalidAddress2",
];

export const whitelist = {
  tierCode: 0,
  allocation: 40000,
  addresses: addresses,
};

export const invalidAdressesWhitelist = {
  tierCode: 0,
  allocation: 40000,
  addresses: invalidAddresses,
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
