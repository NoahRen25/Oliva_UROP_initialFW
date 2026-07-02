#!/usr/bin/env python3
"""
transcribe_recordings.py — Batch speech-to-text for downloaded session
audio. Points OpenAI Whisper at a folder of .webm recordings (e.g. pulled
from the session-audio Supabase bucket), transcribes each, and writes a CSV
of (recording label, duration, transcript). Run:
    python transcribe_recordings.py <folder> [--model base] [--out out.csv]
Requires: pip install openai-whisper (plus ffmpeg on PATH).
"""
import ssl
ssl._create_default_https_context = ssl._create_unverified_context


import argparse
import csv
import os
import re
import sys
import time


def parse_filename(filename):
    """Extract page/pair info from recording filename."""
    name = os.path.splitext(filename)[0]
    # Patterns: recording_Pair_1, recording_Page_2, recording_Benchmark, recording_Trial_3
    match = re.match(r"recording_(.+)", name)
    if match:
        label = match.group(1).replace("_", " ")
    else:
        label = name
    return label


def format_duration(seconds):
    """Format seconds as mm:ss."""
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m:02d}:{s:02d}"


def main():
    parser = argparse.ArgumentParser(
        description="Batch-transcribe .webm recordings using OpenAI Whisper"
    )
    parser.add_argument(
        "folder",
        help="Path to folder containing .webm recordings",
    )
    parser.add_argument(
        "--model",
        default="base",
        choices=["tiny", "base", "small", "medium", "large"],
        help="Whisper model size (default: base). Larger = more accurate but slower.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV path (default: <folder>/transcripts.csv)",
    )
    parser.add_argument(
        "--txt",
        action="store_true",
        help="Also write individual .txt files next to each .webm",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="Language code (e.g. 'en'). Auto-detected if not set.",
    )
    args = parser.parse_args()

    # Validate folder
    if not os.path.isdir(args.folder):
        print(f"Error: '{args.folder}' is not a directory.")
        sys.exit(1)

    # Find .webm files
    webm_files = sorted(
        f for f in os.listdir(args.folder) if f.lower().endswith(".webm")
    )
    if not webm_files:
        print(f"No .webm files found in '{args.folder}'.")
        sys.exit(0)

    print(f"Found {len(webm_files)} recording(s) in '{args.folder}'")
    print(f"Loading Whisper model '{args.model}'...")

    try:
        import whisper
    except ImportError:
        print("\nError: openai-whisper is not installed.")
        print("Install it with: pip install openai-whisper")
        print("You also need ffmpeg installed on your system.")
        sys.exit(1)

    model = whisper.load_model(args.model)
    print(f"Model loaded. Starting transcription...\n")

    # Process each file
    results = []
    total_start = time.time()

    for i, filename in enumerate(webm_files, 1):
        filepath = os.path.join(args.folder, filename)
        label = parse_filename(filename)
        file_start = time.time()

        print(f"[{i}/{len(webm_files)}] {filename} ({label})...", end=" ", flush=True)

        try:
            transcribe_opts = {}
            if args.language:
                transcribe_opts["language"] = args.language

            result = model.transcribe(filepath, **transcribe_opts)
            text = result["text"].strip()
            language = result.get("language", "unknown")

            # Calculate duration from segments
            segments = result.get("segments", [])
            duration = segments[-1]["end"] if segments else 0

            results.append({
                "filename": filename,
                "label": label,
                "transcript": text,
                "duration_sec": round(duration, 1),
                "duration_fmt": format_duration(duration),
                "language": language,
                "word_count": len(text.split()) if text else 0,
            })

            # Write individual .txt if requested
            if args.txt:
                txt_path = os.path.splitext(filepath)[0] + ".txt"
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(text)

            elapsed = time.time() - file_start
            preview = text[:80] + "..." if len(text) > 80 else text
            print(f"done ({elapsed:.1f}s) — {preview or '(silence)'}")

        except Exception as e:
            print(f"FAILED: {e}")
            results.append({
                "filename": filename,
                "label": label,
                "transcript": f"[ERROR: {e}]",
                "duration_sec": 0,
                "duration_fmt": "00:00",
                "language": "unknown",
                "word_count": 0,
            })

    # Write CSV
    output_path = args.output or os.path.join(args.folder, "transcripts.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["filename", "label", "transcript", "duration_sec",
                         "duration_fmt", "language", "word_count"],
        )
        writer.writeheader()
        writer.writerows(results)

    total_elapsed = time.time() - total_start
    total_words = sum(r["word_count"] for r in results)

    print(f"\n{'='*60}")
    print(f"Transcription complete!")
    print(f"  Files processed: {len(results)}")
    print(f"  Total words:     {total_words}")
    print(f"  Total time:      {format_duration(total_elapsed)}")
    print(f"  CSV saved to:    {output_path}")
    if args.txt:
        print(f"  .txt files:      written next to each .webm")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()