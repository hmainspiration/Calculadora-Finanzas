import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { Transaction, GomerConfig, TransactionType, CustomCategory } from './types';
import { generateId } from './utils';

enum View {
  CALCULATOR = 'calc',
  REPORT = 'report',
  SETTINGS = 'settings'
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.CALCULATOR);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gomer_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<GomerConfig>(() => {
    const saved = localStorage.getItem('gomer_config');
    const defaultConfig: GomerConfig = { 
        monthlyThreshold: 5000,
        customCategories: [],
        directionTithePercentage: 10,
        enableGomerLogic: true
    };
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('gomer_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gomer_config', JSON.stringify(config));
  }, [config]);

  const handleSaveTransaction = (amount: number, type: TransactionType, categoryName?: string) => {
    const newTransaction: Transaction = {
      id: generateId(),
      amount,
      type,
      categoryName,
      date: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const handleAddCategory = (name: string) => {
      const newCat: CustomCategory = { id: generateId(), name };
      setConfig(prev => ({
          ...prev,
          customCategories: [...prev.customCategories, newCat]
      }));
  };

  const handleClearData = () => {
    setTransactions([]);
    localStorage.removeItem('gomer_transactions');
  };

  // Icon Components
  const CalcIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  );
  
  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  );

  const CogIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  );

  const NavButton = ({ target, icon, label }: { target: View, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setView(target)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${view === target ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`${view === target ? 'scale-110' : ''} transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="bg-slate-900 h-screen w-full flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative">
      
      {/* Top Navigation */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 grid grid-cols-3 w-full z-50 shadow-md shrink-0">
        <NavButton target={View.CALCULATOR} icon={<CalcIcon />} label="Calculadora" />
        <NavButton target={View.REPORT} icon={<ChartIcon />} label="Reporte" />
        <NavButton target={View.SETTINGS} icon={<CogIcon />} label="Ajustes" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === View.CALCULATOR && (
          <Calculator 
            onSave={handleSaveTransaction} 
            customCategories={config.customCategories}
            onAddCategory={handleAddCategory}
          />
        )}
        {view === View.REPORT && (
          <Dashboard transactions={transactions} config={config} />
        )}
        {view === View.SETTINGS && (
          <Settings 
            config={config} 
            onUpdateConfig={setConfig} 
            onClearData={handleClearData} 
          />
        )}
      </div>

    </div>
  );
};

export default App;