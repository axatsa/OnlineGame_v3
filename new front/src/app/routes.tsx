import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Generator } from "./pages/Generator";
import { Editor } from "./pages/Editor";
import { Students } from "./pages/Students";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "generator", Component: Generator },
      { path: "editor", Component: Editor },
      { path: "students", Component: Students },
      { path: "*", Component: Dashboard },
    ],
  },
]);
