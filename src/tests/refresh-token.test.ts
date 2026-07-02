import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";
import { SessionMongo } from "../models/mongo/session/session.js";

let app: any;

const EMAIL = "refresh@test.com";
const PASS = "refresh123";

/** Extrae el valor de la cookie refresh_token de un header set-cookie. */
function refreshCookie(res: any): string | null {
  const setCookie = (res.headers["set-cookie"] as string[] | undefined) ?? [];
  const c = setCookie.find((x) => x.startsWith("refresh_token="));
  if (!c) return null;
  return c.split(";")[0] ?? null; // "refresh_token=<valor>"
}

async function login() {
  return request(app).post("/user/login").send({ email: EMAIL, password: PASS });
}

describe("Refresh tokens", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    await UserMongo.deleteMany({});
    await SessionMongo.deleteMany({});
    await request(app)
      .post("/user/register")
      .send({ username: "refreshuser", email: EMAIL, password: PASS });
  });

  it("login setea una cookie refresh_token httpOnly", async () => {
    const res = await login();
    expect(res.status).toBe(200);
    const setCookie = (res.headers["set-cookie"] as string[] | undefined) ?? [];
    const c = setCookie.find((x) => x.startsWith("refresh_token="));
    expect(c).toBeTruthy();
    expect(c!.toLowerCase()).toContain("httponly");
  });

  it("refresh con cookie válida → 200, nuevo access token y cookie nueva", async () => {
    const loginRes = await login();
    const cookie = refreshCookie(loginRes)!;

    const res = await request(app).post("/user/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(refreshCookie(res)).toBeTruthy();
  });

  it("rotación: el refresh viejo deja de servir tras usarse", async () => {
    const loginRes = await login();
    const oldCookie = refreshCookie(loginRes)!;

    const first = await request(app)
      .post("/user/refresh")
      .set("Cookie", oldCookie);
    expect(first.status).toBe(200);

    // Reusar el token viejo (ya rotado) → 401.
    const reuse = await request(app)
      .post("/user/refresh")
      .set("Cookie", oldCookie);
    expect(reuse.status).toBe(401);
  });

  it("refresh sin cookie → 401", async () => {
    const res = await request(app).post("/user/refresh");
    expect(res.status).toBe(401);
  });

  it("logout invalida la sesión: refresh posterior → 401", async () => {
    const loginRes = await login();
    const cookie = refreshCookie(loginRes)!;

    const out = await request(app).post("/user/logout").set("Cookie", cookie);
    expect(out.status).toBe(200);

    const res = await request(app).post("/user/refresh").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });

  it("GET /sessions lista las sesiones y marca la actual", async () => {
    const loginRes = await login();
    const cookie = refreshCookie(loginRes)!;
    const token = loginRes.body.token;

    const res = await request(app)
      .get("/user/sessions")
      .set("Cookie", cookie)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((s: any) => s.current)).toBe(true);
  });

  it("DELETE /sessions revoca las demás sesiones (deja la actual)", async () => {
    // Dos logins = dos sesiones.
    const a = await login();
    const b = await login();
    const cookieB = refreshCookie(b)!;
    const tokenB = b.body.token;

    const del = await request(app)
      .delete("/user/sessions")
      .set("Cookie", cookieB)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(del.status).toBe(200);

    // La sesión A quedó revocada.
    const cookieA = refreshCookie(a)!;
    const refreshA = await request(app)
      .post("/user/refresh")
      .set("Cookie", cookieA);
    expect(refreshA.status).toBe(401);

    // La sesión B (actual) sigue viva.
    const refreshB = await request(app)
      .post("/user/refresh")
      .set("Cookie", cookieB);
    expect(refreshB.status).toBe(200);
  });
});
