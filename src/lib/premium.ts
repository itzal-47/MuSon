export function isPremiumActive(premiumUntil: string | null | undefined): boolean {
  if (!premiumUntil) return false;
  return new Date(premiumUntil).getTime() > Date.now();
}
