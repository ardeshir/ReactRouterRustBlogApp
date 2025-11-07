import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function loader() {
  return redirect("/posts");
}

export default function Home() {
  return null;
}
