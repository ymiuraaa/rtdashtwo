'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type Props = {
  path: { x: number; y: number }[];
};

export default function OdometryPlot({ path }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || path.length === 0) return;

    const svg = d3.select(ref.current);
    const width = ref.current.clientWidth;
    const height = ref.current.clientHeight;
    svg.selectAll('*').remove(); // Clear previous

    // Get bounds of the path
    const xExtent = d3.extent(path, (d: { x: number; y: number }) => d.x) as [number, number];
    const yExtent = d3.extent(path, (d: { x: number; y: number }) => d.y) as [number, number];

    // Ensure some padding
    const padding = 20;
    const xRange = xExtent[1] - xExtent[0] || 1;
    const yRange = yExtent[1] - yExtent[0] || 1;
    const maxRange = Math.max(xRange, yRange) / 2;

    const xCenter = (xExtent[0] + xExtent[1]) / 2;
    const yCenter = (yExtent[0] + yExtent[1]) / 2;

    const xScale = d3
      .scaleLinear()
      .domain([xCenter - maxRange, xCenter + maxRange])
      .range([padding, width - padding]);

    const yScale = d3
      .scaleLinear()
      .domain([yCenter + maxRange, yCenter - maxRange]) // invert y
      .range([padding, height - padding]);

    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveLinear);

    // Draw path
    svg
      .append('path')
      .datum(path)
      .attr('fill', 'none')
      .attr('stroke', '#7df2c3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Draw origin dot
    svg
      .append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(0))
      .attr('r', 4)
      .attr('fill', 'white');

    // Optional: Add axes or grid
  }, [path]);

  return (
    <svg
      ref={ref}
      className="w-full h-[100%]"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
