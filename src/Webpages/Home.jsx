import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardActionArea,
  Box,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsightsIcon from "@mui/icons-material/Insights";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorageIcon from "@mui/icons-material/Storage";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";

const sections = [
  {
    id: "core",
    label: "Core",
    description: "Primary workflows",
    accent: "#5b8ef0",
    featured: true,
    items: [
      {
        title: "Upload Config",
        desc: "JSON config for any mode (grid, individual, pairwise, ranked)",
        path: "/rate/upload",
        icon: <CloudUploadIcon />,
      },
      {
        title: "Grid Results",
        desc: "Grid layout & combo protocol results",
        path: "/grid-results",
        icon: <InsightsIcon />,
      },
      {
        title: "Mode Results",
        desc: "Individual, pairwise, ranked & best-worst results",
        path: "/mode-results",
        icon: <CompareArrowsIcon />,
      },
      {
        title: "Analytics Dashboard",
        desc: "Session metrics, timelines, and data quality overview",
        path: "/analytics",
        icon: <AssessmentIcon />,
      },
    ],
  },
  {
    id: "rating",
    label: "Rating",
    description: "Specialized protocols",
    accent: "#34d399",
    items: [
      { title: "Combo Protocol", path: "/combo-rate", icon: <AutoAwesomeIcon /> },
      { title: "Pressure Cooker", path: "/pressure-cooker", icon: <LocalFireDepartmentIcon /> },
    ],
  },
  {
    id: "tools",
    label: "Lab Tools",
    description: "Utilities and configuration",
    accent: "#fb923c",
    items: [
      { title: "Eye Tracking", path: "/webgazer-calibration", icon: <VisibilityIcon /> },
      { title: "Gaze Analytics", desc: "Heatmaps, dwell time charts, and gaze export", path: "/gaze-analytics", icon: <TimelineIcon /> },
      { title: "Dataset Manager", path: "/dataset-manager", icon: <StorageIcon /> },
      { title: "Privacy Settings", path: "/privacy", icon: <PrivacyTipIcon /> },
    ],
  },
];

function SectionDivider({ label, description, accent }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      <Box sx={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        bgcolor: accent,
        boxShadow: `0 0 8px ${accent}`,
        flexShrink: 0,
      }} />
      <Typography sx={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.68rem",
        letterSpacing: "0.16em",
        color: accent,
        textTransform: "uppercase",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
      <Typography sx={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem",
        color: "text.secondary",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
      }}>
        {description}
      </Typography>
    </Box>
  );
}

function FeaturedCard({ item, accent }) {
  return (
    <Card sx={{
      borderLeft: `3px solid ${accent}`,
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accent}40`,
        "& .card-icon": { color: accent },
      },
    }}>
      <CardActionArea
        component={Link}
        to={item.path}
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <Box className="card-icon" sx={{
          color: `${accent}cc`,
          mb: 2,
          transition: "color 0.2s ease",
          "& svg": { fontSize: "1.75rem" },
        }}>
          {item.icon}
        </Box>
        <Typography sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: "text.primary",
          lineHeight: 1.3,
          mb: 1,
        }}>
          {item.title}
        </Typography>
        <Typography sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "text.secondary",
          letterSpacing: "0.04em",
          lineHeight: 1.5,
        }}>
          {item.desc}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

function CompactCard({ item, accent }) {
  return (
    <Card sx={{
      borderLeft: `2px solid ${accent}55`,
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: `0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px ${accent}40`,
        borderLeftColor: accent,
        "& .card-icon": { color: accent },
        "& .card-title": { color: "text.primary" },
      },
    }}>
      <CardActionArea
        component={Link}
        to={item.path}
        sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}
      >
        <Box className="card-icon" sx={{
          color: `${accent}99`,
          transition: "color 0.2s ease",
          "& svg": { fontSize: "1.4rem" },
        }}>
          {item.icon}
        </Box>
        <Typography className="card-title" sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: "0.88rem",
          color: "text.secondary",
          lineHeight: 1.3,
          transition: "color 0.2s ease",
        }}>
          {item.title}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function Home() {
  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3 } }}>
        {/* Page Header */}
        <Box sx={{
          mb: 8,
          opacity: 0,
          animation: "fadeUp 0.6s ease-out 0.1s both",
          "@keyframes fadeUp": {
            from: { opacity: 0, transform: "translateY(16px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}>
          <Typography sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem",
            letterSpacing: "0.2em",
            color: "text.secondary",
            textTransform: "uppercase",
            mb: 1.5,
          }}>
            Oliva Group · Visual Cognition Lab
          </Typography>
          <Typography variant="h3" sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            Image Rating{" "}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
              Platform
            </Box>
          </Typography>
        </Box>

        {/* Sections */}
        {sections.map((section, sectionIdx) => (
          <Box
            key={section.id}
            sx={{
              mb: 7,
              opacity: 0,
              animation: `fadeUp 0.5s ease-out ${0.2 + sectionIdx * 0.1}s both`,
              "@keyframes fadeUp": {
                from: { opacity: 0, transform: "translateY(16px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <SectionDivider
              label={section.label}
              description={section.description}
              accent={section.accent}
            />

            {section.featured ? (
              <Box sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}>
                {section.items.map((item) => (
                  <FeaturedCard key={item.path} item={item} accent={section.accent} />
                ))}
              </Box>
            ) : (
              <Box sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: `repeat(${Math.min(section.items.length, 5)}, 1fr)`,
                },
                gap: 1.5,
              }}>
                {section.items.map((item) => (
                  <CompactCard key={item.path} item={item} accent={section.accent} />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
