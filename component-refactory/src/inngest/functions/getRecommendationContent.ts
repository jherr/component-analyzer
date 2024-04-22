import { client } from "@/inngest/client";

import {
  fetchChatCompletion,
  InputFile,
  ComponentRecommendation,
} from "./_utils";

import { updateProjectStatus } from "@/db";

async function generateRecommendationContent(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendation: ComponentRecommendation
): Promise<string> {
  const output = await fetchChatCompletion([
    {
      role: "user",
      content: JSON.stringify(sourceFiles),
    },
    {
      role: "assistant",
      content: JSON.stringify(recommendations),
    },
    {
      role: "user",
      content: `Generate the source code using format { "content": <content> } for ${recommendation.componentName}`,
    },
  ]);

  return JSON.parse(output!).content;
}

async function getRecommendationContent(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendation: ComponentRecommendation
) {
  const dealiasedOutputPath = recommendation.outputPath.replace("@/", "src/");
  const filePath = `example/${dealiasedOutputPath}`;

  const content = await generateRecommendationContent(
    sourceFiles,
    recommendations,
    recommendation
  );

  return {
    filePath,
    recommendation,
    content,
  };
}

export const getComponentRecommendations = client.createFunction(
  { id: "getComponentRecommendations" },
  { event: "system/get-component-recommendations" },
  async ({ event, step }) => {
    const { trackingId, sourceFiles, recommendations } = event.data;

    await updateProjectStatus(
      trackingId,
      "Generating component recommendations",
      false
    );

    const recommendationsContent = await Promise.all(
      recommendations.map((rec: ComponentRecommendation) =>
        getRecommendationContent(sourceFiles, recommendations, rec)
      )
    );

    await step.sendEvent("emit-component-recommendations", {
      name: "system/generate-components",
      data: {
        trackingId,
        sourceFiles,
        recommendations,
        recommendationsContent,
      },
    });

    return {
      event,
      body: {
        trackingId,
        recommendationsContent,
      },
    };
  }
);
