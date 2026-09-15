import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img src="/brand/maplaquepro.svg" alt="MaPlaquePro" width={53} height={48} />
            <p>Plaques personnalisées, gravées et imprimées sur mesure. Chaque plaque est fabriquée d&apos;après le BAT que vous avez validé.</p>
          </div>
          <div>
            <h2>Produit</h2>
            <ul>
              <li>
                <Link href="/configurateur">Créer ma plaque</Link>
              </li>
              <li>
                <Link href="/#matieres">Matières</Link>
              </li>
              <li>
                <Link href="/#fonctionnement">Fonctionnement</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Atelier</h2>
            <ul>
              <li>
                <Link href="/#precision">Précision et dimensions</Link>
              </li>
              <li>
                <Link href="/#fonctionnement">Le BAT</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} MaPlaquePro</span>
          <span>Fabrication d&apos;après BAT validé</span>
        </div>
      </div>
    </footer>
  );
}
