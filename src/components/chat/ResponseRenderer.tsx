import { useState } from 'react';

/** Parse the EMOS structured response into typed sections */
interface Section {
  type: 'heading' | 'json' | 'prose' | 'code';
  level: number; // 1 = ##, 2 = ###, etc.
  content: string;
  raw: string;
}

interface ParsedResponse {
  directAnswer: string[];
  concepts: string[];      // JSON lines from "What to Learn Now"
  conceptsProse: string[];
  whatToIgnore: string[];
  nextAction: string[];
  reasoning: string[];
  evidence: string[];
  qualityBreakdown: string;
  raw: string;
}

function parseResponse(text: string): ParsedResponse {
  const lines = text.split('\n');
  const sections: Record<string, string[]> = {
    directAnswer: [], whatToLearnNow: [], whatToIgnore: [],
    nextAction: [], reasoning: [], evidence: [], quality: [],
  };
  let current = 'preamble';
  let inJsonBlock = false;
  let jsonLines: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const trimmed = line.trim();

    if (h2) {
      const title = h2[1].toLowerCase();
      if (title.includes('direct answer')) { current = 'directAnswer'; inJsonBlock = false; continue; }
      if (title.includes('what to learn')) { current = 'whatToLearnNow'; inJsonBlock = false; continue; }
      if (title.includes('ignore')) { current = 'whatToIgnore'; inJsonBlock = false; continue; }
      if (title.includes('next action')) { current = 'nextAction'; inJsonBlock = false; continue; }
      if (title.includes('reasoning')) { current = 'reasoning'; inJsonBlock = false; continue; }
      if (title.includes('evidence')) { current = 'evidence'; inJsonBlock = false; continue; }
      if (title.includes('quality')) { current = 'quality'; inJsonBlock = false; continue; }
    }

    if (trimmed === '```json') { inJsonBlock = true; jsonLines = []; continue; }
    if (trimmed === '```' && inJsonBlock) {
        sections.whatToLearnNow.push(jsonLines.join('\n'));
        inJsonBlock = false; jsonLines = []; continue;
    }
    if (inJsonBlock) { jsonLines.push(trimmed); continue; }

    if (current === 'preamble') {
      if (trimmed) sections.directAnswer.push(trimmed);
    } else {
      if (trimmed) sections[current === 'quality' ? 'quality' : current].push(trimmed);
    }
  }

  return {
    directAnswer: sections.directAnswer,
    concepts: sections.whatToLearnNow.filter(l => l.startsWith('{')),
    conceptsProse: sections.whatToLearnNow.filter(l => !l.startsWith('{')),
    whatToIgnore: sections.whatToIgnore,
    nextAction: sections.nextAction,
    reasoning: sections.reasoning,
    evidence: sections.evidence,
    qualityBreakdown: sections.quality.join('\n'),
    raw: text,
  };
}

function PriorityStars({ stars }: { stars: number }) {
  return (
    <span style={{ color: 'var(--accent)', letterSpacing: -2 }}>
      {'★'.repeat(Math.min(stars, 5))}
      {'☆'.repeat(Math.max(0, 5 - stars))}
    </span>
  );
}

function Expandable({ label, children, defaultOpen = false }: {
  label: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: 'var(--accent)',
          padding: '4px 0', fontFamily: 'inherit',
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: '0.15s', display: 'inline-block' }}>▶</span>
        {label}
      </button>
      {open && <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)', marginLeft: 2 }}>{children}</div>}
    </div>
  );
}

