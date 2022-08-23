import express, {Router} from "express";
import {Firestore} from "firebase-admin/firestore";
import {Admin} from "../controllers/admin";
import {authMiddleware} from "../middleware";

export default function getAdminRouter(db: Firestore): Router {
  const adminRouter = express.Router();
  const whitelistRouter = express.Router();
  const addressRouter = express.Router();
  const admin = new Admin(db);

  whitelistRouter.put("/:batch/:whitelist", admin.addWhitelist);
  whitelistRouter.delete("/:batch/:whitelist", admin.removeWhitelist);
  addressRouter.put("/:batch/:whitelist", admin.addAddresses);
  addressRouter.delete("/:batch/:whitelist", admin.removeAddresses);

  adminRouter.use(authMiddleware);
  adminRouter.use("/whitelist", whitelistRouter);
  adminRouter.use("/address", addressRouter);
  adminRouter.put("/sale", admin.setSale);
  adminRouter.get("/batch", admin.getBatch);

  return adminRouter;
}
