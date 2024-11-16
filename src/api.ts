import { faker } from "@faker-js/faker";
import { Org, User, Company, Service, Interaction, DB, ServiceJSON, SimpleService } from "./types";
import { getRandomInt } from "./helperFns";
// @ts-ignore
import servicesList from "/src/services.json";

async function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

type Opts = {
  limit?: number;
  offset?: number;
};

const LIMIT = 5;

class Api {
  db: DB = { orgs: [], users: [], companies: [], services: [], interactions: [] };
  orgOffset = 0;
  orgOffsets: { [k: string]: number } = {};
  userOffsets: { [k: string]: number } = {};
  interactionOffsets: { [k: string]: { [k: string]: number } } = {};

  constructor() {
    const orgCount = 5;
    for (let i = 0; i < orgCount; i++) {
      this.db.orgs.push({
        id: `org-${i + 1}`,
        name: faker.company.name(),
        type: "org",
        parentId: "root",
      });
    }
    const userCount = orgCount * 50;
    for (let i = 0; i < userCount; i++) {
      const parentId = `org-${getRandomInt(1, this.db.orgs.length)}`;
      this.db.users.push({
        id: `user-${i + 1}`,
        name: faker.person.fullName(),
        type: "user",
        parentId,
      });
    }

    const companyNamesSet = new Set<string>();
    for (const service of servicesList as ServiceJSON[]) {
      companyNamesSet.add(service.company);
    }
    const companyNames = [...companyNamesSet];
    for (let i = 0; i < companyNames.length; i++) {
      this.db.companies.push({
        id: `company-${i + 1}`,
        name: companyNames[i],
        type: "company",
        parentId: "root",
      });
    }

    for (let i = 0; i < servicesList.length; i++) {
      const service = servicesList[i];
      const parentId = `company-${this.db.companies.find((com) => com.name === service.company)!}`;
      this.db.services.push({
        ...service,
        id: `service-${i + 1}`,
        type: "service",
        parentId,
      });
    }

    let interactionIdx = 1;
    for (const user of this.db.users) {
      const serviceCount = getRandomInt(0, 16);
      const userServiceIdsSet = new Set<string>();

      while (userServiceIdsSet.size < serviceCount) {
        const randomServiceIdx = getRandomInt(0, this.db.services.length - 1);
        const service = this.db.services[randomServiceIdx];
        userServiceIdsSet.add(service.id);
      }

      const interactionCount = serviceCount * getRandomInt(2, 40);
      const userServiceIds = [...userServiceIdsSet];

      const interactions: Interaction[] = [];
      while (interactions.length < interactionCount) {
        const serviceId = userServiceIds[getRandomInt(0, userServiceIds.length - 1)];
        interactions.push({
          id: `interaction-${interactionIdx}`,
          type: "interaction",
          name: faker.date
            .between({ from: new Date().getTime() - 180 * 24 * 60 * 60 * 1000, to: new Date() })
            .toLocaleString("en"),
          userId: user.id,
          serviceId,
        });
        interactionIdx++;
      }

      this.db.interactions.push(...interactions);
    }
    console.log(this.db);
  }

  async fetchOrgs(options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    // console.log("fetchOrgs", options);

    const entries: Org[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const org = this.db.orgs[idx];
      if (org) {
        entries.push(org);
      }
    }
    await wait(200);
    return { entries, totalCount: this.db.orgs.length };
  }
  async fetchOrgUsers(orgId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const orgUsers = this.db.users.filter((u) => u.parentId === orgId);
    // console.log("fetchOrgUsers", { orgId, options, orgUsers });
    const entries: User[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const user = orgUsers[idx];
      if (user) {
        entries.push(user);
      }
    }
    await wait(200);
    return { entries, totalCount: orgUsers.length };
  }
  async fetchUserServices(userId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const userInteractions = this.db.interactions.filter((s) => s.userId === userId);
    const serviceIds = [...new Set(userInteractions.map((int) => int.serviceId))];
    // console.log("fetchUserServices", { userId, options, userInteractions });
    const entries: SimpleService[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const serviceId = serviceIds[idx];
      const service = this.db.services.find((s) => s.id === serviceId);
      if (service) {
        entries.push(service);
      }
    }
    await wait(200);
    return { entries, totalCount: serviceIds.length };
  }
  async fetchUserServiceInteractions(userId: string, serviceId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const userServiceInteractions = this.db.interactions.filter(
      (int) => int.userId === userId && int.serviceId === serviceId
    );

    const entries: Interaction[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const interaction = userServiceInteractions[idx];
      if (interaction) {
        entries.push(interaction);
      }
    }
    // console.log("::: fetchUserServiceInteractions", { userId, serviceId, userServiceInteractions, entries });
    await wait(200);
    return { entries, totalCount: userServiceInteractions.length };
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

      const interactionNodes = interactions.map((interaction) => ({
        data: {
          ...interaction,
          id: `${interaction.id}::${serviceId}::${userId}`,
          count: 0,
        },
      }));
      return interactionNodes;
    }
  }
}

const api = new Api();
export { api };
