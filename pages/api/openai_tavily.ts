import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs";

dotenv.config();
let reruns = 0;
let tavilyReruns = 0;

// Function to perform a Tavily search
async function tavilySearch(query: string): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY;

  try {
    console.log("running tavily");
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error("Tavily search request failed");
    }
    const apiResponse = await response.json(); // Parse JSON from the response
    console.log("tavily run successfuly");
    return apiResponse;
  } catch {}
}

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
  return run;
}

async function submitToolOutputs(
  threadId: string,
  runId: string,
  toolsToCall: any[],
  openai: OpenAI
): Promise<any> {
  const toolOutputArray = [];
  let output = null;
  let toolCallId;
  let functionName;
  let functionArgs;
  let stringOutput;

  for (const tool of toolsToCall) {
    toolCallId = tool.id;
    functionName = tool.function.name;
    functionArgs = tool.function.arguments;

    if (functionName === "highLevelBrowse") {
      console.log("calling tavily");
      output = await tavilySearch(JSON.parse(functionArgs).instruction);
    }
    if (output) {
      toolOutputArray.push(output);
    }
  }

  if (toolOutputArray) {
    stringOutput = JSON.stringify(toolOutputArray);
  } else if (!toolOutputArray) {
    console.log("reruning tavily", tavilyReruns);
    tavilyReruns += 1;
    const runWithTools = await submitToolOutputs(
      threadId,
      runId,
      toolsToCall,
      openai
    );
  }

  console.log("submitting tools");
  const newRun = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    {
      tool_outputs: [
        {
          tool_call_id: toolCallId,
          output: stringOutput,
        },
      ],
    }
  );

  const completedRun = await waitForRunCompletion(threadId, newRun.id, openai);

  if (
    completedRun.status == "failed" ||
    completedRun.status == "requires_action"
  ) {
    console.log("resubmitting tools", completedRun.status, reruns);
    reruns = +1;
    const runWithTools = await submitToolOutputs(
      threadId,
      runId,
      completedRun.required_action.submit_tool_outputs.tool_calls,
      openai
    );
  } else {
    return completedRun;
  }
}

export async function runSearch(
  threadId: string,
  prompt: string
): Promise<String> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not defined");
  }
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  // Initialize OpenAI with API key
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  console.log("before try in RunSearch");

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

  console.log("before await completion");

  const completedRun = await waitForRunCompletion(threadId, run.id, openai);
  console.log(completedRun.status);

  const runId = completedRun.id;

  if (completedRun.status == "failed") {
    return "failed";
  }
  if (completedRun.status == "completed") {
    return "completed";
  } else if (completedRun.status == "requires_action") {
    console.log("calling submit tools");
    const runWithTools = await submitToolOutputs(
      threadId,
      runId,
      completedRun.required_action.submit_tool_outputs.tool_calls,
      openai
    );

    if (runWithTools) {
      return runWithTools.status;
    } else {
      return "failed";
    }
  }
}
export const config = {
  maxDuration: 75,
};
