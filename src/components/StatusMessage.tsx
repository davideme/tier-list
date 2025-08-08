import React from 'react';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type, visible }) => {
  if (!visible) return null;

  return (
    <div className={`status ${type}`}>
      {message}
    </div>
  );
};

export default StatusMessage;