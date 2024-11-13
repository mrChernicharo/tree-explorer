import { data } from "./data";
import { TreeChart } from "./tree";

const canvas = document.querySelector("#frame") as HTMLDivElement;
// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;

// const dataByUser = [tableRoot, ...orgs, ...users, ...companies, ...services, ...interactions];
// const dataByService = [tableRoot, ...companies, ...services, ...interactions, ...users, ...orgs];
// const state = {
//   dataView: "user",
//   data: dataByUser,
// };

// toggleBtn.onclick = () => {
//   canvas.innerHTML = "";
//   state.dataView = state.dataView === "user" ? "service" : "user";
//   state.data = state.dataView === "user" ? dataByUser : dataByService;

//   // const svg = buildTree(sdata);
//   const svg = buildTree(d3.hierarchy(data), 1);
//   console.log({ data, sdata, svg });
//   canvas.appendChild(svg);
// };

// console.log(state, stratifyTableData(state.data));
// const sdata = stratifyTableData(state.data);

/******/

const treeChart = new TreeChart<any>();

const { svg, treeState } = treeChart.buildTree(data);

// let { svg, update, source, nodes, nodeEnter, node } = buildTree2(data, 0);
canvas.appendChild(svg);

let i = 0;
addBtn.onclick = () => {
  const nodes = [];
  //   console.log({ source, nodes, nodeEnter, node });
  let j = 0;
  while (j < 3) {
    const newd = { data: { name: "JUST ADDED " + i } };
    nodes.push(newd);
    // treeChart.addNode(newd);
    i++;
    j++;
  }

  treeChart.addNodes(nodes);

  // const newd = { data: { name: "JUST ADDED " + i } };
  // treeChart.addNode(newd);
  // i++;
};
