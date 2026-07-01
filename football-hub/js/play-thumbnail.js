export function renderPlayThumbnail(play, highlightPosition = null) {
  const players = play.players || [];
  const routes  = play.routes  || [];

  const W = 320;
  const H = Math.round(W * (50 / 53.33));

  const yardsShown  = 50;
  const ezYards     = 10;
  const fieldYards  = yardsShown - ezYards;
  const pxPerYard   = H / yardsShown;
  const ezH         = ezYards * pxPerYard;
  const losY        = 40 * pxPerYard;
  const hashLeft    = W * 0.333;
  const hashRight   = W * 0.667;
  const hashLen     = pxPerYard * 0.4;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;border-radius:4px">`;
  svg += `<rect width="${W}" height="${H}" fill="#0f1b12"/>`;
  svg += `<rect x="0" y="0" width="${W}" height="${ezH}" fill="#162a1b"/>`;
  svg += `<text x="${W/2}" y="${ezH/2}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="bold" fill="#2a5a35" font-family="sans-serif" letter-spacing="1">END ZONE</text>`;

  for (let yd = 0; yd <= fieldYards; yd += 5) {
    const lineY = ezH + yd * pxPerYard;
    const isThick = yd % 10 === 0;
    svg += `<line x1="0" y1="${lineY}" x2="${W}" y2="${lineY}" stroke="${isThick ? '#2a5a34' : '#1a3020'}" stroke-width="${isThick ? 1.2 : 0.6}"/>`;
    if (yd > 0) {
      const yardNum = 10 + yd;
      if (yardNum <= 50) {
        svg += `<text x="3" y="${lineY}" dominant-baseline="middle" font-size="7" fill="#3a6040" font-family="sans-serif">${yardNum}</text>`;
        svg += `<text x="${W-3}" y="${lineY}" text-anchor="end" dominant-baseline="middle" font-size="7" fill="#3a6040" font-family="sans-serif">${yardNum}</text>`;
      }
    }
  }

  for (let yd = 0; yd <= fieldYards; yd++) {
    const lineY = ezH + yd * pxPerYard;
    svg += `<line x1="${hashLeft - hashLen}" y1="${lineY}" x2="${hashLeft + hashLen}" y2="${lineY}" stroke="#3a6a42" stroke-width="1"/>`;
    svg += `<line x1="${hashRight - hashLen}" y1="${lineY}" x2="${hashRight + hashLen}" y2="${lineY}" stroke="#3a6a42" stroke-width="1"/>`;
  }

  svg += `<line x1="1" y1="0" x2="1" y2="${H}" stroke="#4a7a50" stroke-width="2"/>`;
  svg += `<line x1="${W-1}" y1="0" x2="${W-1}" y2="${H}" stroke="#4a7a50" stroke-width="2"/>`;
  svg += `<line x1="0" y1="${ezH}" x2="${W}" y2="${ezH}" stroke="#5a9a65" stroke-width="2"/>`;
  svg += `<line x1="0" y1="${losY}" x2="${W}" y2="${losY}" stroke="#e8c84b" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.9"/>`;
  svg += `<text x="4" y="${losY - 2}" font-size="7" font-weight="bold" fill="#b09a30" font-family="sans-serif" dominant-baseline="auto">LOS</text>`;

  const groupMap = {
    QB:'QB', RB:'RB', FB:'RB', WR:'WR', TE:'TE',
    LT:'OL', LG:'OL', C:'OL', RG:'OL', RT:'OL',
    DE:'DL', DT:'DL', NT:'DL',
    MLB:'LB', OLB:'LB', ILB:'LB',
    CB:'DB', FS:'DB', SS:'DB', NB:'DB',
  };
  const highlightGroup = highlightPosition ? groupMap[highlightPosition] : null;
  const highlightedIds = new Set(
    players
      .filter(p => p.pos === highlightPosition || p.pos === highlightGroup)
      .map(p => p.id)
  );

  routes.forEach(r => {
    if (!r.points || r.points.length < 2) return;
    const pts = r.points.map(p => `${(p.x/100)*W},${(p.y/100)*H}`).join(' ');
    const isHL = r.playerId && highlightedIds.has(r.playerId);
    const color = isHL ? '#f0d04e' : (r.color || '#f0d04e');
    const width = isHL ? 2 : 1.5;
    const opacity = (highlightPosition && !isHL) ? ' opacity="0.3"' : '';
    const dash = r.tool === 'option' ? ' stroke-dasharray="3,4"' : '';
    svg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash}${opacity}/>`;
    if (r.tool === 'route' || r.tool === 'curve') {
      const last = r.points[r.points.length - 1];
      const prev = r.points[r.points.length - 2];
      const lx = (last.x/100)*W, ly = (last.y/100)*H;
      const px2 = (prev.x/100)*W, py2 = (prev.y/100)*H;
      const angle = Math.atan2(ly - py2, lx - px2);
      const s = 6;
      svg += `<polygon points="${lx},${ly} ${lx - s*Math.cos(angle-0.4)},${ly - s*Math.sin(angle-0.4)} ${lx - s*Math.cos(angle+0.4)},${ly - s*Math.sin(angle+0.4)}" fill="${color}"${opacity}/>`;
    }
  });

  players.forEach(p => {
    const x = (p.x / 100) * W;
    const y = (p.y / 100) * H;
    const isHL = highlightedIds.has(p.id);
    const fill   = isHL ? '#f0d04e' : (play.side === 'offense' ? '#4caf74' : '#d94f3d');
    const stroke = isHL ? '#fff' : '#0f1b12';
    const r      = isHL ? 6 : 5;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="4" fill="${isHL ? '#000' : '#fff'}" font-family="sans-serif" font-weight="bold">${p.pos}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
