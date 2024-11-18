import { api, LIMIT } from "./api";
import { TreeChart } from "./tree";
import { Company, INode, Interaction, Prompt, Service } from "./types";
import { createSvgCircle, parseEntryId, filterDuplicates, dateIntl, dobIntl } from "./helperFns";

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
const promptsCache = new Map<string, { entries: Prompt[]; totalCount: number }>();

/***********************************************************************/

async function initializeTree() {
  const treeChart = new TreeChart<{ name: string; type: string; count: number; imageUrl: string; children: INode[] }>();
  const { totalCount: orgCount } = await api.fetchOrgs({ offset: 0 });
  const rootNode = { name: "Orgs", type: "root", children: [], count: orgCount, imageUrl: "" };
  return treeChart.initTree(rootNode);
}

function onTreeUpdated(event: Event) {
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
      if (!promptsCache.get(interactionId)) {
        api.fetchInteractionPrompts(interactionId, { offset: 0 }).then((prompts) => {
          if (!promptsCache.get(interactionId)) {
            promptsCache.set(interactionId, { entries: [], totalCount: 0 });
          }
          const prev = promptsCache.get(interactionId)!;
          promptsCache.set(interactionId, {
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

function buildInteractionDetailsView() {
  const {
    id,
    name,
    type,
    suggestedTitle,
    confidence,
    sentiment,
    subject,
    ip,
    latency,
    green,
    black,
    blue,
    white,
    orange,
    purple,
    x,
    y,
    z,
    w,
  } = currNodeChain.interaction!.data;
  const interactionId = parseEntryId("interaction", id);
  const prompts = promptsCache.get(interactionId);
  const viewContent = `
        <div>  
          <div class="head">
            <small>interaction</small>
            <img class="icon" src="${icons[type]}" /> 
            <div>
              <h2>${name}</h2>
              <div style="text-align: center; margin-top: 10px">${interactionId}</div>
            </div>
          </div>
          <div class="body">
            <div>subject: ${subject}</div>
            <div>sentiment: ${sentiment}</div>
            <div>suggested title: ${suggestedTitle}</div>
            <div>confidence: ${(confidence! * 10).toFixed(2)}%</div>
            <br />
            <div>ip address: ${ip}</div>
            <div>latency: ${latency}ms</div>
            <br />
            <div class="interaction-char-data">
              <div>x: ${x}</div>
              <div>y: ${y}</div>
              <div>z: ${z}</div>
              <div>w: ${w}</div>
            </div>
            <br />
            <div class="interaction-color-data">
              <div>${createSvgCircle("#00ddb3")} ${green}</div>
              <div>${createSvgCircle("#232bff")} ${blue}</div>
              <div>${createSvgCircle("#f3f6f8")} ${white}</div>
              <div>${createSvgCircle("#000")} ${black}</div>
              <div>${createSvgCircle("#772dff")} ${purple}</div>
              <div>${createSvgCircle("#ff9900")} ${orange}</div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 16px 0 36px">
            <h3>${prompts?.totalCount} prompts</h3>
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
                      <span class="timestamp">${dateIntl.format(new Date(prompt.timestamp))}</span>
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

  let loadMoreBtn: HTMLButtonElement | null = null;
  const remaining = (prompts?.totalCount || 0) - ((prompts?.entries || []).length || 0);
  if (remaining > 0) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.classList.add("load-more-btn");
    loadMoreBtn.innerHTML = `
            <span>Load more Prompts +${remaining}</span>
            <img src="spinner.svg" width="24" height="24" />
            `;
    loadMoreBtn.onclick = () => {
      (loadMoreBtn as HTMLButtonElement).classList.add("loading");
      const offset = Math.floor(((prompts?.entries || []).length || 0) / LIMIT);
      api
        .fetchInteractionPrompts(interactionId, { offset })
        .then((prompts) => {
          if (!promptsCache.get(interactionId)) {
            promptsCache.set(interactionId, { entries: [], totalCount: 0 });
          }
          const prev = promptsCache.get(interactionId)!;
          const entries = filterDuplicates([...prev.entries, ...prompts.entries]);
          console.log({ offset, entries, prev });
          promptsCache.set(interactionId, { entries, totalCount: prompts.totalCount });
          populateDetailsView();
        })
        .finally(() => {
          (loadMoreBtn as HTMLButtonElement).classList.remove("loading");
        });
    };
  }

  return { viewContent, loadMoreBtn };
}

function buildServiceDetailsView() {
  const { id, name, imageUrl, type, description, category, release_date } = currNodeChain.service!.data;
  const serviceId = parseEntryId("service", id);
  const { parentId: companyId } = api.getEntry("services", serviceId) as Service;
  const company = api.getEntry("companies", companyId) as Company;

  return `
    <div>
      <div class="head">
        <small>service</small>
        <img class="avatar-img" src="${imageUrl}" />
        <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
        <div>${serviceId}</div>
      </div>

      <div class="body">
        <div>${description}</div>
        <br />
        <div>category: ${category}</div>
        <div>release date: ${release_date}</div>
        <br />
        <h4>Company: ${company.name}</h4>
        <div>country: ${company.country}</div>
      </div>
    </div>
    `;
}

function buildUserDetailsView() {
  const { id, name, imageUrl, type, email, dateOfBirth, position, zodiacSign, favoriteFood } = currNodeChain.user!.data;
  const dob = new Date(dateOfBirth!);
  return `
  <div>
    <div class="head">
      <small>user</small>
      <img class="avatar-img" src="${imageUrl}" />
      <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
      <div>${position}</div>
      <div>${id}</div>
    </div>

    <div class="body">
      <div><a href="mailto:${email}" target="_blank">${email}</a></div>
      <br />
      <div>birthdate: ${dobIntl.format(dob)}</div>
      <div>age: ${Math.floor((Date.now() - dob!.getTime()) / (365 * 24 * 60 * 60 * 1000))} years</div>
      <br />
      <div>favorite food: ${favoriteFood}</div>
      <div>zodiac sign: ${zodiacSign}</div>
    </div>
  </div>
  `;
}

function buildOrgDetailsView() {
  const { id, name, imageUrl, type, country } = currNodeChain.org!.data;
  return `
    <div>
      <div class="head">
        <small>organization</small>
        <img class="avatar-img" src="${imageUrl}" />
        <h2><img class="icon" src="${icons[type]}" /> ${name}</h2>
        <div>${id}</div>
      </div>
      <div class="body">
        <span>country: ${country}</span>
      </div>  
    </div>
    `;
}

function populateDetailsView() {
  switch (details.dataset.type) {
    case "interaction":
      const { viewContent, loadMoreBtn } = buildInteractionDetailsView();
      detailsViewContent.innerHTML = viewContent;
      if (loadMoreBtn) {
        detailsViewContent.append(loadMoreBtn);
      }
      break;
    case "service":
      detailsViewContent.innerHTML = buildServiceDetailsView();
      break;
    case "user":
      detailsViewContent.innerHTML = buildUserDetailsView();
      break;
    case "org":
      detailsViewContent.innerHTML = buildOrgDetailsView();
      break;
  }
  return detailsViewContent;
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

async function main() {
  window.addEventListener("tree-updated", onTreeUpdated);
  window.addEventListener("open-details-view", () => openDetailsView("interaction"));
  detailsBackArrow.addEventListener("click", openMainView);

  const { svg } = await initializeTree();
  canvas.appendChild(svg);

  document.body.classList.remove("loading");
}

main();
