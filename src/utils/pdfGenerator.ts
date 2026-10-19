import { jsPDF } from 'jspdf';

export function exportUserGuidePDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Reach Trader - Official Trader Manual', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Automated High-Frequency Bot Trading & Strategic Manual Execution System', 14, 26);
  doc.text('Version 3.4 • Multi-Market Cloud Architecture • Published for Traders', 14, 32);

  y = 48;

  // Section 1: Overview
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('1. Core Architecture & Automated Logic', 14, y);
  y += 7;

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textIntro = [
    'Reach Trader is engineered with an algorithmic mean-reversion and momentum engine.',
    'Core Bot Formula: The bot automatically detects drawdowns and oversold market dips to execute BUY',
    'positions, and locks in gains automatically when target profit thresholds are achieved (SELL).',
    'All bots operate seamlessly with both Demo ($10,000) and Real funded accounts.',
  ];
  doc.text(textIntro, 14, y);
  y += 24;

  // Section 2: Three Main Trading Methods
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('2. The Three Trading Systems', 14, y);
  y += 7;

  // Method A: Manual
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('A. Manual Trader Mode', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const manualDesc = [
    '• Chart Types: Toggle instantly between Candlestick and Line charts for flexible trend reading.',
    '• Indicators & POC: Point of Control (POC) reveals the heaviest traded volume price line.',
    '  Green shaded zones represent Bullish Demand (optimal Buy entries), while Red shaded zones',
    '  represent Bearish Resistance (optimal Sell exits).',
    '• Trade With Bot Toggle: Activate the automated AI watcher on the chart. The bot reads live price',
    '  action, entering buys on dips and selling on green bursts while you monitor in real time.',
  ];
  doc.text(manualDesc, 14, y);
  y += 24;

  // Method B: Bulk Trader
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('B. Bulk Trader Mode (Continuous Volatility Scanner)', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const bulkDesc = [
    '• Automatic Market Scanner: Continuously scans volatility indices (Vol 10, 25, 50, 75, 100, Crash/Boom).',
    '• Execution Parameters: Set Stake ($0.50+), Number of Concurrent Trades (e.g. 5-20), and Tick duration.',
    '• Automated Risk Management: Set Target Profit and Maximum Loss (Stop Loss). When either limit is hit,',
    '  the scanner automatically shuts down to preserve capital and bank profits.',
  ];
  doc.text(bulkDesc, 14, y);
  y += 22;

  // Method C: Bot Trader
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('C. Bot Trader Mode (AI Profit Diagnoser & Market Reaper)', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const botDesc = [
    '• AI Profit & Loss Diagnoser: Scans 20+ pairs, predicts profit likelihood (88-94%), and skips risky/losing trades.',
    '• 4 Quantitative Technics: AI Market Reaper, RSI Mean-Reversion Sniper, EMA Trend Surfer, Zero-Drawdown Scalper.',
    '• Capital Protection: Recommends safe micro-stakes ($0.35) for small accounts ($5-$10) to compound securely.',
    '• Time Period Selection: Choose trading intervals from 1m, 5m, 10m, 30m, 1h, 6h, 12h, 24h, 48h to 72h.',
  ];
  doc.text(botDesc, 14, y);
  y += 24;

  // Section 3: Stay Trade & Financials
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('3. "Stay Trade" Background Engine & Payment Gateways', 14, y);
  y += 7;

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const stayTradeDesc = [
    '• Stay Trade: Enable this button on any trading screen. The bot will persist and execute trades',
    '  uninterrupted while you switch tabs, adjust configurations, or step away.',
    '• Deposits ($5 to $1,000) & Withdrawals: Instant card checkout (Visa/Mastercard) and real-time',
    '  mobile money integration (Airtel Money and MTN MoMo push prompts).',
    '• Multi-Currency Engine: Native support for USD, Nigeria (NGN), South Africa (ZAR), Malawi (MWK),',
    '  Zambia (ZMW), and Zimbabwe (ZiG). Toggle currencies anytime in Settings.',
    '• Reset Demo: Restore your demo account back to $10,000 anytime in the Settings menu.',
  ];
  doc.text(stayTradeDesc, 14, y);
  y += 26;

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 275, pageWidth - 14, 275);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Reach Trader • Powered by High-Performance Algorithmic Trading Systems • Confidential', 14, 282);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 45, 282);

  // Save the PDF
  doc.save('Reach_Trader_User_Guide.pdf');
}
