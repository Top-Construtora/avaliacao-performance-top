import { useState } from 'react';
import { Criterion } from '../types';

interface CriteriaRatingProps {
  criterion: Criterion;
  onChange: (id: string, score: number) => void;
}

const CriteriaRating = ({ criterion, onChange }: CriteriaRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleRatingClick = (rating: number) => {
    onChange(criterion.id, rating);
  };

  const ratingLabels = [
    'Insatisfatório',
    'Abaixo do esperado',
    'Atende expectativas',
    'Acima do esperado',
    'Excepcional',
  ];

  return (
    <div className="mb-6 p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="flex-1 lg:pr-4">
          <h4 className="text-sm sm:text-md font-medium text-foreground">{criterion.name}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{criterion.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center lg:justify-end lg:flex-nowrap">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={`
                w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                ${
                  criterion.score === rating
                    ? 'bg-lime text-obsidian'
                    : 'border border-border text-muted-foreground hover:border-lime'
                }
                ${hoveredRating && rating <= hoveredRating ? 'ring-2 ring-[#D2FF00]/20' : ''}
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D2FF00]/20 focus:ring-offset-1
              `}
              onClick={() => handleRatingClick(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              aria-label={`Rating ${rating}: ${ratingLabels[rating - 1]}`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {hoveredRating && (
        <div className="mt-2 text-xs text-center lg:text-right text-muted-foreground">
          {ratingLabels[hoveredRating - 1]}
        </div>
      )}
    </div>
  );
};

export default CriteriaRating;
