import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 12000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong while contacting the CodeArena API.";
    return Promise.reject(new Error(message));
  },
);
