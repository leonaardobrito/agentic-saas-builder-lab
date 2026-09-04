/**
 * Customer Form — client component for creating/editing customers.
 *
 * Uses Server Actions via `useTransition` for consistent error handling.
 */
'use client';

import { useTransition, useState } from 'react';
import {
  createCustomerAction,
  updateCustomerAction,
} from '@/features/customers/presentation/actions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import type { Customer } from '@/features/customers/domain/customer';

interface CustomerFormProps {
  mode?: 'create' | 'edit';
  customer?: Customer;
}

export function CustomerForm({
  mode = 'create',
  customer,
}: CustomerFormProps = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = (formData.get('email') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const cpf = formData.get('cpf') as string;
    const birthDate = (formData.get('birthDate') as string) || null;
    const status = (formData.get('status') as string) || 'active';

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createCustomerAction({ fullName, email, phone, cpf, birthDate, status })
          : await updateCustomerAction({
              id: customer!.id,
              fullName,
              email,
              phone,
              cpf,
              birthDate,
              status,
            });

      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Cadastre um novo cliente para seu salao.'
            : 'Atualize as informacoes deste cliente.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Maria Silva"
              defaultValue={customer?.fullName}
              required
              disabled={isPending}
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@email.com"
                defaultValue={customer?.email ?? undefined}
                disabled={isPending}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+5511999999999"
                defaultValue={customer?.phone ?? undefined}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="00000000000"
                defaultValue={customer?.cpf}
                required
                disabled={isPending}
                maxLength={11}
                pattern="[0-9]{11}"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apenas numeros, sem pontos ou tracos (11 digitos)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={customer?.birthDate ?? undefined}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={customer?.status ?? 'active'}
              disabled={isPending}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-600 disabled:pointer-events-none disabled:opacity-50"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>

          {error && (
            <div
              className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? 'Salvando...'
              : mode === 'create'
                ? 'Cadastrar'
                : 'Atualizar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
