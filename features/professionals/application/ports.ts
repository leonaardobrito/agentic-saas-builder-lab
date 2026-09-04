/**
 * Professional feature — Application layer.
 *
 * Defines the repository port (interface) and use cases.
 * Business logic lives here, never in presentation.
 */
import type { Professional, CreateProfessionalInput, UpdateProfessionalInput } from '../domain/professional';

// --- Repository Port (Interface) -----------------------------------------

export interface ProfessionalRepository {
  /** Creates a new professional within the given tenant. */
  create(
    input: CreateProfessionalInput,
    tenantId: string
  ): Promise<Professional>;

  /** Returns all non-deleted professionals for the tenant. */
  findByTenant(tenantId: string): Promise<Professional[]>;

  /** Finds a single professional by id (within tenant, non-deleted). */
  findById(id: string, tenantId: string): Promise<Professional | null>;

  /** Updates a professional's mutable fields. */
  update(
    id: string,
    input: UpdateProfessionalInput,
    tenantId: string
  ): Promise<Professional>;

  /** Soft-deletes a professional (sets `deleted_at`). */
  delete(id: string, tenantId: string): Promise<void>;
}

// --- Use Cases ------------------------------------------------------------

/**
 * Creates a new Professional.
 *
 * Requires the caller to be authenticated and have a tenant context.
 * The repository is injected, keeping the use case pure and testable.
 */
export async function createProfessional(
  repository: ProfessionalRepository,
  input: CreateProfessionalInput,
  tenantId: string
): Promise<Professional> {
  return repository.create(input, tenantId);
}

/** Lists all active (non-deleted) professionals for the tenant. */
export async function listProfessionals(
  repository: ProfessionalRepository,
  tenantId: string
): Promise<Professional[]> {
  return repository.findByTenant(tenantId);
}

/** Retrieves a single professional by id. */
export async function getProfessional(
  repository: ProfessionalRepository,
  id: string,
  tenantId: string
): Promise<Professional | null> {
  return repository.findById(id, tenantId);
}

/** Updates a professional's fields. */
export async function updateProfessional(
  repository: ProfessionalRepository,
  input: UpdateProfessionalInput,
  tenantId: string
): Promise<Professional> {
  return repository.update(input.id, input, tenantId);
}

/** Soft-deletes a professional. */
export async function deleteProfessional(
  repository: ProfessionalRepository,
  id: string,
  tenantId: string
): Promise<void> {
  return repository.delete(id, tenantId);
}
