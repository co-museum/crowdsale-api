import {describe} from "mocha";
import {StatusCodes} from "http-status-codes";
import {buildBatch, flushDb, runTests, TestCase, TestMethod} from "./utils";
import _ from "lodash";
import {
  addresses,
  addressPath,
  batchPath,
  extraAddresses,
  invalidAddresses,
  malformedTimestampSale,
  malformedTypeSale,
  sale,
  salePath,
  whitelist,
  whitelistPath,
  whitelistPath1,
} from "./constants";
import {Whitelist} from "../src/controllers/types";


describe("admin endpoints", () => {
  const tests: TestCase[] = [
    {
      name: "blocks no auth",
      requests: [{method: TestMethod.PUT, path: whitelistPath, body: whitelist}],
      responses: [{code: StatusCodes.UNAUTHORIZED}],
    },
    {
      name: "blocks wrong auth",
      requests: [{correctIdToken: false, method: TestMethod.PUT, path: whitelistPath, body: whitelist}],
      responses: [{code: StatusCodes.FORBIDDEN}],
    },
    {
      name: "can add whitelist",
      requests: [{correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist}],
      responses: [{code: StatusCodes.OK, body: whitelist}],
    },
    {
      name: "cannot add invalid whitelist",
      requests: [{correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: {} as Whitelist}],
      responses: [{code: StatusCodes.INTERNAL_SERVER_ERROR}],
    },
    {
      name: "can add addresses",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: addressPath, body: extraAddresses},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: _.concat(addresses, extraAddresses)},
      ],
    },
    {
      name: "can remove addresses",
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.DELETE, path: addressPath, body: [addresses[0]]},
      ],
      responses: [
        {code: StatusCodes.OK, body: whitelist},
        {code: StatusCodes.OK, body: addresses.slice(1)},
      ],
    },
    {
      name: "can set sale",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
      ],
      responses: [
        {code: StatusCodes.OK},
        {code: StatusCodes.OK, body: sale},
      ],
    },
    {
      name: "cannot set sale when batch is not found",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
      ],
      responses: [
        {code: StatusCodes.NOT_FOUND},
      ],
    },
    {
      name: "cannot set invalid timestamp sale",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: malformedTimestampSale},
      ],
      responses: [
        {code: StatusCodes.OK},
        {code: StatusCodes.BAD_REQUEST},
      ],
    },
    {
      name: "cannot set invalid type sale",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: malformedTypeSale},
      ],
      responses: [
        {code: StatusCodes.OK},
        {code: StatusCodes.BAD_REQUEST},
      ],
    },
    {
      name: "can get batch",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath1, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {correctIdToken: true, method: TestMethod.GET, path: batchPath},
      ],
      responses: [
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK, body: buildBatch([whitelist, whitelist])},
      ],
    },
    {
      name: "cannot get batch that does not exist",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.GET, path: batchPath},
      ],
      responses: [
        {code: StatusCodes.INTERNAL_SERVER_ERROR},
      ],
    },
    {
      name: "can remove whitelist",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: whitelist},
        {correctIdToken: true, method: TestMethod.PUT, path: whitelistPath1, body: whitelist},
        {correctIdToken: true, method: TestMethod.DELETE, path: whitelistPath},
        {correctIdToken: true, method: TestMethod.PUT, path: salePath, body: sale},
        {correctIdToken: true, method: TestMethod.GET, path: batchPath},
      ],
      responses: [
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK},
        {code: StatusCodes.OK, body: buildBatch([whitelist])},
      ],
    },
    {
      name: "cannot remove whitelist that does not exist",
      prepopulate: true,
      requests: [
        {correctIdToken: true, method: TestMethod.DELETE, path: whitelistPath},
      ],
      responses: [
        {code: StatusCodes.INTERNAL_SERVER_ERROR},
      ],
    },
    {
      name: "cannot add whitelist with invalid addresses",
      requests: [{correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: invalidAddresses}],
      responses: [{code: StatusCodes.INTERNAL_SERVER_ERROR}],
    },
    {
      name: "cannot add undefined whitelist",
      requests: [{correctIdToken: true, method: TestMethod.PUT, path: whitelistPath, body: undefined}],
      responses: [{code: StatusCodes.INTERNAL_SERVER_ERROR}],
    },
  ];

  runTests(tests);

  afterEach(async () => {
    await flushDb();
  });
});


