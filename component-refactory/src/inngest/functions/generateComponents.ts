import { client } from "@/inngest/client";

import {
  fetchChatCompletion,
  InputFile,
  ComponentRecommendation,
} from "./_utils";

import { updateProjectStatus, addRefactoring } from "@/db";

async function updateExistingFile(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendationsContent: {
    recommendation: ComponentRecommendation;
    content: string;
  }[],
  inputFile: InputFile
): Promise<{
  inputFile: InputFile;
  content: string;
} | null> {
  const { inputPath } = inputFile;

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
      content: `Using the new components, regenerate the source code for ${inputPath} using format { "content": <content> }. Here are the new components source:\n${JSON.stringify(
        recommendationsContent
      )}\n`,
    },
  ]);

  const data = JSON.parse(output ?? "{}");
  if (data.noop === true) {
    console.log("No changes needed for", inputPath);
    return null;
  }

  return {
    inputFile,
    content: data.content,
  };
}

export const generateComponents = client.createFunction(
  { id: "generateComponents" },
  { event: "system/generate-components" },
  async ({ event, step }) => {
    const { trackingId, sourceFiles, recommendations, recommendationsContent } =
      event.data;

    await updateProjectStatus(trackingId, "Generating components", false);

    const updatedFiles = await Promise.all(
      sourceFiles.map((inputFile: InputFile) =>
        updateExistingFile(
          sourceFiles,
          recommendations,
          recommendationsContent,
          inputFile
        )
      )
    );

    for (const updatedFile of updatedFiles) {
      if (updatedFile) {
        const { inputPath, content: oldContent } = updatedFile.inputFile;
        await addRefactoring(
          trackingId,
          inputPath,
          oldContent,
          updatedFile.content
        );
      }
    }

    await updateProjectStatus(trackingId, "Completed", true);

    return {
      event,
      body: {
        trackingId,
        updatedFiles: updatedFiles.filter(Boolean),
      },
    };
  }
);
