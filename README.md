Current without any API, in order to run react and everything, including MUI, need to install some stuff

Check for node first:
Run the following in terminal
node -v

If error, then you don't have node installed

If you don't go to nodejs.org and install the corresponding version to your computer. If you already have it, skip this step (gives you version)

Assuming you don't already have MUI components installed yet (If you've used before, you might have), run the following command in terminal:

npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom

Note: If you have some installed already, e.g react-router-dom, then just remove that from the install



Next: If we end up using Google API:

Create a new .env folder that's on the SAME LEVEL as src (outside src in other words, create off proj folder)

VITE_GOOGLE_API_KEY={API_KEY}

To generate the API Key, go to console.cloud.google.com

Then, create a new project, download Google Drive and Google Sheets for the project, and create the API key. Copy the API Key into {API_KEY} without the {} and everything should work!

