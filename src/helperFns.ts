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

export const dateIntl = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" });
