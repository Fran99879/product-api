import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock completo de @sentry/node: acá probamos NUESTRA capa (config/sentry.ts),
// no el SDK. init/captureException no deben pegarle a la red en tests.
vi.mock("@sentry/node", () => {
  const scope = {
    setTag: vi.fn(),
    setUser: vi.fn(),
    setContext: vi.fn(),
  };
  return {
    init: vi.fn(),
    captureException: vi.fn(),
    withScope: vi.fn((cb: (s: typeof scope) => void) => cb(scope)),
    __scope: scope,
  };
});

async function importFresh(dsn: string | undefined) {
  vi.resetModules();
  if (dsn === undefined) {
    delete process.env.SENTRY_DSN;
  } else {
    process.env.SENTRY_DSN = dsn;
  }
  const sentrySdk = await import("@sentry/node");
  const sentryConfig = await import("../config/sentry.js");
  return { sentrySdk, sentryConfig };
}

describe("config/sentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sin SENTRY_DSN queda deshabilitado y captureError es un no-op", async () => {
    const { sentrySdk, sentryConfig } = await importFresh(undefined);

    expect(sentryConfig.sentryEnabled).toBe(false);
    expect(sentrySdk.init).not.toHaveBeenCalled();

    sentryConfig.captureError(new Error("boom"));
    expect(sentrySdk.captureException).not.toHaveBeenCalled();
  });

  it("con SENTRY_DSN inicializa y captureError reporta con contexto", async () => {
    const { sentrySdk, sentryConfig } = await importFresh(
      "https://key@o0.ingest.sentry.io/0"
    );

    expect(sentryConfig.sentryEnabled).toBe(true);
    expect(sentrySdk.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://key@o0.ingest.sentry.io/0" })
    );

    const err = new Error("boom");
    sentryConfig.captureError(err, {
      requestId: "req-1",
      userId: "user-1",
      method: "GET",
      path: "/products",
    });

    expect(sentrySdk.captureException).toHaveBeenCalledWith(err);
    const scope = (sentrySdk as unknown as { __scope: Record<string, ReturnType<typeof vi.fn>> }).__scope;
    expect(scope.setTag).toHaveBeenCalledWith("requestId", "req-1");
    expect(scope.setUser).toHaveBeenCalledWith({ id: "user-1" });
    expect(scope.setContext).toHaveBeenCalledWith("request", {
      method: "GET",
      path: "/products",
    });
  });
});
