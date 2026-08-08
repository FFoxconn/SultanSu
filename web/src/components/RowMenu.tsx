import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreIcon } from "./icons";

export type RowMenuAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
};

export function RowMenu({ actions }: { actions: RowMenuAction[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocumentClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  return (
    <div className="row-menu" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="icon-button" onClick={() => setOpen((v) => !v)} aria-label="İşlemler">
        <MoreIcon size={17} />
      </button>
      {open && (
        <div className="row-menu__panel">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`row-menu__item${action.danger ? " row-menu__item--danger" : ""}`}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
