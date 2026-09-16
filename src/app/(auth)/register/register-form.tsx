"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" name="fullName" autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.info && <p className="text-sm text-brand-blue">{state.info}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
