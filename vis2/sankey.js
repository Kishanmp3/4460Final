// Constants for categories and structure
const categories = [
    "Social Security (All)", "Health", "Education", "Defence", "Public Order & Safety",
    "Transport", "Housing and Community Amenities", "Overseas Aid", "PS Net debt interest",
    "PS Gross debt interest", "Long Term Care"
  ];
  
  const socialSecurityCategories = ["Social Security (Pensioners)", "Social Security (Non-Pensioners)"];
  
  const startYear = "1979-80";
  const endYear = "2022-23";
  
  // Load CSV file and process data
  d3.csv("spending_composition.csv").then((csvData) => {
    const data = processCSVData(csvData);
  
    if (Object.keys(data).length === 0) {
      console.error("No valid data processed. Check the CSV structure and categories.");
      return;
    }
  
    initializeSlider(data);
    updateSankey(startYear, data); // Initialize with the first year
  }).catch((error) => {
    console.error("Error loading CSV file:", error);
  });
  
  // Process CSV data into Sankey flows
  function processCSVData(csvData) {
    const sankeyData = {};
    csvData.forEach((row) => {
      const year = row["Year"];
      if (year >= startYear && year <= endYear) {
        const flows = [];
  
        // Main split from Total Managed Expenditure
        categories.forEach((category) => {
          if (row[category] && row[category] !== "--") {
            let value = parseFloat(row[category]);
            if (!isNaN(value) && value > 0) {
              value = parseFloat(value.toFixed(1)); // Round to 1 decimal place
              flows.push({ source: "Total Managed Expenditure", target: category, value });
            }
          }
        });
  
        // Sub-split from Social Security (All)
        const socialSecurityValue = parseFloat(row["Social Security (All)"]);
        if (!isNaN(socialSecurityValue) && socialSecurityValue > 0) {
          socialSecurityCategories.forEach((subCategory) => {
            if (row[subCategory] && row[subCategory] !== "--") {
              let subValue = parseFloat(row[subCategory]);
              if (!isNaN(subValue) && subValue > 0) {
                subValue = parseFloat(subValue.toFixed(1)); // Round to 1 decimal place
                flows.push({ source: "Social Security (All)", target: subCategory, value: subValue });
              }
            }
          });
        }
  
        if (flows.length > 0) {
          sankeyData[year] = flows;
        } else {
          console.warn(`No valid flows for year ${year}`);
        }
      }
    });
    return sankeyData;
  }
  
  // Initialize slider
  function initializeSlider(data) {
    const slider = d3.select("#year-slider");
    const yearDisplay = d3.select("#year-display");
  
    const startYearInt = parseInt(startYear.split("-")[0]);
    const endYearInt = parseInt(endYear.split("-")[0]);
  
    slider
      .attr("min", startYearInt)
      .attr("max", endYearInt)
      .attr("value", startYearInt);
  
    slider.on("input", function () {
      const yearInt = parseInt(this.value);
      const yearSuffix = (yearInt + 1).toString().slice(-2); // Convert 1979 -> 80
      const year = `${yearInt}-${yearSuffix}`;
      yearDisplay.text(year);
      updateSankey(year, data);
    });
  }
  
  // Sankey chart setup
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  
  const svg = d3.select("#sankey-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  const sankey = d3.sankey()
    .nodeWidth(30)
    .nodePadding(10)
    .size([width, height]);
  
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  
  function updateSankey(year, data) {
    const yearData = data[year];
    if (!yearData) {
      console.warn(`No data for year ${year}`);
      return;
    }
  
    const graph = {
      nodes: [],
      links: yearData,
    };
  
    // Extract unique nodes
    yearData.forEach((d) => {
      if (!graph.nodes.find((n) => n.name === d.source)) {
        graph.nodes.push({ name: d.source });
      }
      if (!graph.nodes.find((n) => n.name === d.target)) {
        graph.nodes.push({ name: d.target });
      }
    });
  
    // Map names to indexes
    graph.links.forEach((d) => {
      d.source = graph.nodes.findIndex((n) => n.name === d.source);
      d.target = graph.nodes.findIndex((n) => n.name === d.target);
    });
  
    sankey(graph);
  
    // Clear previous chart
    svg.selectAll("*").remove();
  
    // Add links
    // Add links with custom color logic
svg.append("g")
  .selectAll("path")
  .data(graph.links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("stroke", (d) => {
    if (d.source.name.includes("Social Security") || d.target.name.includes("Social Security")) {
      return "green"; // Green for Social Security-related links
    }
    return "blue"; // Blue for all other links
  })
  .attr("stroke-width", (d) => Math.max(1, d.width))
  .attr("fill", "none")
  .attr("opacity", 0.7);

// Add nodes with custom color logic
svg.append("g")
  .selectAll("rect")
  .data(graph.nodes)
  .join("rect")
  .attr("x", (d) => d.x0)
  .attr("y", (d) => d.y0)
  .attr("width", (d) => d.x1 - d.x0)
  .attr("height", (d) => d.y1 - d.y0)
  .attr("fill", (d) => {
    if (d.name.includes("Social Security")) {
      return "green"; // Green for Social Security nodes
    }
    return "blue"; // Blue for all other nodes
  })
  .attr("stroke", "#000");

  
    // Add node labels with values
    svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) => d.x1 + 6)
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text((d) => {
        // Calculate the total flow (incoming + outgoing)
        const incoming = graph.links
          .filter((link) => link.target === graph.nodes.indexOf(d))
          .reduce((acc, link) => acc + link.value, 0);
        const outgoing = graph.links
          .filter((link) => link.source === graph.nodes.indexOf(d))
          .reduce((acc, link) => acc + link.value, 0);
        const total = (incoming + outgoing).toFixed(1); // Round to 1 decimal place
        return `${d.name} (${total}B)`;
      })
      .attr("font-size", "10px");
  }
  