"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DISPLAY } from "./display";

// What focus falls back to when the wanted field isn't on screen: the form's first control.
const CONTROLS = "button, a[href], input, select, textarea";

interface FormPanelProps {
  open: boolean;
  /** The panel's heading, e.g. "Add". */
  title: string;
  /** Called when the user closes it with ✕ or Esc. */
  onClose: () => void;
  /** The id of the field that takes focus when it opens. Null starts on the first control. */
  focusId: string | null;
  children: ReactNode;
}

/**
 * A form that opens over the screen the user is on: the whole screen on phones, a centred box
 * from tablet width up. It has a visible ✕ and closes with Esc. Add forms and edit forms use it.
 *
 * On phones the panel is in the page's flow and nothing is pinned to the bottom edge, because iOS
 * Safari lets the keyboard cover what is pinned there. The caller hides the screen behind it on
 * phones while it is open, so the panel is all there is to scroll.
 */
export function FormPanel({
  open,
  title,
  onClose,
  focusId,
  children,
}: FormPanelProps) {
  const body = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      // Prototype only: focus stays inside, but the page isn't locked, so the ProtoBar still works.
      // Production uses a full modal.
      modal="trap-focus"
      // A tap outside never closes it, so typed input can't be lost by accident.
      disablePointerDismissal
    >
      <DialogPortal>
        {/* Under the ProtoBar (z-50), over the sidebar. Phones have nothing behind the panel to dim. */}
        <DialogOverlay className="z-40 max-md:hidden" />
        {/* Base UI's popup, not DialogContent, which fixes the overlay's layer and a small centred box. */}
        <DialogPrimitive.Popup
          initialFocus={() =>
            (focusId === null ? null : document.getElementById(focusId)) ??
            body.current?.querySelector<HTMLElement>(CONTROLS) ??
            null
          }
          className={cn(
            // On phones it is the page itself, in the flow, so the page scrolls and the keyboard behaves.
            "relative z-40 flex min-h-dvh flex-col gap-3 bg-background p-3 text-foreground outline-none",
            "duration-200 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-6 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-6",
            // Between phone and tablet width the ProtoBar sits at the bottom, so the last button clears it.
            "sm:pb-24",
            // From tablet width it is a box that scrolls inside. It leaves room above and below, so it never sits under the ProtoBar.
            "md:fixed md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-9rem)] md:min-h-0 md:w-full md:max-w-lg md:-translate-1/2 md:overflow-y-auto md:overscroll-contain md:rounded-(--block-radius) md:pb-3 md:shadow-xl md:ring-1 md:ring-foreground/10",
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-1">
            <DialogPrimitive.Title
              className={cn(DISPLAY, "text-2xl font-extrabold tracking-tight")}
            >
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-lg" aria-label="Close" />
              }
            >
              <X />
            </DialogPrimitive.Close>
          </div>
          <div ref={body} className="flex flex-col gap-3">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
