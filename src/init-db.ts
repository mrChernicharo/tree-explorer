import path from "node:path";
import fs from "node:fs/promises";
import { faker } from "@faker-js/faker";
import { getRandomInt } from "./helperFns.ts";
import servicesList from "./services.json" with { type: "json" };
import type { DB, ServiceJSON, Interaction, Prompt } from "./types.ts";
;

console.log("hello db init");


async function initDB() {
  const db: DB = { orgs: [], users: [], companies: [], services: [], interactions: [], prompts: [] };
  const orgCount = 5;
  for (let i = 0; i < orgCount; i++) {
    db.orgs.push({
      id: `org-${i + 1}`,
      name: faker.company.name(),
      imageUrl: faker.image.urlPicsumPhotos({ width: 320, height: 180, blur: 0, grayscale: false }),
      country: faker.location.country(),
      // imageUrl: faker.image.avatar(),
      // imageUrl: faker.image.url({ width: 128, height: 128 }),
      // imageUrl: faker.image.dataUri({ width: 128, height: 128 }),
      // imageUrl: faker.image.urlLoremFlickr({ width: 128, height: 128 }),
      type: "org",
      parentId: "root",
    });
  }
  const userCount = orgCount * 24;
  for (let i = 0; i < userCount; i++) {
    const parentId = `org-${getRandomInt(1, db.orgs.length)}`;
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName })
    const dateOfBirth = faker.date.birthdate()
    db.users.push({
      id: `user-${i + 1}`,
      name: `${firstName} ${lastName}`,
      imageUrl: faker.image.avatar(),
      position: faker.person.jobTitle(),
      email,
      dateOfBirth,
      favoriteFood: faker.food.dish(),
      zodiacSign: faker.person.zodiacSign(),
      type: "user",
      parentId,
    });
  }

  const companyNamesSet = new Set<string>();
  for (const service of servicesList as ServiceJSON[]) {
    companyNamesSet.add(service.company);
  }
  const companyNames = [...companyNamesSet];
  for (let i = 0; i < companyNames.length; i++) {
    db.companies.push({
      id: `company-${i + 1}`,
      name: companyNames[i],
      imageUrl: faker.image.urlLoremFlickr({ width: 128, height: 128 }),
      country: faker.location.country(),
      type: "company",
      parentId: "root",
    });
  }

  for (let i = 0; i < servicesList.length; i++) {
    const service = servicesList[i];
    const company = db.companies.find((com) => com.name === service.company)!;
    db.services.push({
      ...service,
      id: `service-${i + 1}`,
      type: "service",
      parentId: company.id,
    });
  }

  let interactionIdx = 1;
  let promptIdx = 1;
  for (const user of db.users) {
    const serviceCount = getRandomInt(0, 12);
    const userServiceIdsSet = new Set<string>();

    while (userServiceIdsSet.size < serviceCount) {
      const randomServiceIdx = getRandomInt(0, db.services.length - 1);
      const service = db.services[randomServiceIdx];
      userServiceIdsSet.add(service.id);
    }

    const interactionCount = serviceCount * getRandomInt(2, 40);
    const userServiceIds = [...userServiceIdsSet];

    const interactions: Interaction[] = [];
    while (interactions.length < interactionCount) {
      const serviceId = userServiceIds[getRandomInt(0, userServiceIds.length - 1)];
      const interactionId = `interaction-${interactionIdx}`
      const interactionDate = faker.date.between({
        from: new Date().getTime() - 180 * 24 * 60 * 60 * 1000,
        to: new Date(),
      });

      const prompts: Prompt[] = [];
      const promptCount = getRandomInt(1, 24);
      let interval = getRandomInt(6000, 60_000);
      for (let i = 0; i < promptCount; i++) {
        prompts.push({
          id: `prompt-${promptIdx}`,
          interactionId,
          input: faker.lorem.lines({ min: 1, max: 2 }),
          output: faker.lorem.lines({ min: 2, max: 6 }),
          timestamp: new Date(interactionDate.getTime() + interval),
        });
        interval += getRandomInt(6000, 60_000);
        promptIdx++
      }
      db.prompts.push(...prompts)

      interactions.push({
        id: interactionId,
        type: "interaction",
        name: interactionDate.toLocaleString("en"),
        userId: user.id,
        serviceId,
        suggestedTitle: faker.book.title(),
        subject: faker.company.buzzPhrase(),
        sentiment: faker.company.buzzAdjective(),
        confidence: faker.number.float({min: 5, max: 10}),
        ip: faker.internet.ipv6(),
        latency: faker.number.int({min:0, max:4600}),
        w: faker.number.int({min:0, max:4600}),
        x: faker.number.int({min:0, max:4600}),
        y: faker.number.int({min:0, max:4600}),
        z: faker.number.int({min:0, max:4600}),
        white: faker.number.int({min:0, max:4600}),
        black: faker.number.int({min:0, max:4600}),
        green: faker.number.int({min:0, max:4600}),
        blue: faker.number.int({min:0, max:4600}),
        purple: faker.number.int({min:0, max:4600}),
        orange: faker.number.int({min:0, max:4600}),
      });
      interactionIdx++;
    }
    db.interactions.push(...interactions);
  }
  

  console.log('ready to write...', db);
  let time = Date.now()
  await fs.writeFile(path.join(process.cwd(), "src", "assets", "data.json"), JSON.stringify(db));
  const diffMs= Date.now() - time
  console.log(`DB write successful! took ${diffMs}ms`);

}


async function main() {
  await initDB()
  console.log('DONE!')
}

main()
