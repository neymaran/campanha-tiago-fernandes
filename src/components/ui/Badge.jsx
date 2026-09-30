import React from 'react';
import './Badge.css';

const Badge = ({ variant = 'neutral', size = 'default', dot = false, children }) => {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {dot && <span className="badge-dot"></span>}
      {children}
    </span>
  );
};

export default Badge;
