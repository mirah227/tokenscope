import { jsPDF } from 'jspdf';

export interface TelemetryReportData {
  reportId: string;
  tokenSymbol: string;
  tokenName: string;
  mintAddress?: string | null;
  poolAddress?: string | null;
  dexId?: string | null;
  quoteSymbol?: string | null;
  pairUrl?: string | null;
  priceUsd?: string | number | null;
  liquidityUsd?: string | number | null;
  volume24h?: string | number | null;
  marketCap?: string | number | null;
  priceChange24h?: string | number | null;
  solanaSlot?: number | null;
  solanaRpcEndpoint?: string | null;
  solanaLatencyMs?: number | null;
  retrievalTimestamp: string;
}

export function generateTelemetryReportPdf(data: TelemetryReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // 1. Dark Modern Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 54, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TokenScope On-Chain Telemetry Report', margin + 14, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Automated Solana Market & Telemetry Snapshot · Non-Audit Diagnostic Document', margin + 14, y + 38);

  // Status Badge in Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 120, y + 14, 106, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('AUDIT: UNVERIFIED', pageWidth - margin - 112, y + 29);

  y += 66;

  // 2. Report Metadata Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y, contentWidth, 38, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.8);
  doc.rect(margin, y, contentWidth, 38, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  doc.text('Report ID:', margin + 10, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(data.reportId, margin + 55, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated (UTC):', margin + 10, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(data.retrievalTimestamp, margin + 85, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Target Asset:', margin + 270, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.tokenName} (${data.tokenSymbol})`, margin + 330, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Scope:', margin + 270, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text('Public On-Chain Telemetry & Market Pair Data', margin + 305, y + 30);

  y += 48;

  // 3. Section: On-Chain Identifiers (Accurately Labelled)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. On-Chain Identifiers & Solana Ledger State', margin, y);
  y += 6;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 12;

  const renderKeyVal = (label: string, val: string, isMono = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 8, y);

    if (isMono) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }
    doc.setTextColor(15, 23, 42);
    doc.text(val, margin + 155, y);
    y += 14;
  };

  renderKeyVal('Solana Token Mint Address:', data.mintAddress || 'Unavailable', true);
  renderKeyVal('DEX Liquidity Pool Address:', data.poolAddress || 'Unavailable', true);
  renderKeyVal('DEX Identifier / Pair:', data.dexId ? `${data.dexId.toUpperCase()} (${data.tokenSymbol}/${data.quoteSymbol || 'SOL'})` : 'Unavailable');
  
  const slotDisplay = data.solanaSlot && data.solanaSlot > 0
    ? `${data.solanaSlot.toLocaleString()} (Latency: ${data.solanaLatencyMs ?? 'N/A'}ms)`
    : 'Unavailable';
  renderKeyVal('Solana Mainnet Slot (Live RPC):', slotDisplay);
  renderKeyVal('RPC Cluster Endpoint:', data.solanaRpcEndpoint || 'https://api.mainnet-beta.solana.com');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Notice: The above addresses are public Solana cryptographic identifiers, NOT auditor signatures or endorsements.', margin + 8, y);
  y += 16;

  // 4. Section: Retrieved Market Telemetry (Source URLs & Timestamps)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Retrieved Market Telemetry Evidence', margin, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Data Source: DEX Screener Public API (https://api.dexscreener.com) · Retrieved: ' + data.retrievalTimestamp, margin + 8, y);
  y += 14;

  // Table of retrieved metrics
  const metrics = [
    { label: 'Token USD Price', value: data.priceUsd ? `$${data.priceUsd}` : 'Unavailable' },
    { label: '24h Trading Volume', value: data.volume24h ? `${data.volume24h}` : 'Unavailable' },
    { label: 'Total Pair Liquidity (USD)', value: data.liquidityUsd ? `${data.liquidityUsd}` : 'Unavailable' },
    { label: 'Market Capitalization / FDV', value: data.marketCap ? `${data.marketCap}` : 'Unavailable' },
    { label: '24h Price Change', value: data.priceChange24h !== undefined && data.priceChange24h !== null ? `${data.priceChange24h}%` : 'Unavailable' }
  ];

  metrics.forEach((m, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 4, y - 9, contentWidth - 8, 14, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(m.label, margin + 12, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(m.value), margin + 220, y + 1);
    y += 15;
  });

  y += 4;

  // 5. Section: Third-Party Security Audit Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Third-Party Security Audit Verification Status', margin, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 14;

  // Unverified Box
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(margin + 4, y - 4, contentWidth - 8, 38, 'F');
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.8);
  doc.rect(margin + 4, y - 4, contentWidth - 8, 38, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('THIRD-PARTY AUDIT STATUS: UNVERIFIED', margin + 14, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(120, 53, 15);
  doc.text(
    'No genuine, attributable public security audit record from an accredited auditor has been verified for this token.',
    margin + 14,
    y + 22
  );
  doc.text(
    'Self-reported claims or unverified badge metadata do not constitute formal verification or security validation.',
    margin + 14,
    y + 31
  );

  y += 46;

  // 6. Section: Checks Not Performed or Unavailable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Checks Not Performed or Unavailable', margin, y);
  y += 6;
  doc.line(margin, y, margin + contentWidth, y);
  y += 13;

  const checksNotDone = [
    { name: 'Independent Smart Contract Source Code Audit', status: 'NOT PERFORMED' },
    { name: 'Formal Mathematical Invariant Verification', status: 'NOT PERFORMED' },
    { name: 'Decompiled Bytecode & Instruction Flow Analysis', status: 'NOT PERFORMED' },
    { name: 'On-Chain Upgrade Authority & Multi-Sig Signer Lookup', status: 'UNAVAILABLE (RPC Lookup Limited)' },
    { name: 'Complete Wallet Holder & Insider Cluster Forensics', status: 'UNAVAILABLE (Ledger Snapshot Excluded)' },
    { name: 'Economic / Liquidity Drain & Oracle Exploit Simulation', status: 'NOT PERFORMED' }
  ];

  checksNotDone.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin + 4, y - 8, contentWidth - 8, 13, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`•  ${item.name}`, margin + 10, y + 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 28, 48);
    doc.text(item.status, pageWidth - margin - 150, y + 1);
    y += 14;
  });

  y += 6;

  // 7. Mandatory Disclaimer Box
  doc.setFillColor(255, 241, 242); // rose-50
  doc.rect(margin + 4, y, contentWidth - 8, 62, 'F');
  doc.setDrawColor(244, 63, 94); // rose-500
  doc.setLineWidth(0.8);
  doc.rect(margin + 4, y, contentWidth - 8, 62, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(159, 18, 57);
  doc.text('MANDATORY LEGAL & SECURITY DISCLAIMER', margin + 14, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(136, 19, 55);
  const disclaimerText = [
    'This report is an automated telemetry compilation created exclusively from public endpoints (DEX Screener API and Solana RPC).',
    'This document is NOT an independent security audit, smart-contract certification, financial advice, or endorsement of safety.',
    'Automated telemetry cannot detect all smart contract backdoors, migration traps, economic exploits, or rug-pull vulnerabilities.',
    'Never rely on automated telemetry to determine whether a token or protocol is safe. Users must conduct their own independent due diligence.'
  ];
  disclaimerText.forEach((line, lIdx) => {
    doc.text(line, margin + 14, y + 24 + lIdx * 9.5);
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('TokenScope Terminal · Solana On-Chain Telemetry System · Page 1 of 1', margin + 8, pageHeight - 16);
  doc.text(`Document Reference: ${data.reportId}`, pageWidth - margin - 150, pageHeight - 16);

  return doc;
}
