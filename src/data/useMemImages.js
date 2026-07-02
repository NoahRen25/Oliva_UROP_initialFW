/**
 * useMemImages.js — Hook exposing the memorability image dataset.
 *
 * Parses src/data/memorability_scores.csv (bundled at build time) into rows
 * of { path, score, ... }, rewriting each path to a Supabase `mem-images`
 * bucket URL (or local /mem_images/ fallback). Grid rating modes use
 * countInRange/sampleInRange to pick N random images within a target
 * memorability-score band (e.g. 0.4–0.8).
 */
import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { getImageUrl } from "../utils/supabaseImageUrl";

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

    // clean headers to remove hidden spaces and convert paths to Supabase URLs
    const cleanData = parsed.data.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        newRow[key.trim()] = row[key];
      });
      // Transform path: "mem_images/target_000000.jpg" → Supabase URL or local "/mem_images/..."
      if (newRow.path) {
        const filename = newRow.path.replace(/^mem_images\//, "");
        newRow.path = getImageUrl("mem-images", filename);
      }
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