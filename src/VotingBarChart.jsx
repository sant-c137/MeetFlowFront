// src/components/VotingBarChart/VotingBarChart.js
import React from "react"; // Asegúrate de importar React si no lo tenías
import "./VotingBarChart.css";

const VotingBarChart = ({ optionsData, optionTypeLabel = "Option" }) => {
  if (!optionsData || optionsData.length === 0) {
    return (
      <p className="no-votes-text">
        No {optionTypeLabel.toLowerCase()}s or votes to display.
      </p>
    );
  }

  // Asegurar que vote_count es tratado como número para el cálculo del máximo
  const allVoteCounts = optionsData.map((opt) => Number(opt.vote_count) || 0);
  const maxVotes = Math.max(0, ...allVoteCounts);

  return (
    <div className="voting-bar-chart-container">
      {optionsData.map((option) => {
        // Asegurar que vote_count es tratado como número para el cálculo individual
        const currentVoteCount = Number(option.vote_count) || 0;
        const percentage =
          maxVotes > 0 ? (currentVoteCount / maxVotes) * 100 : 0;

        // Construir el tooltip
        let tooltipText = `Votes: ${currentVoteCount}`; // Tooltip base con solo el conteo

        // Añadir lista de votantes al tooltip SOLO si all_votes existe y tiene contenido
        // Si option.all_votes es undefined (no enviado por el backend para no creadores) o es un array vacío,
        // esta condición no se cumplirá.
        if (option.all_votes && option.all_votes.length > 0) {
          const votersList = option.all_votes
            .map((vote) => vote.username)
            .join(", ");
          tooltipText += `\nVoters: ${votersList}`;
        }
        // No se necesita un 'else' aquí; si no hay 'all_votes', el tooltip solo tendrá el conteo.

        return (
          <div
            key={option.id || option.label} // Usar option.id si está disponible, sino option.label como fallback
            className="vote-option-row"
            title={tooltipText} // El tooltip ahora es condicionalmente detallado
          >
            <div className="vote-option-label">{option.label}</div>
            <div className="vote-bar-wrapper">
              <div
                className="vote-bar-fill"
                style={{ width: `${percentage}%` }}
                aria-valuenow={currentVoteCount}
                aria-valuemin="0"
                aria-valuemax={maxVotes}
              ></div>
            </div>
            <div className="vote-option-count">{currentVoteCount}</div>
          </div>
        );
      })}
    </div>
  );
};

export default VotingBarChart;
