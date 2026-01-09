import React, { useMemo, useState } from 'react';
import { Transaction, GomerConfig, TransactionType } from '../types';
import { formatCurrency, getSundaysInMonth, getWeekOfMonth } from '../utils';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  transactions: Transaction[];
  config: GomerConfig;
  onDelete: (id: string) => void;
}

type ViewMode = 'weekly' | 'monthly';

const Dashboard: React.FC<DashboardProps> = ({ transactions, config, onDelete }) => {
  // Default to Weekly as requested
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const currentDate = new Date();
  
  // 1. FILTER TRANSACTIONS BY CURRENT MONTH
  const currentMonthTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentDate.getMonth() && 
                 tDate.getFullYear() === currentDate.getFullYear();
      });
  }, [transactions]);

  const sundaysInMonth = getSundaysInMonth(currentDate);
  const weeklyThreshold = Math.round(config.monthlyThreshold / sundaysInMonth);
  const monthlyThreshold = Math.round(config.monthlyThreshold);

  // 2. CALCULATE WEEKLY STATS (The Default View)
  const weeklyStats = useMemo(() => {
      // Map to store data per week
      const weeks: Record<number, { 
          id: number,
          tithes: number, 
          offerings: number, 
          others: number,
          transactions: Transaction[] 
      }> = {};
      
      // Initialize weeks based on max possible weeks (usually 5) or just dynamically
      // Let's populate dynamically based on transactions to avoid empty cards
      currentMonthTransactions.forEach(t => {
          const weekNum = getWeekOfMonth(new Date(t.date));
          if (!weeks[weekNum]) {
              weeks[weekNum] = { id: weekNum, tithes: 0, offerings: 0, others: 0, transactions: [] };
          }
          
          weeks[weekNum].transactions.push(t);

          if (t.type === TransactionType.TITHE) weeks[weekNum].tithes += t.amount;
          else if (t.type === TransactionType.OFFERING) weeks[weekNum].offerings += t.amount;
          else weeks[weekNum].others += t.amount;
      });

      // Calculate logic per week
      return Object.values(weeks).map(week => {
          const titheable = week.tithes + week.offerings;
          const dirTithe = Math.round(titheable * (config.directionTithePercentage / 100));
          const net = titheable - dirTithe;
          
          let minister = 0;
          let rem = 0;
          
          if (config.enableGomerLogic) {
              if (net > weeklyThreshold) {
                  minister = weeklyThreshold;
                  rem = net - weeklyThreshold;
              } else {
                  minister = net;
                  rem = 0;
              }
          } else {
              minister = net;
          }

          return {
              weekNum: week.id,
              totalBase: titheable + week.others,
              tithes: week.tithes,
              offerings: week.offerings,
              others: week.others,
              directionTithe: dirTithe,
              net, // Base Neta (D+O - 10%)
              minister,
              remnant: rem,
              transactions: week.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
      }).sort((a, b) => a.weekNum - b.weekNum);

  }, [currentMonthTransactions, config, weeklyThreshold]);

  // 3. CALCULATE MONTHLY STATS (The Aggregate "Official" View)
  const monthlyStats = useMemo(() => {
    let totalTithes = 0;
    let totalOfferings = 0;
    let totalOthers = 0;
    const byCategory: Record<string, number> = {};

    currentMonthTransactions.forEach(t => {
      if (t.type === TransactionType.TITHE) totalTithes += t.amount;
      else if (t.type === TransactionType.OFFERING) totalOfferings += t.amount;
      else {
        totalOthers += t.amount;
        const catName = t.categoryName || 'Varios';
        byCategory[catName] = (byCategory[catName] || 0) + t.amount;
      }
    });

    const totalBase = totalTithes + totalOfferings + totalOthers;
    
    // Diezmo Dirección (Only from D+O)
    const titheableBase = totalTithes + totalOfferings;
    const directionTithe = Math.round(titheableBase * (config.directionTithePercentage / 100));
    
    // Net base for Minister/Remnant (Total D+O - Direction)
    const netFromBase = titheableBase - directionTithe;
    
    let ministerAmount = 0;
    let remnant = 0;

    // MONTHLY LOGIC: Compare Total Net Base vs Monthly Threshold
    if (config.enableGomerLogic) {
      if (netFromBase > monthlyThreshold) {
        ministerAmount = monthlyThreshold;
        remnant = netFromBase - monthlyThreshold;
      } else {
        ministerAmount = netFromBase;
        remnant = 0;
      }
    } else {
      ministerAmount = netFromBase;
      remnant = 0;
    }

    return {
      totalBase,
      totalTithes,
      totalOfferings,
      totalOthers,
      directionTithe,
      ministerAmount,
      remnant,
      byCategory,
      netFromBase
    };
  }, [currentMonthTransactions, config, monthlyThreshold]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateStr = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const isWeekly = viewMode === 'weekly';

    doc.setFontSize(20);
    doc.text(isWeekly ? "Reporte Semanal" : "Reporte Mensual Global", 20, 20);
    doc.setFontSize(12);
    doc.text(`Mes: ${dateStr.toUpperCase()}`, 20, 30);
    
    let y = 45;

    if (isWeekly) {
        // === GENERATE WEEKLY PDF ===
        weeklyStats.forEach(week => {
            // Check page break
            if (y > 250) { doc.addPage(); y = 20; }

            // Week Header
            doc.setFillColor(230, 230, 230);
            doc.rect(20, y-5, 170, 8, 'F');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`SEMANA ${week.weekNum} - Meta: ${formatCurrency(weeklyThreshold)}`, 25, y);
            y += 10;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            
            // Stats Row 1
            doc.text(`Ingresos: ${formatCurrency(week.totalBase)}`, 25, y);
            doc.text(`Diezmos: ${formatCurrency(week.tithes)}`, 80, y);
            doc.text(`Ofrendas: ${formatCurrency(week.offerings)}`, 135, y);
            y += 6;
            
            // Stats Row 2
            if (week.others > 0) {
                 doc.text(`Otros: ${formatCurrency(week.others)}`, 25, y);
            }
            doc.text(`(-) 10% Dirección: ${formatCurrency(week.directionTithe)}`, 80, y);
            doc.text(`Neto (D+O): ${formatCurrency(week.net)}`, 135, y);
            y += 10;

            // Result
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 150);
            doc.text(`Ministro: ${formatCurrency(week.minister)}`, 25, y);
            
            if (week.remnant > 0) {
                doc.setTextColor(0, 128, 0);
                doc.text(`Remanente: ${formatCurrency(week.remnant)}`, 80, y);
            } else {
                doc.setTextColor(100);
                doc.text(`Remanente: ${formatCurrency(0)}`, 80, y);
            }
            doc.setTextColor(0);
            
            // Transaction List for this week
            y += 8;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("Detalle:", 25, y);
            y += 4;
            
            week.transactions.forEach(t => {
                const name = t.type === TransactionType.OTHER ? (t.categoryName || 'Otro') : t.type;
                doc.text(`- ${name}: ${formatCurrency(t.amount)}`, 30, y);
                y += 4;
            });

            y += 10; // Space between weeks
        });

    } else {
        // === GENERATE MONTHLY PDF ===
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y-10, 170, 35, 'F');
        doc.setFontSize(14);
        doc.text(`Ingresos Totales Mes: ${formatCurrency(monthlyStats.totalBase)}`, 30, y); y += 10;
        doc.setFontSize(11);
        doc.text(`(+) Diezmos: ${formatCurrency(monthlyStats.totalTithes)}`, 30, y); y += 7;
        doc.text(`(+) Ofrendas: ${formatCurrency(monthlyStats.totalOfferings)}`, 30, y); y += 7;
        
        if (monthlyStats.totalOthers > 0) {
            doc.text(`(+) Otros: ${formatCurrency(monthlyStats.totalOthers)}`, 30, y);
            y += 7;
            doc.setFontSize(9);
            doc.setTextColor(80);
            Object.entries(monthlyStats.byCategory).forEach(([name, amount]) => {
                doc.text(`   • ${name}: ${formatCurrency(amount)}`, 40, y);
                y += 5;
            });
            doc.setTextColor(0);
            doc.setFontSize(11);
        }
        y += 10;
        
        doc.line(20, y, 190, y); y += 10;

        doc.setFontSize(12);
        doc.text(`(-) Diezmo Dirección (10% Total): ${formatCurrency(monthlyStats.directionTithe)}`, 20, y); y += 10;
        doc.text(`Base Neta Acumulada: ${formatCurrency(monthlyStats.netFromBase)}`, 20, y); y += 15;

        if (config.enableGomerLogic) {
            doc.setDrawColor(0, 150, 0);
            doc.setLineWidth(0.5);
            doc.line(20, y, 190, y); y += 10;
            
            doc.setFontSize(14);
            doc.text("Distribución Final (Logica Mensual)", 20, y); y += 10;
            doc.setFontSize(12);
            doc.text(`Meta Mensual: ${formatCurrency(monthlyThreshold)}`, 20, y); y += 10;
            
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 200);
            doc.text(`Ministro: ${formatCurrency(monthlyStats.ministerAmount)}`, 20, y); y += 10;
            
            if (monthlyStats.remnant > 0) {
                doc.setTextColor(0, 150, 0);
                doc.text(`Remanente: ${formatCurrency(monthlyStats.remnant)}`, 20, y);
            } else {
                doc.setTextColor(100);
                doc.text(`Remanente: ${formatCurrency(0)}`, 20, y);
            }
        }
    }
    
    doc.save(`reporte-${viewMode}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}.pdf`);
  };

  const StatCard = ({ label, value, subValue, highlight = false, colorClass = "text-white", className="" }: any) => (
    <div className={`bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex flex-col ${highlight ? 'ring-2 ring-emerald-500' : ''} ${className}`}>
      <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</span>
      {subValue && <span className="text-xs text-slate-500 mt-1">{subValue}</span>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-24 pt-4 relative">
      
      {/* Header & Tabs */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-light text-white capitalize">
                {currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
                onClick={generatePDF}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF
            </button>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode('weekly')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'weekly' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                Semanal (Desglose)
            </button>
            <button 
                onClick={() => setViewMode('monthly')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'monthly' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                Mensual (Global)
            </button>
        </div>
      </div>

      <div className="px-4 flex-1">
        
        {viewMode === 'weekly' ? (
            /* ================= WEEKLY VIEW (DEFAULT) ================= */
            <div className="animate-fade-in space-y-6">
                {weeklyStats.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">No hay registros este mes.</div>
                ) : (
                    weeklyStats.map((week) => (
                        <div key={week.weekNum} className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                            {/* Card Header */}
                            <div className="bg-slate-700/50 p-4 flex justify-between items-center border-b border-slate-600">
                                <span className="text-xl font-bold text-white">Semana {week.weekNum}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Meta Semanal</span>
                                    <span className="text-sm font-mono text-slate-200">{formatCurrency(weeklyThreshold)}</span>
                                </div>
                            </div>
                            
                            <div className="p-5 space-y-5">
                                {/* Income Section - Side by Side Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Diezmos</span>
                                        <span className="block text-xl text-emerald-400 font-bold tracking-tight">
                                            {formatCurrency(week.tithes)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Ofrendas</span>
                                        <span className="block text-xl text-amber-400 font-bold tracking-tight">
                                            {formatCurrency(week.offerings)}
                                        </span>
                                    </div>
                                </div>

                                {/* Deductions Row */}
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm text-red-300/80">(-) 10% Dirección</span>
                                    <span className="text-base font-mono font-bold text-red-400">-{formatCurrency(week.directionTithe)}</span>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-700 w-full"></div>

                                {/* Big Results Blocks */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block mb-2">Ministro</span>
                                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl py-3 px-2">
                                            <span className="text-2xl font-bold text-white">{formatCurrency(week.minister)}</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${week.remnant > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>Remanente</span>
                                        <div className={`rounded-xl py-3 px-2 border ${week.remnant > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800 border-slate-600'}`}>
                                            <span className={`text-2xl font-bold ${week.remnant > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {formatCurrency(week.remnant)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer / Toggle Details */}
                            <details className="group border-t border-slate-700 bg-slate-800">
                                <summary className="flex justify-between items-center w-full p-3 cursor-pointer list-none hover:bg-slate-700 transition-colors">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        Ver Movimientos ({week.transactions.length})
                                    </span>
                                </summary>
                                <div className="p-3 space-y-2 bg-slate-900/30">
                                    {week.transactions.map(t => (
                                        <div key={t.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full shadow-sm ${t.type === TransactionType.TITHE ? 'bg-emerald-500' : t.type === TransactionType.OFFERING ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-200 font-medium">
                                                        {t.type === TransactionType.OTHER ? (t.categoryName || 'Otro') : t.type}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{new Date(t.date).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-base text-white font-bold">{formatCurrency(t.amount)}</span>
                                                <button 
                                                    onClick={() => onDelete(t.id)} 
                                                    className="bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400 p-2 rounded-lg transition-all"
                                                    aria-label="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    ))
                )}
            </div>
        ) : (
            /* ================= MONTHLY VIEW (OPTIONAL AGGREGATE) ================= */
            <div className="animate-fade-in">
                <div className="bg-amber-900/20 border border-amber-800 p-3 rounded-lg text-xs text-amber-200 mb-6 flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <p>Esta vista aplica la lógica al <strong>acumulado total del mes</strong>. Si el total no supera la Meta Mensual ({formatCurrency(monthlyThreshold)}), el remanente será $0, corrigiendo cualquier remanente semanal previo.</p>
                </div>

                {config.enableGomerLogic && (
                    <div className="mb-6">
                        <div className={`p-5 rounded-2xl bg-gradient-to-r ${monthlyStats.remnant > 0 ? 'from-emerald-900/90 to-emerald-800/60 border-emerald-500' : 'from-slate-800 to-slate-900 border-slate-700'} border shadow-xl relative overflow-hidden`}>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-emerald-100 font-bold uppercase tracking-wider text-sm">Meta Mensual Global</h3>
                                </div>
                                <div className="text-5xl font-bold text-white mb-2 tracking-tight">
                                    {formatCurrency(monthlyThreshold)}
                                </div>
                                <div className="text-sm text-slate-300 mt-2 bg-black/20 inline-block px-3 py-1 rounded-full">
                                    Base Neta Acumulada: <span className="text-white font-mono font-bold">{formatCurrency(monthlyStats.netFromBase)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Distribution - Monthly Logic */}
                <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 tracking-wider">Distribución Global</h3>
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <StatCard 
                        label="Ministro Total" 
                        subValue="(Acumulado)"
                        value={monthlyStats.ministerAmount} 
                        colorClass="text-blue-400"
                        className="h-full justify-between"
                    />
                    {config.enableGomerLogic && (
                        <StatCard 
                            label="Remanente Total" 
                            subValue="(Acumulado)"
                            value={monthlyStats.remnant} 
                            colorClass={monthlyStats.remnant > 0 ? "text-emerald-400" : "text-slate-500"}
                            highlight={monthlyStats.remnant > 0}
                            className="h-full justify-between"
                        />
                    )}
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-6 space-y-3 shadow-lg">
                    <div className="flex justify-between text-base">
                        <span className="text-slate-400">Total Diezmos</span>
                        <span className="text-white font-mono font-bold">{formatCurrency(monthlyStats.totalTithes)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                        <span className="text-slate-400">Total Ofrendas</span>
                        <span className="text-white font-mono font-bold">{formatCurrency(monthlyStats.totalOfferings)}</span>
                    </div>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-base">
                        <span className="text-red-400">(-) Diezmo Dirección</span>
                        <span className="text-red-400 font-mono font-bold">-{formatCurrency(monthlyStats.directionTithe)}</span>
                    </div>
                </div>

                {monthlyStats.totalOthers > 0 && (
                    <>
                        <h3 className="text-xs uppercase text-slate-500 font-bold mb-3 tracking-wider">Otros Ingresos</h3>
                        <div className="bg-slate-800 rounded-2xl p-4 space-y-3 mb-6 border border-slate-700 shadow-lg">
                            {Object.entries(monthlyStats.byCategory).map(([name, amount]) => (
                                <div key={name} className="flex justify-between text-sm">
                                    <span className="text-slate-300">{name}</span>
                                    <span className="font-mono text-slate-200 font-bold">{formatCurrency(amount)}</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-700 mt-2 pt-3 flex justify-between font-bold text-lg">
                                <span className="text-blue-400">Total Otros</span>
                                <span className="text-blue-400">{formatCurrency(monthlyStats.totalOthers)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;