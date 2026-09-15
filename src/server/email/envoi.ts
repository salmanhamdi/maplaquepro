// Adaptateur d'envoi d'email. Aucun fournisseur n'est arbitré en S2 : seuls une boîte en mémoire (tests)
// et une boîte fichier locale (développement) existent ; en production l'envoi est refusé explicitement.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type MessageEmail = { a: string; sujet: string; texte: string };

export interface EnvoyeurEmail {
  envoyer(message: MessageEmail): Promise<void>;
}

export class EnvoyeurMemoire implements EnvoyeurEmail {
  readonly envoyes: MessageEmail[] = [];
  async envoyer(message: MessageEmail) {
    this.envoyes.push(message);
  }
}

export class EnvoyeurFichier implements EnvoyeurEmail {
  constructor(private readonly dossier: string) {}
  async envoyer(message: MessageEmail) {
    await mkdir(this.dossier, { recursive: true });
    const nom = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}.txt`;
    await writeFile(path.join(this.dossier, nom), `À : ${message.a}\nSujet : ${message.sujet}\n\n${message.texte}\n`, "utf8");
  }
}

export class EmailNonConfigure extends Error {
  override readonly name = "EmailNonConfigure";
}
