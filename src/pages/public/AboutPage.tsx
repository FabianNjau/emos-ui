import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-page__inner">
        <h1 className="about-page__title">What is EMOS?</h1>

        <p className="about-page__lead">
          EMOS is an evidence-based marketing intelligence system. It answers marketing
          questions using real research — academic papers, textbooks, and primary industry
          reports — not blog posts or opinions.
        </p>

        <section className="about-section">
          <h2 className="about-section__title">How it works</h2>
          <div className="about-steps">
            {[
              {
                num: '1',
                title: 'Ingest',
                body: 'Research papers, marketing textbooks, and industry reports are processed and stored with full source attribution.',
              },
              {
                num: '2',
                title: 'Extract',
                body: 'Key concepts, frameworks, and findings are identified and connected to their source evidence.',
              },
              {
                num: '3',
                title: 'Answer',
                body: 'When you ask a question, EMOS retrieves relevant concepts and synthesises an evidence-grounded response.',
              },
            ].map((s) => (
              <div key={s.num} className="about-step">
                <span className="about-step__num">{s.num}</span>
                <div>
                  <h3 className="about-step__title">{s.title}</h3>
                  <p className="about-step__body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section__title">What makes EMOS different</h2>
          <ul className="about-list">
            <li>Every answer cites the specific source it comes from.</li>
            <li>Evidence is graded — High, Medium, or Low — based on source type and rigour.</li>
            <li>Context matters — applicability flags show whether evidence is universal, African market, or Kenya-specific.</li>
            <li>No hallucination. If EMOS doesn't have evidence for something, it says so.</li>
          </ul>
        </section>

        <section className="about-section">
          <h2 className="about-section__title">Evidence levels</h2>
          <div className="about-legend">
            <div className="about-legend__item">
              <span className="about-legend__badge about-legend__badge--high">🟢 High</span>
              <span>Peer-reviewed academic papers, meta-analyses</span>
            </div>
            <div className="about-legend__item">
              <span className="about-legend__badge about-legend__badge--medium">🟡 Medium</span>
              <span>Textbooks, industry reports, practitioner literature</span>
            </div>
            <div className="about-legend__item">
              <span className="about-legend__badge about-legend__badge--low">🔴 Low</span>
              <span>Case studies, anecdotal evidence, expert opinion</span>
            </div>
          </div>
        </section>

        <div className="about-page__cta">
          <Link to={PUBLIC_ROUTES.ASK} className="about-cta-btn">
            Ask a question →
          </Link>
          <Link to={PUBLIC_ROUTES.TOPICS} className="about-cta-btn about-cta-btn--secondary">
            Browse topics
          </Link>
        </div>
      </div>
    </div>
  );
}
