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
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const cpf = (formData.get('cpf') as string) || null;
    const birthDate = (formData.get('birthDate') as string) || null;
    const active = formData.get('active') === 'true';

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createCustomerAction({ name, email, phone, cpf, birthDate, active })
          : await updateCustomerAction({
              id: customer!.id,
              name,
              email,
              phone,
              cpf,
              birthDate,
              active,
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
            ? 'Cadastre um novo cliente para seu salão.'
            : 'Atualize as informações deste cliente.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Maria Silva"
              defaultValue={customer?.name}
              required
              disabled={isPending}
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="00000000000"
                defaultValue={customer?.cpf ?? undefined}
                disabled={isPending}
                maxLength={11}
                pattern="[0-9]{11}"
              />
              <p className="text-xs text-slate-500">
                Apenas números, sem pontos ou traços
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

          <div className="flex items-center gap-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              value="true"
              defaultChecked={customer ? customer.active : true}
              disabled={isPending}
            />
            <Label htmlFor="active" className="text-sm">
              Ativo
            </Label>
          </div>

          {error && (
            <div
              className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800"
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
