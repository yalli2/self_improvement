/* Chart.js 설정 헬퍼 — 레이더 · 막대 · 도넛 · 기준선 막대 · 산점도(4분면) */
(function () {
  const COLORS = {
    me: '#2F7DF0', grp: '#2F3A4A', teal: '#1F8A8A', sand: '#F2B84B',
    soft: '#CFE0FD', grey: '#C3C9D1', red: '#D2504A', green: '#3E9B6A', violet: '#8A6FD0', ink: '#222'
  };
  const PALETTE = [COLORS.me, COLORS.teal, COLORS.sand, COLORS.violet, COLORS.red, COLORS.green, COLORS.grp, COLORS.grey];

  if (window.Chart) {
    Chart.defaults.font.family = '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#4a5260';
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.maintainAspectRatio = false;
  }

  const alpha = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };

  window.CH = {
    COLORS, PALETTE, alpha,

    radar(labels, series, max) {
      return {
        type: 'radar',
        data: {
          labels,
          datasets: series.map(s => ({
            label: s.label, data: s.data,
            borderColor: s.color, backgroundColor: alpha(s.color, 0.18),
            pointBackgroundColor: s.color, borderWidth: 2, pointRadius: 3
          }))
        },
        options: {
          scales: { r: { min: 0, max: max || 10, ticks: { stepSize: (max || 10) / 5, backdropColor: 'transparent' }, grid: { color: '#e6e9ee' }, angleLines: { color: '#e6e9ee' }, pointLabels: { font: { size: 11.5 } } } },
          plugins: { legend: { position: 'bottom' } }
        }
      };
    },

    bar(labels, series, o) {
      o = o || {};
      return {
        type: 'bar',
        data: {
          labels,
          datasets: series.map(s => ({
            label: s.label, data: s.data,
            backgroundColor: s.colors || s.color, borderRadius: 6, maxBarThickness: 34
          }))
        },
        options: {
          indexAxis: o.horizontal ? 'y' : 'x',
          scales: {
            [o.horizontal ? 'x' : 'y']: { beginAtZero: true, max: o.max, stacked: !!o.stacked, grid: { color: '#eef0f3' }, title: o.title ? { display: true, text: o.title } : undefined },
            [o.horizontal ? 'y' : 'x']: { stacked: !!o.stacked, grid: { display: false } }
          },
          plugins: { legend: { display: series.length > 1 || !!o.legend, position: 'bottom' } }
        }
      };
    },

    doughnut(labels, data, colors) {
      return {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors || PALETTE, borderColor: '#fff', borderWidth: 3 }] },
        options: { cutout: '62%', plugins: { legend: { position: 'bottom' } } }
      };
    },

    /* 막대 + 수평 기준선 (예: 긍정:부정 3:1) */
    barRef(labels, series, ref, refLabel, o) {
      const cfg = CH.bar(labels, series, o);
      cfg.data.datasets.push({ type: 'line', label: refLabel, data: labels.map(() => ref), borderColor: COLORS.red, borderDash: [6, 6], pointRadius: 0, borderWidth: 2, order: 0 });
      cfg.options.plugins.legend.display = true;
      return cfg;
    },

    /* 산점도: points = [{x,y,name,me}] — 내 점은 파란색 큰 점 */
    scatter(points, o) {
      o = o || {};
      const others = points.filter(p => !p.me), mine = points.filter(p => p.me);
      const ds = [];
      if (others.length) ds.push({ label: '참가자', data: others, backgroundColor: alpha(COLORS.grp, 0.55), pointRadius: 7, pointHoverRadius: 9 });
      if (mine.length) ds.push({ label: '나', data: mine, backgroundColor: COLORS.me, pointRadius: 11, pointHoverRadius: 13 });
      const mx = o.xmid, my = o.ymid;
      return {
        type: 'scatter',
        data: { datasets: ds },
        options: {
          scales: {
            x: { min: o.xmin || 0, max: o.xmax, title: { display: true, text: o.xl || '' }, grid: { color: c => (mx != null && c.tick.value === mx) ? '#8a93a0' : '#eef0f3' } },
            y: { min: o.ymin || 0, max: o.ymax, title: { display: true, text: o.yl || '' }, grid: { color: c => (my != null && c.tick.value === my) ? '#8a93a0' : '#eef0f3' } }
          },
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: c => `${c.raw.name || ''} (${c.raw.x}, ${c.raw.y})` } }
          }
        }
      };
    }
  };
})();
