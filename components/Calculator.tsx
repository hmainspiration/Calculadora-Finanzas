import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TransactionType, GomerConfig } from '../types';
import { safeCalculate, getWeekOfMonth, getDateForSpecificWeek } from '../utils';

interface CalculatorProps {
  onSave: (amount: number, type: TransactionType, categoryName?: string, customDate?: string) => void;
  config: GomerConfig;
  onAddCategory: (name: string) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onSave, config, onAddCategory }) => {
  const [display, setDisplay] = useState('0');
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Week Selection State: null means "Current/Live", number means specific week
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showWeekSelector, setShowWeekSelector] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input if no categories exist
  useEffect(() => {
    if (showCategoryModal && config.customCategories.length === 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCategoryModal, config.customCategories.length]);

  // Calculate current week and available weeks in this month
  const currentWeekInfo = useMemo(() => {
    const now = new Date();
    const currentWeekNum = getWeekOfMonth(now);
    
    // Simple way to get max weeks: check the last day of the month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const maxWeeks = getWeekOfMonth(lastDay);
    
    return { current: currentWeekNum, max: maxWeeks };
  }, []);

  const handlePress = (val: string) => {
    setDisplay((prev) => {
      if (prev === '0' && !['+', '-', '*', '/'].includes(val)) return val;
      if (lastResult !== null && !['+', '-', '*', '/'].includes(val)) {
         setLastResult(null);
         return val;
      }
      return prev + val;
    });
    setLastResult(null);
  };

  const handleClear = () => {
    setDisplay('0');
    setLastResult(null);
  };

  const handleDelete = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEqual = () => {
    const result = safeCalculate(display);
    if (result !== null) {
      setDisplay(result.toString());
      setLastResult(result);
    }
    return result;
  };

  const getTargetDate = (): string | undefined => {
    if (selectedWeek === null) return undefined; // Use Default (Now)
    return getDateForSpecificWeek(selectedWeek);
  };

  const prepareSave = (type: TransactionType) => {
    // Ensure we calculate first
    let amount = lastResult;
    if (amount === null) {
        amount = safeCalculate(display);
    }

    if (amount !== null && amount > 0) {
      // ROUNDING LOGIC APPLIED HERE
      const roundedAmount = Math.round(amount);
      const customDate = getTargetDate();

      if (type === TransactionType.OTHER) {
        setPendingAmount(roundedAmount);
        setShowCategoryModal(true);
      } else {
        onSave(roundedAmount, type, undefined, customDate);
        setDisplay('0');
        setLastResult(null);
        // We keep the selected week active for rapid entry, or we could reset it:
        // setSelectedWeek(null);
      }
    }
  };

  const handleCustomCategorySelect = (catName: string) => {
    if (pendingAmount) {
      const customDate = getTargetDate();
      onSave(pendingAmount, TransactionType.OTHER, catName, customDate);
      setPendingAmount(null);
      setShowCategoryModal(false);
      setDisplay('0');
      setLastResult(null);
      setNewCategoryName('');
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      const name = newCategoryName.trim();
      const exists = config.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        onAddCategory(name);
      }
      handleCustomCategorySelect(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCategory();
    }
  };

  const Button = ({ 
    label, 
    onClick, 
    className = "", 
    variant = "neutral" 
  }: { 
    label: React.ReactNode, 
    onClick: () => void, 
    className?: string,
    variant?: "neutral" | "action" | "accent" | "danger" | "special"
  }) => {
    const baseStyle = "h-16 w-full rounded-2xl text-2xl font-medium flex items-center justify-center transition-all active:scale-95 shadow-lg select-none";
    const variants = {
      neutral: "bg-slate-800 text-slate-200 hover:bg-slate-700",
      action: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/50",
      accent: "bg-amber-600 text-white hover:bg-amber-500",
      danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
      special: "bg-blue-600 text-white hover:bg-blue-500"
    };
    return (
      <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>{label}</button>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Display Screen */}
      <div className="flex-1 bg-transparent px-6 pt-4 pb-2 flex flex-col justify-end mb-2 relative">
        
        {/* WEEK SELECTOR UI */}
        <div className="absolute top-4 left-6 z-10">
            <div className="relative">
                <button 
                    onClick={() => setShowWeekSelector(!showWeekSelector)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg border ${
                        selectedWeek !== null 
                        ? 'bg-amber-500 text-black border-amber-400' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {selectedWeek !== null ? `Semana ${selectedWeek}` : `Semana Actual (${currentWeekInfo.current})`}
                    <span className="opacity-60 text-[10px]">▼</span>
                </button>

                {showWeekSelector && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden animate-fade-in z-50">
                        <div className="py-1">
                            <button 
                                onClick={() => { setSelectedWeek(null); setShowWeekSelector(false); }}
                                className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center ${selectedWeek === null ? 'bg-slate-700 text-emerald-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
                            >
                                <span>Semana Actual</span>
                                {selectedWeek === null && <span>✓</span>}
                            </button>
                            <div className="h-px bg-slate-700 mx-2"></div>
                            {Array.from({ length: currentWeekInfo.max }, (_, i) => i + 1).map(week => (
                                <button
                                    key={week}
                                    onClick={() => { setSelectedWeek(week); setShowWeekSelector(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center ${selectedWeek === week ? 'bg-slate-700 text-amber-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
                                >
                                    <span>Semana {week}</span>
                                    {selectedWeek === week && <span>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Warning when editing past weeks */}
            {selectedWeek !== null && selectedWeek !== currentWeekInfo.current && (
                <div className="text-[10px] text-amber-500 mt-1 ml-1 animate-pulse font-medium">
                    Registrando en pasado
                </div>
            )}
        </div>

        <div className="text-slate-400 text-lg h-6 text-right">
          {lastResult !== null ? 'Resultado' : ''}
        </div>
        <div className="text-6xl font-light text-white break-all text-right w-full">
          {display}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="bg-slate-900 pb-8 px-4">
        <div className="grid grid-cols-4 gap-3">
          <Button label="C" onClick={handleClear} variant="danger" />
          <Button label="÷" onClick={() => handlePress('/')} variant="accent" />
          <Button label="×" onClick={() => handlePress('*')} variant="accent" />
          <Button label="⌫" onClick={handleDelete} variant="neutral" />

          <Button label="7" onClick={() => handlePress('7')} />
          <Button label="8" onClick={() => handlePress('8')} />
          <Button label="9" onClick={() => handlePress('9')} />
          <Button label="−" onClick={() => handlePress('-')} variant="accent" />

          <Button label="4" onClick={() => handlePress('4')} />
          <Button label="5" onClick={() => handlePress('5')} />
          <Button label="6" onClick={() => handlePress('6')} />
          <Button label="+" onClick={() => handlePress('+')} variant="accent" />

          <Button label="1" onClick={() => handlePress('1')} />
          <Button label="2" onClick={() => handlePress('2')} />
          <Button label="3" onClick={() => handlePress('3')} />
          
          <div className="row-span-2 flex flex-col gap-3">
             <Button label="=" onClick={handleEqual} variant="special" className="flex-1" />
          </div>

          <Button label="0" onClick={() => handlePress('0')} className="col-span-2" />
          <Button label="." onClick={() => handlePress('.')} />

          <div className="col-span-4 grid grid-cols-3 gap-3 mt-2 border-t border-slate-700 pt-4">
            <Button 
                label={<div className="flex flex-col items-center text-sm"><span className="text-xl font-bold">{config.titheAcronym || 'D'}</span>{config.titheLabel || 'Diezmo'}</div>} 
                onClick={() => prepareSave(TransactionType.TITHE)} 
                variant="action" 
            />
            <Button 
                label={<div className="flex flex-col items-center text-sm"><span className="text-xl font-bold">{config.offeringAcronym || 'O'}</span>{config.offeringLabel || 'Ofrenda'}</div>} 
                onClick={() => prepareSave(TransactionType.OFFERING)} 
                variant="action" 
            />
            <Button 
                label={<div className="flex flex-col items-center text-sm"><span className="text-xl font-bold">+</span>Otro</div>} 
                onClick={() => prepareSave(TransactionType.OTHER)} 
                className="bg-slate-700 text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Category Modal Overlay */}
      {showCategoryModal && (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col animate-fade-in p-4">
          <div className="flex justify-between items-center mb-6 pt-2">
            <h3 className="text-white text-xl font-light">Guardar "Otros"</h3>
            <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 p-2 hover:text-white">✕</button>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="text-center mb-6">
                <span className="text-sm text-slate-400 block mb-1">
                    Monto a guardar 
                    {selectedWeek && <span className="text-amber-400 font-bold ml-1">(Semana {selectedWeek})</span>}
                </span>
                <span className="text-5xl text-emerald-400 font-mono font-bold tracking-tighter">
                {pendingAmount}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 min-h-0">
                <div className="grid grid-cols-2 gap-3 content-start">
                {config.customCategories.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-4 italic text-sm border border-dashed border-slate-700 rounded-xl">
                        Crea tu primera categoría abajo 👇
                    </div>
                )}
                {config.customCategories.map(cat => (
                    <button
                    key={cat.id}
                    onClick={() => handleCustomCategorySelect(cat.name)}
                    className="bg-slate-800 p-4 rounded-xl text-slate-200 border border-slate-700 hover:border-emerald-500 hover:bg-slate-700 hover:text-white transition-all text-sm font-medium break-words shadow-sm"
                    >
                    {cat.name}
                    </button>
                ))}
                </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 mt-auto">
              <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block tracking-wider">Nueva Categoría</label>
              <div className="flex gap-2">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej. Primicias, Eventos..."
                  className="flex-1 bg-slate-900 text-white p-3 rounded-lg border border-slate-600 focus:border-emerald-500 outline-none placeholder-slate-600"
                />
                <button 
                  onClick={handleCreateCategory}
                  className="bg-emerald-600 active:bg-emerald-700 text-white px-4 rounded-lg font-bold flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;