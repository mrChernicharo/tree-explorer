import { HierarchicalData } from "./types";

const data: HierarchicalData<{ name: string; value?: number }> = {
  name: "orgs",
  children: [
    {
      name: "Google",
      children: [
        {
          name: "Tom",
          children: [
            {
              name: "ChatGPT",
              children: [
                { name: "2024-11-10", value: 50 },
                { name: "2024-11-09", value: 50 },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-03", value: 50 },
              ],
            },
          ],
        },
        {
          name: "Sarah",
          children: [
            {
              name: "Gemini",
              children: [
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-05", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                { name: "2024-11-02", value: 50 },
              ],
            },
            {
              name: "Stable Difusion",
              children: [
                { name: "2024-11-10", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                { name: "2024-11-01", value: 50 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Meta",
      children: [
        {
          name: "Roy",
          children: [
            {
              name: "ChatGPT",
              children: [
                { name: "2024-11-09", value: 50 },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-07", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                { name: "2024-11-09", value: 50 },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-07", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                {
                  name: "Click me PLEASE!!!!",
                  children: [
                    {
                      name: "more",
                      children: [
                        {
                          name: "even more",
                          children: [
                            {
                              name: "more yet...",
                              children: [
                                { name: "2024-11-08", value: 50 },
                                { name: "2024-11-07", value: 50 },
                                { name: "2024-11-06", value: 50 },
                                { name: "2024-11-04", value: 50 },
                                { name: "2024-11-03", value: 50 },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-07", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                { name: "2024-11-09", value: 50 },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-07", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
                { name: "2024-11-09", value: 50 },
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-07", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-04", value: 50 },
                { name: "2024-11-03", value: 50 },
              ],
            },
            {
              name: "Gemini",
              children: [
                { name: "2024-11-08", value: 50 },
                { name: "2024-11-06", value: 50 },
                { name: "2024-11-05", value: 50 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export { data };

// const data2 = [
//   { name: "A", value: 123, country: "Brazil", parent: null },
//   { name: "B", value: 45, country: "Brazil", parent: "A" },
//   { name: "C", value: 13, country: "Brazil", parent: "A" },
//   { name: "D", value: 273, country: "Brazil", parent: "A" },
//   { name: "E", value: 78, country: "US", parent: "A" },
//   { name: "F", value: 123, country: "US", parent: "E" },
//   { name: "G", value: 45, country: "Japan", parent: "C" },
//   { name: "H", value: 13, country: "Japan", parent: "C" },
//   { name: "I", value: 273, country: "Ireland", parent: "C" },
//   { name: "J", value: 78, country: "Slovenia", parent: "C" },
// ];

// const root = d3
//   .stratify()
//   .id((d) => d.name)
//   .parentId((d) => d.parent)(data2);
