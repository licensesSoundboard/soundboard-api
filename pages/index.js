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
          threadId: "thread_9UBsYFHupHttTPeWN71R2B1T",
          prompt: "how many of those applied for engineering?",
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
