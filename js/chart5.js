// js/chart5.js

import { loadFinesLicences } from "./load_data.js";

(async function () {

  // --------------------------------------
  // LOAD DATA
  // --------------------------------------
  const raw = await loadFinesLicences();
  console.log("Loaded data for chart5:", raw.slice(0, 5));

  // --------------------------------------
  // FILTER — NSW + VIC + correct metric + 2014–2024
  // --------------------------------------
  const filtered = raw.filter(d =>
    ["speed_fines", "speeding_fines", "speed"].includes(d.Metric) &&
    ["NSW", "VIC"].includes(d.Jurisdiction) &&
    d.Year >= 2014 &&
    d.Year <= 2024
  );

// -----------------------------------------------------
// SAFE AGGREGATION for YEAR + JURISDICTION
// -----------------------------------------------------
const aggregated = d3.rollups(
  filtered,
  v => {
    if (v.length === 0) {
      return { Fines: 0, Licences: 0, Rate: 0 };
    }

    const finesSum = d3.sum(v, d => +d.Fines);

    // Extract unique TOTAL LICENCES for this JURISDICTION + YEAR
    const licences = d3.max(v, d => +d.TotalLicences);

    const rate = licences > 0 ? (finesSum / licences) * 10000 : 0;

    return {
      Fines: finesSum,
      Licences: licences,
      Rate: rate
    };
  },
  d => d.Jurisdiction,
  d => +d.Year
)
  .map(([Jurisdiction, years]) =>
    years.map(([Year, v]) => ({
      Jurisdiction,
      Year,
      Fines: v.Fines,
      Licences: v.Licences,
      Rate: v.Rate
    }))
  )
  .flat();

// Remove NaN just in case
const cleaned = aggregated.filter(d => !isNaN(d.Rate));

  // Jurisdictions (should only be NSW + VIC)
  const jurisdictions = ["NSW", "VIC"];

  // Prepare line series
const linesData = jurisdictions.map(j => ({
  name: j,
  values: cleaned
    .filter(d => d.Jurisdiction === j)
    .sort((a, b) => a.Year - b.Year)
}));

  // --------------------------------------
  // SVG SETUP
  // --------------------------------------
  const container = d3.select("#chart5");
  container.selectAll("*").remove();

  const width = 900;
  const height = 450;

  const margin = { top: 40, right: 255, bottom: 60, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // --------------------------------------
  // SCALES
  // --------------------------------------
  const x = d3.scaleLinear()
    .domain([2014, 2024])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(linesData, group => d3.max(group.values, v => v.Rate)) * 1.1
    ])
    .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain(jurisdictions)
    .range(d3.schemeSet2);

  // --------------------------------------
  // AXES
  // --------------------------------------
  chartArea.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  chartArea.append("g")
    .call(d3.axisLeft(y));

  // --------------------------------------
  // LINE GENERATOR
  // --------------------------------------
  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Rate))
    .curve(d3.curveMonotoneX);

  // --------------------------------------
  // DRAW LINES
  // --------------------------------------
  chartArea.selectAll(".fine-line")
    .data(linesData)
    .enter()
    .append("path")
    .attr("class", "fine-line")
    .attr("fill", "none")
    .attr("stroke", d => color(d.name))
    .attr("stroke-width", 2)
    .attr("d", d => line(d.values));

  // --------------------------------------
  // TOOLTIP + HOVER
  // --------------------------------------
  const tooltip = chartArea.append("g")
    .attr("class", "tooltip")
    .style("opacity", 0);

  tooltip.append("rect")
    .attr("width", 140)
    .attr("height", 80)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "#333")
    .attr("opacity", 0.85);

  tooltip.append("text").attr("x", 10).attr("y", 20).attr("fill", "white");
  tooltip.append("text").attr("x", 10).attr("y", 40).attr("fill", "white");
  tooltip.append("text").attr("x", 10).attr("y", 60).attr("fill", "white");

  const hoverLine = chartArea.append("line")
    .attr("stroke", "#999")
    .attr("stroke-width", 1.2)
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .style("opacity", 0);

  const hoverDots = {};
  jurisdictions.forEach(j => {
    hoverDots[j] = chartArea.append("circle")
      .attr("r", 5)
      .attr("fill", color(j))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .style("opacity", 0);
  });

  chartArea.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", event => {
      const [mx] = d3.pointer(event);
      const year = Math.round(x.invert(mx));

      const clampYear = Math.min(2024, Math.max(2014, year));
      const cx = x(clampYear);

      hoverLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);

      const tooltipLines = [`Year: ${clampYear}`];

      jurisdictions.forEach(j => {
        const point = linesData
          .find(g => g.name === j)
          .values.find(v => v.Year === clampYear);

        if (point) {
          hoverDots[j]
            .attr("cx", cx)
            .attr("cy", y(point.Rate))
            .style("opacity", 1);

          tooltipLines.push(`${j}: ${point.Rate.toFixed(1)} per 10k`);
        }
      });

      tooltip.attr("transform", `translate(${cx + 15}, 20)`);

      tooltip.selectAll("text")
        .data(tooltipLines)
        .text(d => d);

      tooltip.style("opacity", 1);
    })
    .on("mouseleave", () => {
      hoverLine.style("opacity", 0);
      tooltip.style("opacity", 0);
      jurisdictions.forEach(j => hoverDots[j].style("opacity", 0));
    });

  // --------------------------------------
  // LEGEND
  // --------------------------------------
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  jurisdictions.forEach((j, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    g.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(j));

    g.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .attr("fill", "white")
      .style("font-size", "12px")
      .text(j);
  });

  // --------------------------------------
  // LABELS & TITLE
  // --------------------------------------
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Speeding Fines per 10,000 Licences");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Speeding Fines per 10,000 Licences (NSW vs VIC, 2014–2024)");

})();
