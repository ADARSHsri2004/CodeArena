import axios, { AxiosError, AxiosHeaders } from "axios";
import { authTokenKey } from "@/lib/auth-session";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(authTokenKey);
    if (token) {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
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
