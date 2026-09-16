import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Criar conta</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Comece a prospectar leads para o Easy Food Hub.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
