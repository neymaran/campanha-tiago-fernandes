import React from 'react';
import Card from './Card';
import './StatsCard.css';

const StatsCard = ({ icon, label, value, trend, trendValue }) => {
  return (
    <Card hoverable padding="md" className="stats-card">
      <div className="stats-header">
        <div className="stats-content">
          <p className="stats-label">{label}</p>
          <h2 className="stats-value">{value}</h2>
        </div>
        <div className="stats-icon-wrapper">
          {icon}
        </div>
      </div>
      {trendValue && (
        <div className="stats-footer">
          <span className={`stats-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
          <span className="stats-trend-text">vs last month</span>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
