import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  const makeApiCall = async () => {
    try {
      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: "thread_ZHcgBBLhsJiFEJm7TZTHr34c",
          prompt: "What was the size of MIT undergraduate class of 2026?",
        }),
      });
      if (response.ok) {
        const rData = await response.json();
        console.log(rData);
      } else {
        console.error("Upload failed");
        // apiResponse = false;
      }
    } catch (error) {}
  };

  return (
    <>
      <button onClick={makeApiCall}>submit</button>
    </>
  );
}
