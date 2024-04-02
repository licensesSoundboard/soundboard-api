import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs";

dotenv.config();

// Function to perform a Tavily search
async function tavilySearch(query: string): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY;

  console.log("before try in tavily");
  try {
    console.log(query);
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: "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",
        query: query,
        search_depth: "basic",
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error("Tavily search request failed");
    }
    const apiResponse = await response.json(); // Parse JSON from the response
    console.log("api response", apiResponse);
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

  for (const tool of toolsToCall) {
    output = null;
    toolCallId = tool.id;
    functionName = tool.function.name;
    functionArgs = tool.function.arguments;

    if (functionName === "highLevelBrowse") {
      console.log("function name working");
      output = await tavilySearch(JSON.parse(functionArgs).instruction);
    }
    if (output) {
      console.log("tool call id", toolCallId);
      toolOutputArray.push({ toolCallId: toolCallId, output: output });
    }
  }

  const body: RunSubmitToolOutputsParams = {
    tool_outputs: toolOutputArray,
  };

  console.log("output", JSON.stringify(output));
  const newRun = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    {
      tool_outputs: [
        {
          tool_call_id: toolCallId,
          output: JSON.stringify(output),
        },
      ],
    }
  );

  const completedRun = await waitForRunCompletion(threadId, newRun.id, openai);
  console.log(completedRun.status);

  console.log("answer", completedRun);

  if (completedRun.status == "requires_action") {
    console.log("hello");
    console.log(completedRun.required_action.submit_tool_outputs.tool_calls);
    const runWithTools = await submitToolOutputs(
      threadId,
      runId,
      completedRun.required_action.submit_tool_outputs.tool_calls,
      openai
    );
  }
}

async function printMessages(threadId: string, openai: OpenAI) {
  const messages = await openai.beta.threads.messages.list(threadId);
  const chatGPTResponses = messages.data.filter(
    (msg) => msg.role === "assistant"
  );

  const chatGPTResponse =
    chatGPTResponses.length > 0
      ? chatGPTResponses[chatGPTResponses.length - 1].content
      : null;

  if (
    chatGPTResponse &&
    chatGPTResponse.length > 0 &&
    chatGPTResponse[0].type === "text"
  ) {
    const textResponse = chatGPTResponse[0].text;
    console.log(textResponse);
  } else {
    console.log("no answer");
  }
}

export async function runSearch(threadId: string, prompt: string) {
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
    throw new Error(completedRun.error);
  } else if (completedRun.status == "requires_action") {
    console.log("hello");
    console.log(completedRun.required_action.submit_tool_outputs.tool_calls);
    const runWithTools = await submitToolOutputs(
      threadId,
      runId,
      completedRun.required_action.submit_tool_outputs.tool_calls,
      openai
    );
  }
  console.log("printing messages");
  printMessages(threadId, openai);
}
