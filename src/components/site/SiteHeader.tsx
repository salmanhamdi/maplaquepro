import Link from "next/link";
import { ArrowRight } from "./ArrowRight";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="MaPlaquePro — accueil">
          {/* Logo officiel, non modifié */}
          <img src="/brand/maplaquepro.svg" alt="MaPlaquePro" width={44} height={40} />
        </Link>
        <nav className="site-nav" aria-label="Navigation principale">
          <ul className="site-nav__links">
            <li>
              <Link href="/#matieres">Matières</Link>
            </li>
            <li>
              <Link href="/#fonctionnement">Fonctionnement</Link>
            </li>
            <li>
              <Link href="/#precision">Précision</Link>
            </li>
          </ul>
          <Link href="/configurateur" className="btn btn--ink">
            Créer ma plaque
            <ArrowRight />
          </Link>
        </nav>
      </div>
    </header>
  );
}
