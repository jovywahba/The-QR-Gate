"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WiFiEncryption } from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["ssid", "password"] as const;

const ENCRYPTION_LABELS: Record<WiFiEncryption, string> = {
  WPA: "WPA/WPA2",
  WEP: "WEP",
  nopass: "None",
};

export function WiFiForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  const [showPassword, setShowPassword] = React.useState(false);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "wifi");

  if (state.content?.type !== "wifi") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "wifi", data: { ...data, ...patch } });

  const ssidError = showError("ssid", validation.fieldErrors);
  const passwordError = showError("password", validation.fieldErrors);
  const needsPassword = data.encryption !== "nopass";

  return (
    <div className="space-y-5">
      <Field id={fieldId("wifi", "ssid")} label="Network name (SSID)" required error={ssidError}>
        <Input
          {...fieldAria(fieldId("wifi", "ssid"), ssidError)}
          type="text"
          placeholder="Office WiFi"
          value={data.ssid}
          onChange={(e) => set({ ssid: e.target.value })}
          onBlur={() => touch("ssid")}
        />
      </Field>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId("wifi", "encryption")}>Encryption</Label>
        <Select
          value={data.encryption}
          onValueChange={(value) => set({ encryption: value as WiFiEncryption })}
        >
          <SelectTrigger id={fieldId("wifi", "encryption")} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ENCRYPTION_LABELS) as WiFiEncryption[]).map((value) => (
              <SelectItem key={value} value={value}>
                {ENCRYPTION_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsPassword && (
        <Field
          id={fieldId("wifi", "password")}
          label="Password"
          required
          error={passwordError}
          hint="For security, the password is never saved with your draft — after a refresh you'll need to enter it again."
        >
          <div className="flex gap-2">
            <Input
              {...fieldAria(fieldId("wifi", "password"), passwordError, true)}
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              placeholder="password123"
              value={data.password}
              onChange={(e) => set({ password: e.target.value })}
              onBlur={() => touch("password")}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </Field>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5 pr-4">
          <Label htmlFor={fieldId("wifi", "hidden")}>Hidden network</Label>
          <p className="text-xs text-muted-foreground">
            Turn on if the network doesn&apos;t broadcast its name.
          </p>
        </div>
        <Switch
          id={fieldId("wifi", "hidden")}
          checked={data.hidden}
          onCheckedChange={(hidden) => set({ hidden })}
        />
      </div>
    </div>
  );
}
