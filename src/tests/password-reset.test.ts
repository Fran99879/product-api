import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Capturamos el token crudo que se mandaría por email, sin tocar SMTP.
const sendResetMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../emails/password-reset.email.js", () => ({
  sendPasswordResetEmail: (args: { rawToken: string }) => sendResetMock(args),
}));

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;

const EMAIL = "reset@test.com";
const OLD_PASS = "oldpass1";
const NEW_PASS = "newpass1";

describe("Password reset — forgot / reset", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    sendResetMock.mockClear();
    await UserMongo.deleteMany({});
    await request(app).post("/user/register").send({
      username: "resetuser",
      email: EMAIL,
      password: OLD_PASS,
    });
  });

  it("forgot-password con email conocido → 200 y manda el email", async () => {
    const res = await request(app)
      .post("/user/forgot-password")
      .send({ email: EMAIL });
    expect(res.status).toBe(200);
    expect(sendResetMock).toHaveBeenCalledTimes(1);
    expect(sendResetMock.mock.calls[0]![0].rawToken).toBeTruthy();
  });

  it("forgot-password con email desconocido → 200 pero NO manda email (anti-enumeración)", async () => {
    const res = await request(app)
      .post("/user/forgot-password")
      .send({ email: "nope@test.com" });
    expect(res.status).toBe(200);
    expect(sendResetMock).not.toHaveBeenCalled();
  });

  it("flujo completo: forgot → reset → login con la nueva contraseña", async () => {
    await request(app).post("/user/forgot-password").send({ email: EMAIL });
    const rawToken = sendResetMock.mock.calls[0]![0].rawToken;

    const reset = await request(app)
      .post("/user/reset-password")
      .send({ token: rawToken, password: NEW_PASS });
    expect(reset.status).toBe(200);

    // Nueva contraseña anda; la vieja ya no.
    const loginNew = await request(app)
      .post("/user/login")
      .send({ email: EMAIL, password: NEW_PASS });
    expect(loginNew.status).toBe(200);

    const loginOld = await request(app)
      .post("/user/login")
      .send({ email: EMAIL, password: OLD_PASS });
    expect(loginOld.status).toBe(401);
  });

  it("reset con token inválido → 400", async () => {
    const res = await request(app)
      .post("/user/reset-password")
      .send({ token: "token-que-no-existe", password: NEW_PASS });
    expect(res.status).toBe(400);
  });

  it("el token es de un solo uso: reusarlo → 400", async () => {
    await request(app).post("/user/forgot-password").send({ email: EMAIL });
    const rawToken = sendResetMock.mock.calls[0]![0].rawToken;

    await request(app)
      .post("/user/reset-password")
      .send({ token: rawToken, password: NEW_PASS });

    const reuse = await request(app)
      .post("/user/reset-password")
      .send({ token: rawToken, password: "another1" });
    expect(reuse.status).toBe(400);
  });
});
