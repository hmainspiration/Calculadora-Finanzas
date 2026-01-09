import React, { useMemo } from 'react';
import { Transaction, GomerConfig, TransactionType, FinancialReport } from '../types';
import { formatCurrency, getSundaysInMonth } from '../utils';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  transactions: Transaction[];
  config: GomerConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, config }) => {
  const currentDate = new Date();
  
  // Calculate Report Logic
  const report: FinancialReport = useMemo(() => {
    const sundaysInMonth = getSundaysInMonth(currentDate);
    const weeklyThreshold = config.monthlyThreshold / sundaysInMonth;
    
    let totalTithes = 0;
    let totalOfferings = 0;
    let totalOthers = 0;
    const byCategory: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === TransactionType.TITHE) totalTithes += t.amount;
      else if (t.type === TransactionType.OFFERING) totalOfferings += t.amount;
      else {
        totalOthers += t.amount;
        const catName = t.categoryName || 'Varios';
        byCategory[catName] = (byCategory[catName] || 0) + t.amount;
      }
    });

    const totalBase = totalTithes + totalOfferings + totalOthers;
    
    // LOGIC FIX: Direction Tithe comes ONLY from Tithes + Offerings (Ordinaria)
    // "Otros" are excluded from this 10% deduction but remain in the local available fund.
    const titheableBase = totalTithes + totalOfferings;
    
    // Configurable percentage
    const directionPercentage = config.directionTithePercentage / 100;
    const directionTithe = titheableBase * directionPercentage;
    
    const available = totalBase - directionTithe;
    
    let ministerAmount = 0;
    let remnant = 0;
    let isGoalMet = false;

    if (config.enableGomerLogic) {
      // Gomer Logic
      if (available > weeklyThreshold) {
        ministerAmount = weeklyThreshold;
        remnant = available - weeklyThreshold;
        isGoalMet = true;
      } else {
        ministerAmount = available;
        remnant = 0;
        isGoalMet = false;
      }
    } else {
      // Standard Logic (Minister gets everything available after direction tithe)
      ministerAmount = available;
      remnant = 0;
      isGoalMet = true; // Technically always met if no threshold enforced
    }

    return {
      sundaysInMonth,
      weeklyThreshold,
      totalBase,
      totalTithes,
      totalOfferings,
      totalOthers,
      directionTithe,
      available,
      ministerAmount,
      remnant,
      isGoalMet,
      byCategory
    };
  }, [transactions, config, currentDate]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateStr = currentDate.toLocaleDateString();

    doc.setFontSize(20);
    doc.text("Reporte Financiero - Gomer Calc", 20, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${dateStr}`, 20, 30);
    
    let y = 40;
    doc.text(`Total Ingresos: ${formatCurrency(report.totalBase)}`, 20, y); y += 10;
    doc.text(`- Diezmos: ${formatCurrency(report.totalTithes)}`, 30, y); y += 7;
    doc.text(`- Ofrendas: ${formatCurrency(report.totalOfferings)}`, 30, y); y += 7;
    doc.text(`- Otros: ${formatCurrency(report.totalOthers)}`, 30, y); y += 10;
    
    doc.line(20, y, 190, y); y += 10;

    doc.text(`Diezmo Dirección (${config.directionTithePercentage}% de D+O): ${formatCurrency(report.directionTithe)}`, 20, y); y += 10;
    doc.text(`Disponible Local: ${formatCurrency(report.available)}`, 20, y); y += 10;
    
    if (config.enableGomerLogic) {
        doc.text(`Meta Semanal (Gomer): ${formatCurrency(report.weeklyThreshold)}`, 20, y); y += 10;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text(`Ministro: ${formatCurrency(report.ministerAmount)}`, 20, y); y += 10;
    
    if (report.remnant > 0) {
        doc.setTextColor(0, 150, 0);
        doc.text(`Remanente: ${formatCurrency(report.remnant)}`, 20, y);
    }
    
    doc.save(`reporte-${dateStr.replace(/\//g, '-')}.pdf`);
  };

  const StatCard = ({ label, value, subValue, highlight = false, colorClass = "text-white" }: any) => (
    <div className={`bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex flex-col ${highlight ? 'ring-2 ring-emerald-500' : ''}`}>
      <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</span>
      {subValue && <span className="text-xs text-slate-500 mt-1">{subValue}</span>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-24 px-4 pt-4">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-white">Reporte</h2>
          <button 
            onClick={generatePDF}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
          </button>
      </div>

      {/* Gomer Status - Only show if enabled */}
      {config.enableGomerLogic && (
        <div className="mb-6">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${report.isGoalMet ? 'from-emerald-900 to-emerald-800 border-emerald-500' : 'from-slate-800 to-slate-900 border-slate-700'} border shadow-xl relative overflow-hidden`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                <h3 className="text-emerald-100 font-medium">Meta Gomer Semanal</h3>
                <span className="bg-black/30 text-xs px-2 py-1 rounded text-white">
                    {report.sundaysInMonth} Domingos
                </span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                {formatCurrency(report.weeklyThreshold)}
                </div>
            </div>
            </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Ingresos Detallados</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard 
          label="Diezmos" 
          value={report.totalTithes} 
          colorClass="text-emerald-300"
        />
        <StatCard 
          label="Ofrendas" 
          value={report.totalOfferings} 
          colorClass="text-amber-300"
        />
        {report.totalOthers > 0 && (
           <StatCard 
             label="Otros" 
             value={report.totalOthers} 
             colorClass="text-blue-300"
             className="col-span-2"
           />
        )}
      </div>

      {/* Total Calculation */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
        <div className="flex justify-between items-end mb-2">
            <span className="text-slate-400">Total Ingresos</span>
            <span className="text-xl font-bold text-white">{formatCurrency(report.totalBase)}</span>
        </div>
        <div className="flex justify-between items-end mb-4 text-sm">
            <span className="text-red-400">(-) Diezmo Dirección (Sobre D+O)</span>
            <span className="text-red-400 font-mono">-{formatCurrency(report.directionTithe)}</span>
        </div>
        <div className="h-px bg-slate-600 mb-3"></div>
        <div className="flex justify-between items-end">
            <span className="text-emerald-400 font-bold">Disponible Local</span>
            <span className="text-2xl font-bold text-emerald-400">{formatCurrency(report.available)}</span>
        </div>
      </div>

      {/* Final Distribution */}
      <div className="mb-6 grid grid-cols-2 gap-3">
         <StatCard 
            label="Ministro" 
            value={report.ministerAmount} 
            colorClass="text-blue-400"
          />
          {config.enableGomerLogic && (
            <StatCard 
                label="Remanente" 
                value={report.remnant} 
                colorClass="text-emerald-400"
                highlight={report.isGoalMet}
            />
          )}
      </div>

      {/* Category Breakdown (if others exist) */}
      {Object.keys(report.byCategory).length > 0 && (
          <>
            <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Desglose "Otros"</h3>
            <div className="bg-slate-800 rounded-lg p-3 space-y-2 mb-6">
                {Object.entries(report.byCategory).map(([name, amount]) => (
                    <div key={name} className="flex justify-between text-sm">
                        <span className="text-slate-300">{name}</span>
                        <span className="font-mono text-slate-400">{formatCurrency(amount)}</span>
                    </div>
                ))}
            </div>
          </>
      )}

      {/* Transactions List */}
      <h3 className="text-lg text-slate-400 mb-3">Historial</h3>
      <div className="space-y-2 mb-8">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-600 italic">No hay registros aún.</div>
        ) : (
          transactions.slice().reverse().map(t => (
            <div key={t.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border-l-4 border-slate-600"
                 style={{ borderLeftColor: t.type === TransactionType.TITHE ? '#10b981' : t.type === TransactionType.OFFERING ? '#f59e0b' : '#3b82f6' }}>
              <div>
                <div className="text-sm font-bold text-slate-200">
                    {t.type === TransactionType.OTHER ? (t.categoryName || 'Otro') : t.type}
                </div>
                <div className="text-xs text-slate-500">{new Date(t.date).toLocaleTimeString()}</div>
              </div>
              <div className="font-mono text-lg text-slate-300">
                {formatCurrency(t.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;