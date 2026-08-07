import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { ArrowRight } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* ── Hero — single conversion section ───────────────────────── */}
      <section className="landing__hero">
        <div className="landing__hero-inner">

          {/* Brand mark */}
          <div className="landing__brand-mark">
            <img
              src="/assets/emos-logo-square.png"
              alt=""
              className="landing__brand-logo"
              width={40}
              height={40}
            />
            <span className="landing__brand-name">EMOS</span>
          </div>

          {/* Headline */}
          <h1 className="landing__headline">
            Your marketing decisions,<br />
            <span className="landing__headline-accent">backed by research.</span>
          </h1>

          {/* Sub */}
          <p className="landing__sub">
            EMOS searches across academic papers and industry research to answer
            your marketing questions — with citations, not opinions.
          </p>

          {/* CTAs */}
          <div className="landing__hero-ctas">
            <button
              className="landing__cta-primary"
              onClick={() => navigate(PUBLIC_ROUTES.SIGNUP)}
            >
              Get started free
              <ArrowRight size={16} />
            </button>
            <button
              className="landing__cta-secondary"
              onClick={() => navigate(PUBLIC_ROUTES.ABOUT)}
            >
              How it works
            </button>
          </div>

          {/* Proof stats */}
          <div className="landing__stats">
            <div className="landing__stat">
              <span className="landing__stat-num">93</span>
              <span className="landing__stat-label">Sources</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-num">3k+</span>
              <span className="landing__stat-label">Concepts</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-num">11</span>
              <span className="landing__stat-label">Domains</span>
            </div>
          </div>

          {/* About link — in body, not nav */}
          <p className="landing__about-link">
            <button onClick={() => navigate(PUBLIC_ROUTES.ABOUT)}>
              About EMOS →
            </button>
          </p>
        </div>
      </section>

    </div>
  );
}
