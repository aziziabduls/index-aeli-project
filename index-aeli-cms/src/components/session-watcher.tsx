"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { deleteClientCookie } from "@/lib/cookie.client";

export function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    // 1. Monkey-patch window.fetch to capture 401 responses globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          deleteClientCookie("session_token");
          deleteClientCookie("user");

          // Force redirect to login page
          router.push("/auth/v1/login");
        }
        return response;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    // 2. Periodically check local cookie expiration time every 5 seconds
    const interval = setInterval(() => {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("session_token="));
      if (tokenCookie) {
        const token = tokenCookie.split("=")[1];
        if (token) {
          try {
            const payloadPart = token.split(".")[1];
            if (payloadPart) {
              const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
              const payload = JSON.parse(atob(base64));
              if (payload.exp && Date.now() >= payload.exp * 1000) {
                deleteClientCookie("session_token");
                deleteClientCookie("user");
                router.push("/auth/v1/login");
              }
            }
          } catch (_e) {
            // ignore malformed tokens
          }
        }
      }
    }, 5000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
