// G2-D12 — cycle de vie du BAT (arbitrage Supervisor du 15/09/2026). Horodatages fixes : aucune lecture de l'horloge réelle.
// Identifiants de BAT et de commande FICTIFS.
import { describe, expect, it } from "vitest";
import {
  actionDue,
  ajouterAnsCalendaires,
  appliquerEvenement,
  calculerExpirationCommerciale,
  creerCycleBrouillon,
  type CycleVieBat,
  type EvenementCycleVie,
  POLITIQUE_CYCLE_VIE_BAT,
  remplacerBat,
  resoudreCorrection,
  type ResultatCycle,
} from "../../src/domain";

const cycle = (r: ResultatCycle): CycleVieBat => {
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.cycle;
};
const codes = (r: { ok: boolean; violations?: { code: string }[] }) => (r.ok ? [] : r.violations!.map((v) => v.code));
const suite = (depart: CycleVieBat, ...evenements: EvenementCycleVie[]) => evenements.reduce((c, e) => cycle(appliquerEvenement(c, e)), depart);

const D = {
  cree: "2026-03-01T10:00:00.000Z",
  valide: "2026-03-02T10:00:00.000Z",
  checkout: "2026-03-03T10:00:00.000Z",
  paye: "2026-03-04T10:00:00.000Z",
  fabrication: "2026-03-05T10:00:00.000Z",
};

const brouillon = (batId = "bat-1", at = D.cree) => cycle(creerCycleBrouillon(batId, at));
const valide = (batId = "bat-1", clientInscrit = false, validatedAt = D.valide) => suite(brouillon(batId), { type: "VALIDATION", at: validatedAt, clientInscrit });
const enAttente = (orderId = "cmd-1") => suite(valide(), { type: "DEBUT_CHECKOUT", at: D.checkout, orderId });
const payee = () => suite(enAttente(), { type: "PAIEMENT", at: D.paye });
const fabrication = () => suite(payee(), { type: "ENTREE_FABRICATION", at: D.fabrication });

describe("G2-D12 — politique versionnée", () => {
  it("durées arbitrées", () => {
    expect(POLITIQUE_CYCLE_VIE_BAT).toEqual({
      version: "G2-D12-2026-09-15",
      validiteCommercialeStandardJours: 15,
      validiteCommercialeClientInscritNonPayeJours: 7,
      retentionBrouillonJours: 7,
      retentionOrphelinJours: 30,
      suspensionCheckoutMaxJours: 7,
      conservationFabricationAns: 2,
    });
  });
});

describe("G2-D12 — validité commerciale du BAT validé", () => {
  it("15 jours exacts depuis validatedAt (jamais depuis la création du brouillon)", () => {
    const c = valide();
    expect(c.etat === "valide" && [c.validatedAt, c.profil, c.expiresAt, c.politiqueVersion]).toEqual([D.valide, "standard", "2026-03-17T10:00:00.000Z", "G2-D12-2026-09-15"]);
  });

  it("client inscrit non payé : 7 jours ; profil figé à la validation et conservé par les transitions suivantes", () => {
    const c = valide("bat-1", true);
    expect(c.etat === "valide" && [c.profil, c.expiresAt]).toEqual(["client_inscrit_non_paye", "2026-03-09T10:00:00.000Z"]);
    const checkout = suite(c, { type: "DEBUT_CHECKOUT", at: D.checkout, orderId: "cmd-1" });
    expect(checkout.etat === "commande_en_attente_paiement" && [checkout.profil, checkout.expiresAt]).toEqual(["client_inscrit_non_paye", "2026-03-09T10:00:00.000Z"]);
  });

  it("frontière exacte : aucune action 1 ms avant ; suppression due à l'échéance exacte", () => {
    expect(actionDue(valide(), "2026-03-17T09:59:59.999Z")).toEqual({ action: "AUCUNE" });
    expect(actionDue(valide(), "2026-03-17T10:00:00.000Z")).toEqual({ action: "SUPPRIMER", motif: "expiration_commerciale", echeance: "2026-03-17T10:00:00.000Z" });
  });

  it("expiration ⇒ suppression ; plus aucune transition ensuite", () => {
    const supprime = suite(valide(), { type: "CONSTAT_ECHEANCE", at: "2026-03-17T10:00:00.000Z" });
    expect(supprime).toEqual({ etat: "supprime", batId: "bat-1", politiqueVersion: "G2-D12-2026-09-15", deletedAt: "2026-03-17T10:00:00.000Z", motif: "expiration_commerciale" });
    expect(codes(appliquerEvenement(supprime, { type: "DEBUT_CHECKOUT", at: "2026-03-18T10:00:00.000Z", orderId: "cmd-1" }))).toEqual(["BAT_SUPPRIME"]);
  });

  it("checkout démarré à l'échéance exacte ⇒ refusé (BAT expiré)", () => {
    expect(codes(appliquerEvenement(valide(), { type: "DEBUT_CHECKOUT", at: "2026-03-17T10:00:00.000Z", orderId: "cmd-1" }))).toEqual(["BAT_EXPIRE"]);
  });
});

