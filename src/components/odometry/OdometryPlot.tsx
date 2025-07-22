'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface Props {
  path: { x: number; y: number }[];
}

export default function OdometryPlot({ path }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const size = 400;
    const margin = 20;

    const allX = path.map(p => p.x);
    const allY = path.map(p => p.y);

    // Always include origin
    allX.push(0);
    allY.push(0);

    const maxAbs = Math.max(
      Math.abs(d3.max(allX) || 0),
      Math.abs(d3.min(allX) || 0),
      Math.abs(d3.max(allY) || 0),
      Math.abs(d3.min(allY) || 0)
    );

    // Symmetric scale around (0,0)
    const xScale = d3.scaleLinear()
      .domain([-maxAbs, maxAbs])
      .range([margin, size - margin]);

    const yScale = d3.scaleLinear()
      .domain([-maxAbs, maxAbs])
      .range([size - margin, margin]); // y-axis flipped

    // Draw axes
    svg.append('line')
      .attr('x1', xScale(0)).attr('x2', xScale(0))
      .attr('y1', 0).attr('y2', size)
      .attr('stroke', '#888').attr('stroke-dasharray', '4 2');

    svg.append('line')
      .attr('x1', 0).attr('x2', size)
      .attr('y1', yScale(0)).attr('y2', yScale(0))
      .attr('stroke', '#888').attr('stroke-dasharray', '4 2');

    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    svg.append('path')
      .datum(path)
      .attr('fill', 'none')
      .attr('stroke', '#0ff')
      .attr('stroke-width', 2)
      .attr('d', line);

    const last = path[path.length - 1] || { x: 0, y: 0 };
    svg.append('circle')
      .attr('cx', xScale(last.x))
      .attr('cy', yScale(last.y))
      .attr('r', 4)
      .attr('fill', 'red');
  }, [path]);


  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
