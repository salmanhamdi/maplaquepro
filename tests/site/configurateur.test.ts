// Configurateur v1 : catalogue de démonstration et traduction du verdict du moteur. Le moteur reste la source de vérité.
import { describe, expect, it } from "vitest";
import { ETAT_INITIAL, erreursDeSaisie, etatEtape, interpreter, lireMm, type Message, statutDepuis, TEXTES_STATUT, versConfiguration } from "../../src/components/configurateur/interpretation";
import { evaluateFabricability, proposeAlternatives, validateCatalog } from "../../src/domain";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "../../src/server/catalogue-demo";

const ids = (famille: Parameters<typeof referenceDemo>[0]) => {
  const r = referenceDemo(famille);
  return { productId: PRODUIT_DEMO, variantId: r.variantId, thicknessId: r.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO };
};
const evaluer = (etat: typeof ETAT_INITIAL) => evaluateFabricability(versConfiguration(etat, ids(etat.famille)), CATALOGUE_DEMO);

describe("catalogue de démonstration", () => {
  it("références étiquetées démonstration, une par famille, sans règle de dimensions inventée ni paramètre de fixation validé", () => {
    expect(CATALOGUE_DEMO.references.map((r) => r.family).sort()).toEqual(["plexiglass", "troglass_metallic", "trolase", "trolase_metallic"]);
    expect(CATALOGUE_DEMO.references.every((r) => r.manufacturer.etat === "DEFINIE" && r.manufacturer.valeur === "Démonstration")).toBe(true);
    for (const d of CATALOGUE_DEMO.dimensionRules) {
      expect([d.minWidthMm, d.maxWidthMm, d.minHeightMm, d.maxHeightMm].every((b) => b.etat === "SANS_OBJET")).toBe(true);
    }
    expect(CATALOGUE_DEMO.mountingRules[0]?.holeDiameterMm).toEqual({ etat: "A_VALIDER" });
    expect(CATALOGUE_DEMO.priceRules).toEqual([]);
    expect(CATALOGUE_DEMO.formats).toEqual([]);
  });

  it("structurellement cohérent : aucune violation hors propriétés de famille déjà ouvertes (épaisseurs TroGlass À VALIDER)", () => {
    expect(validateCatalog(CATALOGUE_DEMO).map((v) => v.code).filter((c) => c !== "ACTIVE_REFERENCE_WITH_PENDING_FAMILY_THICKNESSES")).toEqual([]);
  });
});

describe("configurateur — verdict du moteur", () => {
  it("Plexiglass 200 × 100 sans texte ni trou : fabricable", () => {
    const r = evaluer(ETAT_INITIAL);
    expect(r.ok).toBe(true);
  });

  it("Plexiglass 490 × 347 : fabricable (deux orientations, VR-25)", () => {
    expect(evaluer({ ...ETAT_INITIAL, largeur: "490", hauteur: "347" }).ok).toBe(true);
  });

  it("dépassement : refus VR-25 et refus machine traduits en deux messages distincts, alternatives proposées", () => {
    const etat = { ...ETAT_INITIAL, largeur: "500", hauteur: "300" };
    const r = evaluer(etat);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const messages = interpreter(r.violations, etat.famille);
    expect(messages.map((m) => m.titre)).toEqual(["Trop grande pour notre imprimante UV", "Largeur trop grande : 347 mm maximum"]);
    expect(statutDepuis(false, messages)).toBe("bloque");
    expect(proposeAlternatives(versConfiguration(etat, ids(etat.famille)), CATALOGUE_DEMO)).toEqual([
      { kind: "max_dimensions", widthMm: 347, heightMm: 490 },
      { kind: "max_dimensions", widthMm: 490, heightMm: 347 },
    ]);
  });

  it("TroLase : sur-mesure non ouvert (CR-2) traduit comme en attente, jamais comme fabricable", () => {
    const etat = { ...ETAT_INITIAL, famille: "trolase" as const };
    const r = evaluer(etat);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const messages = interpreter(r.violations, "trolase");
    expect(messages.map((m) => [m.champ, m.niveau, m.titre])).toEqual([["matiere", "validation", "Pas encore ouvert à la commande"]]);
    expect(statutDepuis(false, messages)).toBe("en_validation");
  });

  it("texte et trous : validations atelier en attente (VR-08, paramètres de perçage), messages dédoublonnés", () => {
    const etat = { ...ETAT_INITIAL, lignes: ["Atelier"], trous: 4 as const };
    const r = evaluer(etat);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const messages = interpreter(r.violations, etat.famille);
    expect(messages.map((m) => m.id).sort()).toEqual(["fixations-validation", "texte-validation"]);
    expect(messages.every((m) => m.niveau === "validation")).toBe(true);
  });

  it("TroLase 594 × 294 : borne VR-25 respectée ; 594 × 295 : hauteur trop grande", () => {
    const etat = { ...ETAT_INITIAL, famille: "trolase" as const, largeur: "594", hauteur: "295" };
    const r = evaluer(etat);
    if (r.ok) throw new Error("refus attendu");
    expect(interpreter(r.violations, "trolase").map((m) => m.titre)).toContain("Hauteur trop grande : 294 mm maximum");
  });

  it("saisie : champ vide ou non numérique signalé avant envoi ; aucune valeur arrondie", () => {
    expect(lireMm("12,5")).toBe(12.5);
    expect(lireMm("12.34")).toBe(12.34);
    expect(lireMm("")).toBeNull();
    expect(lireMm("12 mm")).toBeNull();
    expect(erreursDeSaisie({ ...ETAT_INITIAL, largeur: "" }).map((m) => m.id)).toEqual(["saisie-largeur"]);
  });

  it("texte transmis tel que saisi (normalisation par le moteur) ; aucune ligne ⇒ pas de texte", () => {
    expect(versConfiguration({ ...ETAT_INITIAL, lignes: ["  A  "] }, ids("plexiglass")).design.text?.lines).toEqual(["  A  "]);
    expect(versConfiguration({ ...ETAT_INITIAL, lignes: ["", " "] }, ids("plexiglass")).design.text).toBeNull();
  });
});

describe("configurateur — présentation (aucun état métier créé)", () => {
  const msg = (champ: Message["champ"], niveau: Message["niveau"]): Message => ({ id: `${champ}-${niveau}`, champ, niveau, titre: "t", detail: "d" });

  it("état d'étape : à corriger si un message bloquant, en attente si validation atelier, sinon selon la saisie", () => {
    expect(etatEtape("dimensions", [msg("dimensions", "bloquant"), msg("dimensions", "validation")], true)).toBe("a_corriger");
    expect(etatEtape("texte", [msg("texte", "validation")], true, true)).toBe("attente");
    expect(etatEtape("texte", [msg("dimensions", "bloquant")], false, true)).toBe("facultatif");
    expect(etatEtape("dimensions", [], false)).toBe("a_renseigner");
    expect(etatEtape("fixations", [], true)).toBe("renseigne");
  });

  it("CR-2 (TroLase) : l'étape Matière est « en attente », jamais « renseignée » comme disponible ; verdict « en attente de validation atelier »", () => {
    const etat = { ...ETAT_INITIAL, famille: "trolase" as const };
    const r = evaluer(etat);
    if (r.ok) throw new Error("refus attendu");
    const messages = interpreter(r.violations, "trolase");
    expect(etatEtape("matiere", messages, true)).toBe("attente");
    expect(TEXTES_STATUT[statutDepuis(false, messages)].titre).toBe("En attente de validation atelier");
  });

  it("textes de verdict : un titre par état affiché, « Fabricable » réservé à l'état renvoyé par le moteur", () => {
    expect(Object.keys(TEXTES_STATUT).sort()).toEqual(["bloque", "en_validation", "fabricable", "saisie", "verification"]);
    expect(TEXTES_STATUT.fabricable.titre).toBe("Fabricable");
    expect(statutDepuis(true, [])).toBe("fabricable");
    expect(statutDepuis(false, [])).toBe("en_validation");
  });
});
