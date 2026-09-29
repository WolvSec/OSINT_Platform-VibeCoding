import { useEffect, useState, type FC } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useWebSocket } from './hooks/useWebSocket';
import { useAppSelector } from './store';
import { GlobeView } from './components/GlobeView';
import { TelemetryStatsBanner } from './components/TelemetryStatsBanner';
import { LayerControlDrawer } from './components/LayerControlDrawer';
import { EntityDetailsDrawer } from './components/EntityDetailsDrawer';
import { SearchBox } from './components/SearchBox';

/** Top offset of the side panels on tablet/desktop: gutter + top bar (52) + 12px gap. */
const SIDE_TOP = 80;

/**
 * Full-bleed layout: the globe fills the viewport and every HUD element floats above it on a
 * glass panel. The HUD layer itself is `pointer-events: none`; only the panels opt back in, so
 * the globe stays draggable everywhere between them.
 *
 * Z-INDEX CONTRACT — top of the stack last:
 *   globe canvas            0   GlobeView
 *   HUD layer               20  top bar, layers, inspector
 *   menus / tooltips        1300+ (MUI default)
 *
 * Right column (sm+): a selected entity's card. Phones (< sm): the search box gets its own row,
 * and layers and the inspector are bottom sheets; the layers panel folds away whenever an
 * entity is opened.
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
        {/* Top bar: brand + telemetry on the left, search beside it. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <TelemetryStatsBanner
            isConnected={isConnected}
            isReconnecting={isReconnecting}
            messageRate={messageRate}
          />
          <Box
            sx={{
              flex: { xs: '1 1 140px', md: '1 1 280px' },
              maxWidth: { md: 440 },
              mx: { md: 'auto' },
              minWidth: 0
            }}
          >
            <SearchBox />
          </Box>
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
