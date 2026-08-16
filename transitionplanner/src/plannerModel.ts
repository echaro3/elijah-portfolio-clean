export type ExpenseTargetSettings = {
  essentialExpenseTarget: number;
  normalLifestyleTarget: number;
  idealSavingsTarget: number;
};

export function getExpenseTargets(settings: ExpenseTargetSettings) {
  const essential = Math.max(0, settings.essentialExpenseTarget);
  const normal = Math.max(essential, settings.normalLifestyleTarget);
  const ideal = Math.max(normal, settings.idealSavingsTarget);

  return { essential, normal, ideal };
}
