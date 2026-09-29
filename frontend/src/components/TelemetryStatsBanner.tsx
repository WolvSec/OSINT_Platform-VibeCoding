import type { FC } from 'react';
import { Box, Tooltip } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useAppSelector } from '../store';
import { hud, displayTitle, eyebrow, hudEnter } from '../theme';
import { HudPanel, StatReadout, PanelDivider } from './HudPrimitives';

export interface TelemetryStatsBannerProps {
  isConnected: boolean;
  isReconnecting: boolean;
  messageRate: number;
}

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(54, 215, 255, 0.6); }
  70%  { box-shadow: 0 0 0 7px rgba(54, 215, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(54, 215, 255, 0); }
`;

const numberFormat = new Intl.NumberFormat('en-US');

/** "WS" (WolvSec) logo mark: a solid maize block with the monogram in Michigan navy. */
const BrandMark: FC = () => (
  <Box
    aria-hidden
    sx={{
      ...displayTitle,
      width: 34,
      height: 34,
      borderRadius: '3px',
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      bgcolor: hud.accent,
      color: hud.onAccent,
      fontSize: '0.95rem',
      letterSpacing: '-0.02em',
      boxShadow: `0 0 0 1px rgba(255, 203, 5, 0.35), 0 6px 18px rgba(255, 203, 5, 0.18)`
    }}
  >
    WS
  </Box>
);

/**
 * Top-left HUD panel: brand block, live connection pill and headline stream stats.
 * Lower-priority readouts drop away on narrow screens so the panel never wraps or overflows.
 */
export const TelemetryStatsBanner: FC<TelemetryStatsBannerProps> = ({
  isConnected,
  isReconnecting,
  messageRate
}) => {
  const activeEntityCount = useAppSelector((state) => Object.keys(state.entities.entities).length);

  let statusLabel = 'Offline';
  let statusColor: string = hud.danger;
  let statusHint = 'Telemetry stream disconnected';
  if (isConnected) {
    statusLabel = 'Live';
    statusColor = hud.signal;
    statusHint = 'Connected to the live telemetry stream';
  } else if (isReconnecting) {
    statusLabel = 'Reconnecting';
    statusColor = hud.warning;
    statusHint = 'Stream dropped — retrying';
  }

  return (
    <HudPanel
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.25, sm: 2 },
        height: 56,
        pl: 1.25,
        pr: { xs: 1.5, sm: 2.25 },
        minWidth: 0,
        pointerEvents: 'auto',
        ...hudEnter(0, 'top')
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, flexShrink: 0 }}>
        <BrandMark />
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Box
            sx={{ ...displayTitle, fontSize: '1.25rem', color: hud.textPrimary, lineHeight: 0.95 }}
          >
            OSINT
          </Box>
          <Box sx={{ ...eyebrow, fontSize: '0.5625rem', color: hud.accent, mt: 0.4 }}>
            WolvSec · Mission control
          </Box>
        </Box>
      </Box>

      <PanelDivider />

      <Tooltip title={statusHint}>
        <Box
          role="status"
          aria-label={`Connection status: ${statusLabel}`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.9,
            height: 26,
            px: 1.1,
            borderRadius: '2px',
            flexShrink: 0,
            bgcolor: `${statusColor}14`,
            border: `1px solid ${statusColor}55`,
            color: statusColor,
            fontFamily: hud.fontMono,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '1px',
              bgcolor: statusColor,
              animation: isConnected ? `${pulse} 1.8s ease-out infinite` : 'none',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
            }}
          />
          <span>{statusLabel}</span>
        </Box>
      </Tooltip>

      <StatReadout
        label="Entities"
        ariaLabel="Tracked entities"
        value={numberFormat.format(activeEntityCount)}
      />
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <StatReadout
          label="Stream"
          ariaLabel="Message rate"
          value={numberFormat.format(messageRate)}
          unit="msg/s"
        />
      </Box>
    </HudPanel>
  );
};
