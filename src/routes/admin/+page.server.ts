import { fail } from "@sveltejs/kit";
import { DB } from "$lib/server/db";
import { env } from "$env/dynamic/private";
import { createHmac } from "crypto";

function createSessionToken() {
  return createHmac("sha256", env.ADMIN_SECRET)
    .update("admin-authenticated-session")
    .digest("hex");
}

export function load({ cookies, url }) {
  const sessionCookie = cookies.get("admin_session");
  const expectedToken = createSessionToken();

  if (sessionCookie !== expectedToken) {
    return { authorized: false };
  }

  const query = url.searchParams.get("q")?.toUpperCase().trim();
  let searchResult = null;
  if (query) searchResult = DB.get(query);

  const recentWinners = DB.getAll ? DB.getAll() : [];

  const stats = {
    big: recentWinners.filter((w: any) => w.prize === "BIG" && w.claimed)
      .length,
    small: recentWinners.filter((w: any) => w.prize === "SMALL" && w.claimed)
      .length,
    total: recentWinners.filter((w: any) => w.claimed).length,
  };

  return { authorized: true, recentWinners, searchResult, query, stats };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get("password");

    if (password === env.ADMIN_PASSWORD) {
      cookies.set("admin_session", createSessionToken(), {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
      });

      return { success: true };
    }

    // Hatalı giriş gecikmesi
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return fail(403, { incorrect: true });
  },

  logout: async ({ cookies }) => {
    cookies.delete("admin_session", { path: "/" });
  },

  claim: async ({ request }) => {
    const data = await request.formData();
    const code = data.get("code") as string;
    if (code) DB.markClaimed(code);
    return { success: true };
  },
};
