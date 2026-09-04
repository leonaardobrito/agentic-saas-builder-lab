/**
 * Service Form — client component for creating/editing services.
 *
 * Follows the same pattern as the login page: `useTransition` with
 * Server Actions and inline error display.
 */
'use client';

import { useTransition, useState } from 'react';
import {
  createServiceAction,
  updateServiceAction,
} from '@/features/services/presentation/actions';
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
import type { Service } from '@/features/services/domain/service';

interface ServiceFormProps {
  mode?: 'create' | 'edit';
  service?: Service;
}

export function ServiceForm({
  mode = 'create',
  service,
}: ServiceFormProps = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const category = (formData.get('category') as string) || null;
    const price = Number(formData.get('price'));
    const durationMinutes = Number(formData.get('durationMinutes'));
    const active = formData.get('active') === 'true';

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createServiceAction({ name, category, price, durationMinutes, active })
          : await updateServiceAction({
              id: service!.id,
              name,
              category,
              price,
              durationMinutes,
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
          {mode === 'create' ? 'Novo Serviço' : 'Editar Serviço'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Cadastre um novo serviço para seu catálogo.'
            : 'Atualize as informações deste serviço.'}
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
              placeholder="Corte de Cabelo"
              defaultValue={service?.name}
              required
              disabled={isPending}
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              name="category"
              type="text"
              placeholder="Cabelo"
              defaultValue={service?.category ?? undefined}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)*</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={service?.price}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duração (min)*</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                step="1"
                min="15"
                placeholder="60"
                defaultValue={service?.durationMinutes}
                required
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
              defaultChecked={service ? service.active : true}
              disabled={isPending}
            />
            <Label htmlFor="active" className="text-sm">
              Ativo
            </Label>
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
