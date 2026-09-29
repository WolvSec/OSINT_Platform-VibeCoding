import { describe, it, expect } from 'vitest';
import { tacticalTheme, hud, monoValue, displayTitle } from '../theme';

describe('tacticalTheme', () => {
  it('uses the dark navy palette with maize as the primary accent', () => {
    expect(tacticalTheme.palette.mode).toBe('dark');
    expect(tacticalTheme.palette.primary.main).toBe(hud.accent);
    expect(hud.accent).toBe('#ffcb05');
    expect(tacticalTheme.palette.background.default).toBe('#050d1a');
    expect(tacticalTheme.palette.text.primary).toBe(hud.textPrimary);
  });
  it('pairs a Russo One display face, Archivo body and JetBrains Mono tabular values', () => {
    expect(displayTitle.fontFamily).toMatch(/Russo One/);
    expect(tacticalTheme.typography.fontFamily).toMatch(/Archivo/);
    expect(tacticalTheme.typography.fontFamily).not.toMatch(/Inter|Roboto/);
    expect(monoValue.fontFamily).toMatch(/JetBrains Mono/);
    expect(monoValue.fontVariantNumeric).toBe('tabular-nums');
  });
});
