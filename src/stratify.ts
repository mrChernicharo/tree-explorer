import * as d3 from "d3";

export const tableRoot = { id: "root", name: "root" };

export const orgs = [
  { id: "org-1", name: "Genesys" },
  { id: "org-2", name: "Acuvity" },
];

export const users = [
  { id: "user-1", name: "John", orgId: "org-1" },
  { id: "user-2", name: "Sarah", orgId: "org-1" },
  { id: "user-3", name: "Jude", orgId: "org-1" },
  { id: "user-4", name: "Kate", orgId: "org-2" },
  { id: "user-5", name: "Aaron", orgId: "org-2" },
];

export const companies = [
  { id: "company-1", name: "Open AI" },
  { id: "company-2", name: "Google" },
  { id: "company-3", name: "Meta" },
];

export const services = [
  { id: "service-1", name: "ChatGPT", companyId: "company-1" },
  { id: "service-2", name: "Dall-E", companyId: "company-1" },
  { id: "service-3", name: "Gemini", companyId: "company-2" },
  { id: "service-4", name: "Llama", companyId: "company-3" },
];

export const interactions = [
  { id: "interaction-1", name: "2024-11-21", userId: "user-1", serviceId: "service-1" },
  { id: "interaction-2", name: "2024-11-20", userId: "user-1", serviceId: "service-2" },
  { id: "interaction-3", name: "2024-11-19", userId: "user-1", serviceId: "service-3" },
  { id: "interaction-4", name: "2024-11-18", userId: "user-1", serviceId: "service-4" },
  { id: "interaction-5", name: "2024-11-17", userId: "user-2", serviceId: "service-1" },
  { id: "interaction-6", name: "2024-11-16", userId: "user-2", serviceId: "service-2" },
  { id: "interaction-7", name: "2024-11-15", userId: "user-3", serviceId: "service-3" },
  { id: "interaction-8", name: "2024-11-14", userId: "user-3", serviceId: "service-4" },
  { id: "interaction-9", name: "2024-11-13", userId: "user-4", serviceId: "service-1" },
  { id: "interaction-10", name: "2024-11-12", userId: "user-4", serviceId: "service-2" },
  { id: "interaction-11", name: "2024-11-11", userId: "user-4", serviceId: "service-3" },
  { id: "interaction-12", name: "2024-11-10", userId: "user-4", serviceId: "service-4" },
];

const table = [tableRoot, ...orgs, ...users, ...companies, ...services, ...interactions];
console.log(table);

const data = d3
  .stratify()
  .id((d: any) => d.id)
  .parentId((d: any) => {
    if (d.orgId) return d.orgId;
    if (d.companyId) return d.companyId;
    if (d.userId) return d.userId;
    if (d.id == "root") return null;
    else return "root";
  })(table);

export function stratifyTableData<T>(table: T[]) {
  return d3
    .stratify()
    .id((d: any) => d.id)
    .parentId((d: any) => {
      if (d.orgId) return d.orgId;
      if (d.companyId) return d.companyId;
      if (d.userId) return d.userId;
      if (d.id == "root") return null;
      else return "root";
    })(table);
}

console.log({ data });
