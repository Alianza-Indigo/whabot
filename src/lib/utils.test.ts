import { describe, expect, it } from 'vitest';
import { compactJson, formatPercent, parseJsonObject, safeErrorMessage } from './utils';

describe('utility helpers', () => {
  it('formats percentages with rounded whole values', () => {
    expect(formatPercent(0.864)).toBe('86%');
  });

  it('parses JSON objects and rejects arrays', () => {
    expect(parseJsonObject('{"temperature":0.2}')).toEqual({ temperature: 0.2 });
    expect(() => parseJsonObject('[]')).toThrow('Debe ser un objeto JSON');
  });

  it('compacts invalid values safely', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(compactJson(circular)).toBe('{}');
  });

  it('sanitizes unknown errors', () => {
    expect(safeErrorMessage('boom')).toBe('No se pudo completar la operacion');
    expect(safeErrorMessage(new Error('No autorizado'))).toBe('No autorizado');
  });
});
