// Liaison Next.js ↔ cas d'usage du compte : dépendances par requête, lecture de la session, IP cliente.
import { cookies, headers } from "next/headers";
import { baseDeDonnees } from "../db/instance";
import { journalConsole } from "./audit";
import { NOM_COOKIE_SESSION } from "./cookie-session";
import { lireConfigurationAuth } from "./environnement";
import { type ClientConnecte, type DependancesAuth, lireSession } from "./service";

export function dependancesAuth(): DependancesAuth {
  const { urlBase, envoyeur } = lireConfigurationAuth();
  return { db: baseDeDonnees(), envoyeur, journal: journalConsole, maintenant: () => new Date(), urlBase };
}

export async function jetonSessionCourant(): Promise<string | undefined> {
  return (await cookies()).get(NOM_COOKIE_SESSION)?.value;
}

export async function clientConnecte(): Promise<ClientConnecte | null> {
  const jeton = await jetonSessionCourant();
  if (!jeton) return null;
  return lireSession(dependancesAuth(), jeton);
}

// Première adresse de X-Forwarded-For : suppose que le proxy de l'hébergeur réécrit cet en-tête (À CONFIRMER).
export async function ipCliente(): Promise<string> {
  const h = await headers();
  const transmise = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return transmise || h.get("x-real-ip")?.trim() || "inconnue";
}
