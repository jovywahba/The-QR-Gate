"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QRPreviewPanel } from "./qr-preview-panel";

/**
 * Mobile/tablet preview: a sticky bottom-bar button opening the
 * preview in a bottom sheet (Radix handles focus trap + Escape).
 * Hidden on lg+ where the sticky right column takes over.
 */
export function QRMobilePreviewSheet() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <Eye aria-hidden />
            Preview
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-0">
            <SheetTitle>Preview</SheetTitle>
            <SheetDescription>
              The mobile page and the real QR code, exactly as they&apos;ll ship.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            <QRPreviewPanel />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
