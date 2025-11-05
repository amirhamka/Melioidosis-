import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TornadoResult } from '@shared/analysisTypes';

interface TornadoChartProps {
  data: TornadoResult | null;
}

export default function TornadoChart({ data }: TornadoChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current || data.bars.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 60, left: 160 };
    const width = 700 - margin.left - margin.right;
    const height = data.bars.length * 50 + margin.top + margin.bottom;

    svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const allValues = data.bars.flatMap((bar) => [bar.low_impact, bar.high_impact]);
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(data.bars.map((d) => d.variable_name))
      .range([0, height])
      .padding(0.3);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Base case line
    const baseCaseX = xScale(data.base_outcome);
    g.append('line')
      .attr('x1', baseCaseX)
      .attr('x2', baseCaseX)
      .attr('y1', -10)
      .attr('y2', height)
      .attr('stroke', '#de350b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    g.append('text')
      .attr('x', baseCaseX)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#de350b')
      .text(`Base Case: ${data.base_outcome.toFixed(2)}`);

    // Tornado bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(data.bars)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(0, ${yScale(d.variable_name)})`);

    // Low impact bars
    barGroups
      .append('rect')
      .attr('x', (d) => Math.min(xScale(d.low_impact), baseCaseX))
      .attr('y', 0)
      .attr('width', (d) => Math.abs(xScale(d.low_impact) - baseCaseX))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#0052cc')
      .attr('opacity', 0.8)
      .on('mouseover', (event, d) => {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip({
          x: mouseX + 10,
          y: mouseY - 10,
          content: `${d.variable_name}<br/>Low: ${d.low_impact.toFixed(2)}<br/>High: ${d.high_impact.toFixed(2)}`,
        });
      })
      .on('mouseout', () => setTooltip(null));

    // High impact bars
    barGroups
      .append('rect')
      .attr('x', (d) => Math.min(xScale(d.high_impact), baseCaseX))
      .attr('y', 0)
      .attr('width', (d) => Math.abs(xScale(d.high_impact) - baseCaseX))
      .attr('height', yScale.bandwidth())
      .attr('fill', '#6554c0')
      .attr('opacity', 0.8)
      .on('mouseover', (event, d) => {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip({
          x: mouseX + 10,
          y: mouseY - 10,
          content: `${d.variable_name}<br/>Low: ${d.low_impact.toFixed(2)}<br/>High: ${d.high_impact.toFixed(2)}`,
        });
      })
      .on('mouseout', () => setTooltip(null));

    // Axes
    g.append('g').call(d3.axisLeft(yScale)).style('font-size', '12px');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.2f')))
      .style('font-size', '12px');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 20)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text('Variable');

    // X-axis label
    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text('Expected Effectiveness (QALYs)');
  }, [data]);

  if (!data) {
    return <div>Run a sensitivity analysis to see the Tornado Chart.</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      {tooltip && (
        <div
          className="tooltip"
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            padding: '8px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
}
