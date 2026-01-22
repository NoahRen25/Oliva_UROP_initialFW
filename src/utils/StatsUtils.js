export const calculateStats = (values) => {
    if (!values || values.length === 0) return { mean: 0, median: 0, stdDev: 0, count: 0, histogram: {} };
  
    const count = values.length;
    
    // Mean
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
  
    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  
    // Std. Dev
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(avgSquareDiff);
  
    // Histogram
    const histogram = {};
    values.forEach(v => {
      histogram[v] = (histogram[v] || 0) + 1;
    });
  
    return {
      mean: mean.toFixed(2),
      median: median,
      stdDev: stdDev.toFixed(2),
      count,
      histogram
    };
  };