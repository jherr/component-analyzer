import {
  InputFile,
  ComponentRecommendation,
  fetchChatCompletion,
} from './_utils';

export async function getComponentRecommendations(
  sourceFiles: InputFile[]
): Promise<ComponentRecommendation[]> {
  const raw = await fetchChatCompletion([
    {
      role: 'user',
      content: JSON.stringify(sourceFiles),
    },
  ]);

  return JSON.parse(raw!).recommendations as ComponentRecommendation[];
}
