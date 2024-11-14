import * as d3 from "d3";
import { HierarchicalData } from "./types";
import { Api } from "./api.2";
// import plusIcon from "plus.svg";

const api = new Api();

class TreeChart<T> {
  root: any;
  svg: any;
  tree: any;
  diagonal: any;
  gNode: any;
  gLink: any;
  selected: any;
  isLoading = false;

  width = window.innerWidth;
  maxHeight = 600;
  marginTop = 10;
  marginRight = 10;
  marginBottom = 10;
  marginLeft = 40;

  dx = 28;
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

    const leaves: any[] = [];
    this.selected?.eachAfter((n: any) => {
      if (n.depth > this.selected.depth) leaves.push(n);
    });
    const btnAppendingNode = leaves.pop();

    // Enter any new nodes at the parent's previous position.
    const nodeEnter: any = node
      .enter()
      .append("g")
      .attr("class", (d: any) => (d.id === btnAppendingNode?.id ? "node-group last" : "node-group"))
      .attr("transform", (d: any) => `translate(${source.y0},${source.x0})`)
      .on("click", this.onNodeClick.bind(this));

    nodeEnter
      .append("rect")
      .attr("class", (d: any) => (d.id === btnAppendingNode?.id ? "node last" : "node"))
      .attr("x", -5)
      .attr("y", -8)
      .attr("width", (d: any) => d.data.name.length * 6 + 10)
      .attr("height", 16)
      .attr("stroke-width", 2);

    nodeEnter
      .append("text")
      .attr("class", "node-text")
      .attr("dy", "0.32em")
      .attr("text-anchor", (d: any) => "center")
      .text((d: any) => d.data.name)
      // .text((d: any, i: number) => (i > leaves.length ? d.data.name : `${d.data.name} ${d.data.count}`))
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    nodeEnter
      .append("circle")
      .attr("class", "loading-spinner")
      .attr("cx", (d: any) => 25)
      .attr("cy", 25)
      .attr("r", 12)
      .attr("stroke-width", 2)
      .attr("fill", "#707070");

    nodeEnter
      .append("image")
      .attr("class", (d: any) => (d.id === btnAppendingNode?.id ? "plus-icon last" : "plus-icon"))
      .attr("xlink:href", "plus.svg")
      .attr("width", (d: any) => d.data.name.length * 6)
      .attr("height", 20)
      .attr("y", 20)
      .style("visibility", "hidden");

    console.log("update :: ", { isLoading: this.isLoading, root: this.root, source, selected: this.selected });

    // Transition nodes to their new position.
    const nodeUpdate = node.merge(nodeEnter).transition(transition);

    nodeUpdate
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1)
      .attr("stroke", (d: any) => {
        return d.id === this.selected?.id ? "red" : "";
      });

    nodeUpdate
      .select(".loading-spinner")
      .attr("cx", (d: any) => d.data.name.length * 6 + 36)
      .attr("cy", (d: any) => 0)
      .attr("stroke-opacity", 0)
      .style("visibility", (d: any) => (d.id == this.selected?.id && this.isLoading ? "visible" : "hidden"));

    nodeUpdate.select(".plus-icon.last").style("visibility", "visible");
    // console.log({ btnAppendingNode, selected: this.selected });

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove();

    nodeExit
      .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);
    // .select(".loading")
    // .style("opacity", 0);

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

  async onNodeClick(event: PointerEvent | null, d: any) {
    const sameElement = d.id === this.selected?.id;

    console.log("onNodeClick:::", event?.composedPath(), { event, d, root: this.root });
    if (this.root.id === d.id) {
      console.log("clicked ROOT");
    }

    let clickedNode = false;
    let clickedPlus = false;
    event?.composedPath().forEach((element) => {
      const el = element as HTMLElement;
      if (el.classList && (el.classList.contains("node") || el.classList.contains("node-text"))) {
        clickedNode = true;
      }
      if (el.classList && el.classList.contains("plus-icon")) {
        clickedPlus = true;
      }
    });

    if (clickedPlus) {
      this.isLoading = true;

      this.update(null, d.parent);
      const newNodes = (await api.fetchNodes(d.parent)) as any[];
      console.log("clicked plus-icon", { d, newNodes });
      this.addNodes(newNodes);
      this.isLoading = false;
      this.update(null, d.parent);
      // this.selected = d;

      return;
    }

    if (clickedNode) {
      console.log("clicked NODE");
      if (sameElement) {
        this.selected = null;

        if (d.children) {
          console.log("close!");
          d._children = d.children;
          d.children = null;
        }
      } else {
        this.selected = d;

        if ([undefined, 0].includes(d.data?.children?.length)) {
          console.log("first click!");
          this.isLoading = true;
          this.update(null, d);
          this.addNodes((await api.fetchNodes(d)) as any[]);
          this.isLoading = false;
        } else if (d.data.children.length > 0) {
          if (d.children) {
            console.log("just select the open node");
          } else {
            console.log("open closed node!");
            d.children = d._children;
            d._children = null;
          }
        } else {
          console.log("just open!");
          d.children = d._children;
          d._children = null;
        }
      }
    }

    // else {
    //   console.log("clicked something else");
    //   return;
    // }

    return this.update(event, d);
  }

  #addNode(d: any) {
    if (!this.selected) throw Error("a node needs to be selected before you can go around adding nodes");
    const newNode = d3.hierarchy(d.data) as any;
    // console.log("addNode:::", { newNode, d });

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
      this.#addNode(d);
    });
  }
}

export { TreeChart };
