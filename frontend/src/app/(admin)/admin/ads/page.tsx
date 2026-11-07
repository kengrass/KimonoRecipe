import { redirect } from "next/navigation";

/** 旧URL。ナビは /admin/sponsors */
export default function AdminAdsRedirectPage() {
  redirect("/admin/sponsors");
}
