import axios from "axios";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const GOLD_MEMBER_ROLE_ID = process.env.GOLD_MEMBER_ROLE_ID;
const M2M_CLIENT_ID = process.env.M2M_CLIENT_ID;
const M2M_CLIENT_SECRET = process.env.M2M_CLIENT_SECRET;

export const lambdaHandler = async (event, context) => {
  const userId = event.pathParameters.id;
  
  try {
    const axiosRes = await axios.post(
      `https://${AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: M2M_CLIENT_ID,
        client_secret: M2M_CLIENT_SECRET,
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const access_token = axiosRes.data.access_token;
    // google-oauth2%7C108788934657406385802
    // ${encodeURIComponent(userId)} だと２重エンコード
    await axios.delete(`https://${AUTH0_DOMAIN}/api/v2/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { roles: [GOLD_MEMBER_ROLE_ID] },
    });
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({
        message: e.message
      }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE",
    },
    body: JSON.stringify({
      message: "Ranked Up.",
    }),
  };
};
