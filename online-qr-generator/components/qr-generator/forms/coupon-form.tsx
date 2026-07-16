"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isCouponExpired } from "@/lib/qr/coupon";
import type { CouponDiscountType } from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = [
  "title",
  "code",
  "discountValue",
  "businessName",
  "description",
  "terms",
  "expiresAt",
  "redemptionUrl",
  "instructions",
  "ctaLabel",
] as const;

const DISCOUNT_LABELS: Record<CouponDiscountType, string> = {
  percent: "Percentage",
  amount: "Fixed amount",
  text: "Custom text",
};

/** Hosted QR — the published coupon page shows the code + expiry state. */
export function CouponForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "coupon");

  if (state.content?.type !== "coupon") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "coupon", data: { ...data, ...patch } });

  const textField = (
    field: (typeof FIELD_ORDER)[number],
    label: string,
    placeholder: string,
    opts: { required?: boolean; hint?: React.ReactNode; type?: string; inputMode?: "url" } = {},
  ) => {
    const id = fieldId("coupon", field);
    const error = showError(field, validation.fieldErrors);
    return (
      <Field id={id} label={label} required={opts.required} error={error} hint={opts.hint}>
        <Input
          {...fieldAria(id, error, !!opts.hint)}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          placeholder={placeholder}
          value={data[field] as string}
          onChange={(e) => set({ [field]: e.target.value })}
          onBlur={() => touch(field)}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {textField("title", "Coupon title", "Summer sale", { required: true })}
        {textField("code", "Coupon code", "SUMMER20", { required: true })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={fieldId("coupon", "discountType")}>Discount type</Label>
          <Select
            value={data.discountType}
            onValueChange={(value) => set({ discountType: value as CouponDiscountType })}
          >
            <SelectTrigger id={fieldId("coupon", "discountType")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DISCOUNT_LABELS) as CouponDiscountType[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {DISCOUNT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {textField(
          "discountValue",
          "Discount value",
          data.discountType === "percent" ? "20" : data.discountType === "amount" ? "$15" : "Buy 1 get 1 free",
        )}
      </div>

      {textField("businessName", "Business name", "Nile Bistro")}

      <FileUploadField
        id={fieldId("coupon", "logo")}
        label="Logo"
        assetType="logo"
        value={data.logo}
        onChange={(logo) => set({ logo })}
      />

      <Field id={fieldId("coupon", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("coupon", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What does this coupon get people?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <Field id={fieldId("coupon", "terms")} label="Terms" error={showError("terms", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("coupon", "terms"), showError("terms", validation.fieldErrors))}
          rows={2}
          placeholder="One per customer. Not valid with other offers."
          value={data.terms}
          onChange={(e) => set({ terms: e.target.value })}
          onBlur={() => touch("terms")}
        />
      </Field>

      {textField("expiresAt", "Expiration date", "", {
        type: "date",
        hint:
          data.expiresAt && isCouponExpired(data.expiresAt)
            ? "This date is in the past — the public page will show the coupon as Expired."
            : "Leave empty for no expiry.",
      })}

      {textField("redemptionUrl", "Redemption URL", "example.com/redeem", { inputMode: "url" })}

      <Field
        id={fieldId("coupon", "instructions")}
        label="Redemption instructions"
        error={showError("instructions", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("coupon", "instructions"), showError("instructions", validation.fieldErrors))}
          rows={2}
          placeholder="Show this code at the counter."
          value={data.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          onBlur={() => touch("instructions")}
        />
      </Field>

      {textField("ctaLabel", "Button label", "Redeem offer")}
    </div>
  );
}
