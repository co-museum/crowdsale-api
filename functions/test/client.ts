import {describe} from "mocha";
import {StatusCodes} from "http-status-codes";
import {flushDb, getProof, runTests, TestCase, TestMethod} from "./utils";
import {clientSalePath, extraAddresses,
  proofPath, sale, salePath, whitelist, whitelistPath, whitelistWithLowerAllocation} from "./constants";


// TODO test non-happy-path scenarios
describe("client endpoints", () => {
  const tests: TestCase[] = [
    {
      name: "can get sale",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {method: TestMethod.GET, path: clientSalePath},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: sale},
        {code: StatusCodes.OK, body: sale},
      ],
    },
    {
      name: "cannot get sale when it is not set",
      requests: [
        {method: TestMethod.GET, path: clientSalePath},
      ],
      responses: [
        {code: StatusCodes.INTERNAL_SERVER_ERROR},
      ],
    },
    {
      name: "can get proof of address in whitelist",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {method: TestMethod.GET, path: `${proofPath}/${whitelist.addresses[0]}`},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: sale},
        {code: StatusCodes.OK, body: {
          whitelistIdx: 0,
          allocation: whitelist.allocation,
          tiercode: whitelist.tierCode,
          proof: getProof(whitelist.addresses[0], whitelist.addresses),
        }},
      ],
    },

    {
      name: "can get proof of higher tier whitelist when there are addresses shared amongst whitelists in a batch",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelistWithLowerAllocation},
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {method: TestMethod.GET, path: `${proofPath}/${whitelist.addresses[0]}`},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelistWithLowerAllocation},
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: sale},
        {code: StatusCodes.OK, body: {
          whitelistIdx: 0,
          allocation: whitelist.allocation,
          tiercode: whitelist.tierCode,
          proof: getProof(whitelist.addresses[0], whitelist.addresses),
        }},
      ],
    },

    {
      name: "cannot get proof of address not in whitelist",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {method: TestMethod.GET, path: `${proofPath}/${extraAddresses[0]}`},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: sale},
        {code: StatusCodes.NOT_FOUND, body: {message: "address not found"}},
      ],
    },
  ];
  runTests(tests);

  afterEach(async () => {
    await flushDb();
  });
});
