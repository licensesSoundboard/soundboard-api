import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs";

dotenv.config();

export async function runSearch(data) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not defined");
  }

  const threadId = data.threadid;
  const prompt = data.prompt;
  const assistantId = "asst_0EO0LJS9WPxpWYavhEfhN6fe";

  // Initialize OpenAI with API key
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  try {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt,
    });
  } catch (error) {
    console.error("Error querying OpenAI:", error);
  }

  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  const completedRun = await waitForRunCompletion(threadId, run.id, openai);

  const runId = completedRun.id;

  if (completedRun.status == "failed") {
    throw new Error(completedRun.error);
  } else if (completedRun.status == "requires_action") {
    const runWithTools = await submitToolOutputs(
      threadId,
      run.id,
      completedRun.required_action.submit_tool_outputs.tool_calls,
      openai
    );
  }
}

// Function to perform a Tavily search
async function tavilySearch(query: string): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY;
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: query,
      search_depth: "advanced",
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error("Tavily search request failed");
  }

  return await response.json();
}

// Example usage
(async () => {
  try {
    const searchResult = await tavilySearch(
      "Latest news on Nvidia stock performance"
    );
    console.log(searchResult);
  } catch (error) {
    console.error(error);
  }
})();

async function waitForRunCompletion(
  threadId: string,
  runId: string,
  openai: OpenAI
): Promise<any> {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);

  while (run.status === "queued" || run.status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }
}

async function submitToolOutputs(
  threadId: string,
  runId: string,
  toolsToCall: any[],
  openai: OpenAI
): Promise<any> {
  const toolOutputArray = [];

  for (const tool of toolsToCall) {
    let output = null;
    const toolCallId = tool.id;
    const functionName = tool.function.name;
    const functionArgs = tool.function.arguments;

    if (functionName === "tavily_search") {
      output = await tavilySearch(JSON.parse(functionArgs).query);
    }

    if (output) {
      toolOutputArray.push({ tool_call_id: toolCallId, output: output });
    }
  }

  const body: RunSubmitToolOutputsParams = {
    tool_outputs: toolOutputArray,
  };

  return openai.beta.threads.runs.submitToolOutputs(threadId, runId, body);
}
