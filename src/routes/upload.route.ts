import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { getUploadSignature } from "../controllers/upload/upload.controller.js";

const uploadRouter = Router();

// Solo sellers/admin pueden pedir firma de subida (son los que crean productos).
uploadRouter.post(
  "/signature",
  authRequired,
  requireRoles("seller", "admin"),
  getUploadSignature
);

export default uploadRouter;
