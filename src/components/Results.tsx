// src/components/Results.tsx
"use client";
import { Player } from "@/types";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js Kaydı
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ResultsProps {
  question: string | null;
  players: Player[];
  votes: { [key: string]: number };
  isHost: boolean;
  onNextRound: () => void;
}


export default function Results({
  question,
  players,
  votes,
  isHost,
  onNextRound,
}: ResultsProps) {
  // En çok oy alanı bul (Linç edilecek kişi)
  const winnerId = Object.keys(votes).reduce((a, b) => 
    (votes[a] || 0) > (votes[b] || 0) ? a : b
  , players[0]?.id);
  
  const winner = players.find(p => p.id === winnerId);

  const chartData = {
    labels: players.map((p) => p.name),
    datasets: [
      {
        label: "Oy Sayısı",
        data: players.map((p) => votes[p.id] || 0),
        backgroundColor: players.map(p => p.id === winnerId ? "rgba(239, 68, 68, 0.9)" : "rgba(147, 51, 234, 0.6)"), // Kazanan kırmızı, diğerleri mor
        borderColor: players.map(p => p.id === winnerId ? "rgba(239, 68, 68, 1)" : "rgba(147, 51, 234, 1)"),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        ticks: { color: "#9CA3AF", stepSize: 1, font: { size: 14 } },
        grid: { color: "#374151" },
        beginAtZero: true,
      },
      x: {
        ticks: { color: "white", font: { size: 14, weight: "bold" as const } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 min-h-screen">
      <h2 className="text-gray-400 text-lg font-medium mb-2">Bu soru için kazanan (!)</h2>
      
      <div className="bg-red-600/20 border border-red-500/50 px-8 py-4 rounded-xl mb-8 animate-pulse">
         <h1 className="text-4xl font-black text-red-500">{winner?.name || "Kimse?"}</h1>
      </div>

  <h3 className="text-xl text-white mb-6 text-center italic opacity-80">
{question ?? "Soru bulunamadı"}
</h3>


      <div className="w-full h-80 bg-gray-800/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-700">
        <Bar data={chartData} options={options} />
      </div>

      {isHost && (
        <button
          onClick={onNextRound}
          className="mt-10 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-1"
        >
          Sıradaki Soruya Geç ➡️
        </button>
      )}
    </div>
  );
}