export interface DataEntry {
  name: string;
  id?: string;
  parentId?: string;
  value?: number;
}

export interface Org {
  id: string;
  type: "org";
  parentId: "root";
  name: string;
  imageUrl: string;
  country: string;
}
export interface User {
  id: string;
  type: "user";
  parentId: string;
  name: string;
  imageUrl: string;
  email: string;
  dateOfBirth: Date | string;
  position: string;
  favoriteFood: string;
  zodiacSign: string;
}
export interface Company {
  id: string;
  type: "company";
  parentId: "root";
  name: string;
  country: string;
  imageUrl: string;
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
  timestamp: Date | string;
}

export interface Interaction {
  id: string;
  name: string;
  type: "interaction";
  userId: string;
  serviceId: string;
  suggestedTitle: string;
  subject: string;
  sentiment: string;
  confidence: number;
  ip: string;
  latency: number;
  w: number;
  x: number;
  y: number;
  z: number;
  white: number;
  black: number;
  green: number;
  blue: number;
  purple: number;
  orange: number;
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
  email?: string;
  dateOfBirth?: Date;
  // service
  category?: string;
  description?: string;
  company?: string;
  release_date?: number;
  country?: string;
  // interaction
  suggestedTitle?: string;
  subject?: string;
  sentiment?: string;
  confidence?: number;
  ip?: string;
  latency?: number;
  w?: number;
  x?: number;
  y?: number;
  z?: number;
  white?: number;
  black?: number;
  green?: number;
  blue?: number;
  purple?: number;
  orange?: number;
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
