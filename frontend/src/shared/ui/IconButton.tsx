import { Button } from "@/components/ui/button";

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
    <Button
      type="button"
      variant={tone === "danger" ? "destructive" : tone === "muted" ? "outline" : "ghost"}
      size="icon"
      className="size-9"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
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

export function IconView() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-btn__svg">
      <path
        d="M12 5C6.5 5 2.2 9.1 1 12c1.2 2.9 5.5 7 11 7s9.8-4.1 11-7c-1.2-2.9-5.5-7-11-7Zm0 12c-4 0-7.4-2.8-8.8-5C4.6 9.8 8 7 12 7s7.4 2.8 8.8 5C19.4 14.2 16 17 12 17Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
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
