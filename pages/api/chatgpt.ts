import { NextApiRequest, NextApiResponse } from "next";
import { runSearch } from "./openai_tavily"; // Adjust the path accordingly

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      // Extract data from the request body or query parameters as needed
      const data = req.body; // Or however you wish to receive the data

      // Ensure necessary data is provided
      if (!data.threadId || !data.prompt) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Run your search function
      const searchResult = await runSearch(data);
      res.status(200).json(searchResult);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Inform the client about the allowed method
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
