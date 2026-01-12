import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { ResultsProvider } from "./Results"; 

import Home from "./Webpages/Home";
import CombinedResult from "./Webpages/CombinedResult";
import GroupResult from "./Webpages/GroupResult";
import GroupRate from "./Webpages/GroupRate";
import IndividualRate from "./Webpages/IndividualRate";
import IndividualResult from "./Webpages/IndividualResult";
import PairwiseRate from "./Webpages/PairwiseRate";
import RankedRate from "./Webpages/RankedRate";
import PairwiseResult from "./Webpages/PairwiseResult";
import RankedResult from "./Webpages/RankedResult";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#f5f5f5" },
  },
});

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {/* Wrap everything in ResultsProvider */}
      <ResultsProvider>
        <Router>
          <AppBar position="fixed" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                OlivaGroupFW
              </Typography>
              <Button startIcon={<HomeIcon />} component={Link} to="/" color="inherit">
                Dashboard
              </Button>
            </Toolbar>
          </AppBar>
          
          {/* Add padding top to account for fixed AppBar */}
          <div style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/combined-result" element={<CombinedResult />} />
              <Route path="/group-result" element={<GroupResult />} />
              <Route path="/group-rate" element={<GroupRate />} />
              <Route path="/individual-result" element={<IndividualResult />} />
              <Route path="/individual-rate" element={<IndividualRate />} />
              <Route path="/pairwise-rate" element={<PairwiseRate />} />
              <Route path="/ranked-rate" element={<RankedRate />} />
              <Route path="/pairwise-result" element={<PairwiseResult />} />
              <Route path="/ranked-result" element={<RankedResult />} />

            </Routes>
          </div>
        </Router>
      </ResultsProvider>
    </ThemeProvider>
  );
}

export default App;