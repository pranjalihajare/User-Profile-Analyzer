import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Repo {
  id: number;
  name: string;
  html_url: string;
}

interface CommitData {
  date: string;
  count: number;
}

const UserProfileAnalyzer: React.FC = () => {
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [commitData, setCommitData] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGitHubData = async () => {
    setLoading(true);
    try {
      const repoResponse = await fetch(`https://api.github.com/users/${username}/repos`);
      const repoData = await repoResponse.json();
      setRepos(repoData);

      const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`);
      const events = await eventsResponse.json();

      const commitEvents = events.filter((event: any) => event.type === "PushEvent");

      const commitCountMap: { [date: string]: number } = {};
      commitEvents.forEach((event: any) => {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        commitCountMap[date] = (commitCountMap[date] || 0) + event.payload.commits.length;
      });

      const formattedCommitData = Object.entries(commitCountMap).map(([date, count]) => ({ date, count }));
      formattedCommitData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setCommitData(formattedCommitData);
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">GitHub User Profile Analyzer</h1>
      <div className="flex gap-2">
        <Input placeholder="Enter GitHub Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Button onClick={fetchGitHubData} disabled={!username || loading}>
          {loading ? "Loading..." : "Analyze"}
        </Button>
      </div>

      {repos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Repositories</h2>
            <ul className="list-disc list-inside space-y-1">
              {repos.map((repo) => (
                <li key={repo.id}>
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {repo.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {commitData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Daily Commits</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={commitData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfileAnalyzer;
