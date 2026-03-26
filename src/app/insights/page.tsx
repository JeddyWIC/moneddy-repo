"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  count: number;
}

interface CoOccurrence {
  tag1: string;
  tag2: string;
  shared: number;
}

interface CategoryBreakdown {
  category: string | null;
  count: number;
}

interface TagsPerProcess {
  tagCount: number;
  processCount: number;
}

interface RecentActivity {
  name: string;
  recentCount: number;
}

interface InsightsData {
  tags: Tag[];
  coOccurrences: CoOccurrence[];
  categoryBreakdown: CategoryBreakdown[];
  tagsPerProcess: TagsPerProcess[];
  recentActivity: RecentActivity[];
  stats: {
    totalProcesses: number;
    totalTags: number;
  };
}

// ─── Force-directed cluster diagram ────────────────────────────
function ClusterDiagram({
  tags,
  coOccurrences,
}: {
  tags: Tag[];
  coOccurrences: CoOccurrence[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const nodesRef = useRef<
    {
      name: string;
      count: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }[]
  >([]);
  const edgesRef = useRef<
    { source: string; target: string; weight: number }[]
  >([]);
  const initializedRef = useRef(false);

  // Initialize nodes and edges
  useEffect(() => {
    if (initializedRef.current) return;
    if (tags.length === 0) return;

    const topTags = tags.slice(0, 40);
    const tagSet = new Set(topTags.map((t) => t.name));
    const maxCount = Math.max(...topTags.map((t) => t.count));

    nodesRef.current = topTags.map((t) => ({
      name: t.name,
      count: t.count,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 300,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 300,
      vx: 0,
      vy: 0,
      radius: 8 + (t.count / maxCount) * 28,
    }));

    edgesRef.current = coOccurrences
      .filter((e) => tagSet.has(e.tag1) && tagSet.has(e.tag2))
      .map((e) => ({ source: e.tag1, target: e.tag2, weight: e.shared }));

    initializedRef.current = true;
  }, [tags, coOccurrences, dimensions]);

  // Resize handler
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.min(500, width * 0.6) });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const isDark =
      document.documentElement.classList.contains("dark");

    function simulate() {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      if (nodes.length === 0) return;

      const W = dimensions.width;
      const H = dimensions.height;

      // Force simulation step
      for (const node of nodes) {
        node.vx *= 0.92;
        node.vy *= 0.92;

        // Center gravity
        node.vx += (W / 2 - node.x) * 0.002;
        node.vy += (H / 2 - node.y) * 0.002;
      }

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along edges
      const nodeMap = new Map(nodes.map((n) => [n.name, n]));
      for (const edge of edges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.004 * Math.min(edge.weight, 5);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(node.radius + 4, Math.min(W - node.radius - 4, node.x));
        node.y = Math.max(node.radius + 4, Math.min(H - node.radius - 4, node.y));
      }

      // Draw
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Edges
      const maxWeight = Math.max(...edges.map((e) => e.weight), 1);
      for (const edge of edges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;
        const isHighlighted =
          hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHighlighted
          ? isDark
            ? "rgba(250,204,21,0.6)"
            : "rgba(202,138,4,0.5)"
          : isDark
            ? `rgba(120,113,108,${0.08 + (edge.weight / maxWeight) * 0.2})`
            : `rgba(168,162,158,${0.08 + (edge.weight / maxWeight) * 0.25})`;
        ctx.lineWidth = isHighlighted
          ? 1.5 + (edge.weight / maxWeight) * 2.5
          : 0.5 + (edge.weight / maxWeight) * 1.5;
        ctx.stroke();
      }

      // Nodes
      const maxCount = Math.max(...nodes.map((n) => n.count), 1);
      for (const node of nodes) {
        const isHovered = hoveredNode === node.name;
        const isConnected =
          hoveredNode &&
          edges.some(
            (e) =>
              (e.source === hoveredNode && e.target === node.name) ||
              (e.target === hoveredNode && e.source === node.name)
          );
        const dimmed = hoveredNode && !isHovered && !isConnected;

        const ratio = node.count / maxCount;
        const hue = 45;
        const sat = 70 + ratio * 30;
        const light = isDark ? 40 + ratio * 20 : 55 - ratio * 15;
        const alpha = dimmed ? 0.25 : 1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,${alpha})`;
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = isDark ? "#fbbf24" : "#ca8a04";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        const fontSize = Math.max(9, Math.min(13, node.radius * 0.55));
        ctx.font = `${isHovered ? "bold " : ""}${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = dimmed
          ? isDark
            ? "rgba(168,162,158,0.3)"
            : "rgba(120,113,108,0.3)"
          : isDark
            ? "#e7e5e4"
            : "#292524";
        ctx.fillText(`#${node.name}`, node.x, node.y + node.radius + fontSize + 2);
      }

      animRef.current = requestAnimationFrame(simulate);
    }

    simulate();
    return () => cancelAnimationFrame(animRef.current);
  }, [dimensions, hoveredNode, tags]);

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = nodesRef.current.find((n) => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
      });
      setHoveredNode(hit?.name ?? null);
    },
    []
  );

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      window.location.href = `/search?tag=${encodeURIComponent(hoveredNode)}`;
    }
  }, [hoveredNode]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          cursor: hoveredNode ? "pointer" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={handleClick}
      />
      {hoveredNode && (
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 text-center">
          Click to search entries tagged <span className="font-semibold text-yellow-600 dark:text-yellow-400">#{hoveredNode}</span>
        </p>
      )}
    </div>
  );
}

