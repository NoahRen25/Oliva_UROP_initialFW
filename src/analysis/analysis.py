import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# ── Load & parse ───────────────────────────────────────────────────────
df = pd.read_csv('combo_results_all-2.csv')
df['Username'] = df['Username'].astype(str).str.zfill(5)

# Parse Position → Page, Row, Col
df['Page'] = df['Position'].str.extract(r'P(\d)').astype(int)
df['Row']  = df['Position'].str.extract(r'\((\d),').astype(int)
df['Col']  = df['Position'].str.extract(r',(\d)\)').astype(int)

# Numeric ClickOrder (NaN for '-' which means not clicked)
df['ClickOrderNum'] = pd.to_numeric(df['ClickOrder'], errors='coerce')

sns.set_theme(style='whitegrid', font_scale=1.0)


# ════════════════════════════════════════════════════════════════════════
# CHART 1: All Images — Mean Click Order & Mean Score (per image)
# ════════════════════════════════════════════════════════════════════════
img_stats = df.groupby('Image').agg(
    mean_score=('Score', 'mean'),
    mean_click=('ClickOrderNum', 'mean'),  # NaN (not-clicked) excluded automatically
).sort_values('mean_score', ascending=False)

fig1, ax1 = plt.subplots(figsize=(18, 8))
x = np.arange(len(img_stats))
width = 0.38

bars_score = ax1.bar(x - width/2, img_stats['mean_score'], width,
                     label='Mean Score', color='#4C72B0', edgecolor='white', zorder=3)
bars_click = ax1.bar(x + width/2, img_stats['mean_click'], width,
                     label='Mean Click Order', color='#DD8452', edgecolor='white', zorder=3)

# Value labels on bars
for bar in bars_score:
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.08,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=6.5, color='#4C72B0')
for bar in bars_click:
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.08,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=6.5, color='#DD8452')

ax1.set_xticks(x)
ax1.set_xticklabels(img_stats.index.str.replace('target_', ''), rotation=60, ha='right', fontsize=7)
ax1.set_ylabel('Value')
ax1.set_xlabel('Image')
ax1.set_title('All Images — Mean Score & Mean Click Order (averaged across all users)',
              fontsize=14, fontweight='bold')
ax1.legend(fontsize=11)
ax1.set_ylim(0, max(img_stats['mean_score'].max(), img_stats['mean_click'].max()) + 1.2)

fig1.tight_layout()
fig1.savefig('chart1_images_score_click.png', dpi=150, bbox_inches='tight')
plt.close(fig1)
print("✓ Chart 1 saved — All Images: Score & Click Order")


# ════════════════════════════════════════════════════════════════════════
# CHART 2: All Positions — Mean Click Order & Mean Score (combined users)
# ════════════════════════════════════════════════════════════════════════
pos_stats = df.groupby('Position').agg(
    mean_score=('Score', 'mean'),
    mean_click=('ClickOrderNum', 'mean'),
).sort_index()

# Sort by Page then Row then Col for natural order
pos_stats['Page'] = pos_stats.index.str.extract(r'P(\d)')[0].astype(int).values
pos_stats['Row']  = pos_stats.index.str.extract(r'\((\d),')[0].astype(int).values
pos_stats['Col']  = pos_stats.index.str.extract(r',(\d)\)')[0].astype(int).values
pos_stats = pos_stats.sort_values(['Page', 'Row', 'Col'])

fig2, ax2 = plt.subplots(figsize=(20, 8))
x = np.arange(len(pos_stats))
width = 0.38

bars_score = ax2.bar(x - width/2, pos_stats['mean_score'], width,
                     label='Mean Score', color='#4C72B0', edgecolor='white', zorder=3)
bars_click = ax2.bar(x + width/2, pos_stats['mean_click'], width,
                     label='Mean Click Order', color='#DD8452', edgecolor='white', zorder=3)

# Value labels
for bar in bars_score:
    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.08,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=6.5, color='#4C72B0')
for bar in bars_click:
    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.08,
             f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=6.5, color='#DD8452')

ax2.set_xticks(x)
ax2.set_xticklabels(pos_stats.index, rotation=60, ha='right', fontsize=7.5)
ax2.set_ylabel('Value')
ax2.set_xlabel('Position')
ax2.set_title('All Positions — Mean Score & Mean Click Order (combined across ALL users)',
              fontsize=14, fontweight='bold')
ax2.legend(fontsize=11)
ax2.set_ylim(0, max(pos_stats['mean_score'].max(), pos_stats['mean_click'].max()) + 1.5)

# Add vertical dividers between pages
page_boundaries = []
for i in range(1, len(pos_stats)):
    if pos_stats['Page'].iloc[i] != pos_stats['Page'].iloc[i-1]:
        page_boundaries.append(i - 0.5)
for bnd in page_boundaries:
    ax2.axvline(bnd, color='grey', ls='--', lw=1.2, alpha=0.6)
# Page labels
page_starts = [0] + [int(b + 0.5) for b in page_boundaries] + [len(pos_stats)]
for i in range(len(page_starts) - 1):
    mid = (page_starts[i] + page_starts[i+1] - 1) / 2
    ax2.text(mid, ax2.get_ylim()[1] * 0.95, f'Page {i+1}',
             ha='center', fontsize=11, fontweight='bold', color='grey')

