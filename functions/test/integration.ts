import {describe, it} from "mocha";
import request from "superagent";
import config from "../../firebase.json";
import {Whitelist, Addresses, Sale, Batch} from "../src/controllers/types";
import {StatusCodes} from "http-status-codes";
import {initializeApp} from "firebase-admin/app";
import {Firestore, getFirestore} from "firebase-admin/firestore";
import {expect} from "chai";

const api = "api";
const project = "demo-test";
const region = "asia-southeast1";
const batchName = "test-batch";
const whitelistName = "test-whitelist";

const addresses = [
  "0x99F06C58fF3F51b3fd7e39d8A5FADd7BDd456562",
  "0x83F433e18491356Ad5Eb8eEc683436a710735a08",
  "0x964aAFA718C83Df1d163580c638Cfd5E6A2a0fCf",
  "0xBDF166fD508F020a3c7F6D3BA0d26C8bC174fA53",
];

// const extraAddresses = [
//   "0xDBC05B1ECB4FDAEF943819C0B04E9EF6DF4BABD6",
//   "0x721B68FA152A930F3DF71F54AC1CE7ED3AC5F867",
// ];

const whitelist = {
  tierCode: 0,
  allocation: 40000,
  addresses: addresses,
};

const urls = {
  functions: `http://localhost:${config.emulators.functions.port}/${project}/${region}/${api}`,
  auth: `http://localhost:${config.emulators.auth.port}/identitytoolkit.googleapis.com/v1`,
  // eslint-disable-next-line max-len
  flushDb: `http://localhost:${config.emulators.firestore.port}/emulator/v1/projects/${project}/databases/(default)/documents`,
};

interface TestResponse {
  code: number,
  body?: Whitelist | Addresses | Sale | Batch,
}

enum TestMethod {
  PUT = "PUT",
  GET = "GET",
  DELETE = "DELETE",
}

interface TestRequest {
  path: string
  method: TestMethod;
  correctIdToken?: boolean
  body?: Whitelist | Addresses | Sale
}

interface TestCase {
  name: string
  request: TestRequest
  response: TestResponse
  prepopulate?: boolean
  dbData?: Whitelist
}

let idToken: string;
async function getIdToken(): Promise<string> {
  if (!idToken) {
    const res = await request
        .post(`${urls.auth}/accounts:signUp`)
        .query({key: "webApiKey"})
        .type("json")
        .accept("json")
        .send({returnSecureToken: true});
    idToken = res.body.idToken;
  }
  return idToken;
}

function runTests(db: Firestore, prefix: string, tests: TestCase[]) {
  for (const test of tests) {
    it(test.name, async () => {
      if (test.prepopulate) {
        await db.collection(batchName).doc(whitelistName).set(whitelist);
      }

      const url = `${prefix}/${test.request.path}`;
      // NOTE: we don't want superagent to throw - we test for status codes elsewhere
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const req = request(test.request.method, url).type("json").ok((_) => true);
      if (test.request.correctIdToken != undefined) {
        if (test.request.correctIdToken) {
          req.auth(await getIdToken(), {type: "bearer"});
        } else {
          req.auth("invalidIdToken", {type: "bearer"});
        }
      }
      const res = await req.send(test.request.body);

      expect(res.statusCode).to.be.equal(test.response.code, "unexpected response code");

      if (test.response.body) {
        expect(res.body).to.be.deep.equal(test.response.body, "unexpected response body");
      }

      const snapshot = await db.collection(batchName).doc(whitelistName).get();
      const data = snapshot.data() as Whitelist;
      if (test.dbData) {
        expect(data).to.be.deep.equal(test.dbData, "unexpected DB state");
      } else {
        expect(data).to.be.undefined;
      }
    });
  }
}

describe("api", async () => {
  process.env.FIRESTORE_EMULATOR_HOST = `localhost:${config.emulators.firestore.port}`;
  initializeApp({projectId: project});
  const db = getFirestore();

  describe("admin endpoints", () => {
    const whitelistPath = `/whitelist/${batchName}/${whitelistName}`;
    // const addressPath = `/address/${batchName}/${whitelistName}`;
    // const salePath = "/sale";
    // const batchPath = "/batch";

    const tests: TestCase[] = [
      {
        name: "cannot add whitelist without auth",
        request: {
          method: TestMethod.PUT,
          path: whitelistPath,
          body: whitelist,
        },
        response: {code: StatusCodes.UNAUTHORIZED},
      },
      {
        name: "cannot add whitelist with wrong bearer token",
        request: {
          correctIdToken: false,
          method: TestMethod.PUT,
          path: whitelistPath,
          body: whitelist,
        },
        response: {code: StatusCodes.FORBIDDEN},
      },
      {
        name: "can add whitelist",
        request: {
          correctIdToken: true,
          method: TestMethod.PUT,
          path: whitelistPath,
          body: whitelist,
        },
        response: {
          code: StatusCodes.OK,
          body: whitelist,
        },
        dbData: whitelist,
      },
      {
        name: "can remove whitelist",
        prepopulate: true,
        request: {
          correctIdToken: true,
          method: TestMethod.DELETE,
          path: whitelistPath,
        },
        response: {
          code: StatusCodes.OK,
        },
      },
    ];

    afterEach(async () => {
      await request(TestMethod.DELETE, urls.flushDb).send();
    });

    runTests(db, `${urls.functions}/admin`, tests);
  });

  // describe("client endpoints", () => {
  // });
});


