import axios from "axios";
import {ZOOM_CLIENT_ID,ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID } from "../constants.js";



// Function to get the access token using Server-to-Server OAuth
const getZoomAccessToken = async () => {
  try {
    const clientId = ZOOM_CLIENT_ID;
    const clientSecret = ZOOM_CLIENT_SECRET;
    const accountId = ZOOM_ACCOUNT_ID; // Provided in your app configuration

    console.log("clientId",clientId);
    console.log("clientSecret",clientSecret);
    console.log("accountId",accountId);

    const tokenResponse = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      null,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
        }
      }
    );
    
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error.response ? error.response.data : error);
    throw new Error("Failed to get Zoom access token");
  }
};

// Example: Creating a Zoom meeting using the access token
const createZoomMeeting = async (serviceName,date,time) => {
  try {
    const accessToken = await getZoomAccessToken();
    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: "Scheduled Call",
        type: 2, // Scheduled meeting
        start_time: `${date}T${time}`, // Date and time in ISO 8601 format
        duration: 120, // Duration in minutes
        timezone: "IST",
        agenda: `Meeting for ${serviceName}`,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    // Return the Zoom meeting link (join URL)
    console.log("response.data",response.data);
    return response.data.join_url;
  } catch (error) {
    console.log("Error creating Zoom meeting:", error.response ? error.response.data : error);
    throw new Error("Failed to create Zoom meeting");
  }
};

export { createZoomMeeting, getZoomAccessToken };

