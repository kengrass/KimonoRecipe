import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemCreateView } from "@/base/compose/ItemCreateView";
import { FormPageShell } from "@/base/form/FormPageShell";

export const metadata: Metadata = {
  title: "アイテム新規追加",
  robots: { index: false, follow: false },
};

/** アイテム投稿（モック）。戻るはキャンセル／サイトナビに任せる */
export default function ComposeItemPage() {
  return (
    <FormPageShell showBackLink={false} showPreviewBanner={false}>
      <Suspense fallback={null}>
        <ItemCreateView />
      </Suspense>
    </FormPageShell>
  );
}
