import {describe, it} from "mocha";
import request from "superagent";
import config from "../../firebase.json";
import {Whitelist, Addresses, Sale, Batch} from "../src/controllers/types";
import {StatusCodes} from "http-status-codes";
import {initializeApp} from "firebase-admin/app";
import {Firestore, getFirestore} from "firebase-admin/firestore";
import {expect} from "chai";

const api = "api";
// const webApiKey = "test";
const project = "demo-test";
const batchName = "test-batch";
const whitelistName = "test-whitelist";

const addresses = [
  "0x99F06C58fF3F51b3fd7e39d8A5FADd7BDd456562",
  "0x83F433e18491356Ad5Eb8eEc683436a710735a08",
  "0x964aAFA718C83Df1d163580c638Cfd5E6A2a0fCf",
  "0xBDF166fD508F020a3c7F6D3BA0d26C8bC174fA53",
];

const whitelist = {
  tierCode: 0,
  allocation: 40000,
  addresses: addresses,
};

const urls = {
  functions: `http://localhost:${config.emulators.functions.port}/asia-southeast1-${project}.cloudfunctions.net/${api}`,
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
  idToken?: string
  body?: Whitelist | Addresses | Sale
}

interface TestCase {
  name: string
  request: TestRequest
  response: TestResponse
  prepopulate?: boolean
  dbData?: Whitelist
}

function runTests(db: Firestore, prefix: string, tests: TestCase[]) {
  for (const test of tests) {
    it(test.name, async () => {
      if (test.prepopulate) {
        await db.collection(batchName).doc(whitelistName).set(whitelist);
      }

      const url = new URL(test.request.path, prefix).href;
      console.log(url);
      const req = request(test.request.method, url).type("json");
      if (test.request.idToken) {
        req.auth(test.request.idToken, {type: "bearer"});
      }
      const res = await req.send(test.request.body);

      expect(res.statusCode).to.be.equal(test.response.code, "unexpected response code");

      if (test.response.body) {
        expect(res.body).to.be.equal(test.response.body, "unexpected response body");
      }

      if (test.dbData) {
        const snapshot = await db.collection(batchName).doc(whitelistName).get();
        const data = snapshot.data() as Whitelist;
        expect(data).to.be.equal(test.dbData, "unexpected DB state");
      }
    });
  }
}

describe("api", () => {
  process.env.FIRESTORE_EMULATOR_HOST = `localhost:${config.emulators.firestore.port}`;
  initializeApp({projectId: project});
  const db = getFirestore();

  describe("admin endpoints", () => {
    // let idToken: string;

    const whitelistPath = `/whitelist/${batchName}/${whitelistName}`;
    // const addressPath = `/address/${batchName}/${whitelistName}`;
    // const salePath = "/sale";
    // const batchPath = "/batch";

    const tests: TestCase[] = [
      {
        name: "cannot add whitelist without auth",
        response: {code: StatusCodes.UNAUTHORIZED},
        request: {
          method: TestMethod.PUT,
          path: whitelistPath,
          body: whitelist,
        },
      },
    ];

    // before(async () => {
    //   request(urls.auth)
    //       .get("accounts:signUp")
    //       .query({key: webApiKey})
    //       .then((res) => {
    //         idToken = res.body.idToken;
    //       });
    // });

    afterEach(async () => {
      await request(TestMethod.DELETE, urls.flushDb).send();
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    runTests(db, new URL("admin", urls.functions).href, tests);
  });

  // describe("client endpoints", () => {
  // });
});


