// Load combined speeding fine + licence dataset for the chart 1, 4 & 5
export async function loadFinesLicences() {
  return d3.csv("data/Fines & Licence Cleaned.csv", d => ({
    Year: +d.YEAR,
    Jurisdiction: d.JURISDICTION,
    Metric: d.METRIC,
    Detection: d.DETECTION_METHOD,
    Fines: +d.FINES,
    TotalLicences: +d.Total_Licence_Holders
  }));
}

// Load combined speeding fine + licence dataset for the chart 2 
export async function loadFinesCombined() {
  return d3.csv("data/Fines & Licence Cleaned.csv", d => ({
    YEAR: +d.YEAR,
    JURISDICTION: d.JURISDICTION,
    METRIC: d.METRIC,
    DETECTION_METHOD: d.DETECTION_METHOD,
    FINES: +d.FINES,
    Total_Licence_Holders: +d.Total_Licence_Holders
  }));
}

// Load combined speeding fines & licence dataset for the chart 3
export async function loadCombinedFinesData() {
  return d3.csv("data/Fines & Licence Cleaned.csv", d => ({
    YEAR: +d.YEAR,
    METRIC: d.METRIC,
    FINES: +d.FINES,
    Total_Licence_Holders: +d.Total_Licence_Holders
  }));
}



