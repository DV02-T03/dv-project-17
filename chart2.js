// js/chart2.js

import { loadFinesCombined } from "./load_data.js";

(async function () {

  // --- LOAD DATA ---
  const raw = await loadFinesCombined();
  console.log("Loaded Combined Fines Data:", raw.slice(0, 5));

  // Filter only speeding fines
  const data = raw.filter(d => d.METRIC === "speed_fines");

  // --- GROUP DATA BY YEAR ---
  const grouped = d3.rollups(
    data,
    v => ({
      police: d3.sum(v.filter(x => x.DETECTION_METHOD === "Police issued"), d => d.FINES),
      camera: d3.sum(v.filter(x => x.DETECTION_METHOD !== "Police issued"), d => d.FINES)
    }),
    d => d.YEAR
  )
    .map(([year, vals]) => ({
      YEAR: +year,
      Police: vals.police,
      Camera: vals.camera
    }))
    .sort((a, b) => a.YEAR - b.YEAR);

  console.log("Grouped Speeding Fines:", grouped);

  // Add proportions for tooltip (% of all speeding fines)
  grouped.forEach(d => {
    const total = d.Police + d.Camera;
    d.Police_pct = (d.Police / total) * 100;
    d.Camera_pct = (d.Camera / total) * 100;
  });


  // --- SELECT CHART AREA ---
  const container = d3.select("#chart2");
  container.selectAll("*").remove();

  // fallback sizes if container has no explicit height
const width = 800;
const height = 450;

  const margin = { top: 40, right: 40, bottom: 60, left: 90 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // --- X SCALE (YEARS) ---
  const x0 = d3.scaleBand()
    .domain(grouped.map(d => d.YEAR))
    .range([0, innerWidth])
    .padding(0.2);

  // --- INNER GROUP SCALE (Police vs Camera) ---
  const x1 = d3.scaleBand()
    .domain(["Police", "Camera"])
    .range([0, x0.bandwidth()])
    .padding(0.1);

  // --- Y SCALE ---
  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => Math.max(d.Police, d.Camera)) * 1.15])
    .nice()
    .range([innerHeight, 0]);

  // --- COLOR SCALE ---
  const color = d3.scaleOrdinal()
    .domain(["Police", "Camera"])
    .range(d3.schemeSet2);

  // --- AXES ---
  chartArea.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "white");

  chartArea.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white");

  // --- YEAR GROUPS (one <g> per year) ---
  const yearGroups = chartArea.selectAll(".year-group")
    .data(grouped)
    .enter()
    .append("g")
    .attr("class", "year-group")
    .attr("transform", d => `translate(${x0(d.YEAR)},0)`);

  // --- TOOLTIP (SVG group appended to chartArea) ---
  const tooltipWidth = 140;
  const tooltipHeight = 50;

  const tooltip = chartArea.append("g")
    .attr("class", "bar-tooltip")
    .style("pointer-events", "none") // let mouse events go through to bars
    .style("opacity", 0);

  tooltip.append("rect")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "#222")
    .attr("opacity", 0.85);

  const tooltipText = tooltip.append("text")
    .attr("x", tooltipWidth / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-weight", 700)
    .style("font-size", "13px");

  const tooltipSub = tooltip.append("text")
    .attr("x", tooltipWidth / 2)
    .attr("y", 36)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "12px");

  // --- DRAW GROUPED BARS (nested data inside each year-group) ---
  yearGroups.selectAll("rect")
        .data(d =>
      ["Police", "Camera"].map(key => ({
        key,
        value: d[key],
        YEAR: d.YEAR,
        pct: key === "Police" ? d.Police_pct : d.Camera_pct
      }))
    )

    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => innerHeight - y(d.value))
    .attr("fill", d => color(d.key))
    .style("cursor", "pointer")
.on("mouseenter", function (event, d) {
  // dim other bars slightly
  chartArea.selectAll("rect").attr("opacity", 0.6);
  d3.select(this).attr("opacity", 1);

  // use precomputed percentage stored in d.pct
  const pct = d.pct;

  // update tooltip text
  tooltipText.text(`${d.key} — ${d.YEAR}`);
  tooltipSub.text(`${d.value.toLocaleString()} (${pct.toFixed(1)}%)`);

  // position tooltip slightly above mouse pointer (keep inside chart bounds)
  const [mx, my] = d3.pointer(event, chartArea.node());
  const tx = Math.max(0, Math.min(mx - tooltipWidth / 2, innerWidth - tooltipWidth));
  const ty = Math.max(0, my - tooltipHeight - 8); // above pointer
  tooltip.attr("transform", `translate(${tx}, ${ty})`);

  tooltip.transition()
    .duration(120)
    .style("opacity", 1);
})


    
    .on("mousemove", function (event, d) {
      const [mx, my] = d3.pointer(event, chartArea.node());
      const tx = Math.max(0, Math.min(mx - tooltipWidth / 2, innerWidth - tooltipWidth));
      const ty = Math.max(0, my - tooltipHeight - 8);
      tooltip.attr("transform", `translate(${tx}, ${ty})`);
    })

    .on("mouseleave", function () {
      chartArea.selectAll("rect").attr("opacity", 1);
      tooltip.transition()
        .duration(120)
        .style("opacity", 0);
    });

  // --- LEGEND ---
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 150}, ${margin.top})`);

  ["Police", "Camera"].forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 22})`);

    row.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(key));

    row.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "13px")
      .style("fill", "white")
      .text(key);
  });

  // --- LABELS ---
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
    .text("Number of Speeding Fines");

  // --- TITLE ---
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Police vs Camera Speeding Fines (2010–2024)");

})();

