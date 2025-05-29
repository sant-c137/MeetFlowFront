import "./VotingBarChart.css";

const VotingBarChart = ({ optionsData, optionTypeLabel = "Option" }) => {
  if (!optionsData || optionsData.length === 0) {
    return (
      <p className="no-votes-text">
        No {optionTypeLabel.toLowerCase()}s or votes to display.
      </p>
    );
  }

  const allVoteCounts = optionsData.map((opt) => Number(opt.vote_count) || 0);
  const maxVotes = Math.max(0, ...allVoteCounts);

  return (
    <div className="voting-bar-chart-container">
      {optionsData.map((option) => {
        const currentVoteCount = Number(option.vote_count) || 0;
        const percentage =
          maxVotes > 0 ? (currentVoteCount / maxVotes) * 100 : 0;

        let tooltipTextForRow = `Votes: ${currentVoteCount}`;
        if (option.all_votes && option.all_votes.length > 0) {
          const votersList = option.all_votes
            .map((vote) => vote.username)
            .join(", ");
          tooltipTextForRow += `\nVoters: ${votersList}`;
        }

        return (
          <div
            key={option.id || option.label}
            className="vote-option-row"
            title={tooltipTextForRow}
          >
            <div
              className="vote-option-label"
              title={option.tooltipLabel || option.label}
            >
              {option.label}
            </div>

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
