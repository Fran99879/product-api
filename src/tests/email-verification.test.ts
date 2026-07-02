import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Capturamos el token crudo de verificación, sin tocar SMTP.
const sendVerifyMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../emails/email-verification.email.js", () => ({
  sendEmailVerificationEmail: (args: { rawToken: string }) =>
    sendVerifyMock(args),
}));

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;

const EMAIL = "verify@test.com";
const PASS = "verify123";

async function register() {
  return request(app)
    .post("/user/register")
    .send({ username: "verifyuser", email: EMAIL, password: PASS });
}

describe("Email verification", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    sendVerifyMock.mockClear();
    await UserMongo.deleteMany({});
  });

  it("register manda el email de verificación y arranca emailVerified:false", async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.user.emailVerified).toBe(false);
    expect(sendVerifyMock).toHaveBeenCalledTimes(1);
    expect(sendVerifyMock.mock.calls[0]![0].rawToken).toBeTruthy();
  });

  it("verify-email con token válido → 200 y profile pasa a emailVerified:true", async () => {
    const reg = await register();
    const token = sendVerifyMock.mock.calls[0]![0].rawToken;

    const verify = await request(app)
      .post("/user/verify-email")
      .send({ token });
    expect(verify.status).toBe(200);

    const profile = await request(app)
      .get("/user/profile")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(profile.body.emailVerified).toBe(true);
  });

  it("verify-email con token inválido → 400", async () => {
    await register();
    const res = await request(app)
      .post("/user/verify-email")
      .send({ token: "no-existe" });
    expect(res.status).toBe(400);
  });

  it("el token de verificación es de un solo uso", async () => {
    await register();
    const token = sendVerifyMock.mock.calls[0]![0].rawToken;

    await request(app).post("/user/verify-email").send({ token });
    const reuse = await request(app)
      .post("/user/verify-email")
      .send({ token });
    expect(reuse.status).toBe(400);
  });

  it("resend-verification (auth) manda un token nuevo que verifica OK", async () => {
    const reg = await register();
    sendVerifyMock.mockClear();

    const resend = await request(app)
      .post("/user/resend-verification")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(resend.status).toBe(200);
    const newToken = sendVerifyMock.mock.calls[0]![0].rawToken;

    const verify = await request(app)
      .post("/user/verify-email")
      .send({ token: newToken });
    expect(verify.status).toBe(200);
  });

  it("resend sin auth → 401", async () => {
    const res = await request(app).post("/user/resend-verification");
    expect(res.status).toBe(401);
  });

  it("resend cuando ya está verificado → 400", async () => {
    const reg = await register();
    const token = sendVerifyMock.mock.calls[0]![0].rawToken;
    await request(app).post("/user/verify-email").send({ token });

    const resend = await request(app)
      .post("/user/resend-verification")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(resend.status).toBe(400);
  });
});
