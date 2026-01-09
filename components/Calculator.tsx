import React, { useState, useRef, useEffect } from 'react';
import { TransactionType, CustomCategory } from '../types';
import { safeCalculate } from '../utils';

interface CalculatorProps {
  onSave: (amount: number, type: TransactionType, categoryName?: string) => void;
  customCategories: CustomCategory[];
  onAddCategory: (name: string) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onSave, customCategories, onAddCategory }) => {
  const [display, setDisplay] = useState('0');
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input if no categories exist
  useEffect(() => {
    if (showCategoryModal && customCategories.length === 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCategoryModal, customCategories.length]);

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

  const prepareSave = (type: TransactionType) => {
    // Ensure we calculate first
    let amount = lastResult;
    if (amount === null) {
        amount = safeCalculate(display);
    }

    if (amount !== null && amount > 0) {
      if (type === TransactionType.OTHER) {
        setPendingAmount(amount);
        setShowCategoryModal(true);
      } else {
        onSave(amount, type);
        setDisplay('0');
        setLastResult(null);
      }
    }
  };

  const handleCustomCategorySelect = (catName: string) => {
    if (pendingAmount) {
      onSave(pendingAmount, TransactionType.OTHER, catName);
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
      // Check if already exists to avoid duplicates
      const exists = customCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
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
      <div className="flex-1 bg-transparent p-6 flex flex-col items-end justify-end mb-4">
        <div className="text-slate-400 text-lg h-6">
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
                label={<div className="flex flex-col items-center text-sm"><span className="text-xl font-bold">D</span>Diezmo</div>} 
                onClick={() => prepareSave(TransactionType.TITHE)} 
                variant="action" 
            />
            <Button 
                label={<div className="flex flex-col items-center text-sm"><span className="text-xl font-bold">O</span>Ofrenda</div>} 
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
                <span className="text-sm text-slate-400 block mb-1">Monto a guardar</span>
                <span className="text-5xl text-emerald-400 font-mono font-bold tracking-tighter">
                {pendingAmount}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 min-h-0">
                <div className="grid grid-cols-2 gap-3 content-start">
                {customCategories.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-4 italic text-sm border border-dashed border-slate-700 rounded-xl">
                        Crea tu primera categoría abajo 👇
                    </div>
                )}
                {customCategories.map(cat => (
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