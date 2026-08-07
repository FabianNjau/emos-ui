import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES, ADMIN_ROUTES } from '../../constants/routes';
import './PublicFooter.css';

interface PublicFooterProps {
  sourceCount?: number;
  conceptCount?: number;
}

export default function PublicFooter({ sourceCount, conceptCount }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <div className="public-footer__brand">
          <span className="public-footer__logo">EMOS</span>
          <p className="public-footer__tagline">
            Evidence-based marketing intelligence.
          </p>
          {(sourceCount !== undefined || conceptCount !== undefined) && (
            <p className="public-footer__stats">
              {sourceCount !== undefined && <span>{sourceCount} sources</span>}
              {sourceCount !== undefined && conceptCount !== undefined && <span className="public-footer__sep">·</span>}
              {conceptCount !== undefined && <span>{conceptCount} concepts</span>}
            </p>
          )}
        </div>

        <div className="public-footer__links">
          <div className="public-footer__col">
            <span className="public-footer__col-label">Explore</span>
            <Link to={PUBLIC_ROUTES.TOPICS}>Topics</Link>
            <Link to={PUBLIC_ROUTES.SEARCH}>Search</Link>
            <Link to={PUBLIC_ROUTES.ASK}>Ask</Link>
          </div>
          <div className="public-footer__col">
            <span className="public-footer__col-label">Company</span>
            <Link to={PUBLIC_ROUTES.ABOUT}>About</Link>
          </div>
          <div className="public-footer__col">
            <span className="public-footer__col-label">Admin</span>
            <Link to={ADMIN_ROUTES.HOME}>Workspace</Link>
          </div>
        </div>
      </div>

      <div className="public-footer__bottom">
        <span>© {year} EMOS. Built for marketing professionals.</span>
      </div>
    </footer>
  );
}
