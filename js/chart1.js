// js/chart1.js

import { loadFinesLicences } from "./load_data.js";

(async function () {
  const raw = await loadFinesLicences();
  console.log("Loaded fines/licence data:", raw.slice(0, 5));

  // --- FILTER: speed fines only (2020–2024)
  const filtered = raw.filter(d =>
    d.Metric === "speed_fines" &&
    d.Year >= 2020 &&
    d.Year <= 2024
  );

  // --- GROUP BY JURISDICTION
  const grouped = d3.rollups(
    filtered,
    v => ({
      totalFines: d3.sum(v, d => d.Fines),
      totalLicences: d3.sum(v, d => d.TotalLicences)
    }),
    d => d.Jurisdiction
  );

  // Convert to array of objects
  const data = grouped.map(([Jurisdiction, vals]) => ({
    Jurisdiction,
    finesPer10k: (vals.totalFines / vals.totalLicences) * 10000
  }));

  console.log("Computed fines/10k:", data);

  // --- DRAW CHART ---
  const container = d3.select("#chart1-speeding");
  container.selectAll("*").remove();

const width = 800;
const height = 450;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- TOOLTIP ---
  const tooltip = svg.append("g")
    .attr("class", "tooltip-bar")
    .style("opacity", 0);

  tooltip.append("rect")
    .attr("width", 140)
    .attr("height", 40)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "black")
    .attr("opacity", 0.75);

  tooltip.append("text")
    .attr("x", 70)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("NA");

  // --- SCALES ---
  const x = d3.scaleBand()
    .domain(data.map(d => d.Jurisdiction))
    .range([0, innerWidth])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.finesPer10k) * 1.1])
    .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.Jurisdiction))
    .range(d3.schemeSet2);

  // --- BARS ---
chartArea.selectAll("rect")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", d => x(d.Jurisdiction))
  .attr("y", d => y(d.finesPer10k))
  .attr("width", x.bandwidth())
  .attr("height", d => innerHeight - y(d.finesPer10k))
  .attr("fill", d => color(d.Jurisdiction))
  .on("mouseenter", function (e, d) {

    const barX = +d3.select(this).attr("x") + margin.left;
    const barY = +d3.select(this).attr("y") + margin.top;

    tooltip.select("text")
      .text(`${d.Jurisdiction}: ${d.finesPer10k.toFixed(1)} / 10k`);

    tooltip
      .attr("transform", `translate(${barX + x.bandwidth()/2 - 70}, ${barY - 50})`)
      .transition()
      .duration(150)
      .style("opacity", 1);
  })
  .on("mouseleave", function () {
    tooltip
      .transition()
      .duration(150)
      .style("opacity", 0);
  });

  // --- AXES ---
  chartArea.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "white");  

  chartArea.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white"); 

  // --- LABELS ---
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Jurisdiction");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Speeding Fines per 10,000 Licences");

  // --- TITLE ---
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Speeding Fines per 10,000 Licence Holders (2020–2024)");

})();
