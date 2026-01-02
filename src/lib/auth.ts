import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getAuthUserId(): Promise<string | null> {
  try {
    const authResult = await auth();
    return authResult?.userId ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<string> {
  const authResult = await auth();
  const userId = authResult?.userId;

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

export async function getCurrentUser() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
