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
    'Excepcional'
  ];
  
  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="mb-2 md:mb-0 md:flex-1">
          <h4 className="text-md font-medium">{criterion.name}</h4>
          <p className="text-sm text-gray-600">{criterion.description}</p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-2 mt-2 md:mt-0">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${criterion.score === rating ? 
                  'bg-blue-600 text-white' : 
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${hoveredRating && rating <= hoveredRating ? 'ring-2 ring-blue-300' : ''}
                transition-all
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
        <div className="mt-1 text-xs text-right text-gray-500">
          {ratingLabels[hoveredRating - 1]}
        </div>
      )}
    </div>
  );
};

export default CriteriaRating;