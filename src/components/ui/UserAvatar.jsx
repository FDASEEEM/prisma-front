/**
 * UserAvatar Component
 * Avatar del usuario con iniciales o imagen
 */

import React from 'react';

const UserAvatar = ({ name = 'Usuario', size = 'md', className = '' }) => {
  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getColorClass = (fullName) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-indigo-500',
    ];
    const hash = [...fullName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = getInitials(name);
  const bgColor = getColorClass(name);

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center font-bold text-white shadow-sm ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
