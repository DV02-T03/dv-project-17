// js/chart3_fines.js
import { loadCombinedFinesData } from "./load_data.js";

(async function () {

  const raw = await loadCombinedFinesData();
  const filtered = raw.filter(d => d.METRIC === "speed_fines");

  const yearMap = d3.rollup(
    filtered,
    v => d3.sum(v, d => d.FINES),
    d => d.YEAR
  );

  const data = Array.from(yearMap, ([year, total]) => ({
    Year: +year,
    TotalFines: total
  }))
    .filter(d => d.Year >= 2014 && d.Year <= 2024)
    .sort((a, b) => a.Year - b.Year);

  const container = d3.select("#chart3-total");
  container.selectAll("*").remove();

  const width = 800;
  const height = 450;

  const margin = { top: 40, right: 40, bottom: 60, left: 90 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", 1500)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.TotalFines) * 1.1])
    .range([innerHeight, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text").style("fill", "white");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text").style("fill", "white");

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.TotalFines))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // ---------------------------
  // INTERACTIVITY
  // ---------------------------

  // Tooltip group
  const tooltip = g.append("g")
    .style("opacity", 0);

  tooltip.append("rect")
    .attr("width", 120)
    .attr("height", 50)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "#333")
    .attr("opacity", 0.85);

  tooltip.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("fill", "white")
    .attr("font-size", "12px");

  tooltip.append("text")
    .attr("x", 10)
    .attr("y", 40)
    .attr("fill", "white")
    .attr("font-size", "12px");

  // Hover vertical line
  const hoverLine = g.append("line")
    .attr("stroke", "white")
    .attr("stroke-width", 1.2)
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .style("opacity", 0);

  // Hover dot
  const hoverDot = g.append("circle")
    .attr("r", 5)
    .attr("fill", "#1f77b4")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .style("opacity", 0);

  // Transparent rectangle for mouse capture
  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {

      const [mx] = d3.pointer(event);
      const yearScale = x.invert(mx);

      // closest point
      const closest = data.reduce((a, b) =>
        Math.abs(b.Year - yearScale) < Math.abs(a.Year - yearScale) ? b : a
      );

      const cx = x(closest.Year);
      const cy = y(closest.TotalFines);

      hoverLine
        .attr("x1", cx)
        .attr("x2", cx)
        .style("opacity", 1);

      hoverDot
        .attr("cx", cx)
        .attr("cy", cy)
        .style("opacity", 1);

      tooltip.attr("transform", `translate(${cx + 15}, ${cy - 35})`);
      tooltip.selectAll("text")
        .data([
          `Year: ${closest.Year}`,
          `Fines: ${closest.TotalFines.toLocaleString()}`
        ])
        .text(d => d);

      tooltip.style("opacity", 1);
    })
    .on("mouseleave", () => {
      hoverLine.style("opacity", 0);
      hoverDot.style("opacity", 0);
      tooltip.style("opacity", 0);
    });

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-weight", "bold")
    .text("Total Speeding Fines (2014–2024)");

})();
