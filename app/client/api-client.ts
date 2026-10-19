import { createFetchio, type FetchioClient } from './core';

// Export a placeholder or null, and initialize it later
let client: FetchioClient | null = null;

const getAuthToken = async (): Promise<string | null> => {
    // // 1. Dynamic import of the instance
    // const { msalInstance } = await import("@/main.tsx");
    //
    // // 2. Do NOT use getActiveAccount() - it's too finicky.
    // // Use getAllAccounts() - if this array has stuff, the user is logged in.
    // const allAccounts = msalInstance.getAllAccounts();
    // const account = allAccounts[0];
    //
    // if (!account) {
    //     console.warn("No account found in MSAL cache.");
    //     return null;
    // }
    //
    // try {
    //     const response = await msalInstance.acquireTokenSilent({
    //         scopes: ["api://dd6e6c34-5086-490d-8aac-5b501d6ccd8d/access_as_user"],
    //         account: account
    //     });
    //     return response.accessToken;
    // } catch (error) {
    //     console.error("Silent token acquisition failed:", error);
    //     return null;
    // }

    return "0bdb6be1-23f6-4d20-9463-9a105b0d4b08"
};

// Now exported as a function, not a variable
export const getClient = (): FetchioClient => {
    if (!client) {
        client = createFetchio({
            apiUrl: import.meta.env.VITE_API_URL,
            debug: import.meta.env.VITE_CLIENT_DEBUG === 'true',
            lang: 'en-US',
            getAccessToken: getAuthToken,
            handle: {
                unauthenticated: () => {},
                internalError: (_payload) => { return _payload.message; },
            },
        });
    }
    return client;
};