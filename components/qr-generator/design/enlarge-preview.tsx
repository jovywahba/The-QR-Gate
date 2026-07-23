"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQRWizard } from "../use-qr-wizard";

const QRRenderer = dynamic(() => import("../qr-renderer"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
});

/**
 * Enlarged live preview — an accessible dialog (Radix: focus trap,
 * Escape, focus restore) showing the same renderer at a bigger size,
 * plus the destination and any current readability issues.
 */
export function EnlargePreview() {
  const { state, readability } = useQRWizard();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Expand aria-hidden />
          Enlarge preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR preview</DialogTitle>
          <DialogDescription>
            {state.generatedPayload
              ? "The exact code you'll download — test it with your phone."
              : "No code yet — complete the content (or publish) first."}
          </DialogDescription>
        </DialogHeader>
        <QRRenderer
          payload={state.generatedPayload}
          design={state.design}
          type={state.selectedType}
          size={960}
          emptyHint="Nothing to encode yet."
        />
        {state.generatedPayload && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Destination
            </p>
            <p className="mt-0.5 font-mono text-xs break-all">
              {state.generatedPayload.length > 160
                ? `${state.generatedPayload.slice(0, 160)}…`
                : state.generatedPayload}
            </p>
          </div>
        )}
        {readability.issues.length > 0 && (
          <ul className="space-y-1">
            {readability.issues.map((issue) => (
              <li
                key={issue.code}
                className={`text-xs ${issue.level === "error" ? "text-destructive" : "text-muted-foreground"}`}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
