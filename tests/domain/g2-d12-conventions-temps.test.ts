// G2-D12 — conventions temporelles normatives (arbitrage Supervisor, verrouillage final) :
// 1. une échéance est atteinte à l'instant exact qui l'égale ; 2. calculs et comparaisons en UTC ;
// 3. années calendaires : même jour et même mois l'année cible, date inexistante ⇒ 28 février.
// Horodatages fixes ; aucune lecture de l'horloge réelle.
import { describe, expect, it } from "vitest";
import {
  actionDue,
  ajouterAnsCalendaires,
  ajouterJours,
  appliquerEvenement,
  calculerExpirationCommerciale,
  creerAvoir,
  creerCycleBrouillon,
  type CycleVieBat,
  echeanceAtteinte,
  estAvoirUtilisable,
  estHorodatageUtc,
  type EvenementCycleVie,
  MS_PAR_JOUR,
  type ResultatCycle,
} from "../../src/domain";

const cycle = (r: ResultatCycle): CycleVieBat => {
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.cycle;
};
const suite = (depart: CycleVieBat, ...evenements: EvenementCycleVie[]) => evenements.reduce((c, e) => cycle(appliquerEvenement(c, e)), depart);
const ecartMs = (a: string, b: string) => Date.parse(b) - Date.parse(a);

function gelerProfond<T>(v: T): T {
  if (v !== null && typeof v === "object") {
    for (const x of Object.values(v)) gelerProfond(x);
    Object.freeze(v);
  }
  return v;
}

describe("Convention 1 — échéance atteinte à l'instant exact", () => {
  it("1 ms avant : non atteinte ; à l'instant exact : atteinte ; après : atteinte", () => {
    const echeance = "2026-03-17T10:00:00.000Z";
    expect(echeanceAtteinte("2026-03-17T09:59:59.999Z", echeance)).toBe(false);
    expect(echeanceAtteinte("2026-03-17T10:00:00.000Z", echeance)).toBe(true);
    expect(echeanceAtteinte("2026-03-17T10:00:00.001Z", echeance)).toBe(true);
  });

  it("même instant écrit avec ou sans millisecondes ⇒ égalité exacte", () => {
    expect(echeanceAtteinte("2026-03-17T10:00:00Z", "2026-03-17T10:00:00.000Z")).toBe(true);
  });
});

describe("Convention 2 — UTC", () => {
  it("seuls les horodatages UTC ISO 8601 (suffixe Z) sont acceptés", () => {
    expect(estHorodatageUtc("2026-03-29T01:30:00Z")).toBe(true);
    expect(estHorodatageUtc("2026-03-29T01:30:00.000Z")).toBe(true);
    for (const refuse of ["2026-03-29T03:30:00+02:00", "2026-03-29T01:30:00", "2026-03-29"]) expect(estHorodatageUtc(refuse)).toBe(false);
    expect(cycle(creerCycleBrouillon("bat-1", "2026-03-29T01:30:00.000Z")).etat).toBe("brouillon");
    expect(creerCycleBrouillon("bat-1", "2026-03-29T03:30:00+02:00").ok).toBe(false);
  });

  it("passage à l'heure d'été (29/03/2026, Europe) : 1 jour = 24 h exactes, heure UTC inchangée", () => {
    expect(ajouterJours("2026-03-28T23:30:00.000Z", 1)).toBe("2026-03-29T23:30:00.000Z");
    expect(ecartMs("2026-03-28T23:30:00.000Z", ajouterJours("2026-03-28T23:30:00.000Z", 1))).toBe(MS_PAR_JOUR);
    const brouillonEte = cycle(creerCycleBrouillon("bat-1", "2026-03-25T08:00:00.000Z"));
    expect(brouillonEte.etat === "brouillon" && brouillonEte.retentionFinAt).toBe("2026-04-01T08:00:00.000Z");
  });

  it("passage à l'heure d'hiver (25/10/2026, Europe) : validité de 15 jours = 15 × 24 h exactes", () => {
    const expiration = calculerExpirationCommerciale("2026-10-20T08:00:00.000Z", "standard");
    expect(expiration).toBe("2026-11-04T08:00:00.000Z");
    expect(ecartMs("2026-10-20T08:00:00.000Z", expiration)).toBe(15 * MS_PAR_JOUR);
    const valide = suite(cycle(creerCycleBrouillon("bat-1", "2026-10-20T07:00:00.000Z")), { type: "VALIDATION", at: "2026-10-20T08:00:00.000Z", clientInscrit: false });
    expect(actionDue(valide, "2026-11-04T07:59:59.999Z")).toEqual({ action: "AUCUNE" });
    expect(actionDue(valide, "2026-11-04T08:00:00.000Z")).toEqual({ action: "SUPPRIMER", motif: "expiration_commerciale", echeance: "2026-11-04T08:00:00.000Z" });
  });

  it("année calendaire calculée en UTC : aucun basculement de date près de minuit", () => {
    expect(ajouterAnsCalendaires("2026-12-31T23:59:59.999Z", 1)).toBe("2027-12-31T23:59:59.999Z");
    expect(ajouterAnsCalendaires("2026-03-29T00:30:00.000Z", 2)).toBe("2028-03-29T00:30:00.000Z");
  });
});

