import { inngest } from '@/inngest/client';

import { type ComponentRecommendation, type InputFile } from './_utils';
import { getComponentRecommendations } from './getRecommendations';
import { getComponentRecommendationContent } from './getRecommendationContent';
import { getTSXFileList, getTSXFileContent } from './parseProject';
import { generateComponent } from './generateComponents';

import { updateProjectStatus } from '@/db';

export const getProjectRecommendations = inngest.createFunction(
  { id: 'getProjectRecommendations' },
  { event: 'analyzer/get-project-recommendations' },
  async ({ event, step }) => {
    const { user, repo, appRoot, trackingId } = event.data;

    const { tsxFiles, sourceFiles } = await step.run(
      'parse-project',
      async () => {
        await updateProjectStatus(
          trackingId,
          'Parsing project for TSX files',
          false
        );

        const tsxFiles = await getTSXFileList(user, repo, appRoot);

        const sourceFiles = await Promise.all(
          tsxFiles.map(async (filePath) => {
            const content = await getTSXFileContent(user, repo, filePath);
            return { inputPath: filePath, content };
          })
        );
        return { tsxFiles, sourceFiles };
      }
    );

    const { recommendations } = await step.run('parse-files', async () => {
      await updateProjectStatus(trackingId, 'Getting recommendations', false);

      const recommendations = await getComponentRecommendations(sourceFiles);

      return {
        recommendations,
      };
    });

    await step.run('update-project-status-recommendations', async () => {
      await updateProjectStatus(
        trackingId,
        'Generating component recommendations',
        false
      );
    });

    // Use invoke and a separate function here instead of step.run so we can add flow control
    // to limit the number of concurrent calls
    const recommendationsContent = await Promise.all(
      recommendations.map((rec: ComponentRecommendation) =>
        step.invoke(`get-component-recommendations-${rec.componentName}`, {
          function: getComponentRecommendationContent,
          data: {
            sourceFiles,
            recommendations,
            rec,
          },
        })
      )
    );

    await step.run('update-project-status-components', async () => {
      await updateProjectStatus(trackingId, 'Generating components', false);
    });

    // Generate components
    const updatedFiles = await Promise.all(
      sourceFiles.map((inputFile: InputFile) =>
        step.invoke(`generate-components-${inputFile.inputPath}`, {
          function: generateComponent,
          data: {
            trackingId,
            sourceFiles,
            recommendations,
            recommendationsContent,
            inputFile,
          },
        })
      )
    );

    await step.run('update-project-status-completed', async () => {
      await updateProjectStatus(trackingId, 'Completed', true);
    });

    return {
      updatedFiles: updatedFiles.filter(Boolean),
    };
  }
);
