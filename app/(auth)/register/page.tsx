'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpAction } from '@/features/auth/presentation/actions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

/**
 * Página de Registro
 * 
 * Permite que novos usuários criem uma conta e seu salão.
 * Após registro bem-sucedido, redireciona para /app/dashboard.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const tenantName = formData.get('tenantName') as string;
    const cpf = formData.get('cpf') as string;

    startTransition(async () => {
      const result = await signUpAction({
        email,
        password,
        fullName,
        tenantName,
        cpf: cpf || undefined,
      });

      if (result.success) {
        // Redirecionar para o dashboard
        router.push('/app/dashboard');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Criar Conta
        </CardTitle>
        <CardDescription className="text-center">
          Preencha os dados abaixo para criar sua conta e começar a usar o StyleFlow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Maria Silva"
              required
              disabled={isPending}
              autoComplete="name"
              autoFocus
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantName">Nome do Salão</Label>
            <Input
              id="tenantName"
              name="tenantName"
              type="text"
              placeholder="Salão da Maria"
              required
              disabled={isPending}
              autoComplete="organization"
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">
              CPF <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              placeholder="00000000000"
              disabled={isPending}
              autoComplete="off"
              maxLength={11}
              pattern="[0-9]{11}"
            />
            <p className="text-xs text-slate-500">
              Apenas números, sem pontos ou traços
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              autoComplete="new-password"
              minLength={6}
            />
            <p className="text-xs text-slate-500">
              Mínimo de 6 caracteres
            </p>
          </div>

          {error && (
            <div
              className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-slate-500 text-center">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="text-rose-600 hover:text-rose-700 font-medium hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
