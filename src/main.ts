import { drawTree } from "./tree";

const canvas = document.querySelector("#frame") as HTMLDivElement;
const svg = drawTree();
canvas.appendChild(svg);

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
