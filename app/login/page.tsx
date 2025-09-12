"use client";
import { signIn } from "next-auth/react";
import { Card, PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-24">
      <Card className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600">Use your Google account to continue.</p>
        <PrimaryButton
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Continue with Google
        </PrimaryButton>
      </Card>
    </div>
  );
}


