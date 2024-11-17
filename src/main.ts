import { api } from "./api";
import { TreeChart } from "./tree";
import { INode } from "./types";

const canvas = document.querySelector("#frame") as HTMLDivElement;
const details = document.querySelector("#details-view") as HTMLDivElement;
const detailsText = document.querySelector("#details-view #details") as HTMLDivElement;
const detailsBackArrow = document.querySelector("#details-view #back-arrow") as HTMLDivElement;
const breadcrumbs = document.querySelector("#breadcrumbs") as HTMLDivElement;
// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
// const fetchBtn = document.querySelector("#fetch-btn") as HTMLButtonElement;
// const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;
let selectedNode: INode | null = null;

/******/

async function initializeTree() {
  const treeChart = new TreeChart<{ name: string; type: string; count: number; children: INode[] }>();
  const { totalCount: orgCount } = await api.fetchOrgs({ offset: 0 });
  const rootNode = { name: "Orgs", type: "root", children: [], count: orgCount };
  return treeChart.initTree(rootNode);
}

window.addEventListener("tree-updated", onTreeUpdate);
detailsBackArrow.onclick = () => {
  details.style.display = "none";
  canvas.style.display = "block";
};

function onTreeUpdate(event: Event) {
  const ev = event as Event & { detail: { selectedNode: INode | null } };
  if (!ev.detail.selectedNode) return;

  selectedNode = ev.detail.selectedNode;
  const nodePath = getNodePathStr(selectedNode);

  breadcrumbs.innerHTML = "";
  createBreadcrumbLinks(nodePath).forEach((anchor, i) => {
    if (i > 0) breadcrumbs.append(" > ");
    breadcrumbs.appendChild(anchor);
  });
  // breadcrumbs.textContent = nodePath;
}

function createBreadcrumbLinks(path: string) {
  const pathSegments = path
    .split(">")
    .map((str) => str.trim())
    .filter(Boolean);

  return pathSegments.map((pathStr) => {
    const anchorEl = document.createElement("a");
    anchorEl.dataset["name"] = pathStr;

    let node = selectedNode;
    while (node?.parent) {
      if (node.data.name === pathStr) {
        anchorEl.dataset["id"] = node.data.id;
        anchorEl.dataset["type"] = node.data.type;
      }
      node = node.parent;
    }

    anchorEl.onclick = () => {
      canvas.style.display = "none";
      details.style.display = "block";
      // detailsText.textContent = anchorEl.dataset["id"] + " | " + anchorEl.dataset["name"];
      const id = parseEntryId(anchorEl.dataset["type"]!, anchorEl.dataset["id"]!);
      const entry = api.getEntry(anchorEl.dataset["type"]!, id) as any;
      console.log(entry);
      detailsText.innerHTML = `<div>
        <div>${entry?.id}</div>
        <div>${entry?.name}</div>
        <div>${entry?.type}</div>
        ${entry.imageUrl ? `<img src="${entry.imageUrl}" height="160px" />` : ""}
      </div>`;
    };
    anchorEl.textContent = pathStr;
    anchorEl.href = "#";
    return anchorEl;
  });
}

function parseEntryId(type: string, idStr: string) {
  switch (type) {
    case "org":
      return idStr;
    case "user":
      return idStr;
    case "service":
      return idStr.split("::")[0];
    case "interaction":
      return idStr.split("::")[0];
    default:
      return idStr;
  }
}

function getNodePathStr(node: INode): string {
  if (!node.parent) return "";
  return getNodePathStr(node.parent).length > 0
    ? getNodePathStr(node.parent) + `> ${node.data.name} `
    : ` ${node.data.name} `;
}

const { svg } = await initializeTree();
canvas.appendChild(svg);
