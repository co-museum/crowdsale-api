import {Record, String, Static} from "runtypes";
import {NextFunction, Request, Response} from "express";
import {Firestore, FieldPath} from "firebase-admin/firestore";
import {ethers} from "ethers";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";
import {Addresses, Proof, Sale, Whitelist} from "./types";
import {validateAddresses} from "./utils";
import {saleCollection, saleDoc} from "./constants";
import createHttpError from "http-errors";
import {FirebaseFunctionsRateLimiter, FirebaseFunctionsRateLimiterConfiguration} from "firebase-functions-rate-limiter";
import {StatusCodes} from "http-status-codes";

const Params = Record({
  address: String,
});

type Params = Static<typeof Params>

function getProof(address: string, addresses: Addresses): string[] {
  const leaves = addresses.map((address) => ethers.utils.keccak256(address));
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, {sort: true});
  const proof = tree.getHexProof(keccak256(address));
  return proof;
}

export class Client {
  private limiter: FirebaseFunctionsRateLimiter;

  constructor(private db: Firestore, rateLimitConfig: FirebaseFunctionsRateLimiterConfiguration) {
    this.limiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(rateLimitConfig, this.db);
    this.getProof = this.getProof.bind(this);
    this.getSale = this.getSale.bind(this);
  }

  async ipRateLimitMiddlware(req: Request, _: Response, next: NextFunction) {
    try {
      await this.limiter.rejectOnQuotaExceededOrRecordUsage(req.ip);
    } catch (err) {
      next(createHttpError(StatusCodes.TOO_MANY_REQUESTS, err as Error));
    }
  }

  async getProof(
      req: Request<Params, Proof | Error>,
      res: Response<Proof | Error>,
      next: NextFunction,
  ) {
    try {
      Params.check(req.params);
      const address = req.params.address.toLowerCase();
      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);

      const whitelistIds: string[] = [];
      await this.db.collection(sale.batch)
          .orderBy(FieldPath.documentId())
          .select(FieldPath.documentId())
          .get()
          .then((result) => {
            result.forEach((whitelistDoc) => {
              whitelistIds.push(whitelistDoc.id);
            });
          });

      let proof: Proof;
      await this.db.collection(sale.batch)
          .where("addresses", "array-contains", address)
          .get()
          .then((result) => {
            result.forEach((whitelistDoc) => {
              const whitelist = whitelistDoc.data() as Whitelist;
              Whitelist.check(whitelist);
              validateAddresses(whitelist.addresses);
              // NOTE: assumes user prefers higher value to higher tier in the edge case
              // where they're given enough of a lower tier to exceed the value of the next
              // tier
              if (proof == undefined || proof.allocation < whitelist.allocation) {
                proof = {
                  allocation: whitelist.allocation,
                  tiercode: whitelist.tierCode,
                  // NOTE: computationally expensive but we shouldn't have users in too many whitelists anw
                  proof: getProof(address, whitelist.addresses),
                  whitelistIdx: whitelistIds.indexOf(whitelistDoc.id),
                };
              }
            });
          });

      // NOTE: proof is set inside callback
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (proof! == undefined || proof.whitelistIdx == -1) {
        throw new createHttpError.NotFound("address not found");
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      res.json(proof!);
    } catch (err) {
      next(err);
    }
  }

  async getSale(
      _: Request<unknown, Sale | Error>,
      res: Response<Sale | Error>,
      next: NextFunction,
  ) {
    try {
      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  }
}
