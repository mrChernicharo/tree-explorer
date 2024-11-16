import { data } from "./data";

import { TreeChart } from "./tree";
import { Api, DataEntry, Org } from "./api";
import { HierarchicalData } from "./types";
const limit = 2;

const canvas = document.querySelector("#frame") as HTMLDivElement;
// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
// const fetchBtn = document.querySelector("#fetch-btn") as HTMLButtonElement;
// const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;

/******/

async function initializeTree() {
  const treeChart = new TreeChart<any>();
  const api = new Api();
  const { totalCount } = await api.fetchOrgs({ limit, offset: 0 });
  const { svg } = treeChart.buildTree({ name: "orgs", type: "root", children: [], count: totalCount });
  canvas.appendChild(svg);
}

initializeTree();
