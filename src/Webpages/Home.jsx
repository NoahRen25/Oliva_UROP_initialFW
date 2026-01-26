import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Box,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";
import CalculateIcon from "@mui/icons-material/Calculate";
import InsightsIcon from "@mui/icons-material/Insights";
import HotelClassIcon from "@mui/icons-material/HotelClass";
import AssistantIcon from "@mui/icons-material/Assistant";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function Home() {
  const menuItems = [
    {
      title: "Individual Rate",
      path: "/individual-rate",
      icon: <PersonIcon fontSize="large" />,
      color: "#d32f2f",
    },
    {
      title: "Pairwise Rate",
      path: "/pairwise-rate",
      icon: <PeopleIcon fontSize="large" />,
      color: "#F0E68C",
    },
    {
      title: "Ranked Rate",
      path: "/ranked-rate",
      icon: <HotelClassIcon fontSize="large" />,
      color: "#FC46AA",
    },
    {
      title: "Best-Worst Rate",
      path: "/best-worst-rate",
      icon: <CompareArrowsIcon fontSize="large" />,
      color: "#00838f",
    },
    {
      title: "Group Rate",
      path: "/group-rate",
      icon: <CalculateIcon fontSize="large" />,
      color: "#ed6c02",
    },
    {
      title: "Individual Result",
      path: "/individual-result",
      icon: <InsightsIcon fontSize="large" />,
      color: "#9c27b0",
    },
    {
      title: "Pairwise Result",
      path: "/pairwise-result",
      icon: <AssistantIcon fontSize="large" />,
      color: "#bf9000",
    },
    {
      title: "Ranked Result",
      path: "/ranked-result",
      icon: <AutoAwesomeIcon fontSize="large" />,
      color: "#048c7f",
    },
    {
      title: "Best-Worst Result",
      path: "/best-worst-result",
      icon: <CompareArrowsIcon fontSize="large" />,
      color: "#006064",
    },
    {
      title: "Group Result",
      path: "/group-result",
      icon: <GroupsIcon fontSize="large" />,
      color: "#2e7d32",
    },
    {
      title: "Combined Result",
      path: "/combined-result",
      icon: <AssessmentIcon fontSize="large" />,
      color: "#1976d2",
    },
    {
      title: "Pressure Cooker",
      path: "/pressure-cooker",
      icon: <LocalFireDepartmentIcon fontSize="large" />,
      color: "#d32f2f",
    },
    {
      title: "Dataset Manager",
      path: "/dataset-manager",
      icon: <CloudUploadIcon fontSize="large" />,
      color: "#1565c0",
    },
  ];

  return (
    <Box justifyContent="center">
      <Container
        maxWidth="lg"
        sx={{ mt: { xs: 6, sm: 8, md: 12, lg: 18, xl: 24 } }}
      >
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Home
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Select Page
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
              xl: "repeat(5, 1fr)",
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
                "&:hover": {
                  boxShadow: 10,
                  transform: "translateY(-5px)",
                },
              }}
            >
              <CardActionArea
                component={Link}
                to={item.path}
                sx={{
                  height: "100%",
                  p: 4,
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
                  <CardContent>
                    <Typography variant="h6" textAlign="center">
                      {item.title}
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
