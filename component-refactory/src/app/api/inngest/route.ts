import { serve } from "inngest/next";
import { client } from "@/inngest/client";
import {
  parseProject,
  getRecommendations,
  getComponentRecommendations,
  generateComponents,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: client,
  functions: [
    parseProject,
    getRecommendations,
    getComponentRecommendations,
    generateComponents,
  ],
});
