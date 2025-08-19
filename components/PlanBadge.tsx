import React from 'react';

interface PlanBadgeProps {
  planType: string;
  planName: string;
  className?: string;
}

export function PlanBadge({ planType, planName, className = '' }: PlanBadgeProps) {
  const getStyles = () => {
    switch (planType) {
      case 'admin':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-300 shadow-sm';
      case 'pro':
        return 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200';
      case 'beta':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200';
      case 'free':
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStyles()} ${className}`}>
      {planName}
    </span>
  );
}