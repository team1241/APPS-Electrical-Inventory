import type { AuthConfig } from "convex/server";

const clerkIssuer = process.env.CLERK_FRONTEND_API_URL?.trim();
if (!clerkIssuer) {
  throw new Error("Missing CLERK_FRONTEND_API_URL in the Convex environment.");
}

export default {
  providers: [
    {
      domain: clerkIssuer,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
