import { api } from "./api";
import { TreeChart } from "./tree";
import { INode, Prompt } from "./types";

const canvas = document.querySelector("#frame") as HTMLDivElement;
const details = document.querySelector("#details-view") as HTMLDivElement;
const breadcrumbs = document.querySelector("#breadcrumbs") as HTMLDivElement;

const detailsBackArrow = document.querySelector("#details-view #back-arrow") as HTMLDivElement;
const orgDetails = document.querySelector("#details-view #org-details") as HTMLDivElement;
const userDetails = document.querySelector("#details-view #user-details") as HTMLDivElement;
const serviceDetails = document.querySelector("#details-view #service-details") as HTMLDivElement;
const interactionDetails = document.querySelector("#details-view #interaction-details") as HTMLDivElement;

// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
// const fetchBtn = document.querySelector("#fetch-btn") as HTMLButtonElement;
// const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;
let selectedNode: INode | null = null;
const currNodeChain: Record<string, INode | null> = {
  org: null,
  user: null,
  service: null,
  interaction: null,
};

/******/

async function initializeTree() {
  const treeChart = new TreeChart<{ name: string; type: string; count: number; imageUrl: string; children: INode[] }>();
  const { totalCount: orgCount } = await api.fetchOrgs({ offset: 0 });
  const rootNode = { name: "Orgs", type: "root", children: [], count: orgCount, imageUrl: "" };
  return treeChart.initTree(rootNode);
}

function onTreeUpdate(event: Event) {
  const ev = event as Event & { detail: { selectedNode: INode | null } };
  if (!ev.detail.selectedNode) return;

  selectedNode = ev.detail.selectedNode;

  switch (selectedNode.data.type) {
    case "org":
      currNodeChain.org = selectedNode;
      currNodeChain.user = null;
      currNodeChain.service = null;
      currNodeChain.interaction = null;
      break;
    case "user":
      currNodeChain.org = selectedNode.parent;
      currNodeChain.user = selectedNode;
      currNodeChain.service = null;
      currNodeChain.interaction = null;
      break;
    case "service":
      currNodeChain.org = selectedNode.parent!.parent;
      currNodeChain.user = selectedNode.parent;
      currNodeChain.service = selectedNode;
      currNodeChain.interaction = null;
      break;
    case "interaction":
      currNodeChain.org = selectedNode.parent!.parent!.parent;
      currNodeChain.user = selectedNode.parent!.parent;
      currNodeChain.service = selectedNode.parent;
      currNodeChain.interaction = selectedNode;
      break;
    default:
      break;
  }

  const nodeChain = [currNodeChain.org, currNodeChain.user, currNodeChain.service, currNodeChain.interaction].filter(
    Boolean
  ) as INode[];

  console.log({ selectedNode, currNodeChain, nodeChain });

  breadcrumbs.innerHTML = "";
  nodeChain.forEach((node, i) => {
    const anchorEl = document.createElement("a");
    anchorEl.dataset["id"] = node.data.id;
    anchorEl.dataset["name"] = node.data.name;
    anchorEl.dataset["type"] = node.data.type;
    anchorEl.textContent = node.data.name;
    anchorEl.href = "#";
    anchorEl.onclick = () => {
      openDetailsView(node.data.type);
    };
    if (i > 0) breadcrumbs.append(" > ");
    breadcrumbs.appendChild(anchorEl);
  });
}

function openDetailsView(linkType: string) {
  canvas.style.display = "none";
  details.style.display = "block";

  if (currNodeChain.org) {
    orgDetails.innerHTML = `
    <div>
      <img src="${currNodeChain.org.data.imageUrl}" />
      <h3>${currNodeChain.org.data.name}</h3>
    </div>
    `;
  } else {
    orgDetails.innerHTML = "";
  }

  if (currNodeChain.user && linkType !== "org") {
    userDetails.innerHTML = `
    <div>
      <img src="${currNodeChain.user.data.imageUrl}" />
      <h3>${currNodeChain.user.data.name}</h3>
    </div>
    `;
  } else {
    userDetails.innerHTML = "";
  }

  if (currNodeChain.service && !["org", "user"].includes(linkType)) {
    serviceDetails.innerHTML = `
    <div>
      <img src="${currNodeChain.service.data.imageUrl}" />
      <h3>${currNodeChain.service.data.name}</h3>
    </div>
    `;
  } else {
    serviceDetails.innerHTML = "";
  }

  if (currNodeChain.interaction && !["org", "user", "service"].includes(linkType)) {
    const promptList = `<ul class="prompt-list"> ${(currNodeChain.interaction.data?.prompts || [])
      .map(
        (prompt: Prompt) => `
                <li class="timestamp">${prompt.timestamp.toLocaleString("en")}</li>
                <li class="input">${prompt.input}</li>
                <li class="output">${prompt.output}</li>
                `
      )
      .join(" ")} </ul>`;

    interactionDetails.innerHTML = `
    <div>
      <h3>${currNodeChain.interaction.data.name}</h3>
      ${promptList}
    </div>
    `;
  } else {
    interactionDetails.innerHTML = "";
  }
}

function openMainView() {
  details.style.display = "none";
  canvas.style.display = "block";
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

const { svg } = await initializeTree();
canvas.appendChild(svg);

window.addEventListener("tree-updated", onTreeUpdate);
detailsBackArrow.onclick = openMainView;
