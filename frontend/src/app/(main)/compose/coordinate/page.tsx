import type { Metadata } from "next";
import { Suspense } from "react";
import { CoordinateCreateView } from "@/base/compose/CoordinateCreateView";
import { FormPageShell } from "@/base/form/FormPageShell";

export const metadata: Metadata = {
  title: "コーディネート新規追加",
  robots: { index: false, follow: false },
};

/** コーデ投稿（モック）。戻るはキャンセル／サイトナビに任せる */
export default function ComposeCoordinatePage() {
  return (
    <FormPageShell showBackLink={false} showPreviewBanner={false}>
      <Suspense fallback={null}>
        <CoordinateCreateView />
      </Suspense>
    </FormPageShell>
  );
}
