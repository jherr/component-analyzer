import { fetchFromGitHubRepo } from './_utils';

export async function getTSXFileList(
  user: string,
  repo: string,
  appRoot: string
): Promise<string[]> {
  const data = await fetchFromGitHubRepo(user, repo, appRoot);
  const tsxFiles = data.filter((file: { name: string }) =>
    file.name.endsWith('.tsx')
  );

  return tsxFiles.map((file: any) => `example/src/app/${file.name}`);
}

export async function getTSXFileContent(
  user: string,
  repo: string,
  filePath: string
): Promise<string> {
  const data = await fetchFromGitHubRepo(user, repo, `contents/${filePath}`);
  const content = atob(data.content);

  return content;
}
