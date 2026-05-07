import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award, Loader2, AlertTriangle } from 'lucide-react';
import { getUserStats } from '../services/api';

const UserStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getUserStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Could not load statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
  if (error) return <div className="p-8 text-red-400 text-center">{error}</div>;
  if (!stats) return null;

  return (
    <div className="user-stats-container grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* General Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <TrendingUp size={20} />
          </div>
          <h3 className="font-bold text-gray-300">Total Progress</h3>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-black text-white">{stats.learning_path_progress}%</span>
          <span className="text-gray-500 text-sm mb-1">completed</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${stats.learning_path_progress}%` }}
          />
        </div>
      </motion.div>

      {/* Weak Points / Reinforcement */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl md:col-span-2"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Target size={20} />
          </div>
          <h3 className="font-bold text-gray-300">Topics to Reinforce</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.weak_points && stats.weak_points.length > 0 ? (
            stats.weak_points.map((point, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <AlertTriangle size={12} className="text-purple-500" />
                {point}
              </span>
            ))
          ) : (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <Award size={16} />
              You're on an excellent path! You don't have critical weak points.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserStats;
