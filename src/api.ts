import { faker } from "@faker-js/faker";
import { Org, User, Company, Service, Interaction, DB, ServiceJSON, Prompt } from "./types";
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

const db: DB = { orgs: [], users: [], companies: [], services: [], interactions: [] };

class Api {
  orgOffset = 0;
  orgOffsets: { [k: string]: number } = {};
  userOffsets: { [k: string]: number } = {};
  interactionOffsets: { [k: string]: { [k: string]: number } } = {};

  constructor() {
    this.#initDB();
  }

  #initDB() {
    const orgCount = 5;
    for (let i = 0; i < orgCount; i++) {
      db.orgs.push({
        id: `org-${i + 1}`,
        name: faker.company.name(),
        imageUrl: faker.image.urlPicsumPhotos({ width: 320, height: 180, blur: 0, grayscale: false }),
        // imageUrl: faker.image.avatar(),
        // imageUrl: faker.image.url({ width: 128, height: 128 }),
        // imageUrl: faker.image.dataUri({ width: 128, height: 128 }),
        // imageUrl: faker.image.urlLoremFlickr({ width: 128, height: 128 }),
        type: "org",
        parentId: "root",
      });
    }
    const userCount = orgCount * 24;
    for (let i = 0; i < userCount; i++) {
      const parentId = `org-${getRandomInt(1, db.orgs.length)}`;
      db.users.push({
        id: `user-${i + 1}`,
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        position: faker.person.jobTitle(),
        imageUrl: faker.image.avatar(),
        favoriteFood: faker.food.dish(),
        zodiacSign: faker.person.zodiacSign(),
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
      db.companies.push({
        id: `company-${i + 1}`,
        name: companyNames[i],
        imageUrl: faker.image.urlLoremFlickr({ width: 128, height: 128 }),
        type: "company",
        parentId: "root",
      });
    }

    for (let i = 0; i < servicesList.length; i++) {
      const service = servicesList[i];
      const company = db.companies.find((com) => com.name === service.company)!;
      db.services.push({
        ...service,
        id: `service-${i + 1}`,
        type: "service",
        parentId: company.id,
      });
    }

    let interactionIdx = 1;
    for (const user of db.users) {
      const serviceCount = getRandomInt(0, 12);
      const userServiceIdsSet = new Set<string>();

      while (userServiceIdsSet.size < serviceCount) {
        const randomServiceIdx = getRandomInt(0, db.services.length - 1);
        const service = db.services[randomServiceIdx];
        userServiceIdsSet.add(service.id);
      }

      const interactionCount = serviceCount * getRandomInt(2, 40);
      const userServiceIds = [...userServiceIdsSet];

      const interactions: Interaction[] = [];
      while (interactions.length < interactionCount) {
        const serviceId = userServiceIds[getRandomInt(0, userServiceIds.length - 1)];
        const interactionDate = faker.date.between({
          from: new Date().getTime() - 180 * 24 * 60 * 60 * 1000,
          to: new Date(),
        });
        const prompts: Prompt[] = [];
        const promptCount = getRandomInt(1, 6);
        let interval = getRandomInt(6000, 60_000);
        for (let i = 0; i < promptCount; i++) {
          const prompt = {
            input: faker.lorem.lines({ min: 1, max: 2 }),
            output: faker.lorem.lines({ min: 2, max: 6 }),
            timestamp: new Date(interactionDate.getTime() + interval),
          };
          interval += getRandomInt(6000, 60_000);
          prompts.push(prompt);
        }

        interactions.push({
          id: `interaction-${interactionIdx}`,
          type: "interaction",
          name: interactionDate.toLocaleString("en"),
          userId: user.id,
          serviceId,
          prompts,
        });
        interactionIdx++;
      }

      db.interactions.push(...interactions);
    }
    console.log(db);
  }

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
    await wait(200);
    return { entries, totalCount: db.orgs.length };
  }
  async fetchOrgUsers(orgId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const orgUsers = db.users.filter((u) => u.parentId === orgId);
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
    const userInteractions = db.interactions.filter((s) => s.userId === userId);
    const serviceIds = [...new Set(userInteractions.map((int) => int.serviceId))];
    // console.log("fetchUserServices", { userId, options, userInteractions });
    const entries: Service[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const serviceId = serviceIds[idx];
      const service = db.services.find((s) => s.id === serviceId);
      if (service) {
        entries.push(service);
      }
    }
    await wait(200);
    return { entries, totalCount: serviceIds.length };
  }
  async fetchUserServiceInteractions(userId: string, serviceId: string, options: Opts) {
    const { limit = LIMIT, offset = 0 } = options;
    const userServiceInteractions = [...db.interactions]
      .filter((int) => int.userId === userId && int.serviceId === serviceId)
      .sort((a, b) => b.prompts[0].timestamp.getTime() - a.prompts[0].timestamp.getTime());

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

  getEntry(type: string, id: string) {
    const t = type as "org" | "user" | "service" | "interaction";
    return db[`${t}s`].find((el) => el.id === id);
  }
}

const api = new Api();
export { api };
