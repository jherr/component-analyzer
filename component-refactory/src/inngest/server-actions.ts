'use server';
import { inngest } from './client';

import { addProject, updateProjectStatus } from '@/db';

export async function onParseProject({
  user,
  repo,
  appRoot,
}: {
  user: string;
  repo: string;
  appRoot: string;
}) {
  const id = Math.random().toString(36).substring(7);

  await addProject(id, user, repo, appRoot);
  await updateProjectStatus(id, 'Starting processing', false);

  await inngest.send({
    name: 'analyzer/get-project-recommendations',
    data: {
      trackingId: id,
      user,
      repo,
      appRoot,
    },
  });

  return id;
}
