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
          threadId: "thread_b7pe9g1TDwvPmYLno0XxSpCO",
          prompt: "give me a list of 30 universities in the northeast",
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
