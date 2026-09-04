/**
 * Customers management page.
 *
 * Server Component — fetches the customer list for the current tenant
 * and renders a client-side form for creation.
 */
import { listCustomersAction } from '@/features/customers/presentation/actions';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/auth/context';
import { Card, CardContent } from '@/shared/ui/card';
import { CustomerForm } from '@/features/customers/presentation/components/customer-form';
import { EmptyState } from '@/shared/ui/empty-state';
import { Users } from 'lucide-react';

export default async function CustomersPage() {
  const supabase = await createServerClient();
  const ctx = await getTenantContext(supabase);

  const canManage = ctx && ['owner', 'admin', 'manager'].includes(ctx.role);

  const result = await listCustomersAction();
  const customers = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Clientes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie a base de clientes do seu salao.
        </p>
      </div>

      {canManage && <CustomerForm mode="create" />}

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Comece cadastrando seu primeiro cliente para gerenciar o historico e agendamentos."
        />
      ) : (
        <div className="space-y-3">
          {customers.map((cust) => (
            <Card key={cust.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {cust.fullName}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {cust.email && `E-mail: ${cust.email}`}
                      {cust.email && cust.phone && ' | '}
                      {cust.phone && `Tel: ${cust.phone}`}
                      {(cust.email || cust.phone) && cust.cpf && ' | '}
                      {cust.cpf && `CPF: ${cust.cpf}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                      cust.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : cust.status === 'blocked'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cust.status === 'active' ? 'Ativo' : cust.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
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