describe("G2-D12 — brouillon", () => {
  it("suppression 7 jours après la création ; frontière exacte", () => {
    expect(actionDue(brouillon(), "2026-03-08T09:59:59.999Z")).toEqual({ action: "AUCUNE" });
    expect(actionDue(brouillon(), "2026-03-08T10:00:00.000Z")).toEqual({ action: "SUPPRIMER", motif: "brouillon_expire", echeance: "2026-03-08T10:00:00.000Z" });
    expect(suite(brouillon(), { type: "CONSTAT_ECHEANCE", at: "2026-03-08T10:00:00.000Z" }).etat).toBe("supprime");
  });

  it("validation à l'échéance exacte ⇒ refusée", () => {
    expect(codes(appliquerEvenement(brouillon(), { type: "VALIDATION", at: "2026-03-08T10:00:00.000Z", clientInscrit: false }))).toEqual(["BROUILLON_EXPIRE"]);
  });

  it("modification ⇒ brouillon supprimé immédiatement et nouveau brouillon (nouvel identifiant)", () => {
    const r = remplacerBat(brouillon("bat-1"), brouillon("bat-2", "2026-03-01T12:00:00.000Z"), "2026-03-01T12:00:00.000Z");
    expect(r.ok && [r.ancien, r.nouveau.etat, r.nouveau.batId]).toEqual([
      { etat: "supprime", batId: "bat-1", politiqueVersion: "G2-D12-2026-09-15", deletedAt: "2026-03-01T12:00:00.000Z", motif: "remplacement" },
      "brouillon",
      "bat-2",
    ]);
    expect(codes(remplacerBat(brouillon("bat-1"), brouillon("bat-1"), D.valide))).toEqual(["NOUVEAU_BAT_REQUIS"]);
  });
});

describe("G2-D12 — checkout (commande PENDING_PAYMENT)", () => {
  it("startCheckout crée la commande en attente de paiement et y rattache le BAT", () => {
    const c = enAttente();
    expect(c.etat === "commande_en_attente_paiement" && [c.orderId, c.checkoutStartedAt, c.suspensionFinAt]).toEqual(["cmd-1", D.checkout, "2026-03-10T10:00:00.000Z"]);
  });

  it("expiration commerciale suspendue pendant le checkout", () => {
    const c = suite(valide("bat-1", true), { type: "DEBUT_CHECKOUT", at: "2026-03-08T10:00:00.000Z", orderId: "cmd-1" });
    // expiresAt commercial = 2026-03-09 : dépassé, mais suspendu
    expect(actionDue(c, "2026-03-12T10:00:00.000Z")).toEqual({ action: "AUCUNE" });
  });

  it("suspension de 7 jours au plus : paiement 1 ms avant accepté, à l'échéance exacte refusé", () => {
    expect(suite(enAttente(), { type: "PAIEMENT", at: "2026-03-10T09:59:59.999Z" }).etat).toBe("commande_payee");
    expect(codes(appliquerEvenement(enAttente(), { type: "PAIEMENT", at: "2026-03-10T10:00:00.000Z" }))).toEqual(["SUSPENSION_CHECKOUT_TERMINEE"]);
    expect(actionDue(enAttente(), "2026-03-10T10:00:00.000Z")).toEqual({ action: "RENDRE_ORPHELIN", echeance: "2026-03-10T10:00:00.000Z" });
  });

  it("checkout abandonné ⇒ orphelin au moment du constat, puis suppression 30 jours plus tard", () => {
    const orphelin = suite(enAttente(), { type: "CONSTAT_ECHEANCE", at: "2026-03-16T10:00:00.000Z" });
    expect(orphelin.etat === "orphelin" && [orphelin.orphanedAt, orphelin.retentionFinAt]).toEqual(["2026-03-16T10:00:00.000Z", "2026-04-15T10:00:00.000Z"]);
    expect(actionDue(orphelin, "2026-04-15T09:59:59.999Z")).toEqual({ action: "AUCUNE" });
    const supprime = suite(orphelin, { type: "CONSTAT_ECHEANCE", at: "2026-04-15T10:00:00.000Z" });
    expect(supprime.etat === "supprime" && supprime.motif).toBe("retention_orphelin_expiree");
  });
});