// ─── Bar chart component ───────────────────────────────────────
function BarChart({
  data,
  labelKey,
  valueKey,
  color = "bg-yellow-500",
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  const maxVal = Math.max(
    ...data.map((d) => Number(d[valueKey]) || 0),
    1
  );

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const label = String(item[labelKey] || "Uncategorized");
        const value = Number(item[valueKey]) || 0;
        const pct = (value / maxVal) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 text-xs text-stone-600 dark:text-stone-400 truncate text-right">
              {label}
            </span>
            <div className="flex-1 h-5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="w-8 text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-5">
      <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-stone-500 dark:text-stone-400">
          Failed to load insights. Make sure you have some entries and tags first.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 font-medium"
        >
          ← Back home
        </Link>
      </div>
    );
  }

  const avgTagsPerProcess =
    data.tags.reduce((sum, t) => sum + t.count, 0) /
    Math.max(data.stats.totalProcesses, 1);

  const topTag = data.tags[0];
  const orphanTags = data.tags.filter((t) => t.count === 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Tag Insights
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            How your tags connect and cluster across entries
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 font-medium"
        >
          ← Home
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Entries"
          value={data.stats.totalProcesses}
        />
        <StatCard
          label="Unique Tags"
          value={data.stats.totalTags}
          sub={orphanTags.length > 0 ? `${orphanTags.length} unused` : undefined}
        />
        <StatCard
          label="Avg Tags / Entry"
          value={avgTagsPerProcess.toFixed(1)}
        />
        <StatCard
          label="Most Used"
          value={topTag ? `#${topTag.name}` : "—"}
          sub={topTag ? `${topTag.count} entries` : undefined}
        />
      </div>

      {/* Cluster diagram */}
      <section className="mb-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
          Tag Cluster Map
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Tags that appear together on the same entries are pulled closer. Larger circles = more usage. Hover to highlight connections.
        </p>
        {data.tags.length > 1 ? (
          <ClusterDiagram
            tags={data.tags}
            coOccurrences={data.coOccurrences}
          />
        ) : (
          <p className="text-center py-12 text-stone-400 dark:text-stone-500">
            Need at least 2 tags to show a cluster map.
          </p>
        )}
      </section>

      {/* Two-column details */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Top tags */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Top Tags
          </h2>
          <BarChart
            data={data.tags.slice(0, 12) as unknown as Record<string, unknown>[]}
            labelKey="name"
            valueKey="count"
            color="bg-yellow-500 dark:bg-yellow-600"
          />
        </section>

        {/* Category breakdown */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            By Category
          </h2>
          {data.categoryBreakdown.length > 0 ? (
            <BarChart
              data={
                data.categoryBreakdown.map((c) => ({
                  ...c,
                  category: c.category || "Uncategorized",
                })) as unknown as Record<string, unknown>[]
              }
              labelKey="category"
              valueKey="count"
              color="bg-stone-500 dark:bg-stone-600"
            />
          ) : (
            <p className="text-stone-400 dark:text-stone-500 text-sm">
              No categories yet.
            </p>
          )}
        </section>

        {/* Tags per process distribution */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Tags per Entry
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
            How many tags entries typically have
          </p>
          {data.tagsPerProcess.length > 0 ? (
            <BarChart
              data={
                data.tagsPerProcess.map((d) => ({
                  tagLabel: `${d.tagCount} tag${d.tagCount !== 1 ? "s" : ""}`,
                  processCount: d.processCount,
                })) as unknown as Record<string, unknown>[]
              }
              labelKey="tagLabel"
              valueKey="processCount"
              color="bg-amber-400 dark:bg-amber-600"
            />
          ) : (
            <p className="text-stone-400 dark:text-stone-500 text-sm">
              No data yet.
            </p>
          )}
        </section>

        {/* Recent activity */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Active Tags (30 days)
          </h2>
          {data.recentActivity.length > 0 ? (
            <BarChart
              data={data.recentActivity as unknown as Record<string, unknown>[]}
              labelKey="name"
              valueKey="recentCount"
              color="bg-green-500 dark:bg-green-600"
            />
          ) : (
            <p className="text-stone-400 dark:text-stone-500 text-sm">
              No recent activity.
            </p>
          )}
        </section>
      </div>

      {/* Strongest connections */}
      {data.coOccurrences.length > 0 && (
        <section className="mt-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Strongest Tag Pairs
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
            Tags that most frequently appear together on the same entries
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.coOccurrences.slice(0, 12).map((pair, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-stone-50 dark:bg-stone-800/50"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/search?tag=${encodeURIComponent(pair.tag1)}`}
                    className="text-yellow-700 dark:text-yellow-400 hover:underline"
                  >
                    #{pair.tag1}
                  </Link>
                  <span className="text-stone-300 dark:text-stone-600">↔</span>
                  <Link
                    href={`/search?tag=${encodeURIComponent(pair.tag2)}`}
                    className="text-yellow-700 dark:text-yellow-400 hover:underline"
                  >
                    #{pair.tag2}
                  </Link>
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                  {pair.shared}×
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orphan tags */}
      {orphanTags.length > 0 && (
        <section className="mt-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Unused Tags
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
            Tags not attached to any entries — consider cleaning these up
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanTags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-500"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
