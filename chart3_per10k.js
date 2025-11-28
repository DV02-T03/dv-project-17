// js/chart3_per10k.js
import { loadCombinedFinesData } from "./load_data.js";

(async function () {

  const raw = await loadCombinedFinesData();
  const filtered = raw.filter(d => d.METRIC === "speed_fines");

  const yearMap = d3.rollup(
    filtered,
    v => ({
      totalFines: d3.sum(v, d => d.FINES),
      totalLicences: d3.sum(v, d => d.Total_Licence_Holders)
    }),
    d => d.YEAR
  );

  const data = Array.from(yearMap, ([year, obj]) => ({
    Year: +year,
    Per10k: obj.totalLicences > 0
      ? (obj.totalFines / obj.totalLicences) * 10000
      : 0
  }))
    .filter(d => d.Year >= 2014 && d.Year <= 2024)
    .sort((a, b) => a.Year - b.Year);

  const container = d3.select("#chart3-per10k");
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
    .domain([0, d3.max(data, d => d.Per10k) * 1.15])
    .range([innerHeight, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text").style("fill", "white");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text").style("fill", "white");

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Per10k))
    .curve(d3.curveMonotoneX);

  // Draw line
  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // ---------------------------
  // INTERACTIVE ELEMENTS
  // ---------------------------

  // Tooltip group
  const tooltip = g.append("g")
    .style("opacity", 0);

  tooltip.append("rect")
    .attr("width", 130)
    .attr("height", 45)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "#333")
    .attr("opacity", 0.85);

  const tooltipText1 = tooltip.append("text")
    .attr("x", 10)
    .attr("y", 18)
    .attr("fill", "white")
    .attr("font-size", "12px");

  const tooltipText2 = tooltip.append("text")
    .attr("x", 10)
    .attr("y", 35)
    .attr("fill", "white")
    .attr("font-size", "12px");

  // Hover line
  const hoverLine = g.append("line")
    .attr("stroke", "white")
    .attr("stroke-width", 1.2)
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .style("opacity", 0);

  // Hover circle
  const hoverCircle = g.append("circle")
    .attr("r", 5)
    .attr("fill", "#ff7f0e")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .style("opacity", 0);

  // Mouse event overlay
  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {

      const [mx] = d3.pointer(event);
      const yearScale = x.invert(mx);

      const closest = data.reduce((a, b) =>
        Math.abs(b.Year - yearScale) < Math.abs(a.Year - yearScale) ? b : a
      );

      const cx = x(closest.Year);
      const cy = y(closest.Per10k);

      hoverLine
        .attr("x1", cx)
        .attr("x2", cx)
        .style("opacity", 1);

      hoverCircle
        .attr("cx", cx)
        .attr("cy", cy)
        .style("opacity", 1);

      tooltip
        .attr("transform", `translate(${cx + 10}, ${cy - 50})`)
        .style("opacity", 1);

      tooltipText1.text(`Year: ${closest.Year}`);
      tooltipText2.text(`Per 10k: ${closest.Per10k.toFixed(2)}`);

    })
    .on("mouseleave", () => {
      hoverLine.style("opacity", 0);
      hoverCircle.style("opacity", 0);
      tooltip.style("opacity", 0);
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-weight", "bold")
    .text("Speeding Fines per 10,000 Licences (2014–2024)");

})();
