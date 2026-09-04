'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { signInAction } from '@/features/auth/presentation/actions';
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
        router.push('/app/dashboard');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="rounded-3xl shadow-2xl shadow-slate-200/40 dark:shadow-rose-950/10">
      <CardHeader className="space-y-1 text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
          <ArrowRight className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Entrar no StyleFlow
        </CardTitle>
        <CardDescription>
          Digite seu e-mail e senha para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-[18px] h-[18px]" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                disabled={isPending}
                autoComplete="email"
                autoFocus
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-[18px] h-[18px]" />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="current-password"
                minLength={6}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            size="default"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Nao tem uma conta?{' '}
          <Link
            href="/register"
            className="text-rose-600 dark:text-rose-400 hover:text-rose-500 font-bold hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
