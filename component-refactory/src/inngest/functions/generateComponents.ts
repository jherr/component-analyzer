import { inngest } from '@/inngest/client';

import {
  fetchChatCompletion,
  InputFile,
  ComponentRecommendation,
} from './_utils';

import { updateProjectStatus, addRefactoring } from '@/db';

export async function updateExistingFile(
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
      role: 'user',
      content: JSON.stringify(sourceFiles),
    },
    {
      role: 'assistant',
      content: JSON.stringify(recommendations),
    },
    {
      role: 'user',
      content: `Using the new components, regenerate the source code for ${inputPath} using format { "content": <content> }. Here are the new components source:\n${JSON.stringify(
        recommendationsContent
      )}\n`,
    },
  ]);

  const data = JSON.parse(output ?? '{}');
  if (data.noop === true) {
    console.log('No changes needed for', inputPath);
    return null;
  }

  return {
    inputFile,
    content: data.content,
  };
}

export const generateComponent = inngest.createFunction(
  {
    id: 'generateComponent',
    throttle: {
      limit: 1,
      period: '10s',
    },
  },
  { event: 'analyzer/generate-component' },
  async ({ event, step }) => {
    const {
      trackingId,
      sourceFiles,
      recommendations,
      recommendationsContent,
      inputFile,
    } = event.data;

    const updatedFile = await step.run('update-existing-file', async () => {
      return await updateExistingFile(
        sourceFiles,
        recommendations,
        recommendationsContent,
        inputFile
      );
    });

    if (updatedFile) {
      await step.run('add-refactoring', async () => {
        const { inputPath, content: oldContent } = updatedFile.inputFile;
        await addRefactoring(
          trackingId,
          inputPath,
          oldContent,
          updatedFile.content
        );
      });
    }

    return updatedFile;
  }
);
