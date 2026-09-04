/**
 * ProfessionalForm — client component for creating/editing professionals.
 *
 * Uses Next.js Server Actions via `useTransition` for optimistic
 * updates and error display, following the same pattern as the login page.
 */
'use client';

import { useTransition, useState } from 'react';
import {
  createProfessionalAction,
  updateProfessionalAction,
} from '@/features/professionals/presentation/actions';
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
import type { Professional } from '@/features/professionals/domain/professional';

interface ProfessionalFormProps {
  mode?: 'create' | 'edit';
  professional?: Professional;
}

export function ProfessionalForm({
  mode = 'create',
  professional,
}: ProfessionalFormProps = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const userId = (formData.get('userId') as string) || null;
    const active = formData.get('active') === 'true';

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createProfessionalAction({ name, userId, active })
          : await updateProfessionalAction({
              id: professional!.id,
              name,
              userId: userId || undefined,
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
          {mode === 'create' ? 'Novo Profissional' : 'Editar Profissional'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Cadastre um novo profissional para seu salão.'
            : 'Atualize as informações deste profissional.'}
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
              placeholder="João Silva"
              defaultValue={professional?.name}
              required
              disabled={isPending}
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">Usuário (opcional)</Label>
            <Input
              id="userId"
              name="userId"
              type="text"
              placeholder="UUID do usuário"
              defaultValue={professional?.userId ?? undefined}
              disabled={isPending}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deixe em branco para profissionais sem login
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              value="true"
              defaultChecked={professional ? professional.active : true}
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
