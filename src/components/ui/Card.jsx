import React from 'react';
import './Card.css';

const Card = ({ title, children, hoverable = false, padding = 'md', className = '' }) => {
  return (
    <div className={`card card-pad-${padding} ${hoverable ? 'card-hover' : ''} ${className}`}>
      {title && <div className="card-header"><h3 className="card-title">{title}</h3></div>}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
