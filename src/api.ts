import jsonDB from "./assets/data.json" with { type: 'json' };
import type { DB, Interaction, Org, Prompt, Service, User } from "./types";

async function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

type Opts = {
  limit?: number;
  offset?: number;
};

export const LIMIT = 5;
const db = jsonDB as DB;

console.log(db)

class Api {
  orgOffset = 0;
  orgOffsets: { [k: string]: number } = {};
  userOffsets: { [k: string]: number } = {};
  interactionOffsets: { [k: string]: { [k: string]: number } } = {};

  async fetchOrgs(options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    // console.log("fetchOrgs", options);

    const entries: Org[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const org = db.orgs[idx];
      if (org) {
        entries.push(org);
      }
    }
    await wait(300);
    return { entries, totalCount: db.orgs.length };
  }
  async fetchOrgUsers(orgId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const orgUsers = db.users.filter((u) => u.parentId === orgId);
    const entries: User[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const user = orgUsers[idx];
      if (user) {
        entries.push(user);
      }
    }
    console.log("fetchOrgUsers", { orgId, options, orgUsers, entries });
    await wait(300);
    return { entries, totalCount: orgUsers.length };
  }
  async fetchUserServices(userId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const userInteractions = db.interactions.filter((s) => s.userId === userId);
    const serviceIds = [...new Set(userInteractions.map((int) => int.serviceId))];
    const entries: Service[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const serviceId = serviceIds[idx];
      const service = db.services.find((s) => s.id === serviceId);
      if (service) {
        entries.push(service);
      }
    }
    console.log("fetchUserServices", { userId, options, userInteractions, entries });
    await wait(300);
    return { entries, totalCount: serviceIds.length };
  }
  async fetchUserServiceInteractions(userId: string, serviceId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const userServiceInteractions = [...db.interactions]
      .filter((int) => int.userId === userId && int.serviceId === serviceId)
      .sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

    const entries: Interaction[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const interaction = userServiceInteractions[idx];
      if (interaction) {
        entries.push(interaction);
      }
    }
    // console.log("::: fetchUserServiceInteractions", { userId, serviceId, userServiceInteractions, entries });
    await wait(300);
    return { entries, totalCount: userServiceInteractions.length };
  }
  async fetchInteractionPrompts(interactionId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const prompts = [...db.prompts]
      .filter((prmpt) => prmpt.interactionId === interactionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const entries: Prompt[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const prompt = prompts[idx];
      if (prompt) {
        entries.push(prompt);
      }
    }
    console.log("::: fetchInteractionPrompts", { interactionId, prompts, db, entries });
    await wait(300);
    return { entries, totalCount: prompts.length };
  }
  //
  // async fetchCompanies
  // async fetchCompanyServices
  // async fetchServiceUsers
  // async fetchServiceUserInteractions

  async fetchNodes(selectedNode: any) {
    if (!selectedNode) return;

    // console.log("fetch btn onClick -->", { selectedNode });

    // depth 0 root -> orgs
    if (selectedNode.data.type === "root") {
      const { entries: orgs } = await this.fetchOrgs({ offset: this.orgOffset });
      this.orgOffset++;

      const orgProms: Promise<any>[] = orgs.map((org) => this.fetchOrgUsers(org.id, { offset: 0 }));
      const totalCounts = (await Promise.all(orgProms)).map((entry) => entry.totalCount);
      //   console.log("root", { orgs, totalCounts });
      const orgNodes = orgs.map((org, i) => {
        return { data: { ...org, count: totalCounts[i] } };
      });
      return orgNodes;
    }
    // depth 1 org -> users
    if (selectedNode.data.type === "org") {
      const orgId = selectedNode.data.id;
      if (!this.orgOffsets[orgId]) {
        this.orgOffsets[orgId] = 0;
      }
      const { entries: users } = await this.fetchOrgUsers(orgId, { offset: this.orgOffsets[orgId] });
      this.orgOffsets[orgId]++;

      const userProms: Promise<any>[] = users.map((user) => this.fetchUserServices(user.id, { offset: 0 }));
      const totalCounts = (await Promise.all(userProms)).map((entry) => entry.totalCount);

      //   console.log("org", { users, totalCount });
      const userNodes = users.map((user, i) => ({ data: { ...user, count: totalCounts[i] } }));
      return userNodes;
    }
    // depth 2 user -> services
    if (selectedNode.data.type === "user") {
      const userId = selectedNode.data.id;
      if (!this.userOffsets[userId]) {
        this.userOffsets[userId] = 0;
      }
      const { entries: services } = await this.fetchUserServices(userId, {
        offset: this.userOffsets[userId],
      });
      this.userOffsets[userId]++;

      const serviceProms: Promise<any>[] = services.map((service) =>
        this.fetchUserServiceInteractions(userId, service.id, { offset: 0 })
      );
      const totalCounts = (await Promise.all(serviceProms)).map((entry) => entry.totalCount);

      const serviceNodes = services.map((service, i) => ({
        data: { ...service, id: `${service.id}::${userId}`, count: totalCounts[i] },
      }));
      return serviceNodes;
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

      const { entries: interactions } = await this.fetchUserServiceInteractions(userId, serviceId, {
        offset: this.interactionOffsets[serviceId][userId],
      });
      this.interactionOffsets[serviceId][userId]++;


      // await this.fetchInteractionPrompts(int)
      const interactionNodes = interactions.map((interaction) => ({
        data: {
          ...interaction,
          id: `${interaction.id}::${serviceId}::${userId}`,
          count: db.prompts.filter(p => p.interactionId === interaction.id).length ,
        },
      }));
      return interactionNodes;
    }
  }

  getEntry(type: string, id: string) {
    const t = type as "orgs" | "users" | "services" | "companies" | "interactions";
    return db[t].find((el) => el.id === id);
  }
}

const api = new Api();
export { api };
