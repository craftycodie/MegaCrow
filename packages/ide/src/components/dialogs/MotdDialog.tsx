import { type MouseEvent, useEffect, useRef, useState } from "react";
import {
  CURRENT_MOTD,
  type MotdMessage,
  parseMotdLinkHref,
  splitMotdInline,
} from "../../app/motd";
import { docsPageUrl, openDocs, openExternalUrl } from "../../desktop";

const MOTD_FADE_MS = 180;

interface Props {
  message?: MotdMessage;
  onDismiss: () => void;
  open: boolean;
}

export function MotdDialog({ open, message = CURRENT_MOTD, onDismiss }: Props) {
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const bodyParagraphs = message.body
    .split("\n")
    .filter((line) => line.length > 0);

  useEffect(() => {
    if (open) {
      setRender(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
  }, [open]);

  useEffect(() => {
    if (!visible && render) {
      const timeout = window.setTimeout(() => setRender(false), MOTD_FADE_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [visible, render]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    dismissButtonRef.current?.focus();
  }, [visible]);

  if (!render) {
    return null;
  }

  return (
    <div
      className={`motd-backdrop${visible ? " motd-backdrop--visible" : ""}`}
      role="presentation"
    >
      <div className="motd-stage">
        <div
          aria-describedby="motd-body"
          aria-labelledby="motd-title"
          aria-modal="true"
          className="motd-dialog"
          role="dialog"
        >
          <div className="motd-layout">
            <div className="motd-image-panel">
              <img
                alt={message.imageAlt}
                className="motd-image"
                src={message.imageUrl}
              />
            </div>

            <div className="motd-text-panel">
              <h2 className="motd-title" id="motd-title">
                {message.title}
              </h2>

              {message.header ? (
                <p className="motd-header">{message.header}</p>
              ) : null}

              <div className="motd-body" id="motd-body">
                {bodyParagraphs.map((paragraph, index) => (
                  <p key={index}>
                    {splitMotdInline(paragraph).map((part, partIndex) => {
                      if (part.type !== "link") {
                        return part.value;
                      }

                      const target = parseMotdLinkHref(part.href);
                      const href =
                        target.kind === "docs"
                          ? docsPageUrl(target.path)
                          : target.url;

                      return (
                        <a
                          className="motd-link"
                          href={href}
                          key={partIndex}
                          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (target.kind === "docs") {
                              void openDocs(target.path);
                              return;
                            }
                            void openExternalUrl(target.url);
                          }}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {part.label}
                        </a>
                      );
                    })}
                  </p>
                ))}
              </div>

              <div className="motd-footer">
                <button
                  className="motd-dismiss"
                  onClick={() => onDismiss()}
                  ref={dismissButtonRef}
                  type="button"
                >
                  {message.dismissLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
