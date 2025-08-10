'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { D3TimeSeriesProps } from './types';
import { DEFAULT_COLORS } from './colors';

/**
 * Streaming time-series chart (D3 + React)
 * - Pass any set of series in `sample` (e.g., { x: 1.23, y: 2.34 })
 * - Supports dark mode (inherits text color from parent)
 * - Y-axis: fixed, percentile-trimmed, or zero-centered auto scale
 */
export default function D3TimeSeries({
  sample,
  seriesOrder,
  colors = DEFAULT_COLORS,
  maxPoints = 200,
  height = 160,

  fixedYMin,
  fixedYMax,
  percentile,              // e.g., [0.05, 0.95]
  zeroCenter = false,

  showLegend = true,
  labels = {},
}: D3TimeSeriesProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef  = useRef<SVGSVGElement | null>(null);
  const dataRef = useRef<{ t: number; [k: string]: number }[]>([]);
  const startT  = useRef<number>(Date.now());

  // Create SVG once
  useEffect(() => {
    if (!wrapRef.current || svgRef.current) return;
    const width = wrapRef.current.clientWidth || 600;

    const svg = d3
      .select(wrapRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.append('rect')
      .attr('class', 'chart-bg')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height)
      .attr('rx', 14)
      .attr('fill', 'transparent');

    svg.append('g').attr('class', 'grid');
    svg.append('g').attr('class', 'axis axis-x');
    svg.append('g').attr('class', 'axis axis-y');

    svgRef.current = svg.node() as SVGSVGElement;

    // Responsive
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        d3.select(svgRef.current)
          .attr('viewBox', `0 0 ${w} ${height}`)
          .select('rect.chart-bg')
          .attr('width', w);
        draw();
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new sample & redraw
  useEffect(() => {
    const t = (Date.now() - startT.current) / 1000; // seconds since mount
    dataRef.current.push({ t, ...sample });
    if (dataRef.current.length > maxPoints) dataRef.current.shift();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  function draw() {
    if (!svgRef.current || !wrapRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = wrapRef.current.clientWidth || 600;

    const margin = { top: 10, right: 10, bottom: 22, left: 40 };
    const innerW = Math.max(20, width - margin.left - margin.right);
    const innerH = Math.max(20, height - margin.top - margin.bottom);

    const gX = svg.select<SVGGElement>('g.axis-x')
        .attr('transform', `translate(${margin.left},${margin.top + innerH})`);
    const gY = svg.select<SVGGElement>('g.axis-y')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const gGrid = svg.select<SVGGElement>('g.grid')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = dataRef.current;
    if (data.length === 0) return;

    // X scale = oldest to newest sample in buffer
    const tMin = data[0].t;
    const tMax = data[data.length - 1].t;
    const xScale = d3.scaleLinear().domain([tMin, tMax]).range([0, innerW]);

    // ---------- Y domain ----------
    const allVals = data.flatMap(d =>
        Object.entries(d)
        .filter(([k, v]) => k !== 't' && typeof v === 'number')
        .map(([_, v]) => v as number)
    );
    if (allVals.length === 0) return;

    let yMinAuto: number, yMaxAuto: number;
    if (percentile && allVals.length > 1) {
        const [pLo, pHi] = percentile;
        const sorted = [...allVals].sort((a, b) => a - b);
        const pick = (p: number) =>
        sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];
        yMinAuto = pick(pLo);
        yMaxAuto = pick(pHi);
    } else {
        yMinAuto = d3.min(allVals)!;
        yMaxAuto = d3.max(allVals)!;
    }

    let yMin = fixedYMin !== undefined ? fixedYMin : yMinAuto;
    let yMax = fixedYMax !== undefined ? fixedYMax : yMaxAuto;

    if (zeroCenter) {
        const m = Math.max(Math.abs(yMin), Math.abs(yMax));
        yMin = -m; yMax = m;
    }
    if (yMax === yMin) {
        const bump = Math.max(1, Math.abs(yMax) || 1);
        yMin -= bump; yMax += bump;
    }

    const pad = (yMax - yMin) * 0.10;
    const yScale = d3.scaleLinear()
        .domain([yMin - pad, yMax + pad])
        .range([innerH, 0])
        .nice();

    // ---- define keys BEFORE using them (fix) ----
    const keys = seriesOrder || Object.keys(sample);

    // --- colored dots for the latest sample so zeros are visible ---
    let gDots = svg.select<SVGGElement>('g.dots');
    if (gDots.empty()) {
        gDots = svg.append('g')
        .attr('class', 'dots')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }
    const last = data[data.length - 1];
    keys.forEach((key, i) => {
        const color = colors[key] || d3.schemeCategory10[i % 10];
        const v = (last as any)[key] ?? 0; // show a dot at 0 if missing
        const sel = gDots.selectAll<SVGCircleElement, typeof last>(`circle.dot-${key}`)
        .data([last]);
        sel.join(
        enter => enter.append('circle')
            .attr('class', `dot-${key}`)
            .attr('r', 3)
            .attr('fill', color)
            .attr('stroke', color)
            .attr('vector-effect', 'non-scaling-stroke'),
        update => update
        )
        .attr('cx', xScale(last.t))
        .attr('cy', yScale(v));
    });

    // ---------- Axes + grid ----------
    const axisColor = getComputedStyle(svgRef.current.parentElement as Element).color;

    gX.call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d} s` as any) as any)
        .selectAll('path,line').attr('stroke', axisColor);
    gX.selectAll('text').attr('fill', axisColor);

    gY.call(d3.axisLeft(yScale).ticks(5) as any)
        .selectAll('path,line').attr('stroke', axisColor);
    gY.selectAll('text').attr('fill', axisColor);

    gGrid.selectAll('g.gridline').remove();
    gGrid.append('g')
        .attr('class', 'gridline')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(() => '') as any)
        .selectAll('line')
        .attr('stroke', axisColor)
        .attr('stroke-opacity', 0.15);

    // --- ZERO reference line (optional) ---
    const [dMin, dMax] = yScale.domain();
    const showZero = dMin <= 0 && dMax >= 0;
    gGrid.selectAll('line.zero-ref')
        .data(showZero ? [0] : [])
        .join(
        enter => enter.append('line')
            .attr('class', 'zero-ref')
            .attr('x1', 0)
            .attr('x2', innerW)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0))
            .attr('stroke', axisColor)
            .attr('stroke-opacity', 0.45)
            .attr('stroke-dasharray', '4 4'),
        update => update
            .attr('x2', innerW)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0)),
        exit => exit.remove()
        );

    // ---------- Lines ----------
    keys.forEach((key, i) => {
        const color = colors[key] || d3.schemeCategory10[i % 10];
        let path = svg.select<SVGPathElement>(`path.line-${key}`);
        if (path.empty()) {
        path = svg.append('path')
            .attr('class', `line-${key}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('vector-effect', 'non-scaling-stroke');
        }
        const line = d3.line<any>()
        .x(d => xScale(d.t))
        .y(d => yScale((d as any)[key]));
        path
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('d', line(data) || '');
    });
}



  // ---------- Container + Legend ----------
  return (
    <div
      ref={wrapRef}
      className="
        w-full mt-3 rounded-2xl p-3 space-y-2
        bg-slate-100 text-slate-800
        dark:bg-slate-900/70 dark:text-slate-200
        shadow-inner
      "
    >
      {showLegend && (
        <div className="flex flex-wrap gap-4 text-xs font-medium">
          {(seriesOrder || Object.keys(sample)).map((k, i) => (
            <div key={k} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: colors[k] || d3.schemeCategory10[i % 10] }}
              />
              <span>{labels[k] ?? k.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
