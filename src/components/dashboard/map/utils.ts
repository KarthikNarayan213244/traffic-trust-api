
// Helper function to generate a marker color based on trust score
export const getTrustScoreColor = (score: number) => {
  if (score >= 90) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "red";
};
