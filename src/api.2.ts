async function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export interface DataEntry {
  name: string;
  id?: string;
  parentId?: string;
  value?: number;
}

export interface Org {
  id: string;
  name: string;
  type: "org";
  parentId: "root";
}
export interface User {
  id: string;
  name: string;
  type: "user";
  parentId: string;
}
export interface Company {
  id: string;
  name: string;
  type: "company";
  parentId: "root";
}
export interface Service {
  id: string;
  name: string;
  type: "service";
  parentId: string;
}
export interface Interaction {
  id: string;
  name: string;
  type: "interaction";
  userId: string;
  serviceId: string;
}

const orgs: Org[] = [
  { id: "org-1", type: "org", name: "Genesys", parentId: "root" },
  { id: "org-2", type: "org", name: "Acuvity", parentId: "root" },
  { id: "org-3", type: "org", name: "Uber", parentId: "root" },
  { id: "org-4", type: "org", name: "Twilio", parentId: "root" },
  { id: "org-5", type: "org", name: "Github", parentId: "root" },
];

const users: User[] = [
  { id: "user-1", type: "user", name: "John", parentId: "org-1" },
  { id: "user-2", type: "user", name: "Sarah", parentId: "org-1" },
  { id: "user-3", type: "user", name: "Jude", parentId: "org-1" },
  { id: "user-4", type: "user", name: "Juan", parentId: "org-1" },
  { id: "user-5", type: "user", name: "Kate", parentId: "org-1" },
  { id: "user-6", type: "user", name: "Aaron", parentId: "org-2" },
  { id: "user-7", type: "user", name: "Tina", parentId: "org-2" },
  { id: "user-8", type: "user", name: "Gordinha", parentId: "org-2" },
  { id: "user-9", type: "user", name: "Nana", parentId: "org-3" },
  { id: "user-10", type: "user", name: "Gordo", parentId: "org-4" },
];

const companies: Company[] = [
  { id: "company-1", type: "company", name: "Open AI", parentId: "root" },
  { id: "company-2", type: "company", name: "Google", parentId: "root" },
  { id: "company-3", type: "company", name: "Meta", parentId: "root" },
];

const services: Service[] = [
  { id: "service-1", type: "service", name: "ChatGPT", parentId: "company-1" },
  { id: "service-2", type: "service", name: "Dall-E", parentId: "company-1" },
  { id: "service-3", type: "service", name: "Gemini", parentId: "company-2" },
  { id: "service-4", type: "service", name: "Bard", parentId: "company-2" },
  { id: "service-5", type: "service", name: "Llama", parentId: "company-3" },
];

