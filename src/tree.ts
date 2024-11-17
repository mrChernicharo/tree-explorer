import * as d3 from "d3";
import { HierarchicalData, ILink, INode } from "./types";
import { api } from "./api";

const COLORS = ["#0b9d85", "#0b9d85", "#232bff", "#772dff"];
const headerHeight = 82;

class TreeChart<T> {
  root!: d3.HierarchyNode<any> & INode;
  svg!: d3.Selection<SVGSVGElement, any, any, any>;
  tree!: d3.TreeLayout<T>;
  diagonal: any;
  gNode: any;
  gLink: any;
  selected: INode | null = null;
  isLoading = false;

  width = window.innerWidth;
  maxHeight = window.innerHeight - headerHeight;
  marginTop = 10;
  marginRight = 10;
  marginBottom = 10;
  marginLeft = 40;
  nodeMargin = 10;

  dx = 26;
  dy = window.innerWidth > 600 ? window.innerWidth / 6 : 150;
  deltaScroll = 0.8;

  initTree(hierarchicalData: HierarchicalData<T>, drawDepth = -1) {
    this.root = d3.hierarchy(hierarchicalData) as d3.HierarchyNode<any> & INode;

    // Define the tree layout and the shape for links.
    this.tree = d3.tree<T>().nodeSize([this.dx, this.dy]);
    this.diagonal = d3
      .linkHorizontal()
      .x((d) => (d as any).y)
      .y((d) => (d as any).x);

    // Create the SVG container, a layer for the links and a layer for the nodes.
    this.svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.dx)
      .attr("viewBox", [-this.marginLeft, -this.marginTop, this.width, this.dx])
      .attr("style", `max-width: 100%; height: ${this.maxHeight}px; font: 10px monospace; user-select: none;`)
      .on("wheel", this.#onWheel.bind(this), false);

    this.gLink = this.svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

    // first update & initial configuration of the tree
    this.root.x0 = this.dy / 2;
    this.root.y0 = 0;
    this.root.descendants().forEach((d: INode, i: number) => {
      d.id = i;
      d._children = d.children;
      if (d.depth > drawDepth) d.children = null;
    });

    window.addEventListener("resize", this.#onResize);
    this.update(null, this.root);

    return { svg: this.svg.node() as SVGSVGElement };
  }

  update(event: PointerEvent | null, sourceNode: INode) {
    const duration = event?.altKey ? 2000 : 250; // hold the alt key to slow down the transition
    const nodes = this.root.descendants();
    const links = this.root.links();

    // Compute the new tree layout.
    this.tree(this.root);

    let left = this.root;
    let right = this.root;
    this.root.eachBefore((node: d3.HierarchyNode<any> & INode) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + this.marginTop + this.marginBottom;
    this.width = window.innerWidth;

    const transition = this.svg
      .transition()
      .duration(duration)
      .attr("height", height)
      .attr(
        "viewBox",
        [sourceNode.y - this.width / 2 + this.marginLeft, sourceNode.x - this.dx / 2, this.width, this.dx].join()
      ); // center view according to selected node

    // Update the nodes…
    const node = this.gNode.selectAll("g").data(nodes, (d: INode) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d: INode) => `translate(${sourceNode.y0},${sourceNode.x0})`)
      .on("click", this.onNodeClick.bind(this));

    nodeEnter
      .append("rect")
      .attr("class", "node")
      .attr("x", -this.nodeMargin)
      .attr("y", -8)
      .attr("width", (d: INode) => this.#getNodeWidth(d))
      .attr("height", 16)
      .attr("stroke-width", 2)
      .attr("fill", (d: INode) => COLORS[d.depth]);
    // .attr("fill", "transparent");

    nodeEnter
      .append("text")
      .attr("class", "node-text")
      .attr("dy", "0.32em")
      .text((d: INode) => {
        const remainingChildren = this.#getRemainingChildCount(d);
        return remainingChildren > 0 ? `${d.data.name} +${remainingChildren}` : d.data.name;
      })
      .attr("stroke", "white");
    // .attr("stroke-linejoin", "round")
    // .attr("stroke-width", 3)
    // .attr("paint-order", "stroke");

    nodeEnter
      .append("image")
      .attr("class", "loading-spinner")
      .attr("xlink:href", "spinner.svg")
      .attr("width", 32)
      .attr("height", 25)
      .attr("x", (d: INode) => this.#getNodeWidth(d))
      .attr("y", -12);

    nodeEnter
      .append("text")
      .attr("class", "remaining-text")
      .attr("x", (d: INode) => this.#getNodeWidth(d) + 6)
      .attr("y", 3.75)
      .style("font-size", 14)
      .style("display", "none");

    nodeEnter
      .append("image")
      .attr("class", "plus-icon")
      .attr("xlink:href", "plus.svg")
      .attr("height", 10)
      .attr("width", 32)
      .attr("x", (d: INode) => this.#getNodeWidth(d) - 16)
      .attr("y", -6)
      .style("display", "none");

    /**************************************************/

    // Update nodes...
    const nodeUpdate = node.merge(nodeEnter).transition(transition);

    // Transition nodes to their new position.
    nodeUpdate
      .attr("transform", (d: INode) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1)
      .attr("stroke", (d: INode) => {
        return d.id === this.selected?.id ? "dodgerblue" : "";
      });

    nodeUpdate
      .select(".loading-spinner")
      .attr("cx", (d: INode) => d.data.name.length * 6 + 36)
      .attr("cy", (d: INode) => 0)
      .attr("stroke-opacity", 0)
      .style("visibility", (d: INode) => (d.id == this.selected?.id && this.isLoading ? "visible" : "hidden"));

    nodeUpdate.select("text").text((d: INode) => {
      const remainingChildren = this.#getRemainingChildCount(d);
      return d.id == this.selected?.id || remainingChildren == 0 ? d.data.name : `${d.data.name} +${remainingChildren}`;
    });

    nodeUpdate
      .select(".remaining-text")
      .attr("stroke", "dodgerblue")
      .attr("fill", "dodgerblue")
      .text((d: INode) => {
        return this.#getRemainingChildCount(d);
      })
      .style("display", (d: INode) => {
        const remainingChildren = this.#getRemainingChildCount(d);
        return !this.isLoading && d.id === this.selected?.id && remainingChildren > 0 ? "block" : "none";
      });

    nodeUpdate.select(".plus-icon").style("display", (d: INode) => {
      const remainingChildren = this.#getRemainingChildCount(d);
      return !this.isLoading && d.id === this.selected?.id && remainingChildren > 0 ? "block" : "none";
    });

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove();

    nodeExit
      .attr("transform", () => `translate(${sourceNode.y},${sourceNode.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    /**************************************************/

    // Update links…
    const link = this.gLink.selectAll("path").data(links, (d: ILink) => {
      return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d: ILink) => {
        const o = { x: sourceNode.x0, y: sourceNode.y0 };
        return this.diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    const linkUpdate = link.merge(linkEnter).transition(transition).attr("d", this.diagonal);

    // Transition exiting nodes to the parent's new position.
    const linkExit = link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d: INode) => {
        const o = { x: sourceNode.x, y: sourceNode.y };
        return this.diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    this.root.eachBefore((d: INode) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    window.dispatchEvent(
      new CustomEvent("tree-updated", {
        detail: {
          selectedNode: this.selected,
        },
      })
    );
  }

  #onWheel(event: WheelEvent) {
    const { x, y, deltaY } = event;
    console.log({ event, deltaY });
    let [x1, y1, x2, y2] = this.svg
      .attr("viewBox")
      .split(",")
      .map((v: string) => Number(v));

    this.svg
      // .transition()
      // .duration(320)
      .attr("viewBox", [x1, (y1 += deltaY * this.deltaScroll), x2, y2].join());
  }

  #onResize() {
    const svgEl = document.querySelector("#frame svg");
    this.width = window.innerWidth;
    this.dy = this.width / 6;
    (svgEl as any).width.baseVal.value = this.width;
  }

  async onNodeClick(event: PointerEvent | null, d: INode) {
    const sameElement = d.id === this.selected?.id;
    // console.log("onNodeClick:::", event?.composedPath(), { event, d, root: this.root });

    let clickedNode = false;
    let clickedPlus = false;
    for (const element of event!.composedPath() || []) {
      const el = element as HTMLElement;
      if (el.classList && (el.classList.contains("node") || el.classList.contains("node-text"))) {
        clickedNode = true;
        break;
      }
      if (el.classList && (el.classList.contains("plus-icon") || el.classList.contains("remaining-text"))) {
        clickedPlus = true;
        break;
      }
    }

    if (clickedPlus) {
      await this.#handleFetchNodeData(d);
      return this.update(null, d);
    }

    if (clickedNode) {
      if (sameElement) {
        this.selected = null;

        if (d.children) {
          this.#collapseNodeLinks(d); // close!
        }
      } else {
        this.selected = d;

        // clicking node for the first time
        if ([undefined, 0].includes(d.data?.children?.length)) {
          if (d.data.count > 0) {
            await this.#handleFetchNodeData(d); // fetch if node has children
          }
        } else if (d.data.children.length > 0) {
          if (!d.children) {
            this.#expandNodeLinks(d);
          }
        } else {
          this.#expandNodeLinks(d);
        }
      }
      return this.update(event, d);
    }
  }

  #collapseNodeLinks(d: INode) {
    d._children = d.children;
    d.children = null;
  }

  #expandNodeLinks(d: INode) {
    d.children = d._children;
    d._children = null;
  }

  async #handleFetchNodeData(d: INode) {
    this.isLoading = true;
    this.update(null, d);
    const newNodes = (await api.fetchNodes(d)) as any[];
    this.addNodes(newNodes);
    this.isLoading = false;
  }

  #addNode(d: INode) {
    if (!this.selected) throw Error("a node needs to be selected before you can go around adding nodes");
    const newNode = d3.hierarchy(d.data) as unknown as INode;
    // console.log("addNode:::", { newNode, d });

    newNode.depth = this.selected.depth + 1;
    newNode.height = this.selected.height - 1;
    newNode.parent = this.selected;
    newNode.id = d.data.id;
    newNode.data = d.data;

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

    this.selected.children!.push(newNode);
    this.selected.data.children.push(newNode.data);
  }

  addNodes(arr: INode[]) {
    arr.forEach((d) => {
      this.#addNode(d);
    });
  }

  #getRemainingChildCount(d: INode) {
    return (d.data?.count ?? 0) - (d.data?.children?.length ?? 0);
  }

  #getTextWidth(d: INode) {
    const remainingChildren = this.#getRemainingChildCount(d);
    return `${d.data.name} ${remainingChildren}`.length * 6;
  }

  #getNodeWidth(d: INode) {
    return this.#getTextWidth(d) + this.nodeMargin * 2;
  }
}

export { TreeChart };
