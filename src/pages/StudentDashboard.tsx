import { Navigate } from "react-router-dom";
import PlaceholderPage from "@/components/PlaceholderPage";
import { useAuth } from "@/contexts/AuthContext";

const StudentDashboard = () => {
  const { user, ready, role } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/dashboard/student" replace />;
  }

  if (!role) {
    return <Navigate to="/onboarding/role" replace />;
  }

  if (role === "coach") {
    return <Navigate to="/dashboard" replace />;
  }

  return <PlaceholderPage title="Student Dashboard" description="Track your learning progress." />;
};

export default StudentDashboard;
