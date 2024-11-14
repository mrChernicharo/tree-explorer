async function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export interface Org {
  id: string;
  name: string;
  parentId: "root";
}
export interface User {
  id: string;
  name: string;
  parentId: string;
}
export interface Company {
  id: string;
  name: string;
  parentId: "root";
}
export interface Service {
  id: string;
  name: string;
  parentId: string;
}
export interface Interaction {
  id: string;
  name: string;
  userId: string;
  serviceId: string;
}

const orgs: Org[] = [
  { id: "org-1", name: "Genesys", parentId: "root" },
  { id: "org-2", name: "Acuvity", parentId: "root" },
  { id: "org-3", name: "Uber", parentId: "root" },
  { id: "org-4", name: "Twilio", parentId: "root" },
  { id: "org-5", name: "Github", parentId: "root" },
];

const users: User[] = [
  { id: "user-1", name: "John", parentId: "org-1" },
  { id: "user-2", name: "Sarah", parentId: "org-1" },
  { id: "user-3", name: "Jude", parentId: "org-1" },
  { id: "user-4", name: "Juan", parentId: "org-1" },
  { id: "user-5", name: "Kate", parentId: "org-1" },
  { id: "user-6", name: "Aaron", parentId: "org-2" },
  { id: "user-7", name: "Tina", parentId: "org-2" },
  { id: "user-8", name: "Gordinha", parentId: "org-2" },
  { id: "user-9", name: "Nana", parentId: "org-3" },
  { id: "user-10", name: "Gordo", parentId: "org-4" },
];

const companies: Company[] = [
  { id: "company-1", name: "Open AI", parentId: "root" },
  { id: "company-2", name: "Google", parentId: "root" },
  { id: "company-3", name: "Meta", parentId: "root" },
];

const services: Service[] = [
  { id: "service-1", name: "ChatGPT", parentId: "company-1" },
  { id: "service-2", name: "Dall-E", parentId: "company-1" },
  { id: "service-3", name: "Gemini", parentId: "company-2" },
  { id: "service-4", name: "Bard", parentId: "company-2" },
  { id: "service-5", name: "Llama", parentId: "company-3" },
];

const interactions: Interaction[] = [
  { id: "interaction-0", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-01", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-1", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-2", name: "2024-11-20", userId: "user-1", serviceId: "service-2" },
  { id: "interaction-3", name: "2024-11-19", userId: "user-1", serviceId: "service-3" },
  { id: "interaction-4", name: "2024-11-18", userId: "user-1", serviceId: "service-5" },
  { id: "interaction-5", name: "2024-11-17", userId: "user-2", serviceId: "service-1" },
  { id: "interaction-6", name: "2024-11-16", userId: "user-2", serviceId: "service-2" },
  { id: "interaction-7", name: "2024-11-15", userId: "user-3", serviceId: "service-3" },
  { id: "interaction-8", name: "2024-11-14", userId: "user-3", serviceId: "service-4" },
  { id: "interaction-9", name: "2024-11-13", userId: "user-3", serviceId: "service-5" },
  { id: "interaction-10", name: "2024-11-12", userId: "user-4", serviceId: "service-1" },
  { id: "interaction-11", name: "2024-11-11", userId: "user-4", serviceId: "service-2" },
  { id: "interaction-12", name: "2024-11-10", userId: "user-4", serviceId: "service-3" },
  { id: "interaction-13", name: "2024-11-09", userId: "user-4", serviceId: "service-4" },
  { id: "interaction-14", name: "2024-11-08", userId: "user-4", serviceId: "service-5" },
];

type Opts = {
  limit: number;
  offset: number;
};

class Api {
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
    await wait(300);
    return entries;
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
    await wait(300);
    return entries;
  }
  async fetchUserServices(userId: string, options: Opts) {
    const { limit, offset = 0 } = options;
    const userInteractions = interactions.filter((s) => s.userId === userId);
    const serviceIds = [...new Set(userInteractions.map((int) => int.serviceId))];
    // console.log("fetchUserServices", { userId, options, userInteractions });
    const entries: User[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = limit * offset + i;
      const serviceId = serviceIds[idx];
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        entries.push(service);
      }
    }
    await wait(300);
    return entries;
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
    await wait(300);
    return entries;
  }
  //
  // async fetchCompanies
  // async fetchCompanyServices
  // async fetchServiceUsers
  // async fetchServiceUserInteractions
}

export { Api };
