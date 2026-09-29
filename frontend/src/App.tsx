import { useEffect, useState, type FC } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useWebSocket } from './hooks/useWebSocket';
import { useAppSelector } from './store';
import { GlobeView } from './components/GlobeView';
import { TelemetryStatsBanner } from './components/TelemetryStatsBanner';
import { LayerControlDrawer } from './components/LayerControlDrawer';
import { EntityDetailsDrawer } from './components/EntityDetailsDrawer';

/** Top offset of the side panels on tablet/desktop: gutter + top bar (56) + 12px gap. */
const SIDE_TOP = 84;

/**
 * Space backdrop, drawn over the globe canvas and under the HUD: a Michigan-navy vignette and a
 * faint blueprint grid, both masked out of the centre so the globe itself is never tinted.
 */
const backdropSx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
  background: [
    'radial-gradient(ellipse 75% 85% at 50% 50%, transparent 55%, rgba(0, 39, 76, 0.38) 100%)',
    'linear-gradient(180deg, rgba(5, 13, 26, 0.55) 0%, transparent 18%, transparent 82%, rgba(5, 13, 26, 0.6) 100%)'
  ].join(', '),
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(163, 181, 204, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(163, 181, 204, 0.06) 1px, transparent 1px)',
    backgroundSize: '64px 64px',
    backgroundPosition: 'center',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, transparent 45%, #000 100%)',
    maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, transparent 45%, #000 100%)'
  }
} as const;

/**
 * Full-bleed layout: the globe fills the viewport and every HUD element floats above it on a
 * glass panel. The HUD layer itself is `pointer-events: none`; only the panels opt back in, so
 * the globe stays draggable everywhere between them.
 *
 * Z-INDEX CONTRACT — top of the stack last:
 *   globe canvas            0   GlobeView
 *   backdrop                1   vignette + grid (pointer-events: none)
 *   HUD layer               20  top bar, layers, inspector
 *   menus / tooltips        1300+ (MUI default)
 *
 * Right column (sm+): a selected entity's card. Phones (< sm): layers and the inspector are
 * bottom sheets; the layers panel folds away whenever an entity is opened.
 */
export const App: FC = () => {
  const { isConnected, isReconnecting, messageRate } = useWebSocket();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [layersOpen, setLayersOpen] = useState(() => !isPhone);
  const selectedId = useAppSelector((state) => state.entities.selectedEntityId);

  useEffect(() => {
    if (isPhone && selectedId) setLayersOpen(false);
  }, [isPhone, selectedId]);

  const gutter = { xs: 1, sm: 2 };
  const sheet = { left: 8, right: 8, bottom: 8, top: 'auto' } as const;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <GlobeView />
      </Box>
      <Box aria-hidden data-testid="hud-backdrop" sx={backdropSx} />

      <Box
        data-testid="hud-layer"
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          pointerEvents: 'none',
          p: gutter
        }}
      >
        {/* Top bar: brand + telemetry. */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <TelemetryStatsBanner
            isConnected={isConnected}
            isReconnecting={isReconnecting}
            messageRate={messageRate}
          />
        </Box>

        {/* Layers / legend */}
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'flex-end', sm: 'flex-start' },
            alignItems: 'flex-start',
            pointerEvents: 'none',
            left: { xs: 8, sm: 16 },
            right: { xs: layersOpen ? 8 : 'auto', sm: 'auto' },
            top: { xs: 'auto', sm: SIDE_TOP },
            bottom: { xs: 8, sm: 16 },
            width: { sm: 288 },
            maxHeight: { xs: '58%', sm: 'none' },
            zIndex: 2
          }}
        >
          <LayerControlDrawer
            open={layersOpen}
            onOpen={() => setLayersOpen(true)}
            onClose={() => setLayersOpen(false)}
          />
        </Box>

        {/* Entity inspector */}
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'flex-end', sm: 'flex-start' },
            pointerEvents: 'none',
            left: { xs: sheet.left, sm: 'auto' },
            right: { xs: sheet.right, sm: 16 },
            top: { xs: sheet.top, sm: SIDE_TOP },
            bottom: { xs: sheet.bottom, sm: 64 },
            width: { sm: 360 },
            maxHeight: { xs: '62%', sm: 'none' },
            zIndex: 3
          }}
        >
          <EntityDetailsDrawer />
        </Box>
      </Box>
    </Box>
  );
};

export default App;
