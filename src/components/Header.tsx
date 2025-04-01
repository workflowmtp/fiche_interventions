import React from 'react';
import { Clock, Timer, PlayCircle, PauseCircle } from 'lucide-react';
import { formatDuration } from '../services/interventions';

interface HeaderProps {
  currentTime: Date;
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: string;
  timeStats?: {
    effectiveTime: number;
    totalTime: number;
    pauseCount: number;
    pauseDurations: number[];
    averagePauseDuration: number;
  };
}

const Header: React.FC<HeaderProps> = ({ currentTime, isRunning, isPaused, elapsedTime, timeStats }) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center md:text-left">
          FICHE DE DEMANDE D'INTERVENTION - MAINTENANCE INDUSTRIELLE
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-xl font-mono bg-gray-100 px-4 py-2 rounded w-full md:w-auto justify-center">
            <Clock className="w-6 h-6" />
            {currentTime.toLocaleTimeString()}
          </div>
          {isRunning && (
            <div className={`flex items-center gap-2 text-xl font-mono px-4 py-2 rounded w-full md:w-auto justify-center ${
              isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isPaused ? (
                <PauseCircle className="w-6 h-6" />
              ) : (
                <PlayCircle className="w-6 h-6" />
              )}
              {elapsedTime}
            </div>
          )}
        </div>
      </div>

      {timeStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Temps effectif</div>
            <div className="text-2xl font-mono text-blue-900">
              {formatDuration(timeStats.effectiveTime)}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Temps total</div>
            <div className="text-2xl font-mono text-green-900">
              {formatDuration(timeStats.totalTime)}
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Nombre de pauses</div>
            <div className="text-2xl font-mono text-yellow-900">
              {timeStats.pauseCount}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Durée moyenne des pauses</div>
            <div className="text-2xl font-mono text-purple-900">
              {formatDuration(timeStats.averagePauseDuration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;