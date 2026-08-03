import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";

// Mockeamos el verificador de Google: no tocamos la red ni necesitamos un
// ID Token real. Controlamos el payload por test.
const verifyMock = vi.fn();
vi.mock("../config/google.js", () => ({
  googleEnabled: true,
  verifyGoogleIdToken: (token: string) => verifyMock(token),
}));

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;

const googlePayload = (over: Record<string, unknown> = {}) => ({
  sub: "google-sub-123",
  email: "guser@gmail.com",
  email_verified: true,
  name: "G User",
  ...over,
});

describe("Google OAuth — POST /user/google", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    verifyMock.mockReset();
    await UserMongo.deleteMany({});
  });

  it("registra automáticamente un usuario nuevo y devuelve token", async () => {
    verifyMock.mockResolvedValue(googlePayload());

    const res = await request(app).post("/user/google").send({ idToken: "x" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("guser@gmail.com");
    expect(res.body.user.role).toBe("user");

    const doc = await UserMongo.findOne({ email: "guser@gmail.com" });
    expect(doc?.get("provider")).toBe("google");
    expect(doc?.get("providerId")).toBe("google-sub-123");
    expect(doc?.get("emailVerified")).toBe(true);
  });

  it("segunda vez con el mismo providerId → login sin duplicar", async () => {
    verifyMock.mockResolvedValue(googlePayload());
    await request(app).post("/user/google").send({ idToken: "x" });
    const res2 = await request(app).post("/user/google").send({ idToken: "x" });

    expect(res2.status).toBe(200);
    expect(await UserMongo.countDocuments({ email: "guser@gmail.com" })).toBe(1);
  });

  it("vincula una cuenta local existente con el mismo email (y la deja verificada)", async () => {
    await UserMongo.create({
      username: "local",
      email: "guser@gmail.com",
      password: await bcrypt.hash("secret1", 10),
      provider: "local",
      emailVerified: false,
    });

    verifyMock.mockResolvedValue(googlePayload());
    const res = await request(app).post("/user/google").send({ idToken: "x" });

    expect(res.status).toBe(200);
    const doc = await UserMongo.findOne({ email: "guser@gmail.com" });
    expect(doc?.get("provider")).toBe("google");
    expect(doc?.get("providerId")).toBe("google-sub-123");
    // Google ya verificó el email → la cuenta local queda verificada.
    expect(doc?.get("emailVerified")).toBe(true);
    expect(await UserMongo.countDocuments({ email: "guser@gmail.com" })).toBe(1);
  });

  it("rechaza un token inválido (401)", async () => {
    verifyMock.mockRejectedValue(new Error("invalid"));
    const res = await request(app).post("/user/google").send({ idToken: "bad" });
    expect(res.status).toBe(401);
  });

  it("rechaza email NO verificado por Google (401, anti account-takeover)", async () => {
    verifyMock.mockResolvedValue(googlePayload({ email_verified: false }));
    const res = await request(app).post("/user/google").send({ idToken: "x" });
    expect(res.status).toBe(401);
    expect(await UserMongo.countDocuments()).toBe(0);
  });

  it("valida el body sin idToken (400)", async () => {
    const res = await request(app).post("/user/google").send({});
    expect(res.status).toBe(400);
  });

  it("una cuenta de Google (sin contraseña) NO puede usar el login tradicional", async () => {
    // Se crea la cuenta vía Google (sin contraseña).
    verifyMock.mockResolvedValue(googlePayload());
    await request(app).post("/user/google").send({ idToken: "x" });

    // Intentar login con email+contraseña → credenciales inválidas (401).
    const res = await request(app)
      .post("/user/login")
      .send({ email: "guser@gmail.com", password: "cualquier-cosa" });

    expect(res.status).toBe(401);
  });
});
