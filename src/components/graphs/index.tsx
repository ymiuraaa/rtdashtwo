'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { D3TimeSeriesProps } from './types';
import { DEFAULT_COLORS } from './colors';

type Datum = { t: number } & Record<string, number>;

export default function D3TimeSeries({
  sample,
  seriesOrder,
  colors = DEFAULT_COLORS,
  maxPoints = 200,
  height = 160,
  fixedYMin,
  fixedYMax,
  percentile,
  zeroCenter = false,
  showLegend = true,
  labels = {} as Record<string, string>,
}: D3TimeSeriesProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dataRef = useRef<Datum[]>([]);
  const startT = useRef<number>(Date.now());

  const colorMap: Record<string, string> = colors as Record<string, string>;
  const labelMap: Record<string, string> = labels as Record<string, string>;

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
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 14)
      .attr('fill', 'transparent');

    svg.append('g').attr('class', 'grid');
    svg.append('g').attr('class', 'axis axis-x');
    svg.append('g').attr('class', 'axis axis-y');

    svgRef.current = svg.node() as SVGSVGElement;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        d3.select(svgRef.current)
          .attr('viewBox', `0 0 ${w} ${height}`)
          .select<SVGRectElement>('rect.chart-bg')
          .attr('width', w);
        draw();
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = (Date.now() - startT.current) / 1000;
    dataRef.current.push({ t, ...sample });
    if (dataRef.current.length > maxPoints) dataRef.current.shift();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  function draw() {
    if (!svgRef.current || !wrapRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
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

    const tMin = data[0].t;
    const tMax = data[data.length - 1].t;
    const xScale = d3.scaleLinear().domain([tMin, tMax]).range([0, innerW]);

    const allVals: number[] = data.flatMap(d =>
      Object.entries(d)
        .filter(([k, v]) => k !== 't' && typeof v === 'number')
        .map(([, v]) => v as number)
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

    const pad = (yMax - yMin) * 0.1;
    const yScale = d3.scaleLinear()
      .domain([yMin - pad, yMax + pad])
      .range([innerH, 0])
      .nice();

    const keys: string[] = seriesOrder ?? Object.keys(sample);

    let gDots = svg.select<SVGGElement>('g.dots');
    if (gDots.empty()) {
      gDots = svg.append('g')
        .attr('class', 'dots')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }
    const last = data[data.length - 1];

    keys.forEach((key, i) => {
      const color = colorMap[key] ?? d3.schemeCategory10[i % 10];
      const v = last[key] ?? 0;
      const sel = gDots.selectAll<SVGCircleElement, Datum>(`circle.dot-${key}`)
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

    const axisColor = getComputedStyle(svgRef.current.parentElement as Element).color;

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat((d: d3.NumberValue) => `${Number(d)} s`);

    gX.call(xAxis);
    gX.selectAll<SVGPathElement, unknown>('path').attr('stroke', axisColor);
    gX.selectAll<SVGLineElement, unknown>('line').attr('stroke', axisColor);
    gX.selectAll<SVGTextElement, unknown>('text').attr('fill', axisColor);

    const yAxis = d3.axisLeft(yScale).ticks(5);
    gY.call(yAxis);
    gY.selectAll<SVGPathElement, unknown>('path').attr('stroke', axisColor);
    gY.selectAll<SVGLineElement, unknown>('line').attr('stroke', axisColor);
    gY.selectAll<SVGTextElement, unknown>('text').attr('fill', axisColor);

    gGrid.selectAll('g.gridline').remove();
    const gridAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerW)
      .tickFormat(() => '');

    gGrid
      .append('g')
      .attr('class', 'gridline')
      .call(gridAxis)
      .selectAll<SVGLineElement, unknown>('line')
      .attr('stroke', axisColor)
      .attr('stroke-opacity', 0.15);

    const [dMin, dMax] = yScale.domain();
    const showZero = dMin <= 0 && dMax >= 0;
    gGrid.selectAll<SVGLineElement, number>('line.zero-ref')
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

    keys.forEach((key, i) => {
      const color = colorMap[key] ?? d3.schemeCategory10[i % 10];
      let path = svg.select<SVGPathElement>(`path.line-${key}`);
      if (path.empty()) {
        path = svg.append('path')
          .attr('class', `line-${key}`)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('vector-effect', 'non-scaling-stroke');
      }

      const line = d3.line<Datum>()
        .x((d) => xScale(d.t))
        .y((d) => yScale(d[key] ?? 0));

      path
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('d', line(data) ?? '');
    });
  }

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
          {(seriesOrder ?? Object.keys(sample)).map((keyName, idx) => (
            <div key={keyName} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: colorMap[keyName] ?? d3.schemeCategory10[idx % 10] }}
              />
              <span>{labelMap[keyName] ?? keyName.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
