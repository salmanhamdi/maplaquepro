// G2-D12 — avoirs (arbitrage Supervisor du 15/09/2026). Montants et identifiants FICTIFS ; horodatages fixes.
import { describe, expect, it } from "vitest";
import {
  annulerCommande,
  type Avoir,
  avoirsUtilisables,
  creerAvoir,
  ecartPrixCommandePayee,
  estAvoirUtilisable,
  POLITIQUE_AVOIRS,
  recrediterAvoir,
  traiterIncident,
  utiliserAvoir,
} from "../../src/domain";

const avoir = (id = "av-1", montantTtcCentimes = 5000, createdAt = "2026-05-10T09:00:00.000Z"): Avoir => {
  const r = creerAvoir({ id, montantTtcCentimes, createdAt });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.avoir;
};
const codes = (r: { ok: boolean; violations?: { code: string }[] }) => (r.ok ? [] : r.violations!.map((v) => v.code));
const AT = "2026-06-01T09:00:00.000Z";

describe("G2-D12 — création et validité", () => {
  it("avoir TTC, valable 1 an calendaire depuis createdAt ; politique versionnée", () => {
    expect(POLITIQUE_AVOIRS).toEqual({ version: "G2-D12-2026-09-15", validiteAns: 1 });
    expect(avoir()).toEqual({
      id: "av-1",
      politiqueVersion: "G2-D12-2026-09-15",
      createdAt: "2026-05-10T09:00:00.000Z",
      expiresAt: "2027-05-10T09:00:00.000Z",
      montantInitialTtcCentimes: 5000,
      soldeTtcCentimes: 5000,
    });
  });

  it("année bissextile : créé le 29 février ⇒ expire le 28 février suivant", () => {
    expect(avoir("av-1", 100, "2028-02-29T12:00:00.000Z").expiresAt).toBe("2029-02-28T12:00:00.000Z");
    expect(avoir("av-1", 100, "2027-03-01T00:00:00.000Z").expiresAt).toBe("2028-03-01T00:00:00.000Z");
  });

  it("montant nul, négatif ou non entier ⇒ refusé", () => {
    for (const montant of [0, -1, 10.5]) expect(codes(creerAvoir({ id: "av", montantTtcCentimes: montant, createdAt: AT }))).toEqual(["MONTANT_INVALIDE"]);
  });

  it("frontière d'expiration : utilisable 1 ms avant, perdu à l'échéance exacte ; aucun renouvellement", () => {
    const a = avoir();
    expect(estAvoirUtilisable(a, "2027-05-10T08:59:59.999Z")).toBe(true);
    expect(estAvoirUtilisable(a, "2027-05-10T09:00:00.000Z")).toBe(false);
    expect(codes(utiliserAvoir({ avoirs: [a], avoirChoisiId: "av-1", montantCommandeTtcCentimes: 1000, at: "2027-05-10T09:00:00.000Z", utilisationExistante: null }))).toEqual(["AVOIR_EXPIRE"]);
  });
});

