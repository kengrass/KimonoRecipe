import Link from "next/link";

type BaseProps = {
  page: number;
  totalPages: number;
};

type ClientProps = BaseProps & {
  getPageHref?: never;
  onPageChange: (page: number) => void;
};

type HrefProps = BaseProps & {
  getPageHref: (page: number) => string;
  onPageChange?: never;
};

type Props = (ClientProps | HrefProps) & {
  className?: string;
};

const navClass =
  "mt-8 flex flex-wrap items-center justify-center gap-1 text-sm";

const pageBtnClass = (active: boolean) =>
  `min-w-[2rem] rounded px-2 py-1.5 text-center ${
    active
      ? "bg-kr-navy font-medium text-white"
      : "text-kr-link hover:bg-neutral-100"
  }`;

const edgeClass = "rounded px-3 py-1.5 text-kr-link hover:bg-neutral-100";
const edgeDisabledClass = "rounded px-3 py-1.5 text-kr-muted/40";

function pageNumbers(totalPages: number): number[] {
  return Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
}

export function PaginationBar(props: Props) {
  const { page, totalPages, className } = props;
  if (totalPages <= 1) return null;

  const pages = pageNumbers(totalPages);
  const navCls = className ? `${navClass} ${className}` : navClass;

  if ("onPageChange" in props && props.onPageChange) {
    const { onPageChange } = props;

    return (
      <nav aria-label="ページ送り" className={navCls}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={page <= 1 ? edgeDisabledClass : edgeClass}
          aria-label="前のページ"
        >
          ‹‹
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={pageBtnClass(p === page)}
          >
            {p}
          </button>
        ))}

        {totalPages > 7 ? (
          <span className="px-1 text-kr-muted">…</span>
        ) : null}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={page >= totalPages ? edgeDisabledClass : edgeClass}
          aria-label="次のページ"
        >
          ››
        </button>
      </nav>
    );
  }

  const pageHref = props.getPageHref;
  const prevHref = page > 1 ? pageHref(page - 1) : undefined;
  const nextHref =
    page < totalPages ? pageHref(page + 1) : undefined;

  return (
    <nav aria-label="ページ送り" className={navCls}>
      {prevHref ? (
        <Link href={prevHref} className={edgeClass} aria-label="前のページ">
          ‹‹
        </Link>
      ) : (
        <span className={edgeDisabledClass}>‹‹</span>
      )}

      {pages.map((p) => {
        const href = pageHref(p);
        const active = p === page;
        return (
          <Link
            key={p}
            href={href}
            aria-current={active ? "page" : undefined}
            className={pageBtnClass(active)}
          >
            {p}
          </Link>
        );
      })}

      {totalPages > 7 ? (
        <span className="px-1 text-kr-muted">…</span>
      ) : null}

      {nextHref ? (
        <Link href={nextHref} className={edgeClass} aria-label="次のページ">
          ››
        </Link>
      ) : (
        <span className={edgeDisabledClass}>››</span>
      )}
    </nav>
  );
}
