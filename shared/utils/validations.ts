/**
 * CPF (Cadastro de Pessoa Física) validation.
 *
 * Uses the modulo-11 check digit algorithm defined by Brazil's Receita Federal.
 * Accepts 11-digit strings containing only numeric characters.
 */

/** Strips non-numeric characters and returns the raw 11-digit string. */
export function normalizeCPF(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Validates a CPF using the modulo-11 check-digit algorithm.
 * Returns `true` if the CPF is structurally valid (correct digits).
 *
 * Note: This does NOT check whether the CPF actually belongs to a real
 * person — only that the check digits are consistent.
 */
export function isValidCPF(cpf: string): boolean {
  const clean = normalizeCPF(cpf);
  if (clean.length !== 11) return false;

  // Reject all-same-digit sequences (e.g., 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // First check digit (position 10)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(clean[9], 10)) return false;

  // Second check digit (position 11)
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(clean[10], 10)) return false;

  return true;
}
