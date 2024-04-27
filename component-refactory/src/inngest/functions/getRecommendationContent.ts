import { inngest } from '@/inngest/client';

import {
  fetchChatCompletion,
  InputFile,
  ComponentRecommendation,
} from './_utils';

import { updateProjectStatus } from '@/db';

export async function generateRecommendationContent(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendation: ComponentRecommendation
): Promise<string> {
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
      content: `Generate the source code using format { "content": <content> } for ${recommendation.componentName}`,
    },
  ]);

  return JSON.parse(output!).content;
}

export async function getRecommendationContent(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendation: ComponentRecommendation
) {
  const dealiasedOutputPath = recommendation.outputPath.replace('@/', 'src/');
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

export const getComponentRecommendationContent = inngest.createFunction(
  {
    id: 'getComponentRecommendationContent',
    throttle: {
      limit: 1, // placeholders - this should be changed to work around any Open AI API limits
      period: '10s',
    },
  },
  { event: 'analyzer/recommendation.created' },
  async ({ event, step }) => {
    const { sourceFiles, recommendations, rec } = event.data;

    const dealiasedOutputPath = rec.outputPath.replace('@/', 'src/');
    const filePath = `example/${dealiasedOutputPath}`;

    const content = await generateRecommendationContent(
      sourceFiles,
      recommendations,
      rec
    );

    return {
      filePath,
      rec,
      content,
    };
  }
);
