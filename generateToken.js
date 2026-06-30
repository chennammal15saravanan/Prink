import axios from "axios";

const SHOPIFY_STORE = "prink-in.myshopify.com";

const SHOPIFY_CLIENT_ID = "66ef5eec5edd7ff3703f7fbadf34a346";

const SHOPIFY_CLIENT_SECRET = "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";

async function generateToken() {
  try {
    const response = await axios.post(
      `https://${SHOPIFY_STORE}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        grant_type: "client_credentials"
      }
    );

    console.log("ADMIN API ACCESS TOKEN:");
    console.log(response.data.access_token);

  } catch (error) {
    console.log("ERROR:");
    console.log(error.response?.data || error.message);
  }
}

generateToken();
