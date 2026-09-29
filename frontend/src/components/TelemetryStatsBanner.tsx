import type { FC } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useAppSelector } from '../store';
import { hud, displayTitle, eyebrow, hudEnter } from '../theme';
import { HudPanel, StatReadout, PanelDivider } from './HudPrimitives';

export interface TelemetryStatsBannerProps {
  isConnected: boolean;
  isReconnecting: boolean;
}

const numberFormat = new Intl.NumberFormat('en-US');

/** Top-left HUD panel: wordmark, a tick (working) or cross (offline) and the entity count. */
export const TelemetryStatsBanner: FC<TelemetryStatsBannerProps> = ({
  isConnected,
  isReconnecting
}) => {
  const activeEntityCount = useAppSelector((state) => Object.keys(state.entities.entities).length);

  let statusLabel = 'Offline';
  let statusHint = 'Disconnected from the backend';
  if (isConnected) {
    statusLabel = 'Working';
    statusHint = 'Connected to the backend';
  } else if (isReconnecting) {
    statusLabel = 'Retrying';
    statusHint = 'Connection dropped, retrying';
  }
  const statusColor = isConnected ? hud.accent : hud.danger;

  return (
    <HudPanel
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.25, sm: 2 },
        height: 56,
        px: { xs: 1.5, sm: 2.25 },
        minWidth: 0,
        pointerEvents: 'auto',
        ...hudEnter(0, 'top')
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Box
          sx={{ ...displayTitle, fontSize: '1.25rem', color: hud.textPrimary, lineHeight: 0.95 }}
        >
          WolvSec
        </Box>
        <Box sx={{ ...eyebrow, fontSize: '0.5625rem', color: hud.accent, mt: 0.4 }}>OSINT</Box>
      </Box>

      <PanelDivider />

      <Tooltip title={statusHint}>
        <Box
          role="status"
          aria-label={`Connection status: ${statusLabel}`}
          sx={{ flexShrink: 0, textAlign: 'center', color: statusColor }}
        >
          <Box aria-hidden sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
            {isConnected ? '✓' : '✗'}
          </Box>
          <Box sx={{ ...eyebrow, fontSize: '0.5625rem', color: statusColor, mt: 0.3 }}>
            {statusLabel}
          </Box>
        </Box>
      </Tooltip>

      <StatReadout
        label="Entities"
        ariaLabel="Tracked entities"
        value={numberFormat.format(activeEntityCount)}
      />
    </HudPanel>
  );
};
