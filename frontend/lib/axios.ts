import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Ocorreu um erro inesperado";

    if (error.response?.status === 429) {
      return Promise.reject(
        new Error(
          "Você atingiu o limite de requisições. Tente novamente mais tarde."
        )
      );
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
