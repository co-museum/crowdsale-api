import {expect} from "chai";
import {ethers} from "ethers";
import MerkleTree from "merkletreejs";
import request from "superagent";
import {Whitelist, Addresses, Sale, Batch, Proof} from "../src/controllers/types";
import {urls} from "./constants";
import config from "../../firebase.json";
import {keccak256} from "ethers/lib/utils";

export interface TestResponse {
  code: number
  body?: Whitelist | Addresses | Sale | Batch | Proof
}

export enum TestMethod {
  PUT = "PUT",
  GET = "GET",
  DELETE = "DELETE",
}

export interface TestRequest {
  path: string
  method: TestMethod
  correctIdToken?: boolean
  body?: Whitelist | Addresses | Sale
}

export interface TestCase {
  name: string
  requests: TestRequest[]
  responses: TestResponse[]
  prepopulate?: boolean
}

function merkleRootFromAddresses(addresses: string[]): string {
  const leaves = addresses.map((address) => ethers.utils.keccak256(address));
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, {sort: true});
  return tree.getHexRoot();
}

let idToken: string;
export async function getIdToken(): Promise<string> {
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

export function buildBatch(whitelists: Whitelist[]): Batch {
  const batch: Batch = {
    tierCodes: [],
    allocations: [],
    merkleRoots: [],
  };

  for (const wl of whitelists) {
    batch.tierCodes.push(wl.tierCode);
    batch.allocations.push(wl.allocation);
    batch.merkleRoots.push(merkleRootFromAddresses(wl.addresses));
  }

  return batch;
}

export function getProof(address: string, addresses: Addresses): string[] {
  const leaves = addresses.map((address) => ethers.utils.keccak256(address));
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, {sort: true});
  const proof = tree.getHexProof(keccak256(address));
  return proof;
}

async function sendRequest(testRequest: TestRequest): Promise<request.Response> {
  // NOTE: we don't want superagent to throw - we test for status codes elsewhere
  const req = request(testRequest.method, testRequest.path).type("json").ok((_) => true);
  if (testRequest.correctIdToken != undefined) {
    if (testRequest.correctIdToken) {
      req.auth(await getIdToken(), {type: "bearer"});
    } else {
      req.auth("invalidIdToken", {type: "bearer"});
    }
  }
  return req.send(testRequest.body);
}

export function runTests(tests: TestCase[]) {
  process.env.FIRESTORE_EMULATOR_HOST = `localhost:${config.emulators.firestore.port}`;

  for (const test of tests) {
    it(test.name, async () => {
      for (let i = 0; i < test.requests.length; i++) {
        const res = await sendRequest(test.requests[i]);

        if (test.responses[i]) {
          expect(res.statusCode).to.be.equal(test.responses[i].code, "unexpected response code");

          if (test.responses[i].body) {
            expect(res.body).to.be.deep.equal(test.responses[i].body, "unexpected response body");
          }
        }
      }
    });
  }
}

export async function flushDb() {
  process.env.FIRESTORE_EMULATOR_HOST = `localhost:${config.emulators.firestore.port}`;
  await request(TestMethod.DELETE, urls.flushDb).send();
}