const interactions: Interaction[] = [
  { id: "interaction-0", type: "interaction", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-01", type: "interaction", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-1", type: "interaction", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-2", type: "interaction", name: "2024-11-20", userId: "user-1", serviceId: "service-2" },
  { id: "interaction-3", type: "interaction", name: "2024-11-19", userId: "user-1", serviceId: "service-3" },
  { id: "interaction-4", type: "interaction", name: "2024-11-18", userId: "user-1", serviceId: "service-5" },
  { id: "interaction-5", type: "interaction", name: "2024-11-17", userId: "user-2", serviceId: "service-1" },
  { id: "interaction-6", type: "interaction", name: "2024-11-16", userId: "user-2", serviceId: "service-2" },
  { id: "interaction-7", type: "interaction", name: "2024-11-15", userId: "user-3", serviceId: "service-3" },
  { id: "interaction-8", type: "interaction", name: "2024-11-14", userId: "user-3", serviceId: "service-4" },
  { id: "interaction-9", type: "interaction", name: "2024-11-13", userId: "user-3", serviceId: "service-5" },
  { id: "interaction-10", type: "interaction", name: "2024-11-12", userId: "user-4", serviceId: "service-1" },
  { id: "interaction-11", type: "interaction", name: "2024-11-11", userId: "user-4", serviceId: "service-2" },
  { id: "interaction-12", type: "interaction", name: "2024-11-10", userId: "user-4", serviceId: "service-3" },
  { id: "interaction-13", type: "interaction", name: "2024-11-09", userId: "user-4", serviceId: "service-4" },
  { id: "interaction-14", type: "interaction", name: "2024-11-08", userId: "user-4", serviceId: "service-5" },
];

type Opts = {
  limit: number;
  offset: number;
};

const limit = 2;

class Api {
  orgOffset = 0;
  orgOffsets: { [k: string]: number } = {};
  userOffsets: { [k: string]: number } = {};
  interactionOffsets: { [k: string]: { [k: string]: number } } = {};

  async fetchOrgs(options: Opts) {
    const { limit, offset = 0 } = options;
    console.log("fetchOrgs", options);

    const entries: Org[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const org = orgs[idx];
      if (org) {
        entries.push(org);
      }
    }
    await wait(1000);
    return { entries, totalCount: orgs.length };
  }
  async fetchOrgUsers(orgId: string, options: Opts) {
    const { limit, offset = 0 } = options;
    const filteredUsers = users.filter((u) => u.parentId === orgId);
    // console.log("fetchOrgUsers", { orgId, options, filteredUsers });
    const entries: User[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const user = filteredUsers[idx];
      if (user) {
        entries.push(user);
      }
    }
    await wait(1000);
    return { entries, totalCount: filteredUsers.length };
  }
  async fetchUserServices(userId: string, options: Opts) {
    const { limit, offset = 0 } = options;
    const userInteractions = interactions.filter((s) => s.userId === userId);
    const serviceIds = [...new Set(userInteractions.map((int) => int.serviceId))];
    // console.log("fetchUserServices", { userId, options, userInteractions });
    const entries: Service[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const serviceId = serviceIds[idx];
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        entries.push(service);
      }
    }
    await wait(1000);
    return { entries, totalCount: serviceIds.length };
  }
  async fetchUserServiceInteractions(userId: string, serviceId: string, options: Opts) {
    const { limit, offset = 0 } = options;
    const userServiceInteractions = interactions.filter((int) => int.userId === userId && int.serviceId === serviceId);

    const entries: Interaction[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const interaction = userServiceInteractions[idx];
      if (interaction) {
        entries.push(interaction);
      }
    }
    // console.log("::: fetchUserServiceInteractions", { userId, serviceId, userServiceInteractions, entries });
    await wait(1000);
    return { entries, totalCount: userServiceInteractions.length };
  }
  //
  // async fetchCompanies
  // async fetchCompanyServices
  // async fetchServiceUsers
  // async fetchServiceUserInteractions

  async fetchNodes(selectedNode: any) {
    if (!selectedNode) return;
    console.log("fetch btn onClick -->", { selectedNode });
    // depth 0 root -> orgs
    if (selectedNode.data.type === "root") {
      const { entries: orgs, totalCount } = await this.fetchOrgs({ limit, offset: this.orgOffset });
      this.orgOffset++;

      const orgNodes = orgs.map((org) => ({ data: { ...org, count: totalCount - orgs.length } }));
      return orgNodes;
      // treeChart.addNodes(orgNodes);
    }
    // depth 1 org -> users
    if (selectedNode.data.type === "org") {
      const orgId = selectedNode.data.id;
      if (!this.orgOffsets[orgId]) {
        this.orgOffsets[orgId] = 0;
      }
      const { entries: users, totalCount } = await this.fetchOrgUsers(orgId, { limit, offset: this.orgOffsets[orgId] });
      this.orgOffsets[orgId]++;

      const userNodes = users.map((user) => ({ data: { ...user, count: totalCount - users.length } }));
      return userNodes;
      // treeChart.addNodes(userNodes);
    }
    // depth 2 user -> services
    if (selectedNode.data.type === "user") {
      const userId = selectedNode.data.id;
      if (!this.userOffsets[userId]) {
        this.userOffsets[userId] = 0;
      }
      const { entries: services, totalCount } = await this.fetchUserServices(userId, {
        limit,
        offset: this.userOffsets[userId],
      });
      this.userOffsets[userId]++;

      const serviceNodes = services.map((service) => ({
        data: { ...service, id: `${service.id}::${userId}`, count: totalCount - services.length },
      }));
      return serviceNodes;
      // treeChart.addNodes(serviceNodes);
    }
    // depth 3 user -> services
    if (selectedNode.data.type === "service") {
      const [serviceId, userId] = selectedNode.data.id.split("::");

      if (!this.interactionOffsets[serviceId]) {
        this.interactionOffsets[serviceId] = {};
      }
      if (!this.interactionOffsets[serviceId][userId]) {
        this.interactionOffsets[serviceId][userId] = 0;
      }

      const { entries: interactions, totalCount } = await this.fetchUserServiceInteractions(userId, serviceId, {
        limit,
        offset: this.interactionOffsets[serviceId][userId],
      });
      this.interactionOffsets[serviceId][userId]++;

      const interactionNodes = interactions.map((interaction) => ({
        data: {
          ...interaction,
          id: `${interaction.id}::${serviceId}::${userId}`,
          count: totalCount - interactions.length,
        },
      }));
      return interactionNodes;
      // treeChart.addNodes(interactionNodes);
    }
  }
}

export { Api };
