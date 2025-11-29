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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";

// Chart.js Kaydı
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ResultsProps {
  question: string | null;
  players: Player[];
  votes: { [key: string]: number };
  isHost: boolean;
  onNextRound: () => void;
  currentRound: number;
  totalQuestions: number;
}


export default function Results({
  question,
  players,
  votes,
  isHost,
  onNextRound,
  currentRound,
  totalQuestions
}: ResultsProps) {
  const { t } = useLanguage();
  // En çok oy alanı bul (Linç edilecek kişi)
  const winnerId = Object.keys(votes).reduce((a, b) =>
    (votes[a] || 0) > (votes[b] || 0) ? a : b
    , players[0]?.id);

  const winner = players.find(p => p.id === winnerId);

  const chartData = {
    labels: players.map((p) => p.name),
    datasets: [
      {
        label: t("votes"),
        data: players.map((p) => votes[p.id] || 0),
        backgroundColor: players.map(p => p.id === winnerId ? "#000000" : "#e5e5e5"),
        borderColor: "#000000",
        borderWidth: 1,
        borderRadius: 0,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#000',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 0,
        displayColors: false,
      }
    },
    scales: {
      y: {
        ticks: { color: "#888", stepSize: 1, font: { family: 'Inter', size: 12 } },
        grid: { color: "#f5f5f5" },
        beginAtZero: true,
        border: { display: false },
      },
      x: {
        ticks: { color: "#000", font: { family: 'Inter', size: 12, weight: "bold" as const } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const isLastRound = currentRound >= totalQuestions;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center space-y-12 fade-in">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-dark">
          {t("verdict")}
        </span>
        <div className="border border-black p-6 bg-white">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-black">
            {winner?.name || t("noOne")}
          </h1>
        </div>
      </div>

      <div className="text-center max-w-2xl">
        <p className="text-sm uppercase tracking-widest text-gray-dark mb-2">{t("questionLabel")}</p>
        <h3 className="text-xl md:text-2xl font-medium italic">
          {question ?? t("unknownQuestion")}
        </h3>
      </div>

      <Card className="w-full h-80 p-6 border-none shadow-none bg-transparent">
        <Bar data={chartData} options={options} />
      </Card>

      {isHost && (
        <div className="w-full max-w-md">
          <Button
            onClick={onNextRound}
            variant="primary"
            className="w-full"
          >
            {isLastRound ? t("finishGame") : t("nextQuestion")}
          </Button>
        </div>
      )}
    </div>
  );
}