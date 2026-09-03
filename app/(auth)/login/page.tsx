'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInAction } from '@/features/auth/presentation/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Página de Login
 * 
 * Permite que usuários façam login com email e senha.
 * Após login bem-sucedido, redireciona para /app/dashboard.
 */
export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    startTransition(async () => {
      const result = await signInAction({ email, password });

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
          Entrar no StyleFlow
        </CardTitle>
        <CardDescription className="text-center">
          Digite seu e-mail e senha para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
            />
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
              autoComplete="current-password"
              minLength={6}
            />
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
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-slate-500 text-center">
          Não tem uma conta?{' '}
          <Link
            href="/register"
            className="text-rose-600 hover:text-rose-700 font-medium hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
