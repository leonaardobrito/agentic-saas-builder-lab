import { describe, it, expect } from 'vitest';
import { normalizeCPF, isValidCPF } from '../validations';

describe('normalizeCPF', () => {
  it('should strip non-numeric characters', () => {
    expect(normalizeCPF('123.456.789-09')).toBe('12345678909');
  });

  it('should return the same string if already numeric', () => {
    expect(normalizeCPF('12345678909')).toBe('12345678909');
  });
});

describe('isValidCPF', () => {
  it('should accept a structurally valid CPF', () => {
    // 529.982.247-25 — a known valid CPF
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('should accept a valid CPF with formatting', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('should reject CPF with all same digits', () => {
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('11111111111')).toBe(false);
    expect(isValidCPF('99999999999')).toBe(false);
  });

  it('should reject CPF with wrong check digits', () => {
    // Last digit changed from 5 to 6
    expect(isValidCPF('52998224726')).toBe(false);
  });

  it('should reject CPF with fewer than 11 digits', () => {
    expect(isValidCPF('1234567890')).toBe(false);
  });

  it('should reject CPF with more than 11 digits', () => {
    expect(isValidCPF('123456789012')).toBe(false);
  });

  it('should reject CPF with letters', () => {
    expect(isValidCPF('1234567890A')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidCPF('')).toBe(false);
  });
});