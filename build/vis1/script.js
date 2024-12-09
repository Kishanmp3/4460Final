// Set up chart dimensions and margins
const margin = { top: 40, right: 60, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Define scales
const x = d3.scalePoint().range([0, width]);
const yLeft = d3.scaleLinear().range([height, 0]); // Left Y-axis (Employment)
const yRight = d3.scaleLinear().range([height, 0]); // Right Y-axis (Unemployment)

// Line generators
const lineEmployment = d3.line()
    .x(d => x(d.year))
    .y(d => yLeft(d.employment));

const lineUnemployment = d3.line()
    .x(d => x(d.year))
    .y(d => yRight(d.unemployment));

// Tooltip for interactivity
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load and process the cleaned CSV file
d3.csv("Employment_and_Unemployment_Rates_Data.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d.year = d.Date; // Use 'Date' column as the year
        d.employment = +d["Employment Rate (%)"]; // Convert employment to numeric
        d.unemployment = +d["Unemployment Rate (%)"]; // Convert unemployment to numeric
    });

    // Set domains for the scales
    x.domain(data.map(d => d.year));
    yLeft.domain([65, 77]); // Employment range
    yRight.domain([0, 12]); // Unemployment range

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add left Y axis (Employment)
    svg.append("g")
        .call(d3.axisLeft(yLeft))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("fill", "blue")
        .text("Employment Rate (%)");

    // Add right Y axis (Unemployment)
    svg.append("g")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(yRight))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 50)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("fill", "red")
        .text("Unemployment Rate (%)");

    // Add Employment line
    svg.append("path")
        .datum(data)
        .attr("class", "line employment")
        .attr("d", lineEmployment);

    // Add Unemployment line
    svg.append("path")
        .datum(data)
        .attr("class", "line unemployment")
        .attr("d", lineUnemployment);

    // Add Employment points
    svg.selectAll(".dot-employment")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot-employment")
        .attr("cx", d => x(d.year))
        .attr("cy", d => yLeft(d.employment))
        .attr("r", 4)
        .attr("fill", "blue")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Year: ${d.year}<br>Employment: ${d.employment}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add Unemployment points
    svg.selectAll(".dot-unemployment")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot-unemployment")
        .attr("cx", d => x(d.year))
        .attr("cy", d => yRight(d.unemployment))
        .attr("r", 4)
        .attr("fill", "red")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Year: ${d.year}<br>Unemployment: ${d.unemployment}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add a legend
    svg.append("text")
        .attr("x", width - 150)
        .attr("y", 20)
        .attr("fill", "blue")
        .text("Employment Rate");

    svg.append("text")
        .attr("x", width - 150)
        .attr("y", 40)
        .attr("fill", "red")
        .text("Unemployment Rate");
}).catch(error => {
    console.error("Error loading or processing data:", error);
});

