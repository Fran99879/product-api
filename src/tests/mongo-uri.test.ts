import { describe, it, expect, vi, afterEach } from "vitest";

// Testea solo la resolución de URI (sin conectar a nada).
import { resolveMongoUri } from "../config/db/mongodb.js";
import { ENV } from "../config/env.js";

afterEach(() => {
  vi.unstubAllEnvs();
  ENV.MONGO_URI_TEST = undefined;
});

describe("resolveMongoUri", () => {
  it("en test deriva el nombre de la DB con sufijo -test (query params intactos)", () => {
    // vitest corre con NODE_ENV=test, y MONGO_URI real viene del .env
    const uri = resolveMongoUri();
    const url = new URL(uri);
    expect(url.pathname.endsWith("-test")).toBe(true);
    // No pierde el resto de la URI original
    const original = new URL(ENV.MONGO_URI);
    expect(url.host).toBe(original.host);
    expect(url.search).toBe(original.search);
  });

  it("prioriza MONGO_URI_TEST si está seteada", () => {
    ENV.MONGO_URI_TEST = "mongodb://localhost:27017/otra-db";
    expect(resolveMongoUri()).toBe("mongodb://localhost:27017/otra-db");
  });

  it("fuera de test usa MONGO_URI tal cual", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveMongoUri()).toBe(ENV.MONGO_URI);
  });
});