describe("G2-D12 — utilisation", () => {
  it("choix libre parmi les avoirs valides", () => {
    const avoirs = [avoir("av-1", 5000), avoir("av-2", 800), { ...avoir("av-3", 900, "2025-01-01T00:00:00.000Z") }];
    expect(avoirsUtilisables(avoirs, AT).map((a) => a.id)).toEqual(["av-1", "av-2"]);
    const r = utiliserAvoir({ avoirs, avoirChoisiId: "av-2", montantCommandeTtcCentimes: 3000, at: AT, utilisationExistante: null });
    expect(r.ok && [r.utilisation, r.resteAPayerTtcCentimes]).toEqual([{ avoirId: "av-2", consommeTtcCentimes: 800 }, 2200]);
  });

  it("un seul avoir par commande", () => {
    const r = utiliserAvoir({ avoirs: [avoir("av-2")], avoirChoisiId: "av-2", montantCommandeTtcCentimes: 3000, at: AT, utilisationExistante: { avoirId: "av-1", consommeTtcCentimes: 500 } });
    expect(codes(r)).toEqual(["UN_SEUL_AVOIR_PAR_COMMANDE"]);
  });

  it("avoir supérieur à la commande : seule la partie nécessaire est consommée ; reliquat conservé avec l'échéance originale", () => {
    const r = utiliserAvoir({ avoirs: [avoir()], avoirChoisiId: "av-1", montantCommandeTtcCentimes: 3000, at: AT, utilisationExistante: null });
    expect(r.ok && [r.avoir.soldeTtcCentimes, r.avoir.expiresAt, r.utilisation.consommeTtcCentimes, r.resteAPayerTtcCentimes]).toEqual([2000, "2027-05-10T09:00:00.000Z", 3000, 0]);
  });

  it("reliquat expiré ⇒ définitivement perdu", () => {
    const r = utiliserAvoir({ avoirs: [avoir()], avoirChoisiId: "av-1", montantCommandeTtcCentimes: 3000, at: AT, utilisationExistante: null });
    if (!r.ok) throw new Error();
    expect(estAvoirUtilisable(r.avoir, "2027-05-10T09:00:00.000Z")).toBe(false);
    expect(avoirsUtilisables([r.avoir], "2027-06-01T00:00:00.000Z")).toEqual([]);
  });

  it("avoir épuisé, inconnu ou utilisé avant sa création ⇒ refusé", () => {
    expect(codes(utiliserAvoir({ avoirs: [{ ...avoir(), soldeTtcCentimes: 0 }], avoirChoisiId: "av-1", montantCommandeTtcCentimes: 100, at: AT, utilisationExistante: null }))).toEqual(["AVOIR_EPUISE"]);
    expect(codes(utiliserAvoir({ avoirs: [avoir()], avoirChoisiId: "av-9", montantCommandeTtcCentimes: 100, at: AT, utilisationExistante: null }))).toEqual(["AVOIR_INCONNU"]);
    expect(codes(utiliserAvoir({ avoirs: [avoir()], avoirChoisiId: "av-1", montantCommandeTtcCentimes: 100, at: "2026-05-01T00:00:00.000Z", utilisationExistante: null }))).toEqual(["EVENEMENT_ANTERIEUR"]);
  });
});

describe("G2-D12 — recrédit", () => {
  it("recrédit : échéance originale conservée ; solde plafonné au montant initial", () => {
    const entame = { ...avoir(), soldeTtcCentimes: 2000 };
    const r = recrediterAvoir(entame, { avoirId: "av-1", montantTtcCentimes: 3000 });
    expect(r.ok && [r.avoir.soldeTtcCentimes, r.avoir.expiresAt]).toEqual([5000, "2027-05-10T09:00:00.000Z"]);
    expect(codes(recrediterAvoir(entame, { avoirId: "av-1", montantTtcCentimes: 3001 }))).toEqual(["RECREDIT_EXCESSIF"]);
  });

  it("recrédit d'un avoir déjà expiré : aucun renouvellement, reste inutilisable", () => {
    const r = recrediterAvoir({ ...avoir(), soldeTtcCentimes: 0 }, { avoirId: "av-1", montantTtcCentimes: 1000 });
    expect(r.ok && estAvoirUtilisable(r.avoir, "2027-06-01T00:00:00.000Z")).toBe(false);
  });
});

