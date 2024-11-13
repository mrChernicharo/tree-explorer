export type HierarchicalData<T> = T & {
  children?: HierarchicalData<T>[];
};

// const d: HierarchicalData<{ name: string; country: string; value?: number }> = {
//   name: "tom",
//   country: "UK",
//   children: [],
// };
