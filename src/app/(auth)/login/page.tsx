import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Entrar</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Acesse sua conta de prospecção.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
