import { getProject, getRefactorings } from "@/db";

import ProjectRunMonitor from "./ProjectRunMonitor";

export default async function JobStatus({
  params: { projectRunId },
}: {
  params: { projectRunId: string };
}) {
  const project = await getProject(projectRunId);
  const refactorings = await getRefactorings(projectRunId);

  return (
    <ProjectRunMonitor
      projectRunId={projectRunId}
      project={project}
      refactorings={refactorings}
    />
  );
}
