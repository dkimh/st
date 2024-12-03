import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import flareData from "./data/flare-2.json";

const ZoomableIcicle = () => {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const [detail, setDetail] = useState(null);

    const mediaPath = (media) => `${process.env.PUBLIC_URL}${media}`;

    const formatText = (text) => {
        if (!text) return "";
        return text.split("\n").map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index !== text.split("\n").length - 1 && <br />}
            </React.Fragment>
        ));
    };

    useEffect(() => {
        const data = flareData;

        const width = 928;
        const height = window.innerHeight * 0.9;

        const color = d3.scaleOrdinal([
            "#5D4037", "#795548", "#8D6E63", "#A1887F", "#D7CCC8",
        ]);

        const hierarchy = d3
            .hierarchy(data)
            .sum((d) => d.value || 1)
            .sort((a, b) => b.height - a.height || b.value - a.value);

        const root = d3
            .partition()
            .size([height, (hierarchy.height + 1) * width / 3])(hierarchy);

        const svg = d3
            .select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        const cell = svg
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

        const rect = cell
            .append("rect")
            .attr("width", (d) => d.y1 - d.y0 - 1)
            .attr("height", (d) => rectHeight(d))
            .attr("fill-opacity", 0.6)
            .attr("fill", (d) => {
                if (!d.depth) return "#ccc";
                while (d.depth > 1) d = d.parent;
                return color(d.data.name);
            })
            .style("cursor", "pointer")
            .on("click", clicked);

        const text = cell
            .append("text")
            .style("user-select", "none")
            .attr("pointer-events", "none")
            .attr("x", 4)
            .attr("y", 13)
            .attr("fill-opacity", (d) => +labelVisible(d));

        text.append("tspan").text((d) => d.data.name);

        const format = d3.format(",d");
        const tspan = text
            .append("tspan")
            .attr("fill-opacity", (d) => labelVisible(d) * 0.7)
            .text((d) => ` ${format(d.value)}`);

        cell.on("mousemove", (event, d) => {
            const tooltip = d3.select(tooltipRef.current);
            const tooltipWidth = tooltip.node().offsetWidth || 200;
            const tooltipHeight = tooltip.node().offsetHeight || 50;
            const adjustedTop = Math.max(0, event.pageY - tooltipHeight - 10);

            tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${adjustedTop}px`)
                .html(
                    `<strong>${d.data.name}</strong><br />
                    ${
                        d.data.media
                            ? d.data.media.endsWith(".mp4")
                                ? `<video src="${mediaPath(d.data.media)}" autoplay loop controls style="max-width: 100%; height: auto;"></video>`
                                : `<img src="${mediaPath(d.data.media)}" alt="${d.data.name}" style="max-width: 100%; height: auto;"/>`
                            : "No media available"
                    }`
                );
        });

        cell.on("mouseout", () => {
            d3.select(tooltipRef.current).style("opacity", 0);
        });

        cell.on("click", (event, d) => {
            setDetail(d.data);
        });

        let focus = root;

        function clicked(event, p) {
            if (!p) return;

            focus = focus === p ? (p = p.parent) : p;

            root.each((d) => {
                d.target = {
                    x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
                    x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
                    y0: d.y0 - p.y0,
                    y1: d.y1 - p.y0,
                };
            });

            const t = cell
                .transition()
                .duration(750)
                .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);

            rect.transition(t).attr("height", (d) => rectHeight(d.target));
            text.transition(t).attr("fill-opacity", (d) => +labelVisible(d.target));
            tspan.transition(t).attr("fill-opacity", (d) =>
                labelVisible(d.target) * 0.7
            );
        }

        function rectHeight(d) {
            return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
        }

        function labelVisible(d) {
            return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
        }
    }, []);

    return (
        <>
            <div style={{ display: "flex" }}>
                <svg ref={svgRef}></svg>
                <div className="detail-container">
                    {detail ? (
                        <>
                            <h3>{detail.name}</h3>
                            {detail.timeline && (
                                <p>
                                    <strong>Timeline:</strong> {formatText(detail.timeline)}
                                </p>
                            )}
                            {detail.historical_context && (
                                <p>
                                    <strong>Historical Context:</strong> {formatText(detail.historical_context)}
                                </p>
                            )}
                            {detail.impact && (
                                <>
                                    <h4>Impact/Consequences:</h4>
                                    <p>{formatText(detail.impact)}</p>
                                </>
                            )}
                        </>
                    ) : (
                        <p>Select a node to see details</p>
                    )}
                </div>
            </div>
            <div
                ref={tooltipRef}
                className="tooltip"
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    background: "white",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                }}
            ></div>
        </>
    );
};

export default ZoomableIcicle;
