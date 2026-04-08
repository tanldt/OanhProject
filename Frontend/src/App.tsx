import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import MembeeCallback from "./pages/MembeeCallback";

import Applicant from "./pages/Applicant";

import Office from "./pages/Office";
import OfficeApplicationDetail from "./pages/OfficeApplicationDetail";

import Reviewer from "./pages/Reviewer";
import ReviewerEducation from "./pages/ReviewerEducation";
import ReviewerExperience from "./pages/ReviewerExperience";
import ReviewerEducationDetail from "./pages/ReviewerEducationDetail";
import ReviewerExperienceDetail from "./pages/ReviewerExperienceDetail";

import AccessDenied from "./pages/AccessDenied";
import ProtectedRoute from "./ProtectedRoutes";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Membee callback */}
        <Route path="/auth/membee/callback" element={<MembeeCallback />} />

        {/* Common */}
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Applicant */}
        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={["Applicant"]}>
              <Applicant />
            </ProtectedRoute>
          }
        />

        

        {/* Office */}
        <Route
          path="/office"
          element={
            <ProtectedRoute allowedRoles={["Office"]}>
              <Office />
            </ProtectedRoute>
          }
        />

        <Route
          path="/office/applications/:id"
          element={
            <ProtectedRoute allowedRoles={["Office"]}>
              <OfficeApplicationDetail />
            </ProtectedRoute>
          }
        />

        {/* Reviewer parent */}
        <Route
          path="/reviewer"
          element={
            <ProtectedRoute
              allowedRoles={["EducationReviewer", "ExperienceReviewer"]}
            >
              <Reviewer />
            </ProtectedRoute>
          }
        >
          <Route
            path="education"
            element={
              <ProtectedRoute allowedRoles={["EducationReviewer"]}>
                <ReviewerEducation />
              </ProtectedRoute>
            }
          />
          <Route
            path="education/applications/:id"
            element={
              <ProtectedRoute allowedRoles={["EducationReviewer"]}>
                <ReviewerEducationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="experience"
            element={
              <ProtectedRoute allowedRoles={["ExperienceReviewer"]}>
                <ReviewerExperience />
              </ProtectedRoute>
            }
          />
          <Route
            path="experience/applications/:id"
            element={
              <ProtectedRoute allowedRoles={["ExperienceReviewer"]}>
                <ReviewerExperienceDetail />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<AccessDenied />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;