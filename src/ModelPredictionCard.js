import React from 'react';

const ModelPredictionCard = ({ title, analysis, children }) => {
    return (
        <div className="predictions-card">
            <h3 className="predictions-header">{title}</h3>
            <div className="analysis-box">
                {analysis && (typeof analysis === 'string' ? <p className="analysis-text" dangerouslySetInnerHTML={{ __html: analysis }} /> : analysis)}
            </div>
            {children}
        </div>
    );
};

export default ModelPredictionCard;