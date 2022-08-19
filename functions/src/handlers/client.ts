import {Record, String, Static} from "runtypes";
import {Request, Response} from "express";
import {Firestore} from "firebase-admin/firestore";
import {StatusCodes, ReasonPhrases} from "http-status-codes";
import {ethers} from "ethers";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";
import {Addresses, Proof, Sale, Whitelist, Error} from "./types";
import {log, validateAddresses} from "./utils";
import {saleCollection, saleDoc} from "./constants";

enum Handler {
  GetProof = "getProof",
  GetSale = "getSale",
}

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
  constructor(public db: Firestore) {
    this.getProof = this.getProof.bind(this);
  }

  async getProof(
      req: Request<Params, Proof | Error>,
      res: Response<Proof | Error>
  ) {
    try {
      log({handler: Handler.GetProof, body: req.body, params: req.params});
      Params.check(req.params);

      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);
      const whitelistRefs = await this.db.collection(sale.batch).listDocuments();
      const whitelistIds = whitelistRefs.map((it) => it.id).sort();

      let proof: Proof;
      await this.db.collection(sale.batch)
          .where("address", "array-contains", req.params.address)
          .get()
          .then((result) => {
            result.forEach((whitelistDoc) => {
              const whitelist = whitelistDoc.data() as Whitelist;
              Whitelist.check(whitelist);
              validateAddresses(Handler.GetProof, whitelist.addresses, res);
              // NOTE: assumes user prefers higher value to higher tier in the edge case
              // where they're given enough of a lower tier to exceed the value of the next
              // tier
              if (proof == undefined || proof.allocation < whitelist.allocation) {
                proof = {
                  allocation: whitelist.allocation,
                  tiercode: whitelist.tierCode,
                  // NOTE: computationally expensive but we shouldn't have users in too many whitelists anw
                  proof: getProof(req.params.address, whitelist.addresses),
                  whitelistIdx: whitelistIds.indexOf(whitelistDoc.id),
                };
              }
            });
          });


      if (proof! == undefined || proof.whitelistIdx == -1) {
        res.status(StatusCodes.NOT_FOUND).json({error: ReasonPhrases.NOT_FOUND});
      }
    } catch (err) {
      log({handler: Handler.GetProof, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
    }
  }

  async getSale(
      req: Request<unknown, Sale | Error>,
      res: Response<Sale | Error>
  ) {
    try {
      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);
      res.status(StatusCodes.OK).json(sale);
    } catch (err) {
      log({handler: Handler.GetProof, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
    }
  }
}
