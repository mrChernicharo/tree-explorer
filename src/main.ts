import * as d3 from "d3";
// import type { HierarchyNode } from 'd3'
import { data } from "./data";

// Specify the charts’ dimensions. The height is variable, depending on the layout.
const width = window.innerWidth;
const maxHeight = 600;
const marginTop = 10;
const marginRight = 10;
const marginBottom = 10;
const marginLeft = 40;
const deltaScroll = 0.8;

function drawTree() {
  // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
  // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
  // “bottom”, in the data domain. The width of a column is based on the tree’s height.
  const root = d3.hierarchy(data) as any;
  const dx = 20;
  // const dy = (width - marginRight - marginLeft) / (1 + root.height);
  const dy = window.innerWidth / 6;

  // Define the tree layout and the shape for links.
  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal: any = d3
    .linkHorizontal()
    .x((d: any) => d.y)
    .y((d: any) => d.x);

  // Create the SVG container, a layer for the links and a layer for the nodes.
  const svg: d3.Selection<SVGSVGElement, any, null, any> = d3
    .create("svg")
    .attr("width", width)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, width, dx])
    .attr(
      "style",
      `max-width: calc(100% - 2px); height: ${maxHeight}; font: 10px monospace; user-select: none; border: 1px solid teal`
    )
    .on("wheel", onWheel);

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

  // Do the first update to the initial configuration of the tree
  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d: any, i: number) => {
    d.id = i;
    d._children = d.children;
    if (d.depth > 0) d.children = null;
  });

  function update(event: PointerEvent | null, source: any) {
    const duration = event?.altKey ? 2000 : 250; // hold the alt key to slow down the transition
    const nodes = root.descendants();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + marginTop + marginBottom;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("height", height)
      // .attr("viewBox", [-marginLeft, left.x - marginTop, width, height] as any) // scale down svg elements to fit the canvas
      .attr("viewBox", [source.y - width / 2, source.x - dx / 2, width, dx] as any) // center view according to selected node
      .tween("resize", (window.ResizeObserver ? null : () => () => svg.dispatch("toggle")) as any) as any;

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d: any) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter: any = node
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", onNodeClick);

    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d: any) => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 10);

    nodeEnter
      .append("rect")
      .attr("x", (d: any) => -5)
      .attr("y", -8)
      .attr("width", (d: any) => d.data.name.length * 6 + 10)
      .attr("height", 16)
      .attr("stroke-width", 3);

    nodeEnter
      .append("text")
      .attr("dy", "0.32em")
      // .attr('x', d => (d._children ? -6 : 6))
      .attr("text-anchor", (d: any) => "center")
      .text((d: any) => d.data.name)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d: any) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d: any) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      }) as any;

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d: any) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    console.log("update", { root, tree, diagonal, svg, source, left, right, width, height, maxHeight });
  }

  function onNodeClick(event: PointerEvent, d: any) {
    console.log({ event, d });
    d.children = d.children ? null : d._children;
    update(event, d);
  }

  function onWheel(event: WheelEvent) {
    const { x, y, deltaY } = event;
    console.log({ event, x, y, deltaY, vb: svg.attr("viewBox") });
    let [x1, y1, x2, y2] = svg
      .attr("viewBox")
      .split(",")
      .map((v) => Number(v));

    svg
      .transition()
      .duration(320)
      .attr("viewBox", [x1, (y1 += deltaY * deltaScroll), x2, y2] as any);
  }

  update(null, root);

  return svg.node() as SVGSVGElement;
}

const canvas = document.querySelector("#frame") as HTMLDivElement;
const svg = drawTree();
canvas.appendChild(svg);
console.log({ data, svg });

// const data2 = [
//   { name: "A", value: 123, country: "Brazil", parent: null },
//   { name: "B", value: 45, country: "Brazil", parent: "A" },
//   { name: "C", value: 13, country: "Brazil", parent: "A" },
//   { name: "D", value: 273, country: "Brazil", parent: "A" },
//   { name: "E", value: 78, country: "US", parent: "A" },
//   { name: "F", value: 123, country: "US", parent: "E" },
//   { name: "G", value: 45, country: "Japan", parent: "C" },
//   { name: "H", value: 13, country: "Japan", parent: "C" },
//   { name: "I", value: 273, country: "Ireland", parent: "C" },
//   { name: "J", value: 78, country: "Slovenia", parent: "C" },
// ];

// const root = d3
//   .stratify()
//   .id((d) => d.name)
//   .parentId((d) => d.parent)(data2);

// console.log(data2, root);
