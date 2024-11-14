import { data } from "./data";
import { DATA, H_DATA, STRATIFIED_DATA } from "./api";
import { TreeChart } from "./tree";
import { Api, DataEntry, Org } from "./api.2";
import { HierarchicalData } from "./types";
const limit = 2;

const canvas = document.querySelector("#frame") as HTMLDivElement;
// const toggleBtn = document.querySelector("#toggle-btn") as HTMLButtonElement;
const fetchBtn = document.querySelector("#fetch-btn") as HTMLButtonElement;
const addBtn = document.querySelector("#add-btn") as HTMLButtonElement;

/******/

const treeChart = new TreeChart<any>();
const api = new Api();
// const state: { [k: string]: HierarchicalData<DataEntry> } = {
//   dataByUsers: { name: "orgs", children: [] },
//   dataByServices: { name: "companies", children: [] },
// };

console.log({ DATA, STRATIFIED_DATA, H_DATA, data });

const { svg } = treeChart.buildTree({ name: "orgs", type: "root", children: [] });
canvas.appendChild(svg);

// let i = 0;
// addBtn.onclick = () => {
//   const nodes = [];
//   let newEntries = 0;
//   while (newEntries < limit) {
//     const newd = { data: { name: "NEW ENTRY " + i } };
//     nodes.push(newd);
//     i++;
//     newEntries++;
//   }

//   try {
//     treeChart.addNodes(nodes);
//   } catch (error) {
//     console.warn(error);
//     i -= limit;
//   }
// };
let orgOffset = 0;
const userOffsets: { [k: string]: number } = {};
const interactionOffsets: { [k: string]: { [k: string]: number } } = {};

async function fetchNodes() {
  const selectedNode = treeChart?.selected;
  if (!selectedNode) return;
  console.log("fetch btn onClick -->", { selectedNode });
  // depth 0 root -> orgs
  if (selectedNode.data.type === "root") {
    const entries = (await api.fetchOrgs({ limit, offset: orgOffset })) as DataEntry[];
    orgOffset++;

    const orgNodes = entries.map((org) => ({ data: { ...org } }));
    treeChart.addNodes(orgNodes);
  }
  // depth 1 org -> users
  if (selectedNode.data.type === "org") {
    const orgId = selectedNode.data.id;
    if (!userOffsets[orgId]) {
      userOffsets[orgId] = 0;
    }
    const users = await api.fetchOrgUsers(orgId, { limit, offset: userOffsets[orgId] });
    userOffsets[orgId]++;

    const userNodes = users.map((user) => ({ data: { ...user } }));
    treeChart.addNodes(userNodes);
  }
  // depth 2 user -> services
  if (selectedNode.data.type === "user") {
    const userId = selectedNode.data.id;
    if (!userOffsets[userId]) {
      userOffsets[userId] = 0;
    }
    const services = await api.fetchUserServices(userId, { limit, offset: userOffsets[userId] });
    userOffsets[userId]++;

    const serviceNodes = services.map((service) => ({ data: { ...service, id: `${service.id}::${userId}` } }));
    treeChart.addNodes(serviceNodes);
  }
  // depth 3 user -> services
  if (selectedNode.data.type === "service") {
    const [serviceId, userId] = selectedNode.data.id.split("::");
    // const userId = selectedNode.data.parentId;
    if (!interactionOffsets[serviceId]) {
      interactionOffsets[serviceId] = {};
    }
    if (!interactionOffsets[serviceId][userId]) {
      interactionOffsets[serviceId][userId] = 0;
    }

    const interactions = await api.fetchUserServiceInteractions(userId, serviceId, {
      limit,
      offset: interactionOffsets[serviceId][userId],
    });
    interactionOffsets[serviceId][userId]++;

    const interactionNodes = interactions.map((interaction) => ({
      data: { ...interaction, id: `${interaction.id}::${serviceId}::${userId}` },
    }));
    treeChart.addNodes(interactionNodes);
  }
}

// fetchBtn.onclick = fetchNodes;
