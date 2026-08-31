import type { CompileState } from "../compile";

interface Props {
  state: CompileState;
}

export function StatusIcon({ state }: Props) {
  switch (state) {
    case "idle":
      return <span aria-hidden className="status-icon status-icon--idle" />;
    case "parsing":
      return <span aria-hidden className="status-icon status-icon--parsing" />;
    case "ok":
      return (
        <svg
          aria-hidden
          className="status-icon status-icon--ok"
          viewBox="0 0 16 16"
        >
          <circle
            cx="8"
            cy="8"
            fill="none"
            r="6.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M4.75 8.25 6.75 10.25 11.25 5.75"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "warn":
      return (
        <svg
          aria-hidden
          className="status-icon status-icon--warn"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 2.5 13.5 13.5H2.5L8 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M8 6.5V9.25"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <circle cx="8" cy="11.25" fill="currentColor" r="0.75" />
        </svg>
      );
    case "error":
      return (
        <svg
          aria-hidden
          className="status-icon status-icon--error"
          viewBox="0 0 16 16"
        >
          <circle
            cx="8"
            cy="8"
            fill="none"
            r="6.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5.5 5.5 10.5 10.5 M10.5 5.5 5.5 10.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
  }
}
