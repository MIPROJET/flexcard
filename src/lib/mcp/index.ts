import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyProspects from "./tools/list-my-prospects";
import getPublicCard from "./tools/get-public-card";

// Use the direct Supabase host as the OAuth issuer. VITE_SUPABASE_PROJECT_ID
// is inlined at build time by Vite; the fallback keeps the issuer well-formed
// during the throwaway manifest-extract evaluation.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "flexcard-mcp",
  title: "FlexCard MCP",
  version: "0.1.0",
  instructions:
    "Tools for the FlexCard app. Use `get_my_profile` to read the signed-in user's card, `list_my_prospects` to see who scanned it, and `get_public_card` to look up any public card by slug.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyProspects, getPublicCard],
});
