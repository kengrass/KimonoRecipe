"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormPage, PageTitle } from "@/base/form/form-ui";

type Props = {
  title: string;
  backHref: string;
  backLabel: string;
  toast?: ReactNode;
  loading?: boolean;
  /** タイトル直下の注記（アイテムなど） */
  leadNote?: ReactNode;
  children: ReactNode;
};

/** コーデ／アイテム編集の共通枠（戻る・見出し・読込・Toast） */
export function ComposeFormShell({
  title,
  backHref,
  backLabel,
  toast,
  loading = false,
  leadNote,
  children,
}: Props) {
  return (
    <FormPage>
      <div className="space-y-2">
        <PageTitle
          lead={
            <Link
              href={backHref}
              className="text-sm text-kr-link hover:underline"
            >
              {backLabel}
            </Link>
          }
        >
          {title}
        </PageTitle>
        {leadNote}
      </div>
      {toast}
      {loading ? (
        <p className="py-8 text-center text-sm text-kr-muted">読み込み中…</p>
      ) : (
        children
      )}
    </FormPage>
  );
}