describe("G2-D12 — BAT orphelin", () => {
  it("orphanedAt est la nouvelle origine : l'ancien expiresAt ne provoque aucune suppression anticipée", () => {
    const orphelin = suite(payee(), { type: "ANNULATION_COMMANDE", at: "2026-03-06T10:00:00.000Z" });
    expect(orphelin.etat === "orphelin" && [orphelin.expiresAt, orphelin.retentionFinAt]).toEqual(["2026-03-17T10:00:00.000Z", "2026-04-05T10:00:00.000Z"]);
    expect(actionDue(orphelin, "2026-03-20T10:00:00.000Z")).toEqual({ action: "AUCUNE" });
  });

  it("non modifiable : pas de reprise du checkout ; toute reprise impose un nouveau BAT (ancien supprimé immédiatement)", () => {
    const orphelin = suite(enAttente(), { type: "ANNULATION_COMMANDE", at: "2026-03-06T10:00:00.000Z" });
    expect(codes(appliquerEvenement(orphelin, { type: "DEBUT_CHECKOUT", at: "2026-03-07T10:00:00.000Z", orderId: "cmd-2" }))).toEqual(["BAT_ORPHELIN_NON_REPRENABLE"]);
    const r = remplacerBat(orphelin, valide("bat-2", false, "2026-03-07T10:00:00.000Z"), "2026-03-07T10:00:00.000Z");
    expect(r.ok && [r.ancien.etat, r.nouveau.etat]).toEqual(["supprime", "valide"]);
  });
});

describe("G2-D12 — commande et fabrication", () => {
  it("annulation avant fabrication (en attente ou payée) ⇒ orphelin, rétention 30 jours", () => {
    for (const depart of [enAttente(), payee()]) {
      const c = suite(depart, { type: "ANNULATION_COMMANDE", at: "2026-03-06T10:00:00.000Z" });
      expect(c.etat === "orphelin" && c.retentionFinAt).toBe("2026-04-05T10:00:00.000Z");
    }
  });

  it("commande payée : BAT protégé, aucune suppression même après l'expiration commerciale", () => {
    expect(actionDue(payee(), "2026-06-01T10:00:00.000Z")).toEqual({ action: "AUCUNE" });
  });

  it("entrée en fabrication ⇒ conservation 2 ans calendaires depuis enteredProductionAt ; frontière exacte", () => {
    const c = fabrication();
    expect(c.etat === "fabrication" && [c.enteredProductionAt, c.conservationFinAt]).toEqual([D.fabrication, "2028-03-05T10:00:00.000Z"]);
    expect(actionDue(c, "2028-03-05T09:59:59.999Z")).toEqual({ action: "AUCUNE" });
    expect(actionDue(c, "2028-03-05T10:00:00.000Z")).toEqual({ action: "FIN_CONSERVATION", echeance: "2028-03-05T10:00:00.000Z" });
    expect(suite(c, { type: "CONSTAT_ECHEANCE", at: "2028-03-05T10:00:00.000Z" })).toEqual(c);
  });

  it("annulation après fabrication ⇒ pas d'orphelin ; conservation 2 ans inchangée ; une seule annulation", () => {
    const c = suite(fabrication(), { type: "ANNULATION_COMMANDE", at: "2026-03-07T10:00:00.000Z" });
    expect(c.etat === "fabrication" && [c.commandeAnnuleeAt, c.conservationFinAt]).toEqual(["2026-03-07T10:00:00.000Z", "2028-03-05T10:00:00.000Z"]);
    expect(codes(appliquerEvenement(c, { type: "ANNULATION_COMMANDE", at: "2026-03-08T10:00:00.000Z" }))).toEqual(["TRANSITION_INTERDITE"]);
  });

  it("année bissextile : entrée en fabrication le 29 février ⇒ fin de conservation le 28 février, deux ans plus tard", () => {
    const c = suite(
      brouillon("bat-1", "2028-02-25T08:00:00.000Z"),
      { type: "VALIDATION", at: "2028-02-26T08:00:00.000Z", clientInscrit: false },
      { type: "DEBUT_CHECKOUT", at: "2028-02-27T08:00:00.000Z", orderId: "cmd-1" },
      { type: "PAIEMENT", at: "2028-02-28T08:00:00.000Z" },
      { type: "ENTREE_FABRICATION", at: "2028-02-29T08:00:00.000Z" },
    );
    expect(c.etat === "fabrication" && c.conservationFinAt).toBe("2030-02-28T08:00:00.000Z");
    expect(ajouterAnsCalendaires("2026-02-28T00:00:00.000Z", 2)).toBe("2028-02-28T00:00:00.000Z");
    // jours exacts à travers le 29 février
    expect(calculerExpirationCommerciale("2028-02-20T00:00:00.000Z", "standard")).toBe("2028-03-06T00:00:00.000Z");
  });
});

