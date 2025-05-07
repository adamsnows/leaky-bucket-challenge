const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchGraphQL(url: string, options: RequestInit) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (options.headers) {
      const existingHeaders = options.headers;
      if (existingHeaders instanceof Headers) {
        existingHeaders.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(existingHeaders)) {
        existingHeaders.forEach(([key, value]) => headers.set(key, value));
      } else if (typeof existingHeaders === 'object') {
        Object.entries(existingHeaders).forEach(([key, value]) => {
          if (value !== undefined) headers.set(key, value);
        });
      }
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok && response.status !== 200) {
      if (response.status === 429) {
        throw new Error("Você atingiu o limite de requisições. Tente novamente mais tarde.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const jsonData = await response.json();
    return { data: jsonData };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado";
    console.error("Fetch error:", errorMessage);
    throw new Error(errorMessage);
  }
}

const api = {
  post: (_endpoint: string, data: any) => {
    return fetchGraphQL(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  get: (_endpoint: string) => {
    return fetchGraphQL(API_URL, {
      method: "GET",
    });
  }
};

export default api;