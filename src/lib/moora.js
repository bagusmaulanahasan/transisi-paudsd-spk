// MOORA Calculation Engine
export function calculateMOORA(students, assessments, criteriaWeights, indicators) {
  if (!students.length || !criteriaWeights.length) return []

  // Group indicators by criterion
  const criteriaMap = {} // criterion_id -> [indicator_ids]
  indicators.forEach(ind => {
    if (!criteriaMap[ind.criterion_id]) criteriaMap[ind.criterion_id] = []
    criteriaMap[ind.criterion_id].push(ind.id)
  });

  const criterionIds = Object.keys(criteriaMap).sort(); // 6 criteria (C1-C6)

  // 1. Calculate average score per criterion for each student
  // formula: (total jumlah skor) / (total jumlah pertanyaan)
  let decisionMatrix = students.map(student => {
    let scores = {}
    criterionIds.forEach(critId => {
      const inds = criteriaMap[critId]
      let sum = 0
      let count = 0
      inds.forEach(indId => {
        const key = `${student.id}_${indId}`
        if (assessments[key] !== undefined) {
          sum += assessments[key]
          count++
        }
      })
      scores[critId] = count > 0 ? sum / count : 3.00 // default max if empty
    })
    return { student, scores }
  })

  // 2. Normalization (Denominator: square root of sum of squares per criterion)
  let denominators = {}
  criterionIds.forEach(critId => {
    let sumSq = 0
    decisionMatrix.forEach(row => {
      sumSq += Math.pow(row.scores[critId], 2)
    })
    denominators[critId] = Math.sqrt(sumSq) || 1
  })

  let normalizedMatrix = decisionMatrix.map(row => {
    let normScores = {}
    criterionIds.forEach(critId => {
      normScores[critId] = row.scores[critId] / denominators[critId]
    })
    return { student: row.student, scores: row.scores, normScores }
  })

  // 3. Weighted Normalized Matrix & Optimization Yi = Sum(weight * normScore)
  // All criteria in SPK PAUD-SD are benefit (higher is better or lower? wait, score 1 = sudah bisa, 3 = belum bisa. 
  // Let's check spec: higher score means need more stimulation or lower? 
  // Spec: Kategori Rendah (1.00-1.66), Sedang (1.67-2.33), Tinggi (2.34-3.00). 
  // Skor 3 = Belum bisa (kebutuhan stimulasi tinggi). MOORA optimization: Yi = Benefit - Cost. All criteria here represent needs/scores.
  let results = normalizedMatrix.map((row, idx) => {
    let yi = 0
    criterionIds.forEach((critId, cIdx) => {
      const weight = criteriaWeights[cIdx] || (1 / 6)
      yi += row.normScores[critId] * weight
    })
    return {
      student_id: row.student.id,
      student_name: row.student.full_name,
      nisn: row.student.nisn,
      gender: row.student.gender,
      scores: row.scores,
      yi
    }
  })

  // Sort descending by Yi score for ranking
  results.sort((a, b) => b.yi - a.yi)

  // 4. Classification using Interval (I = (ymax - ymin) / 3)
  const ymax = results.length > 0 ? results[0].yi : 0
  const ymin = results.length > 0 ? results[results.length - 1].yi : 0
  const k = 3
  const I = (ymax - ymin) / k

  results = results.map((res, index) => {
    let category = "Rendah"
    if (res.yi >= ymin && res.yi < (ymin + I)) {
      category = "Rendah"
    } else if (res.yi >= (ymin + I) && res.yi < (ymin + 2 * I)) {
      category = "Sedang"
    } else {
      category = "Tinggi"
    }

    return {
      ...res,
      rank: index + 1,
      category
    }
  })

  return results
}
