// src/data/gridConstants.js

export const GRID_DEFINITIONS = {
    "2x2": { columns: 2, imageHeight: "25vh", pageSize: 4 },
    "4x1": { columns: 4, imageHeight: "35vh", pageSize: 4 },
    "3x3": { columns: 3, imageHeight: "15vh", pageSize: 9 },
    "3x3-small": { columns: 3, imageHeight: "10vh", pageSize: 9 },
    "3x3-no-center": { columns: 3, imageHeight: "15vh", pageSize: 8, removeCenter: true },
    "4x4": { columns: 4, imageHeight: "8vh", pageSize: 16 },
  };
  
  // Use this for your Dropdowns
  export const LAYOUT_OPTIONS = [
    { id: "2x2", label: "2×2 Grid" },
    { id: "4x1", label: "4×1 Grid" },
    { id: "3x3", label: "3×3 Grid" },
    { id: "3x3-small", label: "3×3 Small" },
    { id: "3x3-no-center", label: "3×3 No Center" },
    { id: "4x4", label: "4×4 Grid" },
  ];
  
  export const getGridConfig = (layoutId) => {
    return GRID_DEFINITIONS[layoutId] || GRID_DEFINITIONS["2x2"];
  };