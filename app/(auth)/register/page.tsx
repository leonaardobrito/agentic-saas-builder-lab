'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
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
          <UserPlus className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Criar Conta
        </CardTitle>
        <CardDescription>
          Preencha os dados abaixo para criar sua conta e comecar a usar o StyleFlow
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
            <Label htmlFor="tenantName">Nome do Salao</Label>
            <Input
              id="tenantName"
              name="tenantName"
              type="text"
              placeholder="Salao da Maria"
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apenas numeros, sem pontos ou tracos
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minimo de 6 caracteres
            </p>
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
            {isPending ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Ja tem uma conta?{' '}
          <Link
            href="/login"
            className="text-rose-600 dark:text-rose-400 hover:text-rose-500 font-bold hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