describe("G2-D12 — modification de configuration", () => {
  it("BAT validé sans commande : nouveau BAT, ancien supprimé immédiatement", () => {
    const r = remplacerBat(valide("bat-1"), brouillon("bat-2", "2026-03-02T12:00:00.000Z"), "2026-03-02T12:00:00.000Z");
    expect(r.ok && [r.ancien.etat, r.ancien.etat === "supprime" && r.ancien.motif, r.nouveau.batId]).toEqual(["supprime", "remplacement", "bat-2"]);
  });

  it("avant fabrication (commande payée) : le nouveau BAT validé remplace l'ancien ; commande et paiement conservés", () => {
    const nouveau = valide("bat-2", false, "2026-03-06T10:00:00.000Z");
    const r = remplacerBat(payee(), nouveau, "2026-03-06T10:00:00.000Z");
    if (!r.ok) throw new Error(JSON.stringify(r.violations));
    expect(r.ancien.etat).toBe("supprime");
    expect(r.nouveau.etat === "commande_payee" && [r.nouveau.batId, r.nouveau.orderId, r.nouveau.paidAt, r.nouveau.validatedAt]).toEqual(["bat-2", "cmd-1", D.paye, "2026-03-06T10:00:00.000Z"]);
  });

  it("avant fabrication (commande en attente) : remplacement dans la commande, fenêtre de checkout inchangée", () => {
    const r = remplacerBat(enAttente(), valide("bat-2", false, "2026-03-04T10:00:00.000Z"), "2026-03-04T10:00:00.000Z");
    expect(r.ok && r.nouveau.etat === "commande_en_attente_paiement" && [r.nouveau.orderId, r.nouveau.suspensionFinAt]).toEqual(["cmd-1", "2026-03-10T10:00:00.000Z"]);
  });

  it("un brouillon ne peut pas être rattaché à une commande", () => {
    expect(codes(remplacerBat(payee(), brouillon("bat-2", "2026-03-06T10:00:00.000Z"), "2026-03-06T10:00:00.000Z"))).toEqual(["NOUVEAU_BAT_NON_VALIDE"]);
  });

  it("après fabrication : modification refusée, nouvelle commande requise ; BAT de fabrication inchangé", () => {
    const fab = fabrication();
    const avant = structuredClone(fab);
    const nouveau = valide("bat-2", false, "2026-03-06T10:00:00.000Z");
    const r = remplacerBat(fab, nouveau, "2026-03-06T10:00:00.000Z");
    expect(r.ok ? null : [codes(r), r.nouvelleCommandeRequise]).toEqual([["MODIFICATION_APRES_FABRICATION"], true]);
    expect(fab).toEqual(avant);
    // nouvelle commande avec le nouveau BAT ; l'ancienne commande continue
    const nouvelleCommande = suite(nouveau, { type: "DEBUT_CHECKOUT", at: "2026-03-06T11:00:00.000Z", orderId: "cmd-2" });
    expect(nouvelleCommande.etat === "commande_en_attente_paiement" && nouvelleCommande.orderId).toBe("cmd-2");
    expect(fab.etat === "fabrication" && [fab.batId, fab.orderId, fab.conservationFinAt]).toEqual(["bat-1", "cmd-1", "2028-03-05T10:00:00.000Z"]);
  });
});

