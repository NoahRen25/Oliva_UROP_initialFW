# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oliva is a React-based user research framework for evaluating AI-generated images through multiple comparison methodologies. It's a full frontend application with no backend - all data persists in browser localStorage.

## Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

### Tech Stack
- React 19 with Vite
- React Router DOM for client-side routing
- Material-UI (MUI) for components and theming
- Browser localStorage for data persistence
- Web Speech API for voice recording

### Key Files

**State Management**: `src/Results.jsx` - React Context providing global state for all session data (individual, group, pairwise, ranked, pressure-cooker, transcripts). Uses a custom `useLocalStorage` hook for persistence. This is the central data layer.

**Routing**: `src/App.jsx` - Contains all route definitions and MUI theme configuration.

**Rating Pages**: `src/Webpages/` - Each rating mode has a Rate page (data collection) and Result page (analysis):
- `IndividualRate.jsx` / `IndividualResult.jsx` - Single image 1-5 scoring
- `PairwiseRate.jsx` / `PairwiseResult.jsx` - A vs B comparison
- `RankedRate.jsx` / `RankedResult.jsx` - Rank 3 images as 1st/2nd/3rd
- `PressureCooker.jsx` - Timed rapid-fire pairwise (3-second limit)
- `GroupRate.jsx` / `GroupResult.jsx` - Team collaborative ratings

**Shared Components**: `src/components/`
- `VoiceRecorder.jsx` - Web Speech API integration with timer
- `ScoreSlider.jsx` - Rating slider (1-5)
- `StatsSummary.jsx` - Mean, median, std dev, histogram visualization
- `ExportCSVButton.jsx` - CSV download utility

**Statistics**: `src/utils/StatsUtils.js` - Statistical calculations (mean, median, standard deviation)

### Data Flow

1. User enters username on rating page
2. Ratings/choices stored via Results Context
3. Context automatically persists to localStorage
4. Results pages read from context and display statistics
5. CSV export available for all data types

### localStorage Keys
- `app_individual`, `app_group`, `app_pairwise`, `app_ranked`, `app_transcripts`, `app_announcing`

### Test Images

Located in `src/images/` - AI-generated images from three models (GPT, Flux, Nano) across three prompts (Moon Flags, Ship, Row of Flags).
