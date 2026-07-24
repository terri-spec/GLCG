import type { Metadata } from "next";
import FutureKatie from "./FutureKatie";

export const metadata: Metadata = {
  title: "Future Katie",
  description: "Try on a future before choosing one.",
};

export default function Home() {
  return <FutureKatie />;
}
