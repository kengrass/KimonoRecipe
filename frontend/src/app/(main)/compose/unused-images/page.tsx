import type { Metadata } from "next";
import { UnusedImagesView } from "@/base/compose/UnusedImagesView";
import { FormPageShell } from "@/base/form/FormPageShell";

export const metadata: Metadata = {
  title: "未使用画像",
  robots: { index: false, follow: false },
};

/** 未使用画像（モック）。トリミングは編集画面側。 */
export default function ComposeUnusedImagesPage() {
  return (
    <FormPageShell showBackLink={false} showPreviewBanner={false}>
      <UnusedImagesView />
    </FormPageShell>
  );
}
