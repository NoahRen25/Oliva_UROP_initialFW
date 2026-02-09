import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";

// imports the CSV content as a plain string at build time
// if no vite, JSON
import csvData from "./memorability_scores.csv?raw";

export function useMemImages() {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    //parse imported string immediately
    const parsed = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // clean headers to remove hidden spaces
    const cleanData = parsed.data.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        newRow[key.trim()] = row[key];
      });
      return newRow;
    });

    setRows(cleanData);
    setReady(true);
    console.log("CSV Data loaded directly from src:", cleanData.length);
  }, []);

  const countInRange = useCallback((min, max) => {
    if (rows.length === 0) return 0;
    return rows.filter((img) => {
      const s = Number(img.score);
      return s >= min && s <= max;
    }).length;
  }, [rows]);

  const sampleInRange = useCallback((min, max, count) => {
    const filtered = rows.filter((img) => {
      const s = Number(img.score);
      return s >= min && s <= max;
    });
    
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [rows]);

  return { ready, rows, countInRange, sampleInRange };
}