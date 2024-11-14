import * as d3 from "d3";
import { HierarchicalData } from "./types";

class TreeChart<T> {
  root: any;
  svg: any;
  tree: any;
  diagonal: any;
  gNode: any;
  gLink: any;
  selected: any;

  width = window.innerWidth;
  maxHeight = 600;
  marginTop = 10;
  marginRight = 10;
  marginBottom = 10;
  marginLeft = 40;

  dx = 20;
  dy = window.innerWidth / 6;
  // const dy = (width - marginRight - marginLeft) / (1 + root.height);
  deltaScroll = 0.8;

  buildTree(hierarchicalData: HierarchicalData<T>, drawDepth = -1) {
    this.root = d3.hierarchy(hierarchicalData) as any;
    // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
    // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
    // “bottom”, in the data domain. The width of a column is based on the tree’s height.

    // Define the tree layout and the shape for links.
    this.tree = d3.tree().nodeSize([this.dx, this.dy]);
    this.diagonal = d3
      .linkHorizontal()
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    // Create the SVG container, a layer for the links and a layer for the nodes.
    this.svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.dx)
      .attr("viewBox", [-this.marginLeft, -this.marginTop, this.width, this.dx])
      .attr(
        "style",
        `max-width: calc(100% - 2px); height: ${this.maxHeight}; font: 10px monospace; user-select: none; border: 1px solid teal`
      )
      .on("wheel", this.onWheel.bind(this));

    this.gLink = this.svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

    // Do the first update to the initial configuration of the tree
    this.root.x0 = this.dy / 2;
    this.root.y0 = 0;
    this.root.descendants().forEach((d: any, i: number) => {
      d.id = i;
      d._children = d.children;
      if (d.depth > drawDepth) d.children = null;
    });

    return this.update(null, this.root);
  }

  onWheel(event: WheelEvent) {
    const { x, y, deltaY } = event;
    console.log({ event, x, y, deltaY, vb: this.svg.attr("viewBox") });
    let [x1, y1, x2, y2] = this.svg
      .attr("viewBox")
      .split(",")
      .map((v: string) => Number(v));

    this.svg
      .transition()
      .duration(320)
      .attr("viewBox", [x1, (y1 += deltaY * this.deltaScroll), x2, y2] as any);
  }

  update(event: PointerEvent | null, source: any) {
    const duration = event?.altKey ? 2000 : 250; // hold the alt key to slow down the transition
    const nodes = this.root.descendants();
    const links = this.root.links();

    // Compute the new tree layout.
    this.tree(this.root);
    // console.log("update:::", { selected: this.selected, selectedName: this.selected?.data.name });

    let left = this.root;
    let right = this.root;
    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + this.marginTop + this.marginBottom;

    const transition = this.svg
      .transition()
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [
        source.y - this.width / 2 + this.marginLeft,
        source.x - this.dx / 2,
        this.width,
        this.dx,
      ] as any) // center view according to selected node
      .tween("resize", (window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle")) as any) as any;

    // Update the nodes…
    const node = this.gNode.selectAll("g").data(nodes, (d: any) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter: any = node
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", this.onNodeClick.bind(this));

    nodeEnter
      .append("rect")
      .attr("x", (d: any) => -5)
      .attr("y", -8)
      .attr("width", (d: any) => d.data.name.length * 6 + 10)
      .attr("height", 16)
      .attr("stroke-width", 2);

    nodeEnter
      .append("text")
      .attr("dy", "0.32em")
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
      .attr("stroke-opacity", 1)
      .attr("stroke", (d: any) => {
        return d.id === this.selected?.id ? "red" : "";
      });

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = this.gLink.selectAll("path").data(links, (d: any) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d: any) => {
        const o = { x: source.x0, y: source.y0 };
        return this.diagonal({ source: o, target: o });
      }) as any;

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition).attr("d", this.diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d: any) => {
        const o = { x: source.x, y: source.y };
        return this.diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    this.root.eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    return { svg: this.svg.node() as SVGSVGElement };
    // return { svg: this.svg.node() as SVGSVGElement, treeState: this };
  }

  onNodeClick(event: PointerEvent | null, d: any) {
    this.selected = d;

    console.log("onNodeClick:::", { d });

    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    return this.update(event, d);
  }

  addNode(d: any) {
    if (!this.selected) throw Error("a node needs to be selected before you can go around adding nodes");
    // console.log("addNode:::", { d });

    const newNode = d3.hierarchy(d.data) as any;
    console.log("addNode:::", { newNode, d });

    newNode.depth = this.selected.depth + 1;
    newNode.height = this.selected.height - 1;
    newNode.parent = this.selected;
    newNode.id = d.data.id;
    newNode.data.name = d.data.name;

    // if selected is collapsed, open it before adding new node
    if (this.selected._children && !this.selected.children) {
      this.selected.children = this.selected._children;
      this.selected._children = null;
    }

    // if selected is a dynamically added node, node.children = []
    if (!this.selected._children && !this.selected.children) {
      this.selected.children = [];
      this.selected.data.children = [];
    }

    this.selected.children.push(newNode);
    this.selected.data.children.push(newNode.data);
  }

  addNodes(arr: any[]) {
    arr.forEach((d) => {
      this.addNode(d);
    });
    this.update(null, this.selected);
  }
}

export { TreeChart };
