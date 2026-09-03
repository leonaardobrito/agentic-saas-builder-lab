/**
 * Customer feature — Application layer.
 *
 * Defines the repository port (interface) and use cases.
 */
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../domain/customer';

export interface CustomerRepository {
  create(input: CreateCustomerInput, tenantId: string): Promise<Customer>;
  findByTenant(tenantId: string): Promise<Customer[]>;
  findById(id: string, tenantId: string): Promise<Customer | null>;
  update(
    id: string,
    input: UpdateCustomerInput,
    tenantId: string
  ): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<void>;
  search(term: string, tenantId: string): Promise<Customer[]>;
}

export async function createCustomer(
  repository: CustomerRepository,
  input: CreateCustomerInput,
  tenantId: string
): Promise<Customer> {
  return repository.create(input, tenantId);
}

export async function listCustomers(
  repository: CustomerRepository,
  tenantId: string
): Promise<Customer[]> {
  return repository.findByTenant(tenantId);
}

export async function getCustomer(
  repository: CustomerRepository,
  id: string,
  tenantId: string
): Promise<Customer | null> {
  return repository.findById(id, tenantId);
}

export async function updateCustomer(
  repository: CustomerRepository,
  input: UpdateCustomerInput,
  tenantId: string
): Promise<Customer> {
  return repository.update(input.id, input, tenantId);
}

export async function deleteCustomer(
  repository: CustomerRepository,
  id: string,
  tenantId: string
): Promise<void> {
  return repository.delete(id, tenantId);
}

export async function searchCustomers(
  repository: CustomerRepository,
  term: string,
  tenantId: string
): Promise<Customer[]> {
  return repository.search(term, tenantId);
}
