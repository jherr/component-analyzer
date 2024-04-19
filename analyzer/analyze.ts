import OpenAI from "openai";

interface ComponentRecommendation {
  componentName: string;
  outputPath: string;
  explanation: string;
}

interface InputFile {
  inputPath: string;
  content: string;
}

const systemMessage: OpenAI.ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are a veteran Typescript and React programmer. You know the latest in NextJS, Tailwind, and other technologies frequently used in production.\n\nYou will be shown a list files with react components as a json object with property `recommendations`, which is an array of objects with the following schema:\n\n- `inputPath`: the path of the file being analyzed\n- `content`: the raw content of a react component file\n\nCreate a complete list of recommendations of reusable components that can be combined or refactored.\n\nProvide the following fields for each output object:\n\n- `componentName`: the name of the component to factor\n- `outputPath`: the path using a `@/components/` directory as the root\n- `explanation`: provide a 50-75 word summary on why this should be considered\n\nOutput should only ever come as a JSON object or array with the fields.",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchFromGitHubRepo(path: string, options?: RequestInit) {
  const owner = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO;
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

async function fetchChatCompletion(
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

async function getTSXFiles(): Promise<string[]> {
  const data = await fetchFromGitHubRepo("contents/example/src/app");
  const tsxFiles = data.filter((file: { name: string }) =>
    file.name.endsWith(".tsx")
  );

  return tsxFiles.map((file: any) => `example/src/app/${file.name}`);
}

async function getTSXFileContent(filePath: string): Promise<string> {
  const data = await fetchFromGitHubRepo(`contents/${filePath}`);
  const content = atob(data.content);

  return content;
}

async function getComponentRecommendations(
  sourceFiles: InputFile[]
): Promise<ComponentRecommendation[]> {
  const raw = await fetchChatCompletion([
    {
      role: "user",
      content: JSON.stringify(sourceFiles),
    },
  ]);

  console.log("Got recommendations", raw);

  return JSON.parse(raw!).recommendations as ComponentRecommendation[];
}

export async function generateRecommendationContent(
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

export async function createBranch() {
  // Check if branch exists
  const branches = await fetchFromGitHubRepo(`branches`);
  const branchExists = branches.some(
    (branch: any) => branch.name === "analyze-components"
  );

  if (branchExists) {
    return;
  }

  const mainBranch = branches.find((branch) => branch.name === "main");
  await fetchFromGitHubRepo(`git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: "refs/heads/analyze-components",
      sha: mainBranch.commit.sha,
    }),
  });
}

export async function upsertFile(filePath: string, content: string) {
  let blobSha: string | undefined;
  try {
    const result = await fetchFromGitHubRepo(
      `contents/${filePath}?ref=analyze-components`
    );
    blobSha = result.sha;
  } catch (error) {
    blobSha = undefined;
  }

  const body = {
    branch: "analyze-components",
    message: "Add component recommendations",
    comitter: {
      name: "Component Analyzer",
      email: "component-analyzer@liminal.sh",
    },
    content: Buffer.from(content).toString("base64"),
  };

  if (blobSha) {
    body["sha"] = blobSha;
  }

  console.log(`Saving ${filePath}...`);
  const response = await fetchFromGitHubRepo(`contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return response;
}

export async function saveRecommendation(
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

  await upsertFile(filePath, content);

  return {
    recommendation,
    content,
  };
}

export async function updateExistingFile(
  sourceFiles: InputFile[],
  recommendations: ComponentRecommendation[],
  recommendationsContent: {
    recommendation: ComponentRecommendation;
    content: string;
  }[],
  inputFile: InputFile
) {
  const { inputPath } = inputFile;
  console.log("Updating file", inputPath);

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
    return;
  }

  console.log(`got content for ${inputPath}`);
  return upsertFile(inputPath, data.content);
}

export async function analyze() {
  console.log("Creating branch...");
  await createBranch();

  const tsxFiles = await getTSXFiles();
  const sourceFiles = await Promise.all(
    tsxFiles.map(async (filePath) => {
      const content = await getTSXFileContent(filePath);
      return { inputPath: filePath, content };
    })
  );

  console.log("Getting Recommendations...");
  const recommendations = await getComponentRecommendations(sourceFiles);
  console.log("Generating Recommendations content...");
  const recommendationsContent = await Promise.all(
    recommendations.map((rec) =>
      saveRecommendation(sourceFiles, recommendations, rec)
    )
  );

  console.log("Refactoring existing files...");
  await Promise.all(
    sourceFiles.map((inputFile) =>
      updateExistingFile(
        sourceFiles,
        recommendations,
        recommendationsContent,
        inputFile
      )
    )
  );
}

(async () => {
  await analyze();
})();
