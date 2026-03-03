import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login - no home page exists as per PRD
  redirect("/login");
}
