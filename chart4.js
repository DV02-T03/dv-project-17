// js/chart4.js
// INTERACTIVE PIE CHART WITH HOVER TOOLTIP + YEAR + JURISDICTION FILTER

import { loadFinesLicences } from "./load_data.js";

(async function () {

  // --------------------------------------
  // LOAD DATA
  // --------------------------------------
  const raw = await loadFinesLicences();
  console.log("Loaded Fines Data:", raw.slice(0, 5));

  // Extract years and jurisdictions
  const years = [...new Set(raw.map(d => +d.Year))].sort();
  const jurisdictions = [...new Set(raw.map(d => d.Jurisdiction))].sort();

  let currentYear = years[0];
  let currentJurisdiction = jurisdictions[0];

  // --------------------------------------
  // CREATE YEAR BUTTONS
  // --------------------------------------
  const yearControls = d3.select("#chart4_controls");
  yearControls.selectAll("*").remove();

  yearControls.append("p")
    .text("Select Year:")
    .style("font-weight", "600")
    .style("color", "#ffd54f")
    .style("margin-bottom", "10px");

  const yearButtons = yearControls.selectAll(".year-btn")
    .data(years)
    .enter()
    .append("button")
    .attr("class", d => `year-btn ${d === currentYear ? "active" : ""}`)
    .text(d => d)
    .on("click", (event, year) => {
      d3.selectAll(".year-btn").classed("active", false);
      d3.select(event.currentTarget).classed("active", true);
      currentYear = year;
      drawPieChart(currentYear, currentJurisdiction);
    });

  // --------------------------------------
  // CREATE JURISDICTION BUTTONS
  // --------------------------------------
  const jurControls = d3.select("#chart4_jurisdiction_controls");
  jurControls.selectAll("*").remove();

  jurControls.append("p")
    .text("Select Jurisdiction:")
    .style("font-weight", "600")
    .style("color", "#ffd54f")
    .style("margin-bottom", "10px");

  const jurButtons = jurControls.selectAll(".jur-btn")
    .data(jurisdictions)
    .enter()
    .append("button")
    .attr("class", d => `jur-btn ${d === currentJurisdiction ? "active" : ""}`)
    .text(d => d)
    .on("click", (event, j) => {
      d3.selectAll(".jur-btn").classed("active", false);
      d3.select(event.currentTarget).classed("active", true);
      currentJurisdiction = j;
      drawPieChart(currentYear, currentJurisdiction);
    });

  // --------------------------------------
  // DRAW FUNCTION
  // --------------------------------------
  const drawPieChart = (year, jurisdiction) => {

    // Filter dataset for selected jurisdiction + year
    const speed = raw.filter(d =>
      d.Metric === "speed_fines" &&
      d.Jurisdiction === jurisdiction &&
      +d.Year === +year
    );

    // GROUP BY DETECTION METHOD
    const summary = d3.rollups(
      speed,
      v => d3.sum(v, d => d.Fines),
      d => d.Detection
    ).map(([Detection, TotalFines]) => ({
      Detection,
      TotalFines
    }));

    const total = d3.sum(summary, d => d.TotalFines);

    console.log(`Pie Summary for ${jurisdiction}, ${year}:`, summary);

    // --------------------------------------
    // CHART SETUP
    // --------------------------------------
    const container = d3.select("#chart4");
    container.selectAll("*").remove();

    const width = container.node().clientWidth || 600;
    const height = 420;
    const margin = 40;

    const radius = Math.min(width, height) / 2 - margin;

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const chart = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // --------------------------------------
    // COLOR SCALE
    // --------------------------------------
    const color = d3.scaleOrdinal()
      .domain(summary.map(d => d.Detection))
      .range(d3.schemeSet2);

    // --------------------------------------
    // PIE GENERATOR
    // --------------------------------------
    const pie = d3.pie()
      .sort(null)
      .value(d => d.TotalFines);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(0)
      .outerRadius(radius + 10);

    // --------------------------------------
    // TOOLTIP - FIXED POSITIONING
    // --------------------------------------
    const tooltip = d3.select("body").append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("padding", "10px 15px")
      .style("background", "rgba(42, 42, 42, 0.95)")
      .style("color", "white")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("font-family", "Roboto, sans-serif")
      .style("border", "1px solid #ffd54f")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("max-width", "250px");

    // --------------------------------------
    // DRAW PIE SLICES
    // --------------------------------------
    const slices = chart.selectAll("path")
      .data(pie(summary))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.Detection))
      .attr("stroke", "#1e1e1e")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .style("opacity", 0.9)
      .on("mouseenter", function (event, d) {
        // Highlight slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover)
          .style("opacity", 1);

        // Calculate percentage
        const pct = ((d.data.TotalFines / total) * 100).toFixed(1);

        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; color: #ffd54f; margin-bottom: 5px;">${d.data.Detection}</div>
            <div>Fines: <strong>${d.data.TotalFines.toLocaleString()}</strong></div>
            <div>Percentage: <strong>${pct}%</strong></div>
          `);
      })
      .on("mousemove", function (event) {
        // Position tooltip near cursor
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseleave", function () {
        // Restore slice
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc)
          .style("opacity", 0.9);

        // Hide tooltip
        tooltip.style("opacity", 0);
      });

    // --------------------------------------
    // ADD PERCENTAGE LABELS TO SLICES
    // --------------------------------------
    const labelArc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    chart.selectAll("text.percentage")
      .data(pie(summary))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("pointer-events", "none")
      .text(d => {
        const pct = ((d.data.TotalFines / total) * 100).toFixed(1);
        return pct >= 5 ? `${pct}%` : ""; // Only show if slice is large enough
      });

    // --------------------------------------
    // LEGEND
    // --------------------------------------
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 200}, 20)`);

    summary.forEach((d, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 22})`);

      row.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", color(d.Detection))
        .attr("rx", 3);

      row.append("text")
        .attr("x", 18)
        .attr("y", 12)
        .style("font-size", "12px")
        .style("fill", "white")
        .style("font-family", "Roboto, sans-serif")
        .text(d.Detection);
    });

    // --------------------------------------
    // TITLE
    // --------------------------------------
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#ffd54f")
      .style("font-family", "Montserrat, sans-serif")
      .text(`Speeding Fines by Detection Method — ${jurisdiction}, ${year}`);

    // --------------------------------------
    // TOTAL FINES DISPLAY
    // --------------------------------------
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#b0b0b0")
      .style("font-family", "Roboto, sans-serif")
      .text(`Total Fines: ${total.toLocaleString()}`);
  };

  // Initial draw
  drawPieChart(currentYear, currentJurisdiction);

  // Cleanup tooltip on page leave
  window.addEventListener('beforeunload', () => {
    d3.selectAll('.chart-tooltip').remove();
  });

})();