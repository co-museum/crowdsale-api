import {describe} from "mocha";
import {StatusCodes} from "http-status-codes";
import {flushDb, runTests, TestCase, TestMethod} from "./utils";
import {clientSalePath, sale, salePath, whitelist, whitelistPath} from "./constants";


// TODO test non-happy-path scenarios
// TODO test multiple allocations for single address scenario
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
    // FIXME
    // {
    //   name: "can get proof",
    //   requests: [
    //     {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
    //     {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
    //     {method: TestMethod.GET, path: `${clientSalePath}/${whitelist.addresses[0]}`},
    //   ],
    //   responses: [
    //     {code: StatusCodes.OK, body: whitelist},
    //     {code: StatusCodes.OK, body: sale},
    //     {code: StatusCodes.OK, body: {
    //       whitelistIdx: 0,
    //       allocation: whitelist.allocation,
    //       tierCode: whitelist.tierCode,
    //       proof: getProof(whitelist.addresses[0], whitelist.addresses),
    //     }},
    //   ],
    // },
  ];

  runTests(tests);

  afterEach(async () => {
    await flushDb();
  });
});
