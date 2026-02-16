import React from "react";
import { Link } from "react-router-dom";
import {
  Container, Typography, Card, CardActionArea, CardContent, Box,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsightsIcon from "@mui/icons-material/Insights";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorageIcon from "@mui/icons-material/Storage";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

export default function Home() {
  const menuItems = [
    {
      title: "Upload Config",
      description: "JSON config for any mode (grid, individual, pairwise, ranked)",
      path: "/rate/upload",
      icon: <CloudUploadIcon fontSize="large" />,
      color: "#9c27b0",
    },
    {
      title: "Grid Results",
      description: "Grid layout & combo protocol results",
      path: "/grid-results",
      icon: <InsightsIcon fontSize="large" />,
      color: "#1976d2",
    },
    {
      title: "Mode Results",
      description: "Individual, pairwise, ranked & best-worst results",
      path: "/mode-results",
      icon: <CompareArrowsIcon fontSize="large" />,
      color: "#2e7d32",
    },
    {
      title: "Combo Protocol",
      description: "33-image fixed protocol",
      path: "/combo-rate",
      icon: <AutoAwesomeIcon fontSize="large" />,
      color: "#ff9800",
    },
    {
      title: "Pressure Cooker",
      description: "Timed pairwise challenge",
      path: "/pressure-cooker",
      icon: <LocalFireDepartmentIcon fontSize="large" />,
      color: "#d32f2f",
    },
    {
      title: "Eye Tracking",
      description: "WebGazer calibration & gaze test",
      path: "/webgazer-calibration",
      icon: <VisibilityIcon fontSize="large" />,
      color: "#7b1fa2",
    },
    {
      title: "Dataset Manager",
      description: "Upload and manage image datasets",
      path: "/dataset-manager",
      icon: <StorageIcon fontSize="large" />,
      color: "#1565c0",
    },
  ];

  return (
    <Box justifyContent="center">
      <Container maxWidth="lg" sx={{ mt: { xs: 6, sm: 8, md: 12, lg: 16 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            OlivaGroupFW
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Image Rating Research Platform
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            justifyContent: "center",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          {menuItems.map((item) => (
            <Card
              key={item.path}
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "0.2s",
                "&:hover": { boxShadow: 10, transform: "translateY(-5px)" },
              }}
            >
              <CardActionArea
                component={Link}
                to={item.path}
                sx={{
                  height: "100%",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    color: item.color,
                  }}
                >
                  {item.icon}
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}