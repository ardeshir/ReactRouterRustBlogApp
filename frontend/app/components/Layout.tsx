import { Outlet, Link } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";

export default function Layout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Blog Application
          </Typography>
          <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
            Home
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/posts/new"
            startIcon={<AddIcon />}
          >
            New Post
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ bgcolor: "grey.200", py: 2, mt: "auto" }}
      >
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Blog Application. Built with React Router v7, Material UI, and Rust Axum.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
