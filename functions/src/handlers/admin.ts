import {log, validateAddresses} from "./utils";
import {Sale, Whitelist, Addresses, Batch} from "./types";
import {saleCollection, saleDoc} from "./constants";
import {Record, String, Static} from "runtypes";
import {Response, Request} from "express";
import {FieldPath, Firestore} from "firebase-admin/firestore";
import {union, difference} from "lodash";
import {StatusCodes} from "http-status-codes";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";

enum Handler {
  AddWhitelist = "addWhitelist",
  RemoveWhitelist = "removeWhitelist",
  AddAddresses = "addAddresses",
  RemoveAddresses = "removeAddresses",
  SetSale = "setSale",
  GetBatch = "getBatch",
}

const Params = Record({
  batch: String,
  whitelist: String,
});
type Params = Static<typeof Params>

function getMerkleRoot(addresses: Addresses): string {
  const leaves = addresses.map((address) => keccak256(address));
  const tree = new MerkleTree(leaves, keccak256, {sort: true});
  const root = tree.getHexRoot();
  return root;
}

export class Admin {
  constructor(public db: Firestore) {
    // NOTE: make sure that `this` stays bound to the object when passed as a handler
    this.addWhitelist = this.addWhitelist.bind(this);
    this.removeWhitelist = this.removeWhitelist.bind(this);
    this.addAddresses = this.addAddresses.bind(this);
    this.removeAddresses = this.removeAddresses.bind(this);
    this.setSale = this.setSale.bind(this);
    this.getBatch = this.getBatch.bind(this);
  }

  async addWhitelist(
      req: Request<Params, Whitelist | Error, Whitelist>,
      res: Response<Whitelist | Error>
  ) {
    try {
      log({handler: Handler.AddWhitelist, body: req.body, params: req.params});
      Params.check(req.params);
      Whitelist.check(req.body);

      const whitelist = req.body;
      validateAddresses(Handler.AddWhitelist, whitelist.addresses, res);
      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.set(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Whitelist;
      Whitelist.check(updatedData);
      res.status(StatusCodes.OK).json(updatedData);
    } catch (err) {
      log({handler: Handler.AddWhitelist, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }

  async removeWhitelist(
      req: Request<Params, Params | Error>,
      res: Response<Params | Error>
  ) {
    try {
      log({handler: Handler.RemoveWhitelist, body: req.body, params: req.params});
      Params.check(req.params);
      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.delete();
      res.status(StatusCodes.OK).json(req.params);
    } catch (err) {
      log({handler: Handler.RemoveWhitelist, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }

  async addAddresses(
      req: Request<Params, Addresses | Error, Addresses>,
      res: Response<Addresses | Error>,
  ) {
    try {
      log({handler: Handler.AddAddresses, body: req.body, params: req.params});
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(Handler.AddAddresses, req.body, res);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      const old = await ref.get();
      const oldData = old.data() as Whitelist;
      Addresses.check(oldData);

      // HACK: the firestore arrayUnion is broken
      const whitelist = {addresses: union(oldData.addresses, req.body)};
      await ref.update(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Addresses;
      Addresses.check(updatedData);
      res.status(StatusCodes.OK).json(updatedData);
    } catch (err) {
      log({handler: Handler.AddAddresses, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }

  async removeAddresses(
      req: Request<Params, Addresses | Error, Addresses>,
      res: Response<Addresses | Error>,
  ) {
    try {
      log({handler: Handler.RemoveAddresses, body: req.body, params: req.params});
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(Handler.RemoveAddresses, req.body, res);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      const old = await ref.get();
      const oldData = old.data() as Whitelist;
      Addresses.check(oldData);

      // HACK: the firestore arrayRemove is broken
      const whitelist = {addresses: difference(oldData.addresses, req.body)};
      await ref.update(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Addresses;
      Addresses.check(updatedData);
      res.status(StatusCodes.OK).json(updatedData);
    } catch (err) {
      log({handler: Handler.RemoveAddresses, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }

  async setSale(
      req: Request<unknown, Sale | Error, Sale>,
      res: Response<Sale | Error>,
  ) {
    try {
      log({handler: Handler.SetSale, body: req.body});
      Sale.check(req.body);
      const ref = this.db.collection(saleCollection).doc(saleDoc);
      await ref.set(req.body);
      const updated = await ref.get();
      const data = updated.data() as Sale;
      res.status(StatusCodes.OK).json(data);
    } catch (err) {
      log({handler: Handler.SetSale, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }

  async getBatch(
      req: Request,
      res: Response<Batch | Error>,
  ) {
    try {
      log({handler: Handler.GetBatch});
      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);

      const batch: Batch = {
        allocations: [],
        tierCodes: [],
        merkleRoots: [],
      };

      await this.db.collection(sale.batch)
          .orderBy(FieldPath.documentId())
          .get()
          .then((result) => {
            result.forEach((whitelistDoc) => {
              const whitelist = whitelistDoc.data() as Whitelist;
              Whitelist.check(whitelist);
              batch.allocations.push(whitelist.allocation);
              batch.tierCodes.push(whitelist.tierCode);
              batch.merkleRoots.push(getMerkleRoot(whitelist.addresses));
            });
          });

      res.status(StatusCodes.OK).json(batch);
    } catch (err) {
      log({handler: Handler.GetBatch, error: err});
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err as Error);
    }
  }
}
