import { client } from "@/inngest/client";

import { fetchFromGitHubRepo } from "./_utils";

import { addProject, updateProjectStatus } from "@/db";

async function getTSXFileList(
  user: string,
  repo: string,
  appRoot: string
): Promise<string[]> {
  const data = await fetchFromGitHubRepo(user, repo, appRoot);
  const tsxFiles = data.filter((file: { name: string }) =>
    file.name.endsWith(".tsx")
  );

  return tsxFiles.map((file: any) => `example/src/app/${file.name}`);
}

async function getTSXFileContent(
  user: string,
  repo: string,
  filePath: string
): Promise<string> {
  const data = await fetchFromGitHubRepo(user, repo, `contents/${filePath}`);
  const content = atob(data.content);

  return content;
}

export const parseProject = client.createFunction(
  { id: "parseProject" },
  { event: "system/parse-project" },
  async ({ event, step }) => {
    const { user, repo, appRoot, trackingId } = event.data;

    await updateProjectStatus(
      trackingId,
      "Parsing project for TSX files",
      false
    );

    const tsxFiles = await getTSXFileList(user, repo, appRoot);

    const sourceFiles = await Promise.all(
      tsxFiles.map(async (filePath) => {
        const content = await getTSXFileContent(user, repo, filePath);
        return { inputPath: filePath, content };
      })
    );

    await step.sendEvent("emit-files", {
      name: "system/parse-files",
      data: {
        trackingId,
        tsxFiles,
        sourceFiles,
      },
    });

    return {
      event,
      body: {
        trackingId,
        tsxFiles,
        sourceFiles,
      },
    };
  }
);
