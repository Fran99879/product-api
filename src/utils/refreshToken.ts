import crypto from "node:crypto";
import type { Response } from "express";

export const REFRESH_COOKIE = "refresh_token";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const isProd = process.env.NODE_ENV === "production";

/** Token opaco aleatorio (no JWT). Se guarda su hash, nunca el crudo. */
export const generateRefreshToken = () => crypto.randomBytes(32).toString("hex");

export const hashRefreshToken = (raw: string) =>
  crypto.createHash("sha256").update(raw).digest("hex");

/**
 * Setea la cookie httpOnly del refresh token.
 * `sameSite: 'lax'` alcanza cuando front y API son same-site (mismo eTLD+1, ej.
 * localhost:3001 ↔ localhost:3000). Para un deploy realmente cross-site haría
 * falta `sameSite:'none'` + `secure:true` (HTTPS).
 */
export function setRefreshCookie(res: Response, rawToken: string) {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: REFRESH_TTL_MS,
    path: "/",
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}
