import { api } from "./api";
import { TreeChart } from "./tree";
import { INode, Prompt } from "./types";

const canvas = document.querySelector("#frame") as HTMLDivElement;
const breadcrumbs = document.querySelector("#breadcrumbs") as HTMLDivElement;

const details = document.querySelector("#details-view") as HTMLDivElement;
const detailsBackArrow = document.querySelector("#details-view .dismiss-btn") as HTMLDivElement;
const orgDetails = document.querySelector("#details-view #org-details") as HTMLDivElement;
const userDetails = document.querySelector("#details-view #user-details") as HTMLDivElement;
const serviceDetails = document.querySelector("#details-view #service-details") as HTMLDivElement;
const interactionDetails = document.querySelector("#details-view #interaction-details") as HTMLDivElement;
const detailsViewContent = document.querySelector("#details-view #details-view-content") as HTMLDivElement;

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
    <div class="entity-details ${currNodeChain.org.data.type}">
      <img class="avatar-img" src="${currNodeChain.org.data.imageUrl}" />
      <h3><img src="org.svg" class="h3-icon" /> ${currNodeChain.org.data.name}</h3>
    </div>
    `;
    detailsViewContent.innerHTML = `${currNodeChain.org.data.name}`;
  } else {
    orgDetails.innerHTML = "";
  }

  if (currNodeChain.user && linkType !== "org") {
    userDetails.innerHTML = `
    <div class="entity-details ${currNodeChain.user.data.type}">
      <img class="avatar-img" src="${currNodeChain.user.data.imageUrl}" />
      <h3><img src="user.svg" class="h3-icon" />${currNodeChain.user.data.name}</h3>
    </div>
    `;
    detailsViewContent.innerHTML = `${currNodeChain.user.data.name}`;
  } else {
    userDetails.innerHTML = "";
  }

  if (currNodeChain.service && !["org", "user"].includes(linkType)) {
    serviceDetails.innerHTML = `
    <div class="entity-details ${currNodeChain.service.data.type}">
      <img class="avatar-img" src="${currNodeChain.service.data.imageUrl}" />
      <h3><img src="service.svg" class="h3-icon" />${currNodeChain.service.data.name}</h3>
    </div>
    `;
    detailsViewContent.innerHTML = `${currNodeChain.service.data.name}`;
  } else {
    serviceDetails.innerHTML = "";
  }

  if (currNodeChain.interaction && !["org", "user", "service"].includes(linkType)) {
    interactionDetails.innerHTML = `
      <div class="entity-details ${currNodeChain.interaction.data.type}">
        <h3><img src="interaction.svg" class="h3-icon" />${currNodeChain.interaction.data.name}</h3>
      </div>
    `;

    detailsViewContent.innerHTML = `<ul class="prompt-list"> ${(currNodeChain.interaction.data.prompts || [])
      .map(
        (prompt: Prompt) => `
          <li>  
            <div class="input">
              <div class="top">
                <img class="avatar-img small" src="${currNodeChain.user?.data.imageUrl}" />
                <span>
                  ${currNodeChain.user?.data.name}
                  <span class="timestamp">${prompt.timestamp.toLocaleString("en")}</span> 
                </span>
              </div>
              <div class="bottom"><span>${prompt.input}</span></div>
            </div>
            <div class="output">
              <div class="top">
                <img class="avatar-img small" src="${currNodeChain.service?.data.imageUrl}" />
                <span>
                  ${currNodeChain.service?.data.name} 
                </span>
              </div>
              <div class="bottom"><span>${prompt.output}</span></div>
            </div>
          </li>  
        `
      )
      .join(" ")} </ul>`;
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
