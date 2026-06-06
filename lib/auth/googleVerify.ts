import { OAuth2Client } from "google-auth-library";
import { getGoogleClientId } from "@/lib/server/env";

export type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
};

export async function verifyGoogleIdToken(
  credential: string,
): Promise<GoogleProfile> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("INVALID_GOOGLE_TOKEN");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}
