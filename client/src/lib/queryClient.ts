import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = text;
    try {
      const json = JSON.parse(text);
      errorMessage = json.error;
      if (json.details) {
        errorMessage +=
          ": " +
          (typeof json.details === "string"
            ? json.details
            : JSON.stringify(json.details));
      }
    } catch (e) {
      // If parsing fails, use the raw text
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  if (data) {
    console.log(`${method} ${url} request:`, JSON.stringify(data, null, 2));
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  const responseText = await res.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
    console.log(`${method} ${url} response:`, responseData);
  } catch (e) {
    console.log(`${method} ${url} response (text):`, responseText);
    responseData = responseText;
  }

  if (!res.ok) {
    throw new Error(
      typeof responseData === "object" && responseData.error
        ? responseData.error +
          (responseData.details
            ? `: ${JSON.stringify(responseData.details)}`
            : "")
        : `${res.status}: ${responseText}`
    );
  }

  return new Response(JSON.stringify(responseData), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use the custom apiRequest if available (set by setCurrentUser)
    const requestFn = (window as any).apiRequest || fetch;

    let res: Response;
    if (requestFn === fetch) {
      const url = `${API_BASE}${queryKey.join("/") as string}`;
      res = await fetch(url, {
        credentials: "include",
      });
    } else {
      // Use the authenticated apiRequest function
      res = await requestFn(
        "GET",
        `${API_BASE}${queryKey.join("/") as string}`
      );
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
