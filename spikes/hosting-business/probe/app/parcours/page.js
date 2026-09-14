// C8 complémentaire — page représentative du parcours MaPlaquePro (SONDE, non produit).
// Le produit n'existant pas encore, cette page reproduit la charge serveur typique d'une étape de configuration :
// lecture base de données (MariaDB), calcul de géométrie (plaque + 4 trous), JSON canonique + SHA-256,
// rendu d'un aperçu SVG et d'un formulaire de configuration. Valeurs d'essai non atelier.
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { connection } from "next/server";

globalThis.__probePool ??= mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

const roundMm = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};
const canonical = (v) =>
  v === null || typeof v !== "object"
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? `[${v.map(canonical).join(",")}]`
      : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;

export default async function ParcoursPage({ searchParams }) {
  await connection();
  const t0 = performance.now();
  const q = await searchParams;
  const W = Number(q?.w ?? 300);
  const H = Number(q?.h ?? 200);
  const e = 10;
  const d = 4.5;

  let dbMs = null;
  let dbOk = false;
  try {
    const td = performance.now();
    await globalThis.__probePool.query("SELECT NOW() AS maintenant, VERSION() AS version, ? AS largeur, ? AS hauteur", [W, H]);
    dbMs = performance.now() - td;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const geometry = {
    plate: { widthMm: roundMm(W), heightMm: roundMm(H), cornerRadiusMm: 3, thicknessMm: 1.6 },
    safeZoneMm: 2,
    holes: [[e, e], [W - e, e], [e, H - e], [W - e, H - e]].map(([x, y]) => ({ cxMm: roundMm(x), cyMm: roundMm(y), diameterMm: d })),
  };
  const json = canonical(geometry);
  const hash = createHash("sha256").update(json).digest("hex");
  const workMs = performance.now() - t0;

  return (
    <main>
      <h1>Configurer votre plaque (parcours représentatif — sonde)</h1>
      <form>
        <fieldset>
          <legend>Matière</legend>
          {["Gravure laser", "Gravure laser (métallisée)", "Découpe + impression UV", "Gravure envers + UV noir"].map((m) => (
            <label key={m}>
              <input type="radio" name="matiere" /> {m}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Dimensions</legend>
          <input name="w" defaultValue={W} /> × <input name="h" defaultValue={H} /> mm
        </fieldset>
        <fieldset>
          <legend>Texte</legend>
          <input name="texte" defaultValue="Famille Martin" />
        </fieldset>
      </form>
      <svg viewBox={`0 0 ${W} ${H}`} width="480" role="img" aria-label="Aperçu">
        <rect x="0" y="0" width={W} height={H} rx="3" fill="#e8e2d6" stroke="#333" />
        <rect x="2" y="2" width={W - 4} height={H - 4} fill="none" stroke="#999" strokeDasharray="2 2" />
        {geometry.holes.map((h) => (
          <circle key={`${h.cxMm}-${h.cyMm}`} cx={h.cxMm} cy={h.cyMm} r={d / 2} fill="#fff" stroke="#333" />
        ))}
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="24">Famille Martin</text>
      </svg>
      <p>Géométrie : <code>{hash}</code></p>
      <p id="db-ok">{String(dbOk)}</p>
      <p id="db-ms">{dbMs === null ? "" : dbMs.toFixed(3)}</p>
      <p id="server-work-ms">{workMs.toFixed(3)}</p>
    </main>
  );
}
