import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConcepts, getRelationships, getConceptDetail, type ConceptDetail } from '../../api/emos';

const W = 1100;
const H = 700;

// ── Node / Link types ────────────────────────────────────────────────────────

interface SimNode {
  id: string;
  label: string;
  slug: string;
  layer: string;
  domain: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

interface SimLink {
  sourceId: string;
  targetId: string;
  type: string;
}

interface DisplayNode {
  id: string;
  label: string;
  slug: string;
  layer: string;
  domain: string;
  x: number;
  y: number;
  r: number;
  color: string;
}

interface DisplayLink {
  source: DisplayNode;
  target: DisplayNode;
  type: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex(lerp(ca.r, cb.r, t), lerp(ca.g, cb.g, t), lerp(ca.b, cb.b, t));
}

// Cubic bezier path between two points — gives curved, organic edges
function cubicBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  return `M ${x1.toFixed(1)},${y1.toFixed(1)} C ${(x1 + dx * 0.45).toFixed(1)},${y1.toFixed(1)} ${(x2 - dx * 0.45).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

// Layer tonal variations — monochrome gradient, darker = more foundational
const LAYER_TINTS: Record<string, string> = {
  L1: '#3a3a42',  // timeless — deepest
  L2: '#6a6a76',  // framework — mid
  L3: '#9a9aa6',  // platform — lighter
  L4: '#babac4',  // local context — lightest
};

// ── Simulation physics controller ────────────────────────────────────────────

function SimulationController({
  simNodes, simLinks, onTick, isRunning,
}: {
  simNodes: SimNode[];
  simLinks: SimLink[];
  onTick: () => void;
  isRunning: boolean;
}) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) { cancelAnimationFrame(rafRef.current); return; }

    const DAMPING      = 0.82;
    const REPULSION   = 2800;
    const ATTRACTION  = 0.012;
    const CENTER_FORCE = 0.003;


    const run = () => {

      // Repulsion between all pairs
      for (let i = 0; i < simNodes.length; i++) {
        const a = simNodes[i];
        let fx = 0, fy = 0;
        for (let j = 0; j < simNodes.length; j++) {
          if (i === j) continue;
          const b = simNodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const distSq = dx * dx + dy * dy || 0.01;
          const dist = Math.sqrt(distSq);
          const force = REPULSION / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attraction along edges
        for (const link of simLinks) {
          if (link.sourceId !== a.id && link.targetId !== a.id) continue;
          const other = simNodes.find(n => n.id === (link.sourceId === a.id ? link.targetId : link.sourceId));
          if (!other) continue;
          const dx = other.x - a.x, dy = other.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - a.r * 3) * ATTRACTION;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Center gravity
        fx += (W / 2 - a.x) * CENTER_FORCE;
        fy += (H / 2 - a.y) * CENTER_FORCE;

        a.vx = (a.vx + fx) * DAMPING;
        a.vy = (a.vy + fy) * DAMPING;
      }

      // Integrate positions
      for (const node of simNodes) {
        node.x = Math.max(node.r + 8, Math.min(W - node.r - 8, node.x + node.vx));
        node.y = Math.max(node.r + 8, Math.min(H - node.r - 8, node.y + node.vy));
      }

      onTick();
      rafRef.current = requestAnimationFrame(run);
    };

    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, simNodes, simLinks, onTick]);

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<DisplayNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<DisplayNode | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [tick, setTick] = useState(0);

  // Fetch full concept details when a node is selected
  const { data: conceptDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['concept-detail', selectedNode?.id],
    queryFn: () => getConceptDetail(selectedNode!.id),
    enabled: !!selectedNode,
    staleTime: 60 * 1000,
  });

  // Simulation state (mutable refs for perf)
  const simNodes = useRef<SimNode[]>([]);
  const simLinks = useRef<SimLink[]>([]);

  // Display state (React-rendered)
  const [displayNodes, setDisplayNodes] = useState<DisplayNode[]>([]);
  const [displayLinks, setDisplayLinks] = useState<DisplayLink[]>([]);

  // ── Load data ─────────────────────────────────────────────────────────────
  const { data: conceptsResult } = useQuery({
    queryKey: ['concepts-for-graph'],
    queryFn: () => getConcepts({ limit: 500 }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: relsResult } = useQuery({
    queryKey: ['relationships-for-graph'],
    queryFn: () => getRelationships({ limit: 500 }),
    staleTime: 10 * 60 * 1000,
  });

  // Detect theme
  useEffect(() => {
    const stored = localStorage.getItem('emos-theme');
    if (stored === 'dark') setIsDark(true);
    else if (stored === 'light') setIsDark(false);
    else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Build graph when data arrives ─────────────────────────────────────────
  useEffect(() => {
    if (!conceptsResult?.concepts || !relsResult?.relationships) return;
    if (conceptsResult.concepts.length === 0) return;

    const concepts = conceptsResult.concepts;
    const relationships = relsResult.relationships;

    // Count connections per concept
    const connCount = new Map<string, number>();
    for (const r of relationships) {
      connCount.set(r.from_concept, (connCount.get(r.from_concept) || 0) + 1);
      connCount.set(r.to_concept, (connCount.get(r.to_concept) || 0) + 1);
    }

    // Only concepts with at least one relationship
    const activeIds = new Set<string>();
    for (const r of relationships) { activeIds.add(r.from_concept); activeIds.add(r.to_concept); }
    const activeConcepts = concepts.filter(c => activeIds.has(c.slug)).slice(0, 120);

    const maxConn = Math.max(...Array.from(connCount.values()).filter(v => v > 0), 1);

    // Init sim nodes with random positions
    simNodes.current = activeConcepts.map((c, i) => {
      const conn = connCount.get(c.slug) || 0;
      const ratio = conn / maxConn;
      const r = 4 + ratio * 18;  // 4px min, 22px max radius
      const layerGray = LAYER_TINTS[c.layer] || (isDark ? '#666' : '#999');
      const angle = (2 * Math.PI * i) / activeConcepts.length;
      const spreadR = 160 + Math.random() * 200;
      return {
        id: c.id,
        label: c.concept_name,
        slug: c.slug,
        layer: c.layer,
        domain: c.domain,
        x: W / 2 + spreadR * Math.cos(angle),
        y: H / 2 + spreadR * Math.sin(angle),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        r,
        color: layerGray,
      };
    });

    // Build sim links by ID
    const simNodeIds = new Set(simNodes.current.map(n => n.slug));
    simLinks.current = relationships
      .filter(r => simNodeIds.has(r.from_concept) && simNodeIds.has(r.to_concept))
      .map(r => ({ sourceId: r.from_concept, targetId: r.to_concept, type: r.relationship_type }));
    setSimulationRunning(true);
    // Sync sim → display immediately (don't rely on tick change)
    const syncNodes: DisplayNode[] = simNodes.current.map(n => ({ ...n }));
    // Use slug as key since simLinks uses slugs (not UUIDs)
    const nodeMap = new Map(syncNodes.map(n => [n.slug, n]));
    const syncLinks: DisplayLink[] = simLinks.current
      .map(l => {
        const src = nodeMap.get(l.sourceId);
        const tgt = nodeMap.get(l.targetId);
        if (!src || !tgt) return null;
        return { source: src, target: tgt, type: l.type };
      })
      .filter((l): l is DisplayLink => l !== null);
setDisplayNodes(syncNodes);
    setDisplayLinks(syncLinks);
  }, [conceptsResult, relsResult, isDark]);

  // Sync sim → display on each tick
  useEffect(() => {
    const nodes: DisplayNode[] = simNodes.current.map(n => ({ ...n }));
    // Use slug as key since simLinks uses slugs
    const nodeMap = new Map(nodes.map(n => [n.slug, n]));
    const links: DisplayLink[] = simLinks.current
      .map(l => {
        const src = nodeMap.get(l.sourceId);
        const tgt = nodeMap.get(l.targetId);
        if (!src || !tgt) return null;
        return { source: src, target: tgt, type: l.type };
      })
      .filter((l): l is DisplayLink => l !== null);
    setDisplayNodes(nodes);
    setDisplayLinks(links);
  }, [tick]);

  // ── Fullscreen ───────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Interaction (pointer capture for reliable pan + drag) ──────────────────
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform(t => ({
      ...t,
      scale: Math.max(0.3, Math.min(4, t.scale - e.deltaY * 0.001)),
    }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, nodeId?: string) => {
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    lastPos.current = { x: e.clientX, y: e.clientY };

    if (nodeId) {
      setDragging(nodeId);
      setSimulationRunning(false);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!lastPos.current) return;
    const dx = (e.clientX - lastPos.current.x) / transform.scale;
    const dy = (e.clientY - lastPos.current.y) / transform.scale;
    lastPos.current = { x: e.clientX, y: e.clientY };

    if (dragging) {
      const node = simNodes.current.find(n => n.id === dragging);
      if (node) {
        node.x += dx;
        node.y += dy;
        node.vx = 0; node.vy = 0;
        setTick(t => t + 1);
      }
    } else {
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }
  }, [dragging, transform.scale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    lastPos.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
    setDragging(null);
    setSimulationRunning(true);
  }, []);

  const handleNodeClick = useCallback((node: DisplayNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    setSimulationRunning(false);
  }, []);

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
    setHoveredNode(null);
    setSimulationRunning(true);
  };

  // ── Derived styling ────────────────────────────────────────────────────────
  const bgColor    = isDark ? '#0a0a0c' : '#f5f5f7';
  const edgeColor  = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)';
  const labelColor = isDark ? '#d8d8e0' : '#1a1a22';
  const nodeBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const panelBg    = isDark ? 'rgba(16,16,20,0.92)' : 'rgba(255,255,255,0.92)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const panelShadow = isDark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.10)';

  const hoveredId = hoveredNode?.id;
  const selectedId = selectedNode?.id;

  const getEdgeOpacity = (link: DisplayLink) => {
    if (!hoveredId && !selectedId) return 0.35;
    const h = hoveredId, s = selectedId;
    const srcId = link.source.id, tgtId = link.target.id;
    if (h) return (srcId === h || tgtId === h) ? 0.75 : 0.04;
    if (s) return (srcId === s || tgtId === s) ? 0.75 : 0.04;
    return 0.35;
  };

  const getNodeOpacity = (node: DisplayNode) => {
    if (!hoveredId && !selectedId) return 1;
    if (hoveredId) return node.id === hoveredId ? 1 : 0.18;
    if (selectedId) return node.id === selectedId ? 1 : 0.18;
    return 1;
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">Neural Architecture</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            Evidence Mind
          </h1>
          <p style={{ marginTop: '0.4rem', fontSize: 13, color: 'var(--text-secondary)' }}>
            {displayNodes.length} concepts · {displayLinks.length} connections Drag nodes · Scroll to zoom
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowLabels(v => !v)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: showLabels ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
              color: isDark ? '#d0d0d8' : '#1a1a22',
              transition: 'all 0.2s',
            }}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button
            onClick={() => setSimulationRunning(v => !v)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: simulationRunning ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
              color: isDark ? '#d0d0d8' : '#1a1a22',
              transition: 'all 0.2s',
            }}
          >
            {simulationRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={resetView}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent',
              color: isDark ? '#d0d0d8' : '#1a1a22',
              transition: 'all 0.2s',
            }}
          >
            ↺ Reset
          </button>
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: isFullscreen ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
              color: isDark ? '#d0d0d8' : '#1a1a22',
              transition: 'all 0.2s',
            }}
          >
            {isFullscreen ? '⤓ Exit' : '⤢ Fullscreen'}
          </button>
        </div>
      </div>

      {/* ── Graph container ── */}
      <div
        ref={containerRef}
        style={{
          background: bgColor,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 48px rgba(0,0,0,0.65)'
            : '0 0 0 1px rgba(0,0,0,0.07), 0 4px 24px rgba(0,0,0,0.10)',
          position: 'relative',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        <svg
          width="100%"
          height={H}
          style={{ display: 'block' }}
          onWheelCapture={handleWheel}
          ref={svgRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

            {/* ── Edges ── */}
            <g>
              {displayLinks.map((link, i) => {
                const opacity = getEdgeOpacity(link);
                if (opacity < 0.02) return null;
                return (
                  <path
                    key={`e-${link.source.id}-${link.target.id}-${i}`}
                    d={cubicBezierPath(link.source.x, link.source.y, link.target.x, link.target.y)}
                    stroke={edgeColor}
                    strokeWidth={1.5}
                    strokeOpacity={opacity}
                    fill="none"
                    style={{ transition: 'stroke-opacity 0.3s ease' }}
                  />
                );
              })}
            </g>

            {/* ── Nodes ── */}
            <g>
              {displayNodes.map(node => {
                const opacity = getNodeOpacity(node);
                const isHov = hoveredId === node.id;
                const isSel = selectedId === node.id;
                const glow = isHov || isSel;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    style={{ cursor: 'pointer', opacity }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, node.id); }}
                  >
                    {/* Soft glow halo */}
                    {glow && (
                      <circle
                        r={node.r + 10}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={2}
                        strokeOpacity={0.2}
                        style={{ filter: 'blur(6px)' }}
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      r={node.r}
                      fill={node.color}
                      stroke={nodeBorder}
                      strokeWidth={glow ? 2 : 0.75}
                      strokeOpacity={glow ? 0.9 : 0.4}
                      style={{
                        filter: isHov
                          ? `drop-shadow(0 0 ${node.r * 0.9}px ${node.color}99)`
                          : 'none',
                        transition: 'filter 0.2s ease, stroke-width 0.2s ease',
                      }}
                    />

                    {/* Label — shown for large nodes, or when hovered/selected/always-labels */}
                    {(showLabels || isHov || isSel || node.r > 11) && (
                      <text
                        dy={node.r + 13}
                        textAnchor="middle"
                        fill={labelColor}
                        fontSize={node.r > 13 ? 11 : 9}
                        fontFamily="var(--font-sans)"
                        fontWeight={node.r > 11 ? 600 : 400}
                        style={{
                          opacity: showLabels ? 0.7 : (isHov || isSel ? 1 : (node.r > 11 ? 0.8 : 0)),
                          transition: 'opacity 0.25s ease',
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
                      </text>
                    )}

                    {/* Layer indicator dot (subtle, top-right of node) */}
                    <circle
                      cx={node.r * 0.62}
                      cy={-node.r * 0.62}
                      r={2}
                      fill={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'}
                    />
                  </g>
                );
              })}
            </g>

          </g>
        </svg>

        {/* ── Selected node detail panel ── */}
        {selectedNode && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: panelBg,
            backdropFilter: 'blur(18px)',
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '1rem 1.25rem',
            maxWidth: 320,
            maxHeight: 'calc(100% - 32px)',
            overflowY: 'auto',
            boxShadow: panelShadow,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: isDark ? '#777' : '#888',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                  {selectedNode.layer} · {selectedNode.domain.replace(/^\d+-/, '').replace(/-/g, ' ')}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: labelColor, fontFamily: 'var(--font-serif)', lineHeight: 1.3 }}>
                  {selectedNode.label}
                </div>
                <code style={{ fontSize: 9.5, color: isDark ? '#444' : '#bbb', letterSpacing: '0.02em' }}>
                  {selectedNode.slug}
                </code>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isDark ? '#444' : '#bbb',
                  padding: '2px 6px', fontSize: 18, lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <div style={{ marginTop: 12, fontSize: 12, color: isDark ? '#555' : '#aaa' }}>
                Loading details…
              </div>
            ) : conceptDetail ? (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${panelBorder}` }}>
                {/* Definition */}
                {conceptDetail.definition && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                      Definition
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: isDark ? '#c0c0c8' : '#333' }}>
                      {conceptDetail.definition}
                    </div>
                  </div>
                )}

                {/* Purpose */}
                {conceptDetail.purpose && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                      Purpose
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: isDark ? '#c0c0c8' : '#333' }}>
                      {conceptDetail.purpose}
                    </div>
                  </div>
                )}

                {/* Limitations */}
                {conceptDetail.limitations && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                      Limitations
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: isDark ? '#c0c0c8' : '#333' }}>
                      {conceptDetail.limitations}
                    </div>
                  </div>
                )}

                {/* Common Mistakes */}
                {conceptDetail.common_mistakes && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                      Common Mistakes
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: isDark ? '#c0c0c8' : '#333' }}>
                      {conceptDetail.common_mistakes}
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {conceptDetail.evidence && conceptDetail.evidence.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                      Evidence ({conceptDetail.evidence.length})
                    </div>
                    {conceptDetail.evidence.slice(0, 4).map((ev) => (
                      <div key={ev.id} style={{
                        fontSize: 11, lineHeight: 1.45,
                        color: isDark ? '#a0a0a8' : '#555',
                        padding: '4px 8px',
                        marginBottom: 4,
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderRadius: 6,
                      }}>
                        {ev.finding}
                        <div style={{ marginTop: 2, fontSize: 9, color: isDark ? '#555' : '#aaa' }}>
                          {ev.evidence_level} · {ev.source_type}
                        </div>
                      </div>
                    ))}
                    {conceptDetail.evidence.length > 4 && (
                      <div style={{ fontSize: 10, color: isDark ? '#555' : '#aaa', marginTop: 2 }}>
                        +{conceptDetail.evidence.length - 4} more…
                      </div>
                    )}
                  </div>
                )}

                {/* Relationships */}
                {conceptDetail.relationships && conceptDetail.relationships.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                      Relationships ({conceptDetail.relationships.length})
                    </div>
                    {conceptDetail.relationships.slice(0, 5).map((rel) => (
                      <div key={rel.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11, color: isDark ? '#888' : '#666',
                        marginBottom: 3,
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ width: 12, height: 1, background: edgeColor, flexShrink: 0 }} />
                        <span>{rel.from_name}</span>
                        <span style={{ fontSize: 8.5, fontWeight: 600, color: isDark ? '#444' : '#ccc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          → {rel.relationship_type.replace(/_/g, ' ')} →
                        </span>
                        <span>{rel.to_name}</span>
                      </div>
                    ))}
                    {conceptDetail.relationships.length > 5 && (
                      <div style={{ fontSize: 10, color: isDark ? '#555' : '#aaa', marginTop: 2 }}>
                        +{conceptDetail.relationships.length - 5} more…
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Legend ── */}
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          display: 'flex', gap: 14, alignItems: 'center',
          fontSize: 10.5, color: isDark ? '#4a4a52' : '#aaa',
          letterSpacing: '0.03em',
        }}>
          <span style={{ fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontSize: 9.5 }}>
            Node size = connectivity
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isDark ? '#3a3a42' : '#ccc' }} />
            <span>peripheral</span>
          </div>
          <div style={{ width: 36, height: 2, background: `linear-gradient(to right, ${isDark ? '#3a3a42' : '#ccc'}, ${isDark ? '#a0a0a8' : '#444'})`, borderRadius: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', background: isDark ? '#a0a0a8' : '#444' }} />
            <span>hub</span>
          </div>
          <span style={{ opacity: 0.4 }}>·</span>
          {Object.entries(LAYER_TINTS).map(([layer, color]) => (
            <div key={layer} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span>{layer}</span>
            </div>
          ))}
        </div>

        {/* ── Zoom indicator ── */}
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          fontSize: 10, color: isDark ? '#3a3a42' : '#ccc',
          fontFamily: 'monospace',
        }}>
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Concepts', value: displayNodes.length },
          { label: 'Connections', value: displayLinks.length },
          { label: 'L1 Timeless', value: displayNodes.filter(n => n.layer === 'L1').length },
          { label: 'L2 Frameworks', value: displayNodes.filter(n => n.layer === 'L2').length },
          { label: 'L3 Platforms', value: displayNodes.filter(n => n.layer === 'L3').length },
          { label: 'L4 Local', value: displayNodes.filter(n => n.layer === 'L4').length },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: '1 1 110px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 9.5, color: 'var(--text-tertiary)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '1.4rem', fontWeight: 700,
              fontFamily: 'var(--font-serif)', color: 'var(--accent)',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Physics engine */}
      <SimulationController
        simNodes={simNodes.current}
        simLinks={simLinks.current}
        onTick={() => setTick(t => t + 1)}
        isRunning={simulationRunning}
      />
    </div>
  );
}
