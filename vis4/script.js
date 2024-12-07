// Dimensions and margins
const margin = { top: 50, right: 150, bottom: 50, left: 50 },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Append SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Load CSV data
d3.csv("unemployment by age.csv").then(data => {
    // Convert data types
    data.forEach(d => {
        d.Year = +d.Year;
        for (let key in d) {
            if (key !== "Year") {
                d[key] = +d[key];
            }
        }
    });

    const ageGroups = ["Aged_16_17_Rate", "Aged_18_24_Rate", "Aged_25_34_Rate", "Aged_35_49_Rate", "Aged_50_64_Rate", "Aged_65Plus_Rate"];
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(ageGroups, group => d[group]))])
        .nice()
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickSize(-height)
            .tickFormat("")
        );

    // Draw lines
    ageGroups.forEach(group => {
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colors(group))
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d[group]))
            );
    });

    // Overlay for mouse interaction
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .on("mousemove", (event) => {
            const mouseX = d3.pointer(event)[0];
            const closestYear = Math.round(x.invert(mouseX));

            // Find the data for the closest year
            const dataForYear = data.find(d => d.Year === closestYear);
            if (dataForYear) {
                const tooltipContent = `
                    <strong>Year: ${dataForYear.Year}</strong><br>
                    ${ageGroups
                        .map(group => `${group.replace("_Rate", "").replace(/_/g, " ")}: ${dataForYear[group]}%`)
                        .join("<br>")}
                `;
                tooltip.style("display", "block")
                    .html(tooltipContent)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            }
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

    // Add legend
    svg.selectAll(".legend")
        .data(ageGroups)
        .enter()
        .append("text")
        .attr("x", width + 20)
        .attr("y", (d, i) => i * 20)
        .text(d => d.replace("_Rate", "").replace(/_/g, " "))
        .style("fill", d => colors(d))
        .attr("class", "legend");
});
