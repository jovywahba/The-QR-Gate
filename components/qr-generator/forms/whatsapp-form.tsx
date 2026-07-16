"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppPayload } from "@/lib/qr/payloads";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["countryCode", "phone", "message"] as const;

export function WhatsAppForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "whatsapp");

  if (state.content?.type !== "whatsapp") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "whatsapp", data: { ...data, ...patch } });

  const ccError = showError("countryCode", validation.fieldErrors);
  const phoneError = showError("phone", validation.fieldErrors);
  const link = validation.valid ? buildWhatsAppPayload(data) : "";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Field id={fieldId("whatsapp", "countryCode")} label="Country code" required error={ccError}>
          <Input
            {...fieldAria(fieldId("whatsapp", "countryCode"), ccError)}
            type="text"
            inputMode="tel"
            autoComplete="tel-country-code"
            placeholder="+20"
            value={data.countryCode}
            onChange={(e) => set({ countryCode: e.target.value })}
            onBlur={() => touch("countryCode")}
          />
        </Field>
        <Field id={fieldId("whatsapp", "phone")} label="Phone number" required error={phoneError}>
          <Input
            {...fieldAria(fieldId("whatsapp", "phone"), phoneError)}
            type="text"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="100 123 4567"
            value={data.phone}
            onChange={(e) => set({ phone: e.target.value })}
            onBlur={() => touch("phone")}
          />
        </Field>
      </div>

      <Field
        id={fieldId("whatsapp", "message")}
        label="Pre-filled message"
        error={showError("message", validation.fieldErrors)}
        hint="Scanning opens WhatsApp with this message ready to send."
      >
        <Textarea
          {...fieldAria(fieldId("whatsapp", "message"), showError("message", validation.fieldErrors), true)}
          rows={3}
          placeholder="Hello!"
          value={data.message ?? ""}
          onChange={(e) => set({ message: e.target.value })}
          onBlur={() => touch("message")}
        />
      </Field>

      {link && (
        <p className="text-xs text-muted-foreground">
          Encodes <span className="font-mono break-all">{link}</span>
        </p>
      )}
    </div>
  );
}