fig2.tight_layout()
fig2.savefig('/home/claude/chart2_positions_score_click.png', dpi=150, bbox_inches='tight')
plt.close(fig2)
print("✓ Chart 2 saved — All Positions: Score & Click Order")


# ════════════════════════════════════════════════════════════════════════
# CHART 3: Click Order vs Score — Detailed Analysis
#
# WHAT THIS DOES:
# ───────────────
# This chart answers the question: "Do users click on higher-scored
# images EARLIER in their click sequence?"
#
# Each trial, a user sees a grid of images and clicks them in some
# order (ClickOrder = 1 means clicked first, 2 means second, etc.).
# Each image also receives a Score (1-10) from the user.
#
# If users tend to click "better" images first, we'd expect:
#   - Low click orders (1, 2, 3) → higher scores
#   - High click orders (7, 8, 9) → lower scores
#   - A NEGATIVE correlation between click order and score
#
# The chart has three layers:
#   1. SCATTER: Each dot is one observation (one user rating one image).
#      X = when they clicked it, Y = what score they gave it.
#   2. REGRESSION LINE: OLS best-fit line showing the linear trend.
#      A downward slope = users click higher-scored images first.
#   3. BAR OVERLAY: Mean score at each click order value,
#      showing the actual average score for images clicked 1st, 2nd, etc.
#
# Statistical tests reported:
#   - Pearson r: strength/direction of linear relationship (-1 to +1)
#   - p-value: probability this correlation occurred by chance
#   - Spearman rho: rank-based correlation (robust to outliers)
# ════════════════════════════════════════════════════════════════════════

clicked = df.dropna(subset=['ClickOrderNum']).copy()

fig3, (ax3a, ax3b) = plt.subplots(1, 2, figsize=(18, 8))

# ── Left panel: Scatter + regression ──
sns.regplot(data=clicked, x='ClickOrderNum', y='Score',
            scatter_kws={'alpha': 0.3, 's': 40, 'color': '#4C72B0'},
            line_kws={'color': 'red', 'lw': 2},
            ax=ax3a)

# Pearson correlation
r_pearson, p_pearson = stats.pearsonr(clicked['ClickOrderNum'], clicked['Score'])
# Spearman rank correlation (non-parametric)
r_spearman, p_spearman = stats.spearmanr(clicked['ClickOrderNum'], clicked['Score'])

ax3a.set_xlabel('Click Order (1 = clicked first)', fontsize=12)
ax3a.set_ylabel('Score', fontsize=12)
ax3a.set_title('Click Order vs Score — Scatter + Regression', fontsize=13, fontweight='bold')
ax3a.set_xticks(range(1, 10))
ax3a.set_yticks(range(1, 11))

# Stats annotation box
stats_text = (
    f'Pearson r = {r_pearson:.3f}  (p = {p_pearson:.3f})\n'
    f'Spearman ρ = {r_spearman:.3f}  (p = {p_spearman:.3f})\n'
    f'N = {len(clicked)} observations\n\n'
    f'Interpretation:\n'
    f'{"Negative slope → users click higher-scored images first" if r_pearson < 0 else "Positive slope → users click lower-scored images first"}'
)
ax3a.text(0.02, 0.02, stats_text, transform=ax3a.transAxes, fontsize=9,
          verticalalignment='bottom',
          bbox=dict(boxstyle='round,pad=0.5', facecolor='lightyellow', alpha=0.9))

# ── Right panel: Mean score at each click order ──
click_means = clicked.groupby('ClickOrderNum')['Score'].agg(['mean', 'std', 'count'])
click_means['se'] = click_means['std'] / np.sqrt(click_means['count'])

bars = ax3b.bar(click_means.index, click_means['mean'],
                yerr=click_means['se'], capsize=4,
                color='#4C72B0', edgecolor='white', alpha=0.85, zorder=3)

# Value labels + count labels
for bar, (idx, row) in zip(bars, click_means.iterrows()):
    ax3b.text(bar.get_x() + bar.get_width()/2, bar.get_height() + row['se'] + 0.1,
              f'{row["mean"]:.2f}', ha='center', va='bottom', fontsize=9, fontweight='bold')
    ax3b.text(bar.get_x() + bar.get_width()/2, 0.15,
              f'n={int(row["count"])}', ha='center', va='bottom', fontsize=7.5, color='white')

# Overlay trend line on the bar chart
z = np.polyfit(click_means.index, click_means['mean'], 1)
xfit = np.linspace(click_means.index.min(), click_means.index.max(), 100)
ax3b.plot(xfit, np.polyval(z, xfit), 'r--', lw=2, label=f'Trend (slope={z[0]:.3f})')

ax3b.set_xlabel('Click Order (1 = clicked first)', fontsize=12)
ax3b.set_ylabel('Mean Score (± SE)', fontsize=12)
ax3b.set_title('Mean Score at Each Click Order', fontsize=13, fontweight='bold')
ax3b.set_xticks(range(1, 10))
ax3b.set_ylim(0, click_means['mean'].max() + 1.5)
ax3b.legend(fontsize=10)

fig3.suptitle('Click Order vs Score — Does click priority reflect perceived quality?',
              fontsize=15, fontweight='bold', y=1.02)
fig3.tight_layout()
fig3.savefig('/home/claude/chart3_clickorder_vs_score.png', dpi=150, bbox_inches='tight')
plt.close(fig3)
print("✓ Chart 3 saved — Click Order vs Score (detailed)")

print("\nDone! All 3 charts saved.")