// AHP Calculation Helper
export function calculateAHPWeights(matrix) {
  const n = matrix.length;
  let colSums = new Array(n).fill(0);
  
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  let normalizedMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  let weights = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      normalizedMatrix[i][j] = matrix[i][j] / colSums[j];
      rowSum += normalizedMatrix[i][j];
    }
    weights[i] = rowSum / n;
  }

  return weights;
}
