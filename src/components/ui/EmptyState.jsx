import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state-wrapper">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
