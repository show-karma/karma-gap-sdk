import fetch from "node-fetch";
import { createObjectCsvWriter } from "csv-writer";

const MY_QUERY = `
  query MyQuery($first: Int!, $skip: Int!) {
    retroPGF {
      projects(first: $first, orderBy:mostAwarded , skip: $skip) {
        edges {
          node {
            id
            displayName
            applicant {
              address {
                address
              }
            }
            awarded
            bio
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;

async function fetchGraphQLData(): Promise<any[]> {
  const endpoint = "https://optimism-agora-prod.agora-prod.workers.dev/graphql";
  let skip = 0;
  const projects: any[] = [];
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: MY_QUERY,
        variables: { first: 100, skip },
      }),
    });
    const responseData = await response.json();

    if (responseData.errors) {
      throw new Error(
        "GraphQL query returned errors: " + JSON.stringify(responseData.errors)
      );
    }

    const data = responseData.data;
    if (!data || !data.retroPGF || !data.retroPGF.projects) {
      throw new Error(
        "Invalid response format. Expected 'retroPGF' and 'projects' fields."
      );
    }

    const pageProjects = data.retroPGF.projects.edges.map(
      (edge: any) => edge.node
    );
    projects.push(...pageProjects);
    skip += 100;
    hasNextPage = data.retroPGF.projects.pageInfo.hasNextPage;
  }

  // Filter projects where 'awarded' is greater than 0
  const filteredProjects = projects.filter((project) => project.awarded > 0);

  return filteredProjects;
}

function extractProjectId(projectId: string): string {
  return projectId.split("|")[1];
}

async function convertToCSV(projects: any[]): Promise<void> {
  const csvData = projects.map((project: any) => ({
    Project: project.displayName,
    ProposalURL: `https://vote.optimism.io/retropgf/3/application/${extractProjectId(
      project.id
    )}`,
    Owner: project.applicant.address.address,
    Amount: project.awarded,
    GrantDescription: project.bio,
  }));

  const csvWriter = createObjectCsvWriter({
    path: `${__dirname}/../data/projects.csv`,
    header: [
      { id: "Project", title: "Project" },
      { id: "ProposalURL", title: "ProposalURL" },
      { id: "Owner", title: "Owner" },
      { id: "Amount", title: "Amount" },
      { id: "GrantDescription", title: "GrantDescription" },
    ],
  });

  await csvWriter.writeRecords(csvData);
  console.log("CSV file generated successfully!");
}

async function main() {
  try {
    const projects = await fetchGraphQLData();
    await convertToCSV(projects);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
