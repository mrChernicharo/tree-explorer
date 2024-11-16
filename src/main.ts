import { api } from "./api";
import { TreeChart } from "./tree";
import { INode } from "./types";
const limit = 2;

const canvas = document.querySelector("#frame") as HTMLDivElement;
// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
// const fetchBtn = document.querySelector("#fetch-btn") as HTMLButtonElement;
// const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;

/******/

async function initializeTree() {
  const treeChart = new TreeChart<{ name: string; type: string; children: INode[]; count: number }>();
  const { totalCount: orgCount } = await api.fetchOrgs({ limit, offset: 0 });
  const rootNode = { name: "orgs", type: "root", children: [], count: orgCount };
  const { svg } = treeChart.initTree(rootNode);
  canvas.appendChild(svg);
}

initializeTree();
