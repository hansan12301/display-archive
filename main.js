// SVG 선택 및 크기 설정
const svg = d3.select("#displayChart");
const width = (window.innerWidth / 3) * 2 - 100;
const height = window.innerHeight;

// 스케일 설정: PPI → x축, 출시 연도 → y축
const xScale = d3.scaleLinear().range([64, width - 64]);
const yScale = d3.scaleLinear().range([64, height - 128]);

// 툴팁 생성
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "1.1rem 1.6rem")
    .style("background", "#EDEDED")
    .style("opacity", 0.8)
    .style("backdrop-filter", "saturate(1.8) blur(5px)")
    .style("border-radius", "1.3rem")
    .style("font-size", "1.5rem")
    .style("font-height", "1.5rem")
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
    .style("z-index", "999")
    .style("mix-blend-mode", "difference")
    .style("backdrop-filter", "saturate(1.8) blur(5px)")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("border-radius", "2rem");

// 해상도 라벨
resolutionBox.html("<h3></h3>");
resolutionBox.select("h3")
    .style("margin", "0")
    .style("padding", "1rem")
    .style("text-align", "center")

// 실제 사이즈 박스 생성 (투명 배경, 테두리만 있음)
const realSizeBox = d3.select("body")
    .append("div")
    .attr("id", "real-size-box")
    .style("position", "fixed")
    .style("top", "50%")
    .style("left", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("z-index", "1000")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("border", "1.5px solid white")
    .style("border-radius", "20px")
    .style("box-sizing", "border-box");

// 사이즈 박스 라벨
realSizeBox.html("<h3></h3>");
realSizeBox.select("h3")
    .style("margin", "0")
    .style("padding", "1rem")
    .style("text-align", "center")
    .style("color", "#fff");

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
        .tickValues([163, 326, 401, 458, 460, 476])
        .tickSize(-height + 192)
        .tickFormat(d => `${d}ppi`);

    const yAxis = d3.axisLeft(yScale)
        .tickValues(d3.range(2007, 2026, 1))
        .tickSize(-width + 128)
        .tickFormat(d => `${d}년`);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 128})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(64, 0)`)
        .call(yAxis);

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
        .attr("r", 12)
        .attr("fill", d => colorScale(d.display_name || "None"))
        .attr("stroke", "black")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            d3.select("body").style("cursor", "pointer");
            
            tooltip
                .style("visibility", "visible")
                .html(`${d.marketing[0]}<br><strong>${d.name}</strong><br>${d.resolution} @ ${d.ppi}ppi`);

            const [w, h] = d.resolution.split("*").map(Number);
            resolutionBox
                .style("width", `${w}px`)
                .style("height", `${h}px`)
                .style("background-color", () => {
                    const baseColor = d3.color(colorScale(d.display_name || "None"));
                    baseColor.opacity = 0.9;
                    return baseColor.formatRgb(); // → 'rgba(r, g, b, 0.8)'
                })
                .style("opacity", 1)
                .select("h3")
                .text(`${d.name}의 해상도`);

            const widthInch = w / d.ppi;
            const heightInch = h / d.ppi;
            const inchToCm = 2.54;
            const widthCm = widthInch * inchToCm;
            const heightCm = heightInch * inchToCm;

            realSizeBox
                .style("width", `${widthCm}cm`)
                .style("height", `${heightCm}cm`)
                .style("background-color", () => {
                    const baseColor = d3.color(colorScale(d.display_name || "None"));
                    baseColor.opacity = 0.9;
                    return baseColor.formatRgb(); // → 'rgba(r, g, b, 0.8)'
                })
                .style("opacity", 1)
                .select("h3")
                .text(`${d.name}의 디스플레이 크기 (오차범위 ±10%)`);
        })
        .on("mousemove", event => {
            tooltip
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            d3.select("body").style("cursor", "default");

            tooltip.style("visibility", "hidden");
            resolutionBox.style("opacity", 0);
            realSizeBox.style("opacity", 0);
            resolutionLabel.style("opacity", 0);
            realSizeLabel.style("opacity", 0);
        })
        .on("click", (event, d) => {
            const detail = document.getElementById("detail");
            detail.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            detail.innerHTML = `
                <div class="title">
                <h5>${d.name} | ${d.display_name || "Nonamed Display"}</h5>
                <h1>${d.marketing[0]}</h1>
                </div>
                <div class="deviceImg">
                    <img src="./img/${d.name}.jpg" alt="">
                </div>
                <div class="price">
                    <h5>${'$' + d.price}부터</h5>
                    <h6>${d.name}, 현재 판매 종료<h6>
                </div>
                <div class="display">
                    <h3>디스플레이</h3>
                    <div class="displayEx">
                        <div class="displayExInner">
                            <h5>설명 (KR):</h5>
                            <div>
                                <p>${d.description_kr.join("<br>")}</p>
                            </div>
                        </div>
                        <div class="displayExInner">
                            <h5>설명 (EN):</h5>
                            <div>
                            <p>${d.description_en.join("<br>")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="display">
                    <h3>최대 밝기</h3>
                    <div class="displayEx">
                        <div class="displayExInner">
                            <h5>니트(nit)</h5>
                            <div>
                                <p>단위 면적당 방출되는 빛을 측정하는 기준 단위로 높을 수록 화면이 밝아 야외에서도 선명한 화면을 볼 수 있습니다.</p>
                            </div>
                        </div>
                    </div>
                </div>

                    <div class="display">
                        <h3>명암비</h3>
                        <div class="displayEx">
                            <div class="displayExInner">
                                <h5>n:1</h5>
                                <div>
                                    <p>디스플레이가 가장 밝은 색과 가장 어두운색을 얼마나 잘 표현하는지를 나타내는 수치입니다. 명암비가 높을수록 화면 구분이 뚜렷하고 보다 정확한 색상을 표시할 수 있게 되므로 명암비가 높을수록 좋습니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="display">
                        <h3>색공간</h3>
                        <div class="displayEx">
                            <div class="displayExInner">
                                <h5>sRGB</h5>
                                <div>
                                    <div class="sRGB"></div>
                                    <p>1996년부터 지금까지 사용되고 있는 일반적인 모니터의 표준 색공간입니다.</p>
                                </div>
                            </div>
                            <div class="displayExInner">
                                <h5>Display P3</h5>
                                <div>
                                    <div class="p3"></div>
                                    <p>Display P3는 Apple에서 만든 넓은 색 영역을 지원하는 디스플레이 시스템입니다. DCI-P3 색 공간을 기반으로 하지만, sRGB 감마 곡선을 사용합니다. 이는 기존 sRGB 색 영역보다 더 넓은 색상 범위를 제공하여 더욱 생생하고 풍부한 색상을 표현할 수 있게 해줍니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <section class="display-features">
                    <div class="display">
                        <h3>True Tone</h3>
                        <div class="displayEx">
                            <div class="displayExInner">
                                <h5>
                                    색온도
                                </h5>
                                <div>
                                    <div class="true-tone-box">
                                    </div>
                                    <p>True Tone은 고급 센서를 통해 디스플레이의 색상 및 강도를 주변광에 맞춰 조절하여 더욱 자연스러운 이미지를 구현합니다. True Tone을 끄면 디스플레이가 주변광의 변화와 관계없이 색상과 강도를 일정하게 유지합니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>
            `;
        });

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(64, ${height - 64})`);

    displayNames.forEach((name, i) => {
        const xPos = i * (width / 6 - 20);
        const item = legend.append("g").attr("transform", `translate(${xPos}, 0)`);

        item.append("circle")
            .attr("cx", 6)
            .attr("cy", 6)
            .attr("r", 6)
            .attr("fill", colorScale(name))
            .attr("stroke", "#333");

        item.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(name)
            .attr("font-size", "1.2rem")
            .attr("fill", "#333");
    });
});

// #about 마우스 이벤트
const about = d3.select("#about");

about
    .on("click", () => {
        about.style("display", "none");
    });

// 버튼 클릭 시 #about 보이기
d3.select("#show-about").on("click", () => {
    about.style("display", "block");
});
