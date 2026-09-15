// Limitation de débit persistée en base (fenêtre fixe), fiable avec plusieurs processus ou redémarrages.
import { and, eq, sql } from "drizzle-orm";
import type { creerDb } from "../db/client";
import { authAttempts } from "../db/schema";
import type { Limite } from "./parametres";
import { empreinte } from "./secrets";

type Db = ReturnType<typeof creerDb>;

export async function consommerTentative(db: Db, action: string, cle: string, limite: Limite, maintenant: Date): Promise<boolean> {
  const windowStart = new Date(Math.floor(maintenant.getTime() / limite.fenetreMs) * limite.fenetreMs);
  const keyHash = empreinte(`${action}:${cle}`);
  await db
    .insert(authAttempts)
    .values({ keyHash, action, windowStart, count: 1 })
    .onDuplicateKeyUpdate({ set: { count: sql`${authAttempts.count} + 1` } });
  const [ligne] = await db
    .select({ count: authAttempts.count })
    .from(authAttempts)
    .where(and(eq(authAttempts.keyHash, keyHash), eq(authAttempts.action, action), eq(authAttempts.windowStart, windowStart)));
  return (ligne?.count ?? 0) <= limite.max;
}
