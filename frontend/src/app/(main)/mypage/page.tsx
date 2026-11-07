import { redirect } from "next/navigation";
import { userProfilePath } from "@/lib/mypage-data";
import { getServerViewerUserId } from "@/lib/server-viewer";
import { LARAVEL } from "@/lib/laravel-urls";

/**
 * `/mypage` → ログイン中なら自分の `/m/{id}`。
 * 未ログインは既存 Laravel ログインへ（spike 時はトップへ）。
 */
export default async function MypageAliasPage() {
  const viewerId = await getServerViewerUserId();
  if (viewerId) {
    redirect(userProfilePath(viewerId));
  }
  if (process.env.NEXT_PUBLIC_USE_SPIKE_API === "1") {
    redirect("/");
  }
  redirect(LARAVEL.login);
}
