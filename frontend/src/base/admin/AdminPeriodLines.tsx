import { formatYmdSlash } from "@/lib/admin/format";

/** 掲載開始〜終了の表示（広告・協賛で同型）。〜は終了日側につける */
export function AdminPeriodLines({
  startOn,
  endOn,
}: {
  startOn: string;
  endOn: string;
}) {
  if (!startOn && !endOn) {
    return <span>期間未設定</span>;
  }
  return (
    <>
      <span>{startOn ? formatYmdSlash(startOn) : "開始未設定"}</span>
      <span>〜{endOn ? formatYmdSlash(endOn) : "終了未設定"}</span>
    </>
  );
}