describe("G2-D12 — corrections (validation client obligatoire)", () => {
  const propose = (batPropose: CycleVieBat, origine: "client" | "atelier" | "systeme" = "atelier") => ({ origine, batPropose });

  it("refus ⇒ BAT initial utilisable, cycle normal poursuivi", () => {
    const initial = payee();
    const r = resoudreCorrection(initial, propose(valide("bat-2", false, "2026-03-06T10:00:00.000Z")), { reponse: "refusee" });
    expect(r.ok && r.applicable).toBe(initial);
    expect(suite(initial, { type: "ENTREE_FABRICATION", at: D.fabrication }).etat).toBe("fabrication");
  });

  it("aucune correction (atelier, système ou client) acceptée sans BAT validé par le client", () => {
    for (const origine of ["atelier", "systeme", "client"] as const) {
      const r = resoudreCorrection(payee(), propose(brouillon("bat-2", "2026-03-06T10:00:00.000Z"), origine), { reponse: "acceptee", at: "2026-03-06T10:00:00.000Z" });
      expect(codes(r)).toEqual(["CORRECTION_NON_VALIDEE_PAR_CLIENT"]);
    }
  });

  it("acceptation après validation client ⇒ remplacement du BAT (avant fabrication)", () => {
    const r = resoudreCorrection(payee(), propose(valide("bat-2", false, "2026-03-06T10:00:00.000Z"), "systeme"), { reponse: "acceptee", at: "2026-03-06T10:00:00.000Z" });
    expect(r.ok && [r.applicable.batId, r.applicable.etat, r.initial.etat]).toEqual(["bat-2", "commande_payee", "supprime"]);
  });
});

describe("G2-D12 — ordre des événements et transitions impossibles", () => {
  it("événement antérieur à la dernière transition ⇒ refusé", () => {
    expect(codes(appliquerEvenement(enAttente(), { type: "PAIEMENT", at: "2026-03-02T10:00:00.000Z" }))).toEqual(["EVENEMENT_ANTERIEUR"]);
    expect(codes(remplacerBat(payee(), valide("bat-2", false, "2026-03-06T10:00:00.000Z"), "2026-03-01T10:00:00.000Z"))).toEqual(["EVENEMENT_ANTERIEUR"]);
  });

  it("transitions impossibles ⇒ TRANSITION_INTERDITE", () => {
    const cas: Array<[CycleVieBat, EvenementCycleVie]> = [
      [brouillon(), { type: "DEBUT_CHECKOUT", at: D.valide, orderId: "cmd-1" }],
      [valide(), { type: "VALIDATION", at: D.checkout, clientInscrit: false }],
      [valide(), { type: "PAIEMENT", at: D.checkout }],
      [valide(), { type: "ENTREE_FABRICATION", at: D.checkout }],
      [enAttente(), { type: "ENTREE_FABRICATION", at: D.paye }],
      [valide(), { type: "ANNULATION_COMMANDE", at: D.checkout }],
      [fabrication(), { type: "PAIEMENT", at: "2026-03-06T10:00:00.000Z" }],
    ];
    for (const [c, e] of cas) expect(codes(appliquerEvenement(c, e))).toEqual(["TRANSITION_INTERDITE"]);
  });

  it("horodatage non UTC ISO 8601 ⇒ refusé", () => {
    expect(codes(creerCycleBrouillon("bat-1", "2026-03-01"))).toEqual(["HORODATAGE_INVALIDE"]);
    expect(codes(appliquerEvenement(valide(), { type: "DEBUT_CHECKOUT", at: "2026-03-03T10:00:00+01:00", orderId: "cmd-1" }))).toEqual(["HORODATAGE_INVALIDE"]);
  });

  it("aucune mutation implicite de l'état d'entrée", () => {
    const c = valide();
    const copie = structuredClone(c);
    appliquerEvenement(c, { type: "DEBUT_CHECKOUT", at: D.checkout, orderId: "cmd-1" });
    remplacerBat(c, brouillon("bat-2", D.checkout), D.checkout);
    expect(c).toEqual(copie);
  });
});
