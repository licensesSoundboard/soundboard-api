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
          threadId: "thread_LJj9HjRw2gr7IaqaRguKjaT4",
          prompt: "For MIT, what was the accpetance rate this year?",
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
