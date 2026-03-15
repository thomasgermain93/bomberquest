# Issue #92 - Game Economy: Augmenter les prix d'invocation x10

## Changes Made

### Prices Updated (multiplied by 10):

| Pull Type | Old Price | New Price |
|-----------|-----------|-----------|
| ×1        | 100       | 1,000     |
| ×10       | 900       | 9,000     |
| ×100      | 8,000     | 80,000    |

### Files Modified

1. **src/pages/Index.tsx** (line 1104)
   - Updated `handleSummon` cost calculation

2. **src/components/SummonModal.tsx** (lines 368, 373, 378, 383, 388, 394)
   - Updated button disabled conditions
   - Updated displayed price labels

### Build Status
- ✅ Build successful

### Validations
- All prices now 10x higher
- No breaking changes to game logic
- Prices updated consistently across all UI components
