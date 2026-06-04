"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/validators";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [loading, setLoading] = useState(false);

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

  const submit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);
  };

  if (mode === "login") {
    return (
      <Card className="glass-panel border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl">Enter the arena</CardTitle>
          <CardDescription>Sign in to continue your ranked grind.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={loginForm.handleSubmit(submit)}>
            <div>
              <label className="mb-2 block text-sm text-muted">Email</label>
              <Input {...loginForm.register("email")} type="email" placeholder="dev@codearena.dev" />
              <p className="mt-1 text-xs text-danger">{loginForm.formState.errors.email?.message}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted">Password</label>
              <Input {...loginForm.register("password")} type="password" placeholder="Enter password" />
              <p className="mt-1 text-xs text-danger">{loginForm.formState.errors.password?.message}</p>
            </div>
            <Button className="w-full" type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue to dashboard
            </Button>
            <Button type="button" variant="outline" className="w-full">
              <Globe className="h-4 w-4" />
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-border/70">
      <CardHeader>
        <CardTitle className="text-2xl">Create your fighter</CardTitle>
        <CardDescription>Register to join live 1v1 coding battles.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={registerForm.handleSubmit(submit)}>
          <div>
            <label className="mb-2 block text-sm text-muted">Username</label>
            <Input {...registerForm.register("username")} placeholder="byteKnight" />
            <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.username?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Email</label>
            <Input {...registerForm.register("email")} type="email" placeholder="dev@codearena.dev" />
            <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.email?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Password</label>
            <Input {...registerForm.register("password")} type="password" placeholder="Enter password" />
            <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.password?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Confirm password</label>
            <Input {...registerForm.register("confirmPassword")} type="password" placeholder="Enter password again" />
            <p className="mt-1 text-xs text-danger">{registerForm.formState.errors.confirmPassword?.message}</p>
          </div>
          <label className="flex items-center gap-3 text-sm text-muted">
            <Checkbox {...registerForm.register("agreeToTerms")} />
            I agree to the CodeArena terms and anti-cheat policy.
          </label>
          <p className="text-xs text-danger">{registerForm.formState.errors.agreeToTerms?.message}</p>
          <Button className="w-full" type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>
          <Button type="button" variant="outline" className="w-full">
            <Globe className="h-4 w-4" />
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
