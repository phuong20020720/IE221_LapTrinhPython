type IconButtonProps = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "muted" | "danger";
  children: React.ReactNode;
};

export function IconButton({
  label,
  onClick,
  tone = "primary",
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${tone}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-btn__svg">
      <path
        d="M4 17.5V20h2.5L17.1 9.4l-2.5-2.5L4 17.5zM19.7 7.8a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0l-1.1 1.1 2.5 2.5 1.1-1.1z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconDeactivate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-btn__svg">
      <path
        d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 2a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5zM6.7 7.4l9.9 9.9A7 7 0 0 1 6.7 7.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconActivate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-btn__svg">
      <path
        d="M9.5 16.2 5.8 12.5l1.4-1.4 2.3 2.3 5.9-5.9 1.4 1.4-7.3 7.3zM12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 16a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"
        fill="currentColor"
      />
    </svg>
  );
}
