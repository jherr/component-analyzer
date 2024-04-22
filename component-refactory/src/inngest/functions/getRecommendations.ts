import { client } from "@/inngest/client";

import {
  InputFile,
  ComponentRecommendation,
  fetchChatCompletion,
} from "./_utils";

import { updateProjectStatus } from "@/db";

async function getComponentRecommendations(
  sourceFiles: InputFile[]
): Promise<ComponentRecommendation[]> {
  const raw = await fetchChatCompletion([
    {
      role: "user",
      content: JSON.stringify(sourceFiles),
    },
  ]);

  return JSON.parse(raw!).recommendations as ComponentRecommendation[];
}

export const getRecommendations = client.createFunction(
  { id: "getRecommendations" },
  { event: "system/parse-files" },
  async ({ event, step }) => {
    const { sourceFiles, trackingId } = event.data;

    await updateProjectStatus(trackingId, "Getting recommendations", false);

    const recommendations = await getComponentRecommendations(sourceFiles);

    await step.sendEvent("emit-recommendations", {
      name: "system/get-component-recommendations",
      data: {
        trackingId,
        sourceFiles,
        recommendations,
      },
    });

    return {
      event,
      body: {
        trackingId,
        sourceFiles,
        recommendations,
      },
    };
  }
);
