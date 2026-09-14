// C8 — page rendue à la requête (aucun cache). Travail minimal et constant.
import { connection } from "next/server";

export default async function SsrPage() {
  await connection();
  const t0 = performance.now();
  const rows = Array.from({ length: 50 }, (_, i) => ({ id: i, label: `Ligne ${i}` }));
  const renderMs = performance.now() - t0;
  return (
    <main>
      <h1>SSR</h1>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>{r.label}</li>
        ))}
      </ul>
      <p id="server-work-ms">{renderMs.toFixed(3)}</p>
      <p id="rendered-at">{new Date().toISOString()}</p>
    </main>
  );
}