function ConceptCard({ jsonLine }: { jsonLine: string }) {
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(jsonLine); } catch { return null; }

  const stars = typeof data.stars === 'number' ? data.stars : 3;
  const priority = typeof data.priority === 'string' ? data.priority : 'useful';
  const priorityColor = priority === 'critical' ? '#c0392b' : priority === 'important' ? '#e67e22' : 'var(--text-tertiary)';

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      marginBottom: 8,
      background: 'var(--surface)',
      borderLeft: `3px solid ${priority === 'critical' ? '#c0392b' : priority === 'important' ? '#e67e22' : 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
          {String(data.concept || data.name || 'Unknown')}
        </span>
        <PriorityStars stars={stars} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: priorityColor, background: `${priorityColor}18`,
          padding: '2px 7px', borderRadius: 999,
        }}>
          {priority}
        </span>
        {data.layer ? (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
            {String(data.layer)}
          </span>
        ) : null}
      </div>
      {data.why ? (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Why:</strong> {String(data.why)}
        </p>
      ) : null}
      {data.for_this_user ? (
        <p style={{ fontSize: 12, color: 'var(--accent)', margin: '4px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
          → {String(data.for_this_user)}
        </p>
      ) : null}
    </div>
  );
}

function QualityBreakdown({ text }: { text: string }) {
  // Try to find JSON in the text
  const jsonMatch = text.match(/```json\s*(\{[\s\S]+?\})\s*```/);
  let scores: Record<string, number> = {};
  if (jsonMatch) {
    try { scores = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
  }

  const scoreColor = (s: number) => s >= 75 ? '#27ae60' : s >= 60 ? '#e67e22' : '#c0392b';

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      marginTop: 8,
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
        Quality Breakdown
      </div>
      {Object.entries(scores).filter(([k]) => k !== 'overall').map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 110, fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999 }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, val as number))}%`,
              height: '100%',
              background: scoreColor(val as number),
              borderRadius: 999,
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ width: 32, fontSize: 11, fontWeight: 700, color: scoreColor(val as number), textAlign: 'right' }}>{val}</span>
        </div>
      ))}
      {scores.overall && (
        <div style={{
          marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Overall</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: scoreColor(scores.overall) }}>
            {scores.overall}/100
          </span>
        </div>
      )}
    </div>
  );
}

export function ResponseRenderer({ content }: { content: string }) {
  const parsed = parseResponse(content);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  return (
    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
      {/* Direct Answer */}
      {parsed.directAnswer.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {parsed.directAnswer.map((line, i) => (
            <p key={i} style={{ margin: 0 }}>{line}</p>
          ))}
        </div>
      )}

      {/* What to Learn Now — Concept Cards */}
      {parsed.concepts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-tertiary)', marginBottom: 8,
          }}>
            What to Learn Now
          </div>
          {parsed.concepts.map((json, i) => (
            <ConceptCard key={i} jsonLine={json} />
          ))}
        </div>
      )}

      {/* Concept prose (explanation after JSON) */}
      {parsed.conceptsProse.length > 0 && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent)', paddingLeft: 12 }}>
          {parsed.conceptsProse.map((line, i) => <p key={i} style={{ margin: '0 0 0.3em' }}>{line}</p>)}
        </div>
      )}

      {/* What to Ignore */}
      {parsed.whatToIgnore.length > 0 && (
        <div style={{
          marginBottom: 12, padding: '10px 14px',
          background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-tertiary)', marginBottom: 6,
          }}>
            Not Yet
          </div>
          {parsed.whatToIgnore.map((line, i) => (
            <p key={i} style={{ margin: '0 0 0.3em', fontSize: 13, color: 'var(--text-secondary)' }}>
              → {line.replace(/^\- \*\*|:\*\* — /g, '').replace(/\*\*/g, '')}
            </p>
          ))}
        </div>
      )}

      {/* Next Action */}
      {parsed.nextAction.length > 0 && (
        <div style={{
          marginBottom: 12, padding: '10px 14px',
          background: 'rgba(12,123,138,0.06)', borderRadius: 'var(--radius)',
          border: '1px solid rgba(12,123,138,0.2)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--accent)', marginBottom: 4,
          }}>
            Your Next Action
          </div>
          {parsed.nextAction.map((line, i) => (
            <p key={i} style={{ margin: 0, fontSize: 13 }}>{line}</p>
          ))}
        </div>
      )}

      {/* Detailed Reasoning — collapsed */}
      {parsed.reasoning.length > 0 && (
        <Expandable label="Detailed Reasoning">
          {parsed.reasoning.map((line, i) => <p key={i} style={{ margin: '0 0 0.3em', fontSize: 13, color: 'var(--text-secondary)' }}>{line}</p>)}
        </Expandable>
      )}

      {/* Evidence — collapsed by default */}
      {parsed.evidence.length > 0 && (
        <Expandable label={`Evidence & Sources (${parsed.evidence.length})`}>
          {parsed.evidence.map((line, i) => <p key={i} style={{ margin: '0 0 0.3em', fontSize: 12, color: 'var(--text-secondary)' }}>{line}</p>)}
        </Expandable>
      )}

      {/* Quality Breakdown */}
      {parsed.qualityBreakdown && (
        <QualityBreakdown text={parsed.qualityBreakdown} />
      )}
    </div>
  );
}
