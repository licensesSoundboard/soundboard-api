import { NextApiRequest, NextApiResponse } from "next";
import { runSearch } from "./openai_tavily"; // Adjust the path accordingly

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const data = req.body; // Or however you wish to receive the data

    console.log("before calling chatgpt tavily");
    if (!data.threadId || !data.prompt) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const response = await runSearch(data.threadId, data.prompt);
    res.status(200).json({ response });
    console.log(response);
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
