import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;
let adminToken: string;
let userToken: string;

describe("Admin — GET /admin/users", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    await UserMongo.deleteMany({});

    await request(app).post("/user/register").send({
      username: "user",
      email: "user-admin@test.com",
      password: "123456",
    });
    userToken = (
      await request(app).post("/user/login").send({
        email: "user-admin@test.com",
        password: "123456",
      })
    ).body.token;

    const adminReg = await request(app).post("/user/register").send({
      username: "admin",
      email: "admin-admin@test.com",
      password: "123456",
    });
    const adminId = adminReg.body.user?.id || adminReg.body.id;
    await UserMongo.findByIdAndUpdate(adminId, { role: "admin" });
    adminToken = (
      await request(app).post("/user/login").send({
        email: "admin-admin@test.com",
        password: "123456",
      })
    ).body.token;
  });

  it("sin auth devuelve 401", async () => {
    const res = await request(app).get("/admin/users");
    expect(res.status).toBe(401);
  });

  it("con user normal devuelve 403", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("como admin lista todos los usuarios sin exponer password", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const user = res.body.find((u: any) => u.email === "user-admin@test.com");
    expect(user).toMatchObject({
      username: "user",
      role: "user",
      emailVerified: false,
    });
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeDefined();
    // Nunca filtrar credenciales/tokens
    expect(user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("$2"); // hash bcrypt
  });

  // --- PATCH /admin/users/:id/role ---

  it("admin cambia el rol de un usuario a seller", async () => {
    const target = await UserMongo.findOne({ email: "user-admin@test.com" });
    const res = await request(app)
      .patch(`/admin/users/${target!._id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "seller" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("seller");
  });

  it("un user normal NO puede cambiar roles (403)", async () => {
    const target = await UserMongo.findOne({ email: "user-admin@test.com" });
    const res = await request(app)
      .patch(`/admin/users/${target!._id}/role`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
  });

  it("sin auth NO puede cambiar roles (401)", async () => {
    const target = await UserMongo.findOne({ email: "user-admin@test.com" });
    const res = await request(app)
      .patch(`/admin/users/${target!._id}/role`)
      .send({ role: "admin" });

    expect(res.status).toBe(401);
  });

  it("rol inválido devuelve 400", async () => {
    const target = await UserMongo.findOne({ email: "user-admin@test.com" });
    const res = await request(app)
      .patch(`/admin/users/${target!._id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
  });
});
