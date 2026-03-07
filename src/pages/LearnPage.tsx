import { useParams } from "react-router-dom";

const LearnPage = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Course: {slug}</h1>
        <p className="text-muted-foreground">Learning page coming soon.</p>
      </div>
    </div>
  );
};

export default LearnPage;
