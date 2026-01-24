import Papa from "papaparse";
import csv1Text from "../data/prompts_flux_2_pro.csv?raw";
import csv2Text from "../data/prompts_gpt-image-1.5.csv?raw";
import csv3Text from "../data/prompts_nano_banana_pro.csv?raw";

const FOLDER_PATHS = {
  1: "/public/images/flux_2_pro",
  2: "/public/images/gptimage15",
  3: "/public/images/nano_banana_pro",
};

// parse single csv
const parseCSV = (csvString, folderId) => {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => {
    const rawFilename = row.Output_Filename || row.output_filename || ""; 
    const cleanFilename = rawFilename.split("/").pop(); 

    return {
      category: row.Category || row.category || "Uncategorized",
      prompt: row.prompt_text || row.prompt_text || "No prompt available",
      filename: cleanFilename,
      folderId: folderId,
      src: `${FOLDER_PATHS[folderId]}/${cleanFilename}`,
    };
  });
};

const data1 = parseCSV(csv1Text, 1);
const data2 = parseCSV(csv2Text, 2);
const data3 = parseCSV(csv3Text, 3);

// combine into one big array
const ALL_DATA = [...data1, ...data2, ...data3];

// organized for ranked/pairwise
// format: { "generated_001.png": { 1: corr. img, 2: corr. img, 3: corr. img } }
const BY_FILENAME = {};

ALL_DATA.forEach((item) => {
  if (!BY_FILENAME[item.filename]) {
    BY_FILENAME[item.filename] = {};
  }
  BY_FILENAME[item.filename][item.folderId] = item;
});

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];


//randomly go through 3 folders
export const getIndividualBatch = (count = 5) => {
  const batch = [];
  for (let i = 0; i < count; i++) {
    // pick random image
    const item = getRandomItem(ALL_DATA);
    
    batch.push({
      id: i,
      src: item.src,
      prompt: item.prompt,
      category: item.category,
      filename: item.src.slice(15),
      alt: `Folder ${item.folderId} - ${item.filename}`,
      folderId: item.folderId,
    });
  }
  return batch;
};

//4 random images from same category
export const getGroupBatch = (count = 1) => {
  // get list of unique categories
  const categories = [...new Set(ALL_DATA.map((d) => d.category))];
  
  const batch = [];
  for (let i = 0; i < count; i++) {
    // pick random category
    const selectedCat = getRandomItem(categories);
    
    // filter all data for  category
    const candidates = ALL_DATA.filter((d) => d.category === selectedCat);

//randomly pick 4
    const shuffled = candidates.sort(() => 0.5 - Math.random());
    const selectedImages = shuffled.slice(0, 4);

    const groupImages = selectedImages.map((img, idx) => ({
      id: `g_${i}_${idx}`,
      src: img.src,
      prompt: img.prompt,
      filename: img.src.slice(15),
      alt: `Img ${idx + 1}`,
    }));

    batch.push({
      sessionId: i,
      category: selectedCat,
      images: groupImages,
    });
  }
  return batch;
};

//2 images, same filename, diff folders
export const getPairwiseBatch = (count = 5) => {
  const batch = [];
  const filenames = Object.keys(BY_FILENAME);

  for (let i = 0; i < count; i++) {
    // pick random file
    const fname = getRandomItem(filenames);
    const variants = BY_FILENAME[fname];

    // make sure 2 folders
    const availableFolders = Object.keys(variants).map(Number);
    if (availableFolders.length < 2) {
      i--; 
      continue;
    }

    // pick 2 diff folders
    const folderA = getRandomItem(availableFolders);
    let folderB = getRandomItem(availableFolders);
    while (folderB === folderA) {
      folderB = getRandomItem(availableFolders);
    }

    const itemA = variants[folderA];
    const itemB = variants[folderB];

    batch.push({
      id: i,
      prompt: itemA.prompt, 
      left: { 
        src: itemA.src, 
        alt: `Model ${folderA}`, 
        filename: itemA.src.slice(15),
        folderId: folderA 
      },
      right: { 
        src: itemB.src, 
        alt: `Model ${folderB}`, 
        filename: itemB.src.slice(15),
        folderId: folderB 
      },
    });
  }
  return batch;
};

//3 images, same filename, one from each folder

export const getRankedBatch = (count = 3) => {
  const batch = [];
  const filenames = Object.keys(BY_FILENAME);

  for (let i = 0; i < count; i++) {
    //pick random filename
    const fname = getRandomItem(filenames);
    const variants = BY_FILENAME[fname];

    //ensure all 3 folders
    if (!variants[1] || !variants[2] || !variants[3]) {
        i--;
        continue;
    }

    batch.push({
      groupId: i,
      prompt: variants[1].prompt,
      images: [
        { id: `r${i}_1`, src: variants[1].src, filename: variants[1].src.slice(15), alt: "Folder 1", folderId: 1 },
        { id: `r${i}_2`, src: variants[2].src, filename: variants[2].src.slice(15),alt: "Folder 2", folderId: 2 },
        { id: `r${i}_3`, src: variants[3].src, filename: variants[3].src.slice(15), alt: "Folder 3", folderId: 3 },
      ]
    });
  }
  return batch;
};