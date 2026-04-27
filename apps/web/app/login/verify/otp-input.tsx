"use client";

import { useState } from "react";

type Props = {
  length: number;
  className?: string;
};

export function OtpInput({ length, className }: Props) {
  const [value, setValue] = useState("");

  return (
    <input
      id="otp"
      name="otp"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern={`[0-9]{${length}}`}
      minLength={length}
      required
      placeholder={"0".repeat(length)}
      value={value}
      onChange={(e) =>
        setValue(e.target.value.replace(/\D/g, "").slice(0, length))
      }
      className={className}
    />
  );
}
