import { createAuthClient } from "better-auth/client";
/**
 * Helper that creates a single Better‑Auth client instance.
 * You can import this wherever you need to call the auth API
 * (e.g. in your controllers).
 */

export const authClient = createAuthClient({
    fetchOptions: {
        credentials: "include",
    },
    disableDefaultFetchPlugins: true,
    sessionOptions: {
        refetchInterval: 0,
        refetchOnWindowFocus: true,
        refetchWhenOffline: false,
    }
})

