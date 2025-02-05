import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Chart, registerables } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

Chart.register(...registerables);

const ChartComponent = ({ type, data, options }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        const svg = d3.select(chartRef.current);
         svg.selectAll('*').remove();


      if (type === 'heatmap' && data && options) {
            const margin = { top: 20, right: 100, bottom: 150, left: 120 };
            const svgWidth = chartRef.current.parentElement.offsetWidth * 0.8;
            const labels = data.labels;
                const labelHeights = labels.map(label => {
                    const text = svg.append("text")
                        .text(label)
                        .style("text-anchor", "end")
                        .attr("transform", "translate(-10,0)rotate(-45)")
                        .node();
                        const height = text.getBBox().height
                     svg.selectAll("text").remove();
                    return height;
                });
             const maxLabelHeight = Math.max(...labelHeights)
           const updatedLeftMargin = Math.max(maxLabelHeight, margin.left);
            const updatedBottomMargin = Math.max(maxLabelHeight * 0.8, margin.bottom);
              const marginWidth = { top: 20, right: 100, bottom: updatedBottomMargin, left: updatedLeftMargin };
                const width = svgWidth - marginWidth.left - marginWidth.right;
                const height = 600 - marginWidth.top - marginWidth.bottom;
                const heatmapData = data.datasets[0].data;
            const x = d3.scaleBand()
                .range([0, width])
                .domain(labels)
                .padding(0.01);
            const y = d3.scaleBand()
                .range([height, 0])
                .domain(labels)
                .padding(0.01);
           const colorScale = d3.scaleLinear()
               .domain([-1,0,1])
               .range(["#0000ff","#ffffff", "#ff0000"]);
           const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'd3-tooltip')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('background-color', 'white')
                .style('border', '1px solid black')
                .style('padding', '5px');

            const svgElement = svg
                .attr("width", width + marginWidth.left + marginWidth.right)
                .attr("height", height + marginWidth.top + marginWidth.bottom)
              .append("g")
                .attr("transform",`translate(${marginWidth.left},${marginWidth.top})`);

           svgElement.selectAll()
            .data(heatmapData, d => d.x + ':' + d.y)
            .enter()
            .append("rect")
                .attr("x", d => x(d.x))
                .attr("y", d => y(d.y))
                .attr("width", x.bandwidth() )
                .attr("height", y.bandwidth() )
                 .style("fill", d => colorScale(d.value))
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    tooltip.html(`Correlation ${d.value.toFixed(2)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 15) + "px");
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                         .style("opacity", 0);
                });
               svgElement.append("g")
                 .style("font-size","0.8em")
                 .attr("transform", `translate(0,${height})`)
                 .call(d3.axisBottom(x))
                 .selectAll("text")
                  .attr("transform", "translate(-10,0)rotate(-45)")
                 .style("text-anchor", "end")


              svgElement.append("g")
                .style("font-size","0.8em")
                  .call(d3.axisLeft(y));

            // Add color key (legend)
             const legendHeight = 20;
              const legendWidth = 10;
              const legendXScale = d3.scaleLinear().domain([-1,1]).range([height - 20,20]);
              const legendAxis = d3.axisRight(legendXScale);

              const legendGroup = svgElement
                   .append('g')
                   .attr('transform', `translate(${width + 50},0)`);

            legendGroup
                 .selectAll('rect')
                   .data(d3.range(-1,1,0.1))
                 .enter()
                .append('rect')
                  .attr('x',0)
                .attr('y',d => legendXScale(d))
                  .attr('width', legendWidth)
                .attr('height', legendHeight)
                .style('fill', d => colorScale(d))

               legendGroup.append("g").call(legendAxis);
            }
             if (type !== 'heatmap') {
              const ctx = chartRef.current.getContext('2d');

               if (chartInstance.current) {
                   chartInstance.current.destroy();
               }

                chartInstance.current = new Chart(ctx, {
                    type: type,
                    data: data,
                     options: options,
                });
            }


         return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
         };
    }, [type, data, options]);

      return type === 'heatmap' ? <svg ref={chartRef} /> : <canvas ref={chartRef} />;
};

export default ChartComponent;