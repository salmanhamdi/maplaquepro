// Cookie de session (décision Supervisor S2) : valeur opaque, préfixe __Host-, Secure, HttpOnly,
// SameSite=Lax, Path=/, aucun Domain.
export const NOM_COOKIE_SESSION = "__Host-mpp_session";

export function optionsCookieSession(expiresAt: Date) {
  return { httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: expiresAt } as const;
}

export const OPTIONS_SUPPRESSION_COOKIE = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 } as const;
