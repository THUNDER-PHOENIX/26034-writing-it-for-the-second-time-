"use client";
import { useEffect } from "react";
import { seedDemoData } from "@/lib/storage";

export function Initializer() {
  useEffect(() => {
    seedDemoData();
  }, []);
  return null;
}
