import path from "node:path";
import fs from "node:fs/promises";
import { faker } from "@faker-js/faker";
import { getRandomInt } from "./helperFns.ts";
import servicesList from "./services.json" with { type: "json" };
import type { DB, ServiceJSON, Interaction, Prompt } from "./types.ts";
;

console.log("hello db init");


const companies = ['Acuvity', 'Uber', 'Netflix', 'Doordash', 'Genesys', 'Apple'];
const companyImgUrls = [
  'https://media.licdn.com/dms/image/v2/D560BAQG3fC9tq42A9A/company-logo_200_200/company-logo_200_200/0/1714841959020?e=1740009600&v=beta&t=80XwaX1iyRZ-prk-PIRLWyFPlys3GfE7Hfjf9GEQ7ew',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFbOgQZOKgl4K-1K3OSeJqbnPEfp6ddHKpEQ&s', 
  'https://static.vecteezy.com/system/resources/previews/020/336/373/non_2x/netflix-logo-netflix-icon-free-free-vector.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQM92cet5zqsAAPE_sxAKbIkQw7TLtJHCeijw&s', 
  'https://camo.githubusercontent.com/97e94dbac4db13f3308a611c7ace6c930032a69ec735a8fb4c1e6ff03670ac52/68747470733a2f2f737472696e673764657666696c65732e73332e616d617a6f6e6177732e636f6d2f6a6f62732f67656e657379732e77656270', 
  'https://logodownload.org/wp-content/uploads/2013/12/apple-logo-2-1.png'
];
const companyCountries = ['USA','Germany','USA','USA','UK','USA' ]

const orgCount = companies.length;

const usersPerOrg = 24;

const maxServicesPerUser = 12;

const minInteractionCount = 2;
const maxInteractionCount = 36;

const minPromptCount = 1;
const maxPromptCount = 40;

async function initDB() {
  const db: DB = { orgs: [], users: [], companies: [], services: [], interactions: [], prompts: [] };

  for (let i = 0; i < companies.length; i++) {
    db.orgs.push({
      id: `org-${i + 1}`,
      name: companies[i],
      imageUrl: companyImgUrls[i],
      country: companyCountries[i],
      type: "org",
      parentId: "root",
    });
  }
  const userCount = orgCount * usersPerOrg;
  for (let i = 0; i < userCount; i++) {
    const parentId = `org-${getRandomInt(1, db.orgs.length)}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const dateOfBirth = faker.date.birthdate();
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
    const serviceCount = getRandomInt(0, maxServicesPerUser);
    const userServiceIdsSet = new Set<string>();

    while (userServiceIdsSet.size < serviceCount) {
      const randomServiceIdx = getRandomInt(0, db.services.length - 1);
      const service = db.services[randomServiceIdx];
      userServiceIdsSet.add(service.id);
    }

    const interactionCount = serviceCount * getRandomInt(minInteractionCount, maxInteractionCount);
    const userServiceIds = [...userServiceIdsSet];

    const interactions: Interaction[] = [];
    while (interactions.length < interactionCount) {
      const serviceId = userServiceIds[getRandomInt(0, userServiceIds.length - 1)];
      const interactionId = `interaction-${interactionIdx}`;
      const interactionDate = faker.date.between({
        from: new Date().getTime() - 180 * 24 * 60 * 60 * 1000,
        to: new Date(),
      });

      const prompts: Prompt[] = [];
      const promptCount = getRandomInt(minPromptCount, maxPromptCount);
      let interval = getRandomInt(20_000, 500_000);
      for (let i = 0; i < promptCount; i++) {
        prompts.push({
          id: `prompt-${promptIdx}`,
          interactionId,
          input: faker.lorem.lines({ min: 1, max: 2 }),
          output: faker.lorem.lines({ min: 2, max: 6 }),
          timestamp: new Date(interactionDate.getTime() + interval),
        });
        interval += getRandomInt(20_000, 500_000);
        promptIdx++;
      }
      db.prompts.push(...prompts);

      interactions.push({
        id: interactionId,
        type: "interaction",
        name: interactionDate.toLocaleString("en"),
        userId: user.id,
        serviceId,
        suggestedTitle: faker.book.title(),
        subject: faker.company.buzzPhrase(),
        sentiment: faker.company.buzzAdjective(),
        confidence: faker.number.float({ min: 5, max: 10 }),
        ip: faker.internet.ipv6(),
        latency: faker.number.int({ min: 0, max: 6000 }),
        w: faker.number.int({ min: 0, max: 1000 }),
        x: faker.number.int({ min: 0, max: 1000 }),
        y: faker.number.int({ min: 0, max: 1000 }),
        z: faker.number.int({ min: 0, max: 1000 }),
        white: faker.number.int({ min: 0, max: 14600 }),
        black: faker.number.int({ min: 0, max: 14600 }),
        green: faker.number.int({ min: 0, max: 14600 }),
        blue: faker.number.int({ min: 0, max: 14600 }),
        purple: faker.number.int({ min: 0, max: 14600 }),
        orange: faker.number.int({ min: 0, max: 14600 }),
      });
      interactionIdx++;
    }
    db.interactions.push(...interactions);
  }


  console.log('ready to write...', db);
  let time = Date.now();
  await fs.writeFile(path.join(process.cwd(), "src", "assets", "data.json"), JSON.stringify(db));
  const diffMs = Date.now() - time;
  console.log(`DB write successful! took ${diffMs}ms`);

}


async function main() {
  await initDB();
  console.log('DONE!');
}

main();