describe("G2-D12 — écart de prix d'une commande payée modifiée avant fabrication", () => {
  it("hausse ⇒ complément dû (TTC) avant fabrication ; avec un avoir utilisé, l'avoir n'est pas modifié", () => {
    expect(ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 12500, utilisation: null, at: AT, nouvelAvoirId: "av-n" })).toEqual({ ok: true, ecart: { type: "COMPLEMENT_DU", complementTtcCentimes: 2500 } });
    expect(ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 12500, utilisation: { avoirId: "av-1", consommeTtcCentimes: 3000 }, at: AT, nouvelAvoirId: "av-n" })).toEqual({ ok: true, ecart: { type: "COMPLEMENT_DU", complementTtcCentimes: 2500 } });
  });

  it("prix identique ⇒ aucun écart", () => {
    expect(ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 10000, utilisation: null, at: AT, nouvelAvoirId: "av-n" })).toEqual({ ok: true, ecart: { type: "AUCUN_ECART" } });
  });

  it("baisse sans avoir utilisé ⇒ nouvel avoir de la différence TTC, valable 1 an depuis sa création", () => {
    const r = ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 7000, utilisation: null, at: AT, nouvelAvoirId: "av-n" });
    expect(r.ok && r.ecart).toEqual({
      type: "RESTITUTION",
      differenceTtcCentimes: 3000,
      recredit: null,
      nouvelAvoir: { id: "av-n", politiqueVersion: "G2-D12-2026-09-15", createdAt: AT, expiresAt: "2027-06-01T09:00:00.000Z", montantInitialTtcCentimes: 3000, soldeTtcCentimes: 3000 },
      utilisation: null,
    });
  });

  it("baisse avec avoir utilisé ⇒ recrédit de la part consommée d'abord, puis nouvel avoir pour le reste", () => {
    const r = ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 7000, utilisation: { avoirId: "av-1", consommeTtcCentimes: 2000 }, at: AT, nouvelAvoirId: "av-n" });
    expect(r.ok && r.ecart.type === "RESTITUTION" && [r.ecart.recredit, r.ecart.nouvelAvoir?.montantInitialTtcCentimes, r.ecart.utilisation]).toEqual([
      { avoirId: "av-1", montantTtcCentimes: 2000 },
      1000,
      { avoirId: "av-1", consommeTtcCentimes: 0 },
    ]);
  });

  it("baisse inférieure à la part d'avoir consommée ⇒ recrédit partiel, aucun nouvel avoir", () => {
    const r = ecartPrixCommandePayee({ ancienTtcCentimes: 10000, nouveauTtcCentimes: 8500, utilisation: { avoirId: "av-1", consommeTtcCentimes: 2000 }, at: AT, nouvelAvoirId: "av-n" });
    expect(r.ok && r.ecart.type === "RESTITUTION" && [r.ecart.recredit, r.ecart.nouvelAvoir, r.ecart.utilisation]).toEqual([
      { avoirId: "av-1", montantTtcCentimes: 1500 },
      null,
      { avoirId: "av-1", consommeTtcCentimes: 500 },
    ]);
  });
});

describe("G2-D12 — annulation, échec technique et SAV", () => {
  const utilisation = { avoirId: "av-1", consommeTtcCentimes: 2000 };

  it("annulation avant fabrication ⇒ avoir utilisé recrédité ; après fabrication ⇒ aucun recrédit", () => {
    expect(annulerCommande({ moment: "avant_fabrication", utilisation })).toEqual({ recredit: { avoirId: "av-1", montantTtcCentimes: 2000 } });
    expect(annulerCommande({ moment: "apres_fabrication", utilisation })).toEqual({ recredit: null });
    expect(annulerCommande({ moment: "avant_fabrication", utilisation: null })).toEqual({ recredit: null });
  });

  it("échec technique interne, avant comme après fabrication (Q65) ⇒ recrédit + remboursement du paiement complémentaire", () => {
    for (const moment of ["avant_fabrication", "apres_fabrication"] as const) {
      expect(traiterIncident({ nature: "ECHEC_TECHNIQUE_INTERNE", moment, utilisation, paiementComplementaireTtcCentimes: 4500 })).toEqual({
        ok: true,
        traitement: { traitement: "AUTOMATIQUE", recredit: { avoirId: "av-1", montantTtcCentimes: 2000 }, remboursementPaiementComplementaireTtcCentimes: 4500 },
      });
    }
  });

  it("défaut atelier, erreur client, contestation d'un résultat conforme au BAT ⇒ SAV manuel, rien d'automatique", () => {
    for (const nature of ["DEFAUT_ATELIER", "ERREUR_CLIENT", "CONTESTATION_CONFORME_BAT"] as const) {
      for (const moment of ["avant_fabrication", "apres_fabrication"] as const) {
        expect(traiterIncident({ nature, moment, utilisation, paiementComplementaireTtcCentimes: 4500 })).toEqual({ ok: true, traitement: { traitement: "SAV_MANUEL" } });
      }
    }
  });
});
