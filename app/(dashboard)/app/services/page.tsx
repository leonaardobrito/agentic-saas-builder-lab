/**
 * Services management page.
 *
 * Server Component — fetches the service list for the current tenant
 * and renders a client-side form for creation.
 */
import { listServicesAction } from '@/features/services/presentation/actions';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/auth/context';
import { Card, CardContent } from '@/shared/ui/card';
import { ServiceForm } from '@/features/services/presentation/components/service-form';
import { EmptyState } from '@/shared/ui/empty-state';
import { Scissors } from 'lucide-react';

export default async function ServicesPage() {
  const supabase = await createServerClient();
  const ctx = await getTenantContext(supabase);

  const canManage = ctx && ['owner', 'admin', 'manager'].includes(ctx.role);

  const result = await listServicesAction();
  const services = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Servicos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catalogo de servicos, precos e duracoes.
        </p>
      </div>

      {canManage && <ServiceForm mode="create" />}

      {services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum servico cadastrado"
          description="Cadastre os servicos do seu catalogo com precos e duracoes."
        />
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <Card key={svc.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {svc.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {svc.category && `${svc.category} | `}
                      R$ {svc.price.toFixed(2)} | {svc.durationMinutes} min
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                      svc.active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {svc.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
