// script.js

// SVG 선택 및 크기 설정
const svg = d3.select("#displayChart");
const width = window.innerWidth / 2 - 30;
const height = window.innerHeight - 30;

// 스케일 설정: PPI → x축, 출시 연도 → y축
const xScale = d3.scaleLinear().range([60, width - 60]);
const yScale = d3.scaleLinear().range([60, height - 100]);

// 툴팁 생성
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("font-size", "0.8rem")
    .style("pointer-events", "none")
    .style("visibility", "hidden");

// 해상도 박스 생성
const resolutionBox = d3.select("body")
    .append("div")
    .attr("id", "resolution-box")
    .style("position", "fixed")
    .style("top", "50%")
    .style("left", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("z-index", "1000")
    .style("mix-blend-mode", "difference")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("border", "1.5px solid #444");

// 실제 사이즈 박스 생성 (투명 배경, 테두리만 있음)
const realSizeBox = d3.select("body")
    .append("div")
    .attr("id", "real-size-box")
    .style("position", "fixed")
    .style("top", "50%")
    .style("left", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("z-index", "999")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("border", "1.5px solid black")
    .style("box-sizing", "border-box");

// JSON 데이터 불러오기
d3.json("iphone_displays.json").then(data => {
    data.forEach(d => {
        d.releaseYear = +d.release.split(".")[0];
        d.ppi = +d.ppi;
        d.size_inch = +d.size_inch;
    });

    const pointMap = new Map();
    data.forEach(d => {
        const key = `${d.ppi}-${d.releaseYear}`;
        if (!pointMap.has(key)) pointMap.set(key, 0);
        d.offsetIndex = pointMap.get(key);
        pointMap.set(key, d.offsetIndex + 1);
    });

    const ppiExtent = d3.extent(data, d => d.ppi);
    const xPadding = 20;
    xScale.domain([ppiExtent[0] - xPadding, ppiExtent[1] + xPadding]);
    const yearExtent = d3.extent(data, d => d.releaseYear);
    const yPadding = 1;
    yScale.domain([yearExtent[0] - yPadding, yearExtent[1] + yPadding]);

    const xAxis = d3.axisBottom(xScale)
        .tickValues([163, 326, 401, 460, 476])
        .tickFormat(d => `${d}ppi`);

    const yAxis = d3.axisLeft(yScale)
        .tickValues(d3.range(2007, 2026, 1))
        .tickFormat(d => `${d}년`);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 100})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(60, 0)`)
        .call(yAxis);

    svg.select("text.axis-label")
        .text("PPI (pixels per inch)");

    svg.append("g")
        .attr("class", "grid-y")
        .attr("transform", `translate(60, 0)`)
        .call(d3.axisLeft(yScale)
            .tickValues(d3.range(2007, 2026, 1))
            .tickSize(-width + 120)
            .tickFormat("")
    );

    svg.append("g")
        .attr("class", "grid-x")
        .attr("transform", `translate(0, ${height - 100})`)
        .call(d3.axisBottom(xScale)
            .tickValues([163, 326, 401, 458, 460, 476])
            .tickSize(-height + 120)
            .tickFormat("")
    );

    const displayNames = ["Nonamed", "Retina", "Retina HD", "Super Retina HD", "Liquid Retina HD", "Super Retina XDR"];
    const colorScale = d3.scaleOrdinal()
        .domain(displayNames)
        .range(["white", "yellow", "lime", "blue", "aqua", "magenta"]);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.ppi) + d.offsetIndex * 6)
        .attr("cy", d => yScale(d.releaseYear))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.display_name || "None"))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            tooltip
                .style("visibility", "visible")
                .html(`<strong>${d.name}</strong><br>${d.resolution} @ ${d.ppi}ppi`);

            const [w, h] = d.resolution.split("*").map(Number);
            resolutionBox
                .style("width", `${w}px`)
                .style("height", `${h}px`)
                .style("background-color", colorScale(d.display_name || "None"))
                .style("opacity", 1);

            // 실제 사이즈 계산 (based on resolution and ppi)
            // 픽셀 → 인치
            const widthInch = w / d.ppi;
            const heightInch = h / d.ppi;

            // 인치 → 센티미터
            const inchToCm = 2.54; // inch * 2.54 = cm

            const widthCm = widthInch * inchToCm;
            const heightCm = heightInch * inchToCm;

            realSizeBox
                .style("width", `${widthCm}cm`)
                .style("height", `${heightCm}cm`)
                .style("opacity", 1);
        })
        .on("mousemove", event => {
            tooltip
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
            resolutionBox.style("opacity", 0);
            realSizeBox.style("opacity", 0);
        })
        .on("click", (event, d) => {
            const detail = document.getElementById("detail");
            detail.innerHTML = `
                <h2>${d.name}</h2>
                <p><strong>출시일:</strong> ${d.release}</p>
                <p><strong>디스플레이:</strong> ${d.display_name || "표기 없음"}</p>
                <p><strong>크기:</strong> ${d.size_inch}인치</p>
                <p><strong>해상도:</strong> ${d.resolution} @ ${d.ppi}ppi</p>
                <p><strong>마케팅:</strong> ${d.marketing.join("<br>")}</p>
                <p><strong>설명 (KR):</strong><br>${d.description_kr.join("<br>")}</p>
                <p><strong>설명 (EN):</strong><br>${d.description_en.join("<br>")}</p>
            `;
        });

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(60, ${height - 50})`);

    displayNames.forEach((name, i) => {
        const xPos = i * (width / 6 - 15);
        const item = legend.append("g").attr("transform", `translate(${xPos}, 0)`);

        item.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(name))
            .attr("stroke", "#333");

        item.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(name)
            .attr("font-size", "0.75rem")
            .attr("fill", "#333");
    });
});
