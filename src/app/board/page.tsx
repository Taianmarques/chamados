import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoardClient from "./BoardClient";

export default async function BoardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <BoardClient
      userName={session.user.name}
      userRole={(session.user as { role: string }).role}
    />
  );
}
