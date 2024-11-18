export interface DataEntry {
  name: string;
  id?: string;
  parentId?: string;
  value?: number;
}

export interface Org {
  id: string;
  name: string;
  imageUrl: string;
  type: "org";
  parentId: "root";
}
export interface User {
  id: string;
  name: string;
  imageUrl: string;
  position: string;
  favoriteFood: string;
  zodiacSign: string;
  type: "user";
  parentId: string;
}
export interface Company {
  id: string;
  name: string;
  imageUrl: string;
  type: "company";
  parentId: "root";
}

export interface ServiceJSON {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  description: string;
  company: string;
  release_date: number;
}

export interface Service extends Omit<ServiceJSON, "id"> {
  id: string;
  type: "service";
  parentId: string;
}

export interface Prompt {
  id: string;
  interactionId: string;
  input: string;
  output: string;
  timestamp: Date;
}

export interface Interaction {
  id: string;
  name: string;
  type: "interaction";
  userId: string;
  serviceId: string;
}

export type HierarchicalData<T> = T & {
  children?: HierarchicalData<T>[];
};

export interface INodeData {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  count: number;
  children: INodeData[];
  // user
  position?: string;
  favoriteFood?: string;
  zodiacSign?: string;
  // service
  category?: string;
  description?: string;
  company?: string;
  release_date?: number;
  // interaction
  prompts?: Prompt[];
}

export interface INode {
  id: number | string;
  data: INodeData;
  height: number;
  depth: number;
  x: number;
  y: number;
  x0: number;
  y0: number;
  parent: INode | null;
  children: INode[] | null;
  _children: INode[] | null;
}

export interface ILink {
  source: INode;
  target: INode;
}

export interface DB {
  orgs: Org[];
  users: User[];
  companies: Company[];
  services: Service[];
  interactions: Interaction[];
  prompts: Prompt[];
}
