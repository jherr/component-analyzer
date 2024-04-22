import { getProject, getRefactorings } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  {
    params: { projectRunId },
  }: {
    params: { projectRunId: string };
  }
) {
  const project = await getProject(projectRunId);
  const refactorings = await getRefactorings(projectRunId);

  return NextResponse.json({
    project,
    refactorings,
  });
}
