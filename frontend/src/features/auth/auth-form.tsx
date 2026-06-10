"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { buildGoogleAuthUrl, loginUser, registerUser } from "@/lib/auth-api";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/validators";
import { useAuthStore } from "@/store/authStore";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const oauthError = searchParams.get("error");

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: true,
    },
  });

  const submitLogin = async (values: LoginValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const { user } = await loginUser(values.email, values.password);
      setUser(user);
      const redirect = searchParams.get("redirect");
      const nextPath = redirect?.startsWith("/") ? redirect : "/dashboard";
      router.push(nextPath);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (values: RegisterValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const { user } = await registerUser(values.username, values.email, values.password);
      setUser(user);
      const redirect = searchParams.get("redirect");
      const nextPath = redirect?.startsWith("/") ? redirect : "/dashboard";
      router.push(nextPath);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  };

  const startGoogleSignIn = () => {
    const redirect = searchParams.get("redirect");
    window.location.assign(buildGoogleAuthUrl(redirect ?? "/dashboard"));
  };

  return (
    <Card className="glass-panel border-border/70">
      <CardHeader>
        <CardTitle className="text-2xl">{mode === "login" ? "Enter the arena" : "Create your fighter"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to continue your ranked grind."
            : "Register to join live 1v1 coding battles."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={mode === "login" ? loginForm.handleSubmit(submitLogin) : registerForm.handleSubmit(submitRegister)}
        >
          {submitError ? <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{submitError}</p> : null}
          {oauthError === "google" ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              Google sign-in was cancelled or failed. Please try again.
            </p>
          ) : null}
          {mode === "register" ? (
            <div>
              <label className="mb-2 block text-sm text-muted">Username</label>
              <Input {...registerForm.register("username")} placeholder="byteKnight" />
              <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.username?.message}</p>
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm text-muted">Email</label>
            <Input {...(mode === "login" ? loginForm.register("email") : registerForm.register("email"))} type="email" placeholder="dev@codearena.dev" />
            <p className="mt-1 text-xs text-danger">{mode === "login" ? loginForm.formState.errors.email?.message : registerForm.formState.errors.email?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Password</label>
            <Input {...(mode === "login" ? loginForm.register("password") : registerForm.register("password"))} type="password" placeholder="********" />
            <p className="mt-1 text-xs text-danger">{mode === "login" ? loginForm.formState.errors.password?.message : registerForm.formState.errors.password?.message}</p>
          </div>
          {mode === "register" ? (
            <>
              <div>
                <label className="mb-2 block text-sm text-muted">Confirm password</label>
                <Input {...registerForm.register("confirmPassword")} type="password" placeholder="********" />
                <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.confirmPassword?.message}</p>
              </div>
              <label className="flex items-center gap-3 text-sm text-muted">
                <Checkbox {...registerForm.register("agreeToTerms")} />
                I agree to the CodeArena terms and anti-cheat policy.
              </label>
              <p className="text-xs text-danger">{registerForm.formState.errors.agreeToTerms?.message}</p>
            </>
          ) : null}
          <Button className="w-full" type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "Continue to dashboard" : "Create account"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={startGoogleSignIn}>
            <LogIn className="h-4 w-4" />
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
