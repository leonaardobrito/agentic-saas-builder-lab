/**
 * Service feature — Application layer.
 *
 * Defines the repository port (interface) and use cases.
 */
import type {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
} from '../domain/service';

export interface ServiceRepository {
  create(input: CreateServiceInput, tenantId: string): Promise<Service>;
  findByTenant(tenantId: string): Promise<Service[]>;
  findById(id: string, tenantId: string): Promise<Service | null>;
  update(
    id: string,
    input: UpdateServiceInput,
    tenantId: string
  ): Promise<Service>;
  delete(id: string, tenantId: string): Promise<void>;
}

export async function createService(
  repository: ServiceRepository,
  input: CreateServiceInput,
  tenantId: string
): Promise<Service> {
  return repository.create(input, tenantId);
}

export async function listServices(
  repository: ServiceRepository,
  tenantId: string
): Promise<Service[]> {
  return repository.findByTenant(tenantId);
}

export async function getService(
  repository: ServiceRepository,
  id: string,
  tenantId: string
): Promise<Service | null> {
  return repository.findById(id, tenantId);
}

export async function updateService(
  repository: ServiceRepository,
  input: UpdateServiceInput,
  tenantId: string
): Promise<Service> {
  return repository.update(input.id, input, tenantId);
}

export async function deleteService(
  repository: ServiceRepository,
  id: string,
  tenantId: string
): Promise<void> {
  return repository.delete(id, tenantId);
}
