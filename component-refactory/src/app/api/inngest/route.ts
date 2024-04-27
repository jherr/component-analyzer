import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  getProjectRecommendations,
  getComponentRecommendationContent,
  generateComponent,
} from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    getProjectRecommendations,
    getComponentRecommendationContent,
    generateComponent,
  ],
});
