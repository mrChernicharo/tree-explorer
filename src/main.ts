import { api, LIMIT } from "./api";
import { TreeChart } from "./tree";
import { INode, Prompt } from "./types";
import { parseEntryId, filterDuplicates } from "./helperFns";

const icons: Record<string, string> = {
  org: "org.svg",
  user: "user.svg",
  company: "company.svg",
  service: "service.svg",
  interaction: "interaction.svg",
};

const canvas = document.querySelector("#frame") as HTMLDivElement;
const breadcrumbs = document.querySelector("#breadcrumbs") as HTMLDivElement;

const details = document.querySelector("#details-view") as HTMLDivElement;
const detailsBackArrow = document.querySelector("#details-view .dismiss-btn") as HTMLDivElement;
const detailsViewContent = document.querySelector("#details-view #details-view-content") as HTMLDivElement;

let selectedNode: INode | null = null;

const currNodeChain: Record<string, INode | null> = { org: null, user: null, service: null, interaction: null };
const promtsCache = new Map<string, { entries: Prompt[]; totalCount: number }>();

/***********************************************************************/

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
      const interactionId = parseEntryId("interaction", selectedNode.data.id);
      if (!promtsCache.get(interactionId)) {
        api.fetchInteractionPrompts(interactionId, { offset: 0 }).then((prompts) => {
          if (!promtsCache.get(interactionId)) {
            promtsCache.set(interactionId, { entries: [], totalCount: 0 });
          }
          const prev = promtsCache.get(interactionId)!;
          promtsCache.set(interactionId, {
            entries: filterDuplicates([...prev.entries, ...prompts.entries]),
            totalCount: prompts.totalCount,
          });
        });
      }
      break;
    default:
      break;
  }

  updateBreadcrumbs();
}

function updateBreadcrumbs() {
  const nodeChain = [currNodeChain.org, currNodeChain.user, currNodeChain.service, currNodeChain.interaction].filter(
    Boolean
  ) as INode[];

  console.log("updateBreadcrumbs", { selectedNode, currNodeChain, nodeChain });

  breadcrumbs.innerHTML = "";
  detailsViewContent.innerHTML = "";
  nodeChain.forEach((node, i) => {
    const entityCard = document.createElement("div");
    const img = node.data?.imageUrl ? `<img class="avatar-img small" src="${node.data.imageUrl}" />` : "";
    const text = `<small><img src="${icons[node.data.type]}" class="icon" /> ${node.data.name}</small>`;
    entityCard.innerHTML = `${img} ${text}`;
    entityCard.classList.add("entity-card");
    entityCard.dataset["type"] = node.data.type;
    if (node.data.id === selectedNode?.data.id) {
      entityCard.classList.add("active");
    } else {
      entityCard.classList.remove("active");
    }
    entityCard.onclick = () => {
      openDetailsView(node.data.type);
    };
    if (i > 0) {
      const separator = document.createElement("span");
      separator.textContent = ` > `;
      breadcrumbs.appendChild(separator);
    }
    breadcrumbs.appendChild(entityCard);
  });
}

function populateDetailsView() {
  switch (details.dataset.type) {
    case "interaction": {
      const { id, name, type, suggestedTitle, subject, green, black, blue, white, orange } =
        currNodeChain.interaction!.data;
      const interactionId = parseEntryId("interaction", id);
      const prompts = promtsCache.get(interactionId);

      detailsViewContent.innerHTML = `
        <div>  
          <div class="head">
            <small>interaction</small>
            <img class="icon" src="${icons[type]}" /> 
            <div>
              <h2>${name}</h2>
              <div>suggested title: ${suggestedTitle}</div>
              <div>subject: ${subject}</div>
              <div><span>${prompts?.totalCount} prompts</span></div>
              <div>green: ${green}</div>
              <div>blue: ${blue}</div>
              <div>white: ${white}</div>
              <div>black: ${black}</div>
              <div>orange: ${orange}</div>
            </div>
          </div>
          <ul class="prompt-list"> ${(prompts?.entries || [])
            .map(
              (prompt: Prompt, i) => `
              <li>
                <div class="input">
                  <div class="top">
                    ${i + 1} <img class="avatar-img small" src="${currNodeChain.user?.data.imageUrl}" />
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
            .join(" ")} 
          </ul>
        <div>  
        `;

      const remaining = (prompts?.totalCount || 0) - ((prompts?.entries || []).length || 0);
      if (remaining > 0) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.classList.add("load-more-btn");
        loadMoreBtn.innerHTML = `Load more +${remaining}`;
        loadMoreBtn.onclick = () => {
          const offset = Math.floor(((prompts?.entries || []).length || 0) / LIMIT);
          api.fetchInteractionPrompts(interactionId, { offset }).then((prompts) => {
            if (!promtsCache.get(interactionId)) {
              promtsCache.set(interactionId, { entries: [], totalCount: 0 });
            }
            const prev = promtsCache.get(interactionId)!;
            const entries = filterDuplicates([...prev.entries, ...prompts.entries]);
            console.log({ offset, entries, prev });
            promtsCache.set(interactionId, { entries, totalCount: prompts.totalCount });
            populateDetailsView();
          });
        };
        detailsViewContent.append(loadMoreBtn);
      }

      return detailsViewContent;
    }
    case "service": {
      const { name, imageUrl, type, company, description, release_date } = currNodeChain.service!.data;
      return (detailsViewContent.innerHTML = `
        <div>
          <div class="head">
            <small>service</small>
            <img class="avatar-img" src="${imageUrl}" />
            <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
          </div>

          <div class="body">
            <div>${company}</div>
            <div>${release_date}</div>
            <div>${description}</div>
          </div>
        </div>
        `);
    }
    case "user": {
      const { name, imageUrl, type, position, zodiacSign, favoriteFood } = currNodeChain.user!.data;
      return (detailsViewContent.innerHTML = `
        <div>
          <div class="head">
            <small>user</small>
            <img class="avatar-img" src="${imageUrl}" />
            <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
          </div>

          <div class="body">
            <div>${position}</div>
            <div>${favoriteFood}</div>
            <div>${zodiacSign}</div>
          </div>
        </div>
        `);
    }
    case "org":
    default: {
      const { name, imageUrl, type } = currNodeChain.org!.data;
      return (detailsViewContent.innerHTML = `
        <div>
          <div class="head">
            <small>organization</small>
            <img class="avatar-img" src="${imageUrl}" />
            <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
          </div>
        </div>
        `);
    }
  }
}

function openDetailsView(linkType: string) {
  canvas.style.display = "none";
  details.style.display = "block";
  details.dataset.type = linkType;

  populateDetailsView();
}

function openMainView() {
  details.style.display = "none";
  canvas.style.display = "block";
}

window.addEventListener("tree-updated", onTreeUpdate);
window.addEventListener("open-details-view", () => openDetailsView("interaction"));
detailsBackArrow.onclick = openMainView;
const { svg } = await initializeTree();
canvas.appendChild(svg);
