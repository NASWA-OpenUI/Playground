import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

function ClaimStatusChip({ status }) {
  // Define colors and icons based on status
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Submitted':
        return {
          color: 'info',
          icon: <InfoIcon />,
          label: 'Submitted'
        };
      case 'InProcess':
        return {
          color: 'primary',
          icon: <PendingIcon />,
          label: 'In Process'
        };
      case 'WaitingEmployerInfo':
        return {
          color: 'warning',
          icon: <HourglassEmptyIcon />,
          label: 'Waiting for Employer'
        };
      case 'Approved':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Approved'
        };
      case 'Denied':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Denied'
        };
      default:
        return {
          color: 'default',
          icon: <InfoIcon />,
          label: status
        };
    }
  };

  const { color, icon, label } = getStatusConfig(status);

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
    />
  );
}

export default ClaimStatusChip;