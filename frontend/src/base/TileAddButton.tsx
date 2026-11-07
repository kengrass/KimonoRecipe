type Props = {
  label: string;
  onClick: () => void;
};

/** 3列グリッド用の＋追加タイル（詳細紐付けと同型） */
export function TileAddButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left"
      aria-label={label}
    >
      <div className="tile-thumb tile-thumb--add">
        <span className="text-3xl font-light leading-none" aria-hidden>
          ＋
        </span>
      </div>
    </button>
  );
}
