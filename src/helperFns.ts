export const dateIntl = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const dobIntl = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
});
// export const dateIntl = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" });

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function groupArray<T>(array: T[], limit: number): T[][] {
  const result: T[][] = [];
  let currentGroup: T[] = [];

  for (const item of array) {
    currentGroup.push(item);

    if (currentGroup.length === limit) {
      result.push(currentGroup);
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}

export function parseEntryId(type: string, idStr: string) {
  switch (type) {
    case "org":
      return idStr;
    case "user":
      return idStr;
    case "service":
      return idStr.split("::")[0];
    case "interaction":
      return idStr.split("::")[0];
    default:
      return idStr;
  }
}

export function filterDuplicates<T extends { id: string }>(arr: T[]) {
  const res: T[] = [];
  const set = new Set();
  arr.forEach((item) => {
    if (set.has(item.id)) return;
    set.add(item.id);
    res.push(item);
  });
  return res;
}

export function createSvgCircle(color: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="background-color: transparent">
      <circle cx="8" cy="8" r="8" fill="${color}" stroke="#787089" stroke-width="0.2"/>
    </svg>
  `;
}
