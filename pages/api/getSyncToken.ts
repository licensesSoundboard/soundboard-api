import axios from "axios";

interface GoogleCalendarEventResponse {
  items: any[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export async function getSyncToken(authToken: string): Promise<string | null> {
  const calendarId = "primary";
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
  let nextPageToken: string | undefined;
  let syncToken: string | undefined;

  try {
    do {
      const url = nextPageToken
        ? `${baseUrl}?pageToken=${nextPageToken}`
        : baseUrl;

      const response = await axios.get<GoogleCalendarEventResponse>(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;

      if (data.nextSyncToken) {
        syncToken = data.nextSyncToken;
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken && !syncToken);

    if (syncToken) {
      console.log("Sync Token:", syncToken);
      return syncToken;
    } else {
      console.log("Sync Token not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching sync token:", error);
    return null;
  }
}
