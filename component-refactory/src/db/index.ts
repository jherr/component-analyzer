"use server";
import { createClient } from "@libsql/client";
import { revalidatePath } from "next/cache";

const client = createClient({
  url: "file:local.db",
});

export type ProjectRun = {
  id: number;
  projectRunId: string;
  user: string;
  repo: string;
  appRoot: string;
  status: string;
  completed: boolean;
};

export type Refactoring = {
  id: number;
  projectRunId: string;
  path: string;
  originalFile: string;
  newFile: string;
};

export async function addProject(
  projectRunId: string,
  user: string,
  repo: string,
  appRoot: string
): Promise<void> {
  await client.execute({
    sql: "INSERT INTO projects (projectRunId, user, repo, appRoot, completed) VALUES (?, ?, ?, ?, false)",
    args: [projectRunId, user, repo, appRoot],
  });
  revalidatePath(`/projectRun/${projectRunId}`);
}

export async function addRefactoring(
  projectRunId: string,
  path: string,
  originalFile: string,
  newFile: string
): Promise<void> {
  await client.execute({
    sql: "INSERT INTO refactorings (projectRunId, path, originalFile, newFile) VALUES (?, ?, ?, ?)",
    args: [projectRunId, path, originalFile, newFile],
  });
  revalidatePath(`/projectRun/${projectRunId}`);
}

export async function updateProjectStatus(
  projectRunId: string,
  status: string,
  completed: boolean
): Promise<void> {
  await client.execute({
    sql: "UPDATE projects SET status = ?, completed = ? WHERE projectRunId = ?",
    args: [status, completed, projectRunId],
  });
  revalidatePath(`/projectRun/${projectRunId}`);
}

export async function getRefactorings(
  projectRunId: string
): Promise<Refactoring[]> {
  const { rows } = await client.execute({
    sql: "SELECT * FROM refactorings WHERE projectRunId = ?",
    args: [projectRunId],
  });

  return rows.map((row) => ({
    id: +(row.id?.toString() ?? ""),
    projectRunId: row.projectRunId?.toString() ?? "",
    path: row.path?.toString() ?? "",
    originalFile: row.originalFile?.toString() ?? "",
    newFile: row.newFile?.toString() ?? "",
  }));
}

export async function getProject(
  projectRunId: string
): Promise<ProjectRun | null> {
  const { rows } = await client.execute({
    sql: "SELECT * FROM projects WHERE projectRunId = ?",
    args: [projectRunId],
  });

  if (rows.length === 0) {
    return null;
  }

  return {
    id: +(rows[0].id?.toString() ?? ""),
    projectRunId: rows[0].projectRunId?.toString() ?? "",
    user: rows[0].user?.toString() ?? "",
    repo: rows[0].repo?.toString() ?? "",
    appRoot: rows[0].appRoot?.toString() ?? "",
    status: rows[0].status?.toString() ?? "",
    completed: !!rows[0].completed,
  };
}
