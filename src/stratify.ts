import * as d3 from "d3";

export const tableRoot = { id: "root", name: "root" };

const orgs = [
  { id: "org-1", name: "Genesys", parentId: "root" },
  { id: "org-2", name: "Acuvity", parentId: "root" },
];

const users = [
  { id: "user-1", name: "John", parentId: "org-1" },
  { id: "user-2", name: "Sarah", parentId: "org-1" },
  { id: "user-3", name: "Jude", parentId: "org-1" },
  { id: "user-4", name: "Kate", parentId: "org-2" },
  { id: "user-5", name: "Aaron", parentId: "org-2" },
];

const companies = [
  { id: "company-1", name: "Open AI", parentId: "root" },
  { id: "company-2", name: "Google", parentId: "root" },
  { id: "company-3", name: "Meta", parentId: "root" },
];

const services = [
  { id: "service-1", name: "ChatGPT", parentId: "company-1" },
  { id: "service-2", name: "Dall-E", parentId: "company-1" },
  { id: "service-3", name: "Gemini", parentId: "company-2" },
  { id: "service-4", name: "Bard", parentId: "company-2" },
  { id: "service-5", name: "Llama", parentId: "company-3" },
];

const interactions = [
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

const DATA = [
  //   { id: "root", name: "root", parentId: null },
  ...orgs,
  ...companies,
  ...users,
  ...services,
  ...interactions,
];

const groupData = d3.group(DATA, (d: any) => d.parentId);
const groupData2 = d3.groups(DATA, (d: any) => d.parentId);

console.log({ groupData, groupData2 });

const STRATIFIED_DATA = undefined;
// const STRATIFIED_DATA = d3
//   .stratify()
//   .id((d: any) => d.id)
//   .parentId((d: any) => d?.parentId || d?.userId || null)(DATA);
// const H_DATA = d3.hierarchy(STRATIFIED_DATA);
const H_DATA = d3.hierarchy(groupData);

// function getChildData(parentId: string, limit: number, offset: number) {
//   const parent = DATA.find((entry) => entry.id === parentId);
//   console.log("getChildData", { parent, parentId, limit, offset });
// }

export { DATA, STRATIFIED_DATA, H_DATA };
