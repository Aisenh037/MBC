import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as ConnectingIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketStatusProps {
  showDetails?: boolean;
  variant?: 'chip' | 'indicator' | 'detailed';
  onReconnect?: () => void;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showDetails = false,
  variant = 'chip',
  onReconnect
}) => {
  const {
    connected,
    connecting,
    socketId,
    reconnectAttempts,
    error,
    connect,
    disconnect
  } = useWebSocket();

  const [expanded, setExpanded] = React.useState(false);

  const getStatusColor = () => {
    if (connecting) return 'warning';
    if (connected) return 'success';
    return 'error';
  };

  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (connected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (connecting) return <ConnectingIcon className="animate-spin" />;
    if (connected) return <ConnectedIcon />;
    return <DisconnectedIcon />;
  };

  const handleReconnect = () => {
    if (onReconnect) {
      onReconnect();
    } else {
      connect();
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Chip variant
  if (variant === 'chip') {
    return (
      <Tooltip title={`WebSocket ${getStatusText()}`}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor() as any}
          variant="outlined"
          size="small"
          onClick={showDetails ? handleToggleExpanded : undefined}
          sx={{
            cursor: showDetails ? 'pointer' : 'default',
            '& .MuiChip-icon': {
              animation: connecting ? 'spin 1s linear infinite' : 'none'
            }
          }}
        />
      </Tooltip>
    );
  }

  // Simple indicator variant
  if (variant === 'indicator') {
    return (
      <Tooltip title={`WebSocket ${getStatusText()}`}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: showDetails ? 'pointer' : 'default'
          }}
          onClick={showDetails ? handleToggleExpanded : undefined}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: `${getStatusColor()}.main`,
              animation: connecting ? 'pulse 1s infinite' : 'none'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {getStatusText()}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  // Detailed variant
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: `${getStatusColor()}.main`,
          cursor: showDetails ? 'pointer' : 'default'
        }}
        onClick={showDetails ? handleToggleExpanded : undefined}
      >
        {getStatusIcon()}
        <Typography variant="body2" fontWeight="medium">
          WebSocket {getStatusText()}
        </Typography>
        
        {!connected && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleReconnect();
            }}
            disabled={connecting}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
        
        {showDetails && (
          <IconButton size="small">
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        )}
      </Box>

      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            {/* Connection Details */}
            <Typography variant="subtitle2" gutterBottom>
              Connection Details
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 2fr' }}>
              <Typography variant="caption" color="text.secondary">
                Status:
              </Typography>
              <Typography variant="caption">
                {getStatusText()}
              </Typography>
              
              {socketId && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Socket ID:
                  </Typography>
                  <Typography variant="caption" fontFamily="monospace">
                    {socketId}
                  </Typography>
                </>
              )}
              
              {reconnectAttempts > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Reconnect Attempts:
                  </Typography>
                  <Typography variant="caption">
                    {reconnectAttempts}
                  </Typography>
                </>
              )}
            </Box>

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }} variant="outlined">
                <Typography variant="caption">
                  {error.message}
                </Typography>
              </Alert>
            )}

            {/* Actions */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              {!connected && (
                <Chip
                  label="Reconnect"
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<RefreshIcon />}
                  onClick={handleReconnect}
                  disabled={connecting}
                />
              )}
              
              {connected && (
                <Chip
                  label="Disconnect"
                  size="small"
                  color="error"
                  variant="outlined"
                  icon={<DisconnectedIcon />}
                  onClick={disconnect}
                />
              )}
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default WebSocketStatus;