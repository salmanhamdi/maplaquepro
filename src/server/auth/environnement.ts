// Configuration d'environnement du compte client, validée par Zod (§24.4).
// APP_URL fixe l'origine des liens envoyés par email : elle n'est jamais déduite de l'en-tête Host.
import path from "node:path";
import { z } from "zod";
import { EmailNonConfigure, type EnvoyeurEmail, EnvoyeurFichier, EnvoyeurMemoire } from "../email/envoi";

export class ConfigurationAuthInvalide extends Error {
  override readonly name = "ConfigurationAuthInvalide";
}

const schema = z.object({
  APP_URL: z.url({ protocol: /^https?$/ }),
  EMAIL_TRANSPORT: z.enum(["memoire", "fichier"]),
  NODE_ENV: z.string().optional(),
});

export type ConfigurationAuth = { urlBase: string; envoyeur: EnvoyeurEmail };

export function lireConfigurationAuth(env: Record<string, string | undefined> = process.env): ConfigurationAuth {
  const r = schema.safeParse(env);
  if (!r.success) {
    const champs = [...new Set(r.error.issues.map((i) => String(i.path[0])))].join(", ");
    throw new ConfigurationAuthInvalide(`Configuration du compte client invalide ou absente : ${champs}`);
  }
  const { APP_URL, EMAIL_TRANSPORT, NODE_ENV } = r.data;
  // Aucun fournisseur d'email n'est arbitré : en production, aucun envoi n'est simulé silencieusement.
  if (NODE_ENV === "production") throw new EmailNonConfigure("Aucun fournisseur d'email n'est configuré pour la production");
  const envoyeur = EMAIL_TRANSPORT === "fichier" ? new EnvoyeurFichier(path.join(process.cwd(), ".local", "outbox")) : new EnvoyeurMemoire();
  return { urlBase: new URL(APP_URL).origin, envoyeur };
}
