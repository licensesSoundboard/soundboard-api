import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  const makeApiCall = async () => {
    try {
      const response = await fetch("/api/google-calendar-sync-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken:
            "ya29.a0AXooCgt6pzSIr-5X-HXrKyaVxyG3VOm8ZQDHwKVgYKE6cgOeZeRSUOK6fyDuFNANKNo-ihgGsXVCBKZwUIZMa6e5dWx5J3PDfiVBLFXcvnnFmSCQp-71bPCnX2eFAP-x591mSIqPN0hMbtDOeB1JDJ_BSzroIoO7bqdKaCgYKAVESARASFQHGX2MiTtn_9rILO20zXxgHyAQ7HQ0171",
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
