export type CoreProfileInputs = {
  photoUrl?: string | null;
  location?: string | null;
  phone?: string | null;
};

export type CompletionResult = {
  completed: number;
  total: number;
  percent: number;
  flags: { photo: boolean; location: boolean; phone: boolean };
};

// Compute core profile completion across multiple candidate sources.
// Any truthy value among candidates counts as completed for that field.
export function computeCoreProfileCompletion(
  candidates: CoreProfileInputs[]
): CompletionResult {
  const pick = (key: keyof CoreProfileInputs) =>
    candidates.some((c) => {
      const v = c?.[key];
      return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
    });

  const photo = pick('photoUrl');
  const location = pick('location');
  const phone = pick('phone');

  const flags = { photo, location, phone };
  const checks = [photo, location, phone];
  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);

  return { completed, total, percent, flags };
}
