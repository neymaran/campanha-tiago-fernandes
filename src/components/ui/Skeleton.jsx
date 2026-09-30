import React from 'react';
import './Skeleton.css';

export default function Skeleton({ width, height, borderRadius, className = '' }) {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius || '4px',
  };

  return <div className={`skeleton-shimmer ${className}`} style={style} />;
}
