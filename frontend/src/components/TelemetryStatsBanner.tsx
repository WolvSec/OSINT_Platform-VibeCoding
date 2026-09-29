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

/** Top-left HUD panel: wordmark, a live tick/cross and the entity count. */
export const TelemetryStatsBanner: FC<TelemetryStatsBannerProps> = ({
  isConnected,
  isReconnecting
}) => {
  const activeEntityCount = useAppSelector((state) => Object.keys(state.entities.entities).length);

  let statusLabel = 'Offline';
  let statusHint = 'Disconnected from the backend';
  if (isConnected) {
    statusLabel = 'Live';
    statusHint = 'Connected to the backend';
  } else if (isReconnecting) {
    statusLabel = 'Reconnecting';
    statusHint = 'Connection dropped, retrying';
  }

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
          OSINT
        </Box>
        <Box sx={{ ...eyebrow, fontSize: '0.5625rem', color: hud.accent, mt: 0.4 }}>WolvSec</Box>
      </Box>

      <PanelDivider />

      <Tooltip title={statusHint}>
        <Box
          role="status"
          aria-label={`Connection status: ${statusLabel}`}
          sx={{
            flexShrink: 0,
            fontSize: '1.25rem',
            fontWeight: 900,
            lineHeight: 1,
            color: isConnected ? hud.accent : hud.danger
          }}
        >
          <span aria-hidden>{isConnected ? '✓' : '✗'}</span>
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
