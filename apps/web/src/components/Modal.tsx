import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Modal({ title, closeLabel, close, children, className = '' }: {
  title: string; closeLabel: string; close: () => void; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => { dialog.close(); };
  }, []);
  return <dialog className={`game-modal ${className}`} ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
    <div className="modal-heading"><h2 id={titleId}>{title}</h2><button autoFocus aria-label={closeLabel} onClick={close}>×</button></div>
    <div className="modal-content">{children}</div>
  </dialog>;
}
