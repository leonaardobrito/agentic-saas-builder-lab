/**
 * Customers management page.
 *
 * Server Component — fetches the customer list for the current tenant
 * and renders a client-side form for creation.
 */
import { listCustomersAction } from '@/features/customers/presentation/actions';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/auth/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { CustomerForm } from '@/features/customers/presentation/components/customer-form';

export default async function CustomersPage() {
  const supabase = await createServerClient();
  const ctx = await getTenantContext(supabase);

  const canManage = ctx && ['owner', 'admin', 'manager'].includes(ctx.role);

  const result = await listCustomersAction();
  const customers = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
      </div>

      {canManage && <CustomerForm mode="create" />}

      {customers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-500">Nenhum cliente cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((cust) => (
            <Card key={cust.id}>
              <CardHeader>
                <CardTitle>{cust.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {cust.email && `E-mail: ${cust.email} | `}
                  {cust.phone && `Tel: ${cust.phone} | `}
                  {cust.cpf && `CPF: ${cust.cpf}`}
                </p>
                <p className="text-sm text-slate-500">
                  Status: {cust.active ? 'Ativo' : 'Inativo'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
