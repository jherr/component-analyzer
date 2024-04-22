import OpenAI from "openai";

export interface ComponentRecommendation {
  componentName: string;
  outputPath: string;
  explanation: string;
}

export interface InputFile {
  inputPath: string;
  content: string;
}

export const systemMessage: OpenAI.ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are a veteran Typescript and React programmer. You know the latest in NextJS, Tailwind, and other technologies frequently used in production.\n\nYou will be shown a list files with react components as a json object with property `recommendations`, which is an array of objects with the following schema:\n\n- `inputPath`: the path of the file being analyzed\n- `content`: the raw content of a react component file\n\nCreate a complete list of recommendations of reusable components that can be combined or refactored.\n\nProvide the following fields for each output object:\n\n- `componentName`: the name of the component to factor\n- `outputPath`: the path using a `@/components/` directory as the root\n- `explanation`: provide a 50-75 word summary on why this should be considered\n\nOutput should only ever come as a JSON object or array with the fields.",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function fetchFromGitHubRepo(
  owner: string,
  repo: string,
  path: string,
  options?: RequestInit
) {
  const token = process.env.GITHUB_ACCESS_TOKEN;

  if (!owner || !repo || !token) {
    throw new Error("Missing required environment variables");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": `2022-11-28`,
      },
      ...options,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch from GitHub: ${await response.text()}`);
  }

  return response.json();
}

export async function fetchChatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[]
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [systemMessage, ...messages],
    temperature: 0,
    max_tokens: 4095,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "json_object",
    },
  });

  return response.choices[0].message.content;
}
