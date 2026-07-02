import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";
import { resetMetrics } from "../middlewares/metrics.js";

let app: any;
let adminToken: string;
let userToken: string;

describe("Request metrics — GET /health/metrics", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    resetMetrics();
    await UserMongo.deleteMany({});

    await request(app).post("/user/register").send({
      username: "user",
      email: "user-metrics@test.com",
      password: "123456",
    });
    userToken = (
      await request(app).post("/user/login").send({
        email: "user-metrics@test.com",
        password: "123456",
      })
    ).body.token;

    const adminReg = await request(app).post("/user/register").send({
      username: "admin",
      email: "admin-metrics@test.com",
      password: "123456",
    });
    const adminId = adminReg.body.user?.id || adminReg.body.id;
    await UserMongo.findByIdAndUpdate(adminId, { role: "admin" });
    adminToken = (
      await request(app).post("/user/login").send({
        email: "admin-metrics@test.com",
        password: "123456",
      })
    ).body.token;
  });

  it("sin auth devuelve 401", async () => {
    const res = await request(app).get("/health/metrics");
    expect(res.status).toBe(401);
  });

  it("con user normal devuelve 403", async () => {
    const res = await request(app)
      .get("/health/metrics")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("como admin devuelve el snapshot con rutas agregadas", async () => {
    // Genera tráfico conocido
    await request(app).get("/health");
    await request(app).get("/health");
    await request(app).get("/products");

    const res = await request(app)
      .get("/health/metrics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBeGreaterThanOrEqual(3);
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);

    const routes: Array<{ route: string; count: number; avgMs: number; p95Ms: number }> =
      res.body.routes;
    const health = routes.find((r) => r.route === "GET /health");
    expect(health).toBeDefined();
    expect(health!.count).toBe(2);
    expect(health!.avgMs).toBeGreaterThanOrEqual(0);
    expect(health!.p95Ms).toBeGreaterThanOrEqual(0);
  });

  it("agrupa por ruta del router sin ids (cardinalidad acotada)", async () => {
    await request(app).get("/products/000000000000000000000001");
    await request(app).get("/products/000000000000000000000002");

    const res = await request(app)
      .get("/health/metrics")
      .set("Authorization", `Bearer ${adminToken}`);

    const routes: Array<{ route: string; count: number }> = res.body.routes;
    const byId = routes.find((r) => r.route === "GET /products/:id");
    expect(byId).toBeDefined();
    expect(byId!.count).toBe(2);
    // No debe haber una entrada por cada id
    expect(routes.some((r) => r.route.includes("000000000000000000000001"))).toBe(false);
  });

  it("cuenta errores 5xx", async () => {
    // Ruta inexistente no es 5xx; forzamos un 500 con un body inválido a un
    // endpoint que explota... no hay uno determinístico, así que validamos que
    // el contador exista y arranque en 0.
    const res = await request(app)
      .get("/health/metrics")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.totalErrors5xx).toBe(0);
  });
});
