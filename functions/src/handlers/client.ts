import * as logger from "firebase-functions/lib/logger";
import {Record, Number, String, Array, Static} from "runtypes";
import {Request, Response} from "express";
import {Firestore} from "firebase-admin/firestore";
import {StatusCodes} from "http-status-codes";
import {ethers} from "ethers";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";
import {Addresses, Proof, Sale, Whitelist} from "./types";
import {log, validateAddresses} from "./utils";
import {saleCollection, saleDoc} from "./constants";

enum Handler {
  getProof = "getProof",
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
      log({handler: Handler.getProof, body: req.body, params: req.params});
      Params.check(req.params);

      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);

      const batchSnapshot = await this.db.collection(sale.batch).get();
      const whitelistDocs = batchSnapshot.docs;

      // TODO: write as forEach
      for (let i = 0; i < whitelistDocs.length; i++) {
        const whitelist = whitelistDocs[i].data() as Whitelist;
        Whitelist.check(whitelist);
        validateAddresses(Handler.getProof, whitelist.addresses, res);
        if (whitelist.addresses.indexOf(req.params.address) != -1) {
          const buyNFTResponse: Proof = {
            allocation: whitelist.allocation,
            proof: getProof(req.params.address, whitelist.addresses),
            whitelistIdx: [i.toString()],
            tiercode: whitelist.tierCode,
          };
          console.log(buyNFTResponse);
          res.status(StatusCodes.OK).json(buyNFTResponse);
          break;
        }
      }
      res.status(StatusCodes.OK).json({});
    } catch (err) {
      handleError(Handler.getProof, err, res);
    }
  }

  // TODO: fill in
  async getSale(
      req: Request<unknown, Sale | Error>,
      res: Response<Sale | Error>
  ) {

  }
}
