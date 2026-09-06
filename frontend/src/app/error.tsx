"use client";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Page failed to load</h1>
      <p style={{ color: "#475569", marginTop: 8 }}>{error.message || "Unknown error"}</p>
      {error.digest && (
        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          background: "#1d4ed8",
          color: "white",
          border: 0,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
