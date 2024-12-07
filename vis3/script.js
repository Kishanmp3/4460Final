// Set dimensions and margins
const margin = { top: 50, right: 30, bottom: 70, left: 60 },
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// Append SVG to the chart div
const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the CSV data
d3.csv("Male_Female_Unemployment.csv").then((data) => {
  // Parse data and cast to numbers
  data.forEach((d) => {
    d.Year = +d.Year;
    d["Female Unemployment Rate"] = +d["Female Unemployment Rate"];
    d["Male Unemployment Rate"] = +d["Male Unemployment Rate"];
  });

  // Define subgroups
  const subgroups = ["Female Unemployment Rate", "Male Unemployment Rate"];

  // Define groups (years)
  const groups = data.map((d) => d.Year);

  // Define scales
  const x0 = d3.scaleBand().domain(groups).range([0, width]).padding(0.2); // Main groups
  const x1 = d3.scaleBand().domain(subgroups).range([0, x0.bandwidth()]).padding(0.1); // Subgroups
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Math.max(d["Female Unemployment Rate"], d["Male Unemployment Rate"]))])
    .nice()
    .range([height, 0]);
  const color = d3.scaleOrdinal().domain(subgroups).range(["#d62728", "#1f77b4"]);

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickFormat(d3.format("d")))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end")
    .style("font-size", "10px");

  // Add Y axis
  svg.append("g").call(d3.axisLeft(y));

  // Add horizontal gridlines
  svg
    .append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
    )
    .selectAll("line")
    .style("stroke", "#e0e0e0");

  // Add bars
  svg
    .append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d.Year)},0)`)
    .selectAll("rect")
    .data((d) => subgroups.map((key) => ({ key: key, value: d[key] })))
    .join("rect")
    .attr("x", (d) => x1(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => height - y(d.value))
    .attr("fill", (d) => color(d.key))
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 0.7);
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.key}:</strong> ${d.value.toFixed(1)}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    });

  // Add legend
  const legend = svg
    .selectAll(".legend")
    .data(subgroups)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend
    .append("rect")
    .attr("x", width - 150)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", color);

  legend
    .append("text")
    .attr("x", width - 130)
    .attr("y", 10)
    .text((d) => d)
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "middle")
    .style("font-size", "12px");

  // Add tooltips
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "5px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
    .style("opacity", 0);
});
