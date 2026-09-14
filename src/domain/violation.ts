// Violation typée d'une règle du domaine. Les codes sont stables ; aucune correction silencieuse (P11 × P13).
export type DomainViolation = {
  code: string;
  path: string;
  message: string;
};

export const violation = (code: string, path: string, message: string): DomainViolation => ({ code, path, message });
