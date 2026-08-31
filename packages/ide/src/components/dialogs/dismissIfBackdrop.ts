import type { MouseEvent } from "react";

/**
 * Dismiss only when the press starts on the backdrop.
 * `click` on the overlay also fires after a drag that starts in the dialog
 * and ends outside it (click targets the common ancestor).
 */
export const dismissIfBackdropMouseDown = (
  event: MouseEvent<HTMLElement>,
  dismiss: () => void
): void => {
  if (event.target === event.currentTarget) {
    dismiss();
  }
};
