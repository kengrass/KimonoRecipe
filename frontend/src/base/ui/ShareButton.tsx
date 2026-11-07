"use client";

import { useEffect, useState, type ReactNode } from "react";
import { detailShareText } from "@/lib/display-title";
import { ModalDialog } from "./ModalDialog";
import { ShareIcon } from "./icons/ShareIcon";

type Props = {
  /** 投稿文の見出し（タイトル or フォールバック） */
  title: string;
  path: string;
  /** 公開本文。あるとき X 等の text にタイトルと一緒に載せる（現行サイト踏襲） */
  description?: string | null;
};

function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function openShareWindow(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=600,height=480");
}

/**
 * IG 風：紙飛行機 → ボトムシート（LINE / X / コピー / その他）。
 */
export function ShareButton({ title, path, description }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && Boolean(navigator.share),
    );
  }, []);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const url = () => absoluteUrl(path);
  const close = () => setOpen(false);

  const shareBody = () => detailShareText(title, description);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        close();
      }, 1000);
    } catch {
      close();
    }
  };

  const shareLine = () => {
    openShareWindow(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url())}`,
    );
    close();
  };

  const shareX = () => {
    const u = url();
    openShareWindow(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(shareBody())}`,
    );
    close();
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title, text: shareBody(), url: url() });
    } catch {
      /* cancel */
    }
    close();
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center text-kr-muted transition hover:text-kr-text"
        aria-label="シェア"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ShareIcon className="h-5 w-5" />
      </button>

      <ModalDialog open={open} title="シェア" onClose={close} layout="sheet">
        <div className="flex justify-center gap-5 overflow-x-auto px-6 pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 sm:px-7">
          <ShareAction
            label="LINE"
            onClick={shareLine}
            tone="bg-[#06C755] text-white"
          >
            <LineMark />
          </ShareAction>
          <ShareAction
            label="X"
            onClick={shareX}
            tone="bg-neutral-900 text-white"
          >
            <XMark />
          </ShareAction>
          <ShareAction
            label={copied ? "コピー済み" : "コピー"}
            onClick={() => void copyLink()}
            tone="bg-neutral-100 text-kr-text"
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
          </ShareAction>
          {canNativeShare ? (
            <ShareAction
              label="その他"
              onClick={() => void shareNative()}
              tone="bg-neutral-100 text-kr-text"
            >
              <MoreIcon />
            </ShareAction>
          ) : null}
        </div>
      </ModalDialog>
    </>
  );
}

function ShareAction({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[4.25rem] shrink-0 flex-col items-center gap-2 text-center"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${tone}`}
      >
        {children}
      </span>
      <span className="whitespace-nowrap text-[11px] leading-tight text-kr-text">
        {label}
      </span>
    </button>
  );
}

function LineMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
      <path d="M19.8 10.3c0-3.5-3.5-6.4-7.8-6.4S4.2 6.8 4.2 10.3c0 3.2 2.8 5.8 6.6 6.3.26.05.6.16.69.37.08.2.05.52.03.73l-.12.74c-.04.22-.18.87.76.47s5.05-3 6.89-5.13c1.27-1.4 1.75-2.8 1.75-4.48z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M17.6 3h2.7l-5.9 6.75L22 21h-5.5l-4.3-5.63L7.2 21H4.5l6.3-7.2L2.4 3h5.6l3.9 5.16L17.6 3zm-.95 16.2h1.5L7.45 4.7H5.85l10.8 14.5z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 00-7.07-7.07L10.7 5.23"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 00-7.07 0L4.8 13.12a5 5 0 007.07 7.07l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}
