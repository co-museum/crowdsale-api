import * as logger from "firebase-functions/lib/logger";
import {Record, Number, String, Array, Static} from "runtypes";
import {Request, Response} from "express";
import {Firestore} from "firebase-admin/firestore";
import {StatusCodes} from "http-status-codes";
import {ethers} from "ethers";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";

enum Handler {
  BuyNFT = "buyNFT",
}

/**
 * Log request parameters relevant to this module
 * @param {Handler} handler function
 * @param {ClientParams} params from url
 * @param {any} body of request
 */
function logRequest(handler: Handler, params: ClientParams, body: unknown) {
  logger.log({
    handler: handler,
    params: params,
    body: body,
  });
}

/**
 * @param {Handler} handler function
 * @param {any} err to log - no matter the type
 * @param {Response} res to write to
 */
function handleError(handler: Handler, err: unknown, res: Response) {
  logger.error({
    handler: handler,
    error: err,
  });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
}

const Whitelist = Record({
  tierCode: Number,
  allocation: Number,
  addresses: Array(String),
});
type Whitelist = Static<typeof Whitelist>

const BuyNFTResponse = Record({
  proof: Array(String),
  whitelistIdx: Array(String),
  allocation: Number,
  tiercode: Number,
});
type BuyNFTResponse = Static<typeof BuyNFTResponse>;


const ClientParams = Record({
  address: String,
  batch: String,
});

type ClientParams = Static<typeof ClientParams>

/**
 * utility to check whether an array of addresses is valid and report the error in result
 * @param {Handler} handler the validation was done in
 * @param {string[]} addresses addresses to validate
 * @param {Response} res response object
 */
function validateAddresses(handler: Handler, addresses: string[], res: Response) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      logger.error({
        handler: handler,
        error: `${address} is not an address`,
      });
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({error: `${address} is not an address`});
    }
  });
}

/**
 * utility to check whether an array of addresses is valid and report the error in result
 * @param {string} address the address to get proof from
 * @param {string[]} addresses addresses to validate
 * @return {string[]} proof
 */
function getProof(address: string, addresses: string[]): string[] {
  const leaves = addresses.map((address) => ethers.utils.keccak256(address));
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, {sort: true});
  const proof = tree.getHexProof(keccak256(address));
  return proof;
}

/**
 * Admin handler class
 */
export class Client {
  /**
   * Dependency injection point
   * @param {Firestore} db firestore instance
   */
  constructor(public db: Firestore) {
    // NOTE: make sure that `this` stays bound to the object when passed as a handler
    this.buyNFT = this.buyNFT.bind(this);
  }

  /**
   * adds entire whitelist document to firestore
   * @param {Request<ClientParams>} req the whitelist to add into specified batch under specified name
   * @param {Response<Whitelist>} res the whitelist actually written to the db
   **/
  async buyNFT(
      req: Request<ClientParams>,
      res: Response
  ) {
    try {
      logRequest(Handler.BuyNFT, req.params, req.body);
      ClientParams.check(req.params);
      const whiteListDocuments = (
        await this.db.collection(req.params.batch).get()
      ).docs;

      for (let i = 0; i < whiteListDocuments.length; i++) {
        const whitelist: Whitelist = whiteListDocuments[i].data() as Whitelist;
        validateAddresses(Handler.BuyNFT, whitelist.addresses, res);
        if (whitelist.addresses.indexOf(req.params.address) != -1) {
          const buyNFTResponse: BuyNFTResponse = {
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
      handleError(Handler.BuyNFT, err, res);
    }
  }
}
