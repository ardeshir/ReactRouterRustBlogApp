import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Route } from "./+types/_index";

const theme = createTheme();

export function meta({}: Route.MetaArgs {
	return [
		{ title: "Blog Home" }
		{ name: "description", content: "Welcome to our blog!" },
	];
}

export default function Index() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Typography variant="h2">Blog Home</Typography>
      </Container>
    </ThemeProvider>
  );
}
