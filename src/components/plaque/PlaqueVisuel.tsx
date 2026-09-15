// Visuel client d'une plaque (illustration d'interface). Ce n'est ni la preview serveur (§12) ni un fichier de production :
// aucune règle de fabrication n'est calculée ici, les couleurs de matière et le diamètre des trous sont indicatifs.
import { useId } from "react";

export type Matiere = "trolase" | "trolase_metallic" | "plexiglass" | "troglass_metallic";

type Props = {
  matiere: Matiere;
  widthMm: number;
  heightMm: number;
  lignes: readonly string[];
  trous?: 0 | 2 | 4;
  /** Distance du bord au centre des trous, en mm (aperçu). */
  retraitTrouMm?: number;
  alignement?: "left" | "center";
  /** Texte d'exemple affiché en retrait tant que le client n'a rien saisi. */
  exemple?: boolean;
  cotes?: boolean;
  titre: string;
  className?: string;
};

const TEINTES: Record<Matiere, { fond: [string, string, string]; texte: string; bord: string }> = {
  trolase: { fond: ["#27323d", "#1c2630", "#141c24"], texte: "#ece6d9", bord: "#0f151b" },
  trolase_metallic: { fond: ["#c9cfd4", "#eef1f3", "#aeb5bc"], texte: "#1d252d", bord: "#8d959d" },
  plexiglass: { fond: ["rgba(255,255,255,0.72)", "rgba(250,252,253,0.42)", "rgba(236,242,246,0.6)"], texte: "#18222d", bord: "rgba(24,34,45,0.22)" },
  troglass_metallic: { fond: ["#b58d3b", "#e8d08f", "#a57e2f"], texte: "#15130f", bord: "#7f6123" },
};

export function PlaqueVisuel({ matiere, widthMm: W, heightMm: H, lignes, trous = 0, retraitTrouMm, alignement = "center", exemple = false, cotes = false, titre, className }: Props) {
  const id = useId().replace(/[:]/g, "");
  const t = TEINTES[matiere];
  const echelle = Math.max(W, H);
  const fsCote = echelle * 0.032;
  const marge = cotes ? fsCote * 4.4 : echelle * 0.03;
  const x0 = echelle * 0.03;
  const y0 = marge;
  const vbW = W + x0 + (cotes ? fsCote * 5.6 : echelle * 0.03);
  const vbH = H + y0 + echelle * 0.03;
  const rayon = Math.min(W, H) * 0.035;

  // Rayon d'illustration (diamètre réel À VALIDER) : lisible quelle que soit l'échelle de la plaque.
  const rTrou = Math.min(Math.max(echelle * 0.009, Math.min(W, H) * 0.028), Math.min(W, H) * 0.12);
  const retrait = retraitTrouMm ?? Math.max(rTrou * 3.2, Math.min(W, H) * 0.1);
  const positionsTrous =
    trous === 2
      ? [[retrait, H / 2], [W - retrait, H / 2]]
      : trous === 4
        ? [[retrait, retrait], [W - retrait, retrait], [retrait, H - retrait], [W - retrait, H - retrait]]
        : [];

  const lignesAffichees = lignes.length > 0 ? lignes : [""];
  const zoneTexteX = trous === 2 ? retrait + rTrou * 2.5 : W * 0.08;
  const largeurUtile = W - 2 * zoneTexteX;
  const plusLongue = Math.max(...lignesAffichees.map((l, i) => l.length * (i === 0 ? 0.6 : 0.36)), 1);
  const taille = Math.max(Math.min((H * 0.78) / (lignesAffichees.length * 1.18), largeurUtile / plusLongue), 0.5);
  const brillance = matiere !== "trolase";
  const xTexte = alignement === "center" ? W / 2 : zoneTexteX;

  return (
    <svg className={`plaque ${className ?? ""}`} viewBox={`0 0 ${vbW} ${vbH}`} role="img" aria-label={titre}>
      <defs>
        <linearGradient id={`fond-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.fond[0]} />
          <stop offset="0.52" stopColor={t.fond[1]} />
          <stop offset="1" stopColor={t.fond[2]} />
        </linearGradient>
        <linearGradient id={`reflet-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={brillance ? 0.55 : 0.12} />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="plaque__corps" transform={`translate(${x0} ${y0})`}>
        <rect width={W} height={H} rx={rayon} fill={`url(#fond-${id})`} stroke={t.bord} strokeWidth={echelle * 0.002} />
        <rect x={echelle * 0.003} y={echelle * 0.003} width={Math.max(W - echelle * 0.006, 0)} height={H * 0.5} rx={rayon} fill={`url(#reflet-${id})`} />
        {matiere === "plexiglass" && (
          <rect x={echelle * 0.006} y={echelle * 0.006} width={Math.max(W - echelle * 0.012, 0)} height={Math.max(H - echelle * 0.012, 0)} rx={rayon} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={echelle * 0.002} />
        )}
        <g fill={t.texte} fontFamily="var(--font-sans)" fontWeight={500} textAnchor={alignement === "center" ? "middle" : "start"} opacity={exemple ? 0.38 : 1}>
          {lignesAffichees.map((ligne, i) => {
            const tailleLigne = taille * (i === 0 ? 1 : 0.62);
            const pas = taille * 1.18;
            const y = H / 2 - ((lignesAffichees.length - 1) * pas) / 2 + i * pas + tailleLigne * 0.35;
            return (
              <text key={i} x={xTexte} y={y} fontSize={tailleLigne} letterSpacing={i === 0 ? 0 : tailleLigne * 0.04} xmlSpace="preserve">
                {ligne}
              </text>
            );
          })}
        </g>
        {positionsTrous.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={rTrou} fill="#8f959b" />
            <circle cx={cx} cy={cy} r={rTrou * 0.62} fill="#f2f1ec" stroke="rgba(24,34,45,0.35)" strokeWidth={rTrou * 0.12} />
          </g>
        ))}
      </g>

      {cotes && (
        <g aria-hidden="true" style={{ strokeWidth: echelle * 0.0016 }}>
          <path className="plaque__cote-trait" style={{ strokeWidth: "inherit" }} d={`M${x0} ${y0 - fsCote * 2.2}V${y0 - fsCote * 0.9}M${x0 + W} ${y0 - fsCote * 2.2}V${y0 - fsCote * 0.9}M${x0} ${y0 - fsCote * 1.55}H${x0 + W}`} />
          <text className="plaque__cote" x={x0 + W / 2} y={y0 - fsCote * 2.6} fontSize={fsCote} textAnchor="middle">
            {String(W).replace(".", ",")} mm
          </text>
          <path className="plaque__cote-trait" style={{ strokeWidth: "inherit" }} d={`M${x0 + W + fsCote * 0.9} ${y0}H${x0 + W + fsCote * 2.2}M${x0 + W + fsCote * 0.9} ${y0 + H}H${x0 + W + fsCote * 2.2}M${x0 + W + fsCote * 1.55} ${y0}V${y0 + H}`} />
          <text className="plaque__cote" x={x0 + W + fsCote * 2.6} y={y0 + H / 2 + fsCote * 0.35} fontSize={fsCote}>
            {String(H).replace(".", ",")}
          </text>
        </g>
      )}
    </svg>
  );
}
