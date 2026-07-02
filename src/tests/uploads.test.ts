import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Mock del config de Cloudinary: folder fijo y `destroy` espiable, así los
// tests no tocan la red ni dependen de credenciales reales.
const destroyMock = vi.fn();
vi.mock("../config/cloudinary.js", () => ({
  CLOUDINARY_FOLDER: "marketplace/products",
  cloudinary: {
    uploader: { destroy: (...args: unknown[]) => destroyMock(...args) },
  },
}));

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;
let sellerToken: string;
let userToken: string;

describe("Uploads — DELETE /uploads", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    destroyMock.mockReset();
    destroyMock.mockResolvedValue({ result: "ok" });
    await UserMongo.deleteMany({});

    await request(app).post("/user/register").send({
      username: "user",
      email: "user-uploads@test.com",
      password: "123456",
    });
    userToken = (
      await request(app).post("/user/login").send({
        email: "user-uploads@test.com",
        password: "123456",
      })
    ).body.token;

    const sellerReg = await request(app).post("/user/register").send({
      username: "seller",
      email: "seller-uploads@test.com",
      password: "123456",
    });
    const sellerId = sellerReg.body.user?.id || sellerReg.body.id;
    await UserMongo.findByIdAndUpdate(sellerId, { role: "seller" });
    sellerToken = (
      await request(app).post("/user/login").send({
        email: "seller-uploads@test.com",
        password: "123456",
      })
    ).body.token;
  });

  it("rechaza sin auth (401)", async () => {
    const res = await request(app)
      .delete("/uploads")
      .send({ publicId: "marketplace/products/abc" });
    expect(res.status).toBe(401);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("rechaza a un user normal (403)", async () => {
    const res = await request(app)
      .delete("/uploads")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ publicId: "marketplace/products/abc" });
    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("valida body sin publicId (400)", async () => {
    const res = await request(app)
      .delete("/uploads")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("bloquea public_id fuera del folder permitido (403) sin llamar a Cloudinary", async () => {
    const res = await request(app)
      .delete("/uploads")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ publicId: "otra-cuenta/secreto" });
    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("borra un asset del folder como seller (200)", async () => {
    const res = await request(app)
      .delete("/uploads")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ publicId: "marketplace/products/abc123" });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe("ok");
    expect(destroyMock).toHaveBeenCalledWith("marketplace/products/abc123");
  });
});