describe("Convention 3 — années calendaires", () => {
  it("même jour et même mois ; 29 février sans équivalent ⇒ 28 février", () => {
    expect(ajouterAnsCalendaires("2028-02-29T00:00:00.000Z", 1)).toBe("2029-02-28T00:00:00.000Z");
    expect(ajouterAnsCalendaires("2028-02-29T12:34:56.789Z", 2)).toBe("2030-02-28T12:34:56.789Z");
    expect(ajouterAnsCalendaires("2028-02-29T00:00:00.000Z", 4)).toBe("2032-02-29T00:00:00.000Z");
    expect(ajouterAnsCalendaires("2027-02-28T00:00:00.000Z", 1)).toBe("2028-02-28T00:00:00.000Z");
    expect(ajouterAnsCalendaires("2027-03-01T00:00:00.000Z", 1)).toBe("2028-03-01T00:00:00.000Z");
  });

  it("avoir créé le 29 février : 1 ms avant le 28 février suivant utilisable, à l'instant exact expiré", () => {
    const r = creerAvoir({ id: "av-1", montantTtcCentimes: 1000, createdAt: "2028-02-29T00:00:00.000Z" });
    if (!r.ok) throw new Error(JSON.stringify(r.violations));
    expect(r.avoir.expiresAt).toBe("2029-02-28T00:00:00.000Z");
    expect(estAvoirUtilisable(r.avoir, "2029-02-27T23:59:59.999Z")).toBe(true);
    expect(estAvoirUtilisable(r.avoir, "2029-02-28T00:00:00.000Z")).toBe(false);
  });

  it("fabrication entrée le 29 février : suppression due au 28 février deux ans plus tard, pas 1 ms avant", () => {
    const fab = suite(
      cycle(creerCycleBrouillon("bat-1", "2028-02-25T08:00:00.000Z")),
      { type: "VALIDATION", at: "2028-02-26T08:00:00.000Z", clientInscrit: false },
      { type: "DEBUT_CHECKOUT", at: "2028-02-27T08:00:00.000Z", orderId: "cmd-1" },
      { type: "PAIEMENT", at: "2028-02-28T08:00:00.000Z" },
      { type: "ENTREE_FABRICATION", at: "2028-02-29T08:00:00.000Z" },
    );
    expect(fab.etat === "fabrication" && fab.conservationFinAt).toBe("2030-02-28T08:00:00.000Z");
    expect(actionDue(fab, "2030-02-28T07:59:59.999Z")).toEqual({ action: "AUCUNE" });
    expect(actionDue(fab, "2030-02-28T08:00:00.000Z")).toEqual({ action: "SUPPRIMER", motif: "fin_conservation_fabrication", echeance: "2030-02-28T08:00:00.000Z" });
  });
});

describe("Conventions — absence de mutation", () => {
  it("états gelés : décisions et transitions ne modifient jamais l'entrée", () => {
    const valide = gelerProfond(suite(cycle(creerCycleBrouillon("bat-1", "2028-02-29T08:00:00.000Z")), { type: "VALIDATION", at: "2028-02-29T09:00:00.000Z", clientInscrit: true }));
    const copie = structuredClone(valide);
    expect(() => actionDue(valide, "2028-03-07T09:00:00.000Z")).not.toThrow();
    const r = appliquerEvenement(valide, { type: "CONSTAT_ECHEANCE", at: "2028-03-07T09:00:00.000Z" });
    expect(r.ok && r.cycle.etat).toBe("supprime");
    expect(appliquerEvenement(valide, { type: "DEBUT_CHECKOUT", at: "2028-03-01T09:00:00.000Z", orderId: "cmd-1" }).ok).toBe(true);
    expect(valide).toEqual(copie);
  });

  it("les fonctions de temps ne modifient pas les horodatages reçus", () => {
    const origine = "2028-02-29T08:00:00.000Z";
    ajouterJours(origine, 7);
    ajouterAnsCalendaires(origine, 2);
    expect(origine).toBe("2028-02-29T08:00:00.000Z");
  });
});
