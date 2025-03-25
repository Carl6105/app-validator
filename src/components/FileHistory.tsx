// src/components/FileHistory.tsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Clock, FileText, Star } from "lucide-react";

interface FileHistoryItem {
  userId: string;
  fileName: string;
  path: string;
  timestamp: string;
  score: number;
}

const BACKEND_API = {
  url: "http://localhost:5000/api/history", // Adjust to your backend URL
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`, // Assumes token is stored in localStorage
  },
};

export function FileHistory() {
  const [history, setHistory] = React.useState<FileHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_API.url}/${user.id}`, {
          method: "GET",
          headers: BACKEND_API.headers,
        });

        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) return <div className="text-center py-4">Loading history...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No analysis history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Analysis History</h2>
      {history.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-gray-700 bg-[#1a1a1a] space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-gray-200">{item.fileName}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Clock className="h-4 w-4" />
              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-gray-300">Score: {item.score}</span>
          </div>

          <p className="text-gray-400 text-sm mt-2">Path: {item.path}</p>
        </div>
      ))}
    </div>
  );
}