export type HierarchicalData<T> = T & {
  children?: HierarchicalData<T>[];
};

export interface INodeData {
  id: string;
  name: string;
  count: number;
  children: INodeData[];
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
