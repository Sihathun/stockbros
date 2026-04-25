export function calculateTrend(latest, past) {
  return ((latest - past) / past) * 100;
}