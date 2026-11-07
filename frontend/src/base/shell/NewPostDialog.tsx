"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModalDialog } from "@/base/ui/ModalDialog";
import { useMockAuth } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";
import {
  buildMypageHref,
  defaultMypageUrlState,
} from "@/lib/mypage-state";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * ヘッダー ＋ ：上段コーデ／アイテム、下段に仮コーデ一覧への導線。
 * 仮コーデはここでは作らず、一覧を見てから追加する。
 */
export function NewPostDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { currentUser } = useMockAuth();

  const tempListHref = currentUser
    ? buildMypageHref(
        userProfilePath(currentUser.id),
        defaultMypageUrlState({ coordinateView: "temp" }),
      )
    : APP_ROUTES.login;

  const goTempList = () => {
    onClose();
    router.push(tempListHref);
  };

  return (
    <ModalDialog
      open={open}
      title="新規追加"
      onClose={onClose}
      layout="sheet"
      size="md"
    >
      <div className="space-y-2.5 pb-2 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          <ChoiceLink
            href={APP_ROUTES.addCoordinate}
            label="コーデを登録"
            hint="着こなし1セット"
            onNavigate={onClose}
          />
          <ChoiceLink
            href={APP_ROUTES.addItem}
            label="アイテムを登録"
            hint="着物・帯など単品"
            onNavigate={onClose}
          />
        </div>
        <button
          type="button"
          onClick={goTempList}
          className="block w-full rounded-xl border border-dashed border-kr-border px-4 py-3.5 text-center transition duration-150 hover:border-kr-navy/30 hover:bg-neutral-50/80 active:bg-neutral-50"
        >
          <span className="block text-sm font-medium tracking-tight text-kr-text">
            仮コーデ
          </span>
          <span className="mt-1 block text-[11px] leading-snug text-kr-muted">
            一覧を見る・あとから詰める
          </span>
        </button>
      </div>
    </ModalDialog>
  );
}

function ChoiceLink({
  href,
  label,
  hint,
  onNavigate,
}: {
  href: string;
  label: string;
  hint: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-[6.75rem] flex-col items-center justify-center rounded-xl border border-kr-border px-3 py-5 text-center transition duration-150 hover:border-kr-navy/35 hover:bg-kr-navy/[0.03] active:bg-kr-navy/[0.05]"
    >
      <span className="block text-sm font-semibold tracking-tight text-kr-text">
        {label}
      </span>
      <span className="mt-1.5 block text-[11px] leading-snug text-kr-muted">
        {hint}
      </span>
    </Link>
  );
}
