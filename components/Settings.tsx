import React, { useState } from 'react';
import { GomerConfig, CalculationMode } from '../types';

interface SettingsProps {
  config: GomerConfig;
  onUpdateConfig: (newConfig: GomerConfig) => void;
  onClearData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, onClearData }) => {
  const [tempThreshold, setTempThreshold] = useState(config.monthlyThreshold.toString());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tithePercent, setTithePercent] = useState(config.directionTithePercentage.toString());

  // Local state for labels to avoid flickering updates
  const [tempLabels, setTempLabels] = useState({
      tLabel: config.titheLabel || 'Diezmo',
      tAcronym: config.titheAcronym || 'D',
      oLabel: config.offeringLabel || 'Ofrenda',
      oAcronym: config.offeringAcronym || 'O'
  });

  const handleSaveThreshold = () => {
    const val = parseFloat(tempThreshold);
    if (!isNaN(val) && val > 0) {
      onUpdateConfig({ 
          ...config, 
          monthlyThreshold: val
      });
      alert('Meta guardada.');
    }
  };

  const handleSaveAdvanced = () => {
      const tp = parseFloat(tithePercent);
      if (!isNaN(tp)) {
          onUpdateConfig({
              ...config,
              directionTithePercentage: tp,
              titheLabel: tempLabels.tLabel,
              titheAcronym: tempLabels.tAcronym,
              offeringLabel: tempLabels.oLabel,
              offeringAcronym: tempLabels.oAcronym
          });
          alert('Configuración avanzada guardada.');
      }
  };

  const toggleGomer = () => {
      onUpdateConfig({ ...config, enableGomerLogic: !config.enableGomerLogic });
  };
  
  const toggleVisibility = (key: 'showTotalIncome' | 'showLocalAvailable') => {
      onUpdateConfig({ ...config, [key]: !config[key] });
  };

  const handleRemoveCategory = (id: string) => {
    if (confirm('¿Eliminar esta categoría?')) {
        const newCategories = config.customCategories.filter(c => c.id !== id);
        onUpdateConfig({ ...config, customCategories: newCategories });
    }
  };

  const handleClear = () => {
    if (confirm('¿Estás seguro de borrar todas las transacciones? Esto no se puede deshacer.')) {
      onClearData();
    }
  };

  const handleCalculationModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateConfig({ ...config, calculationMode: e.target.value as CalculationMode });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 pt-4 overflow-y-auto">
      <h2 className="text-3xl font-light text-white mb-8">Ajustes</h2>

      {/* Basic Settings */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg mb-6 border border-slate-700/50">
        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wide">
          Meta / Umbral Mensual
        </label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-3 text-slate-500">$</span>
            <input 
              type="number" 
              value={tempThreshold}
              onChange={(e) => setTempThreshold(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-lg py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700 font-mono text-lg"
            />
          </div>
          <button 
            onClick={handleSaveThreshold}
            className="bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-500 transition-colors"
          >
            ✓
          </button>
        </div>
      </div>

      {/* Categories Management */}
      <div className="mb-8">
        <h3 className="text-slate-500 text-xs font-bold uppercase mb-3 pl-1">Categorías Personalizadas</h3>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            {config.customCategories.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm italic text-center">
                    No hay categorías guardadas. Agrega una desde la Calculadora.
                </div>
            ) : (
                config.customCategories.map((cat, idx) => (
                    <div key={cat.id} className={`flex justify-between items-center p-3 ${idx !== config.customCategories.length - 1 ? 'border-b border-slate-700' : ''}`}>
                        <span className="text-white font-medium pl-2">{cat.name}</span>
                        <button 
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Advanced Settings Redesigned */}
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shadow-lg transition-all">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
          >
              <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 text-emerald-400`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-white font-medium">Configuración Avanzada</span>
              </div>
              <span className={`text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showAdvanced && (
            <div className="p-5 border-t border-slate-700 animate-fade-in space-y-6">
                
                {/* Mode Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Modo de Desglose (Calculo Meta)</label>
                    <select 
                        value={config.calculationMode || 'sundays'}
                        onChange={handleCalculationModeChange}
                        className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-emerald-500 outline-none"
                    >
                        <option value="sundays">Por Domingos (Predeterminado)</option>
                        <option value="weeks">Por Semanas (Fijo)</option>
                        <option value="days">Por Días</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Define cómo se divide la meta mensual para el cálculo del remanente.</p>
                </div>

                {/* Button Customization */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-700 pb-1 mt-2">Personalizar Botones</div>
                    
                    {/* Tithe */}
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Sigla (1 Letra)</label>
                        <input type="text" maxLength={2} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-white font-bold" value={tempLabels.tAcronym} onChange={e => setTempLabels({...tempLabels, tAcronym: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nombre Botón 1</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={tempLabels.tLabel} onChange={e => setTempLabels({...tempLabels, tLabel: e.target.value})} />
                    </div>

                    {/* Offering */}
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Sigla (1 Letra)</label>
                        <input type="text" maxLength={2} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-white font-bold" value={tempLabels.oAcronym} onChange={e => setTempLabels({...tempLabels, oAcronym: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nombre Botón 2</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={tempLabels.oLabel} onChange={e => setTempLabels({...tempLabels, oLabel: e.target.value})} />
                    </div>
                </div>

                <div className="h-px bg-slate-700/50"></div>

                {/* Percentage */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                        % Diezmo Dirección
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={tithePercent}
                            onChange={(e) => setTithePercent(e.target.value)}
                            className="w-24 bg-slate-900 text-white rounded-lg py-2 px-3 border border-slate-600 text-center"
                        />
                        <span className="text-slate-400">%</span>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-2">
                    {/* Gomer Logic Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-white text-sm font-medium">Lógica Gomer</div>
                            <div className="text-[10px] text-slate-500">Calcula remanente basado en meta.</div>
                        </div>
                        <button 
                            onClick={toggleGomer}
                            className={`w-10 h-6 rounded-full transition-colors relative ${config.enableGomerLogic ? 'bg-emerald-600' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.enableGomerLogic ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Total Income Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-white text-sm font-medium">Mostrar Total Ingresos</div>
                            <div className="text-[10px] text-slate-500">En la parte superior del reporte.</div>
                        </div>
                        <button 
                            onClick={() => toggleVisibility('showTotalIncome')}
                            className={`w-10 h-6 rounded-full transition-colors relative ${config.showTotalIncome ? 'bg-emerald-600' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.showTotalIncome ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Local Available Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-white text-sm font-medium">Mostrar Disponible Local</div>
                            <div className="text-[10px] text-slate-500">Suma final incluyendo "Otros".</div>
                        </div>
                        <button 
                            onClick={() => toggleVisibility('showLocalAvailable')}
                            className={`w-10 h-6 rounded-full transition-colors relative ${config.showLocalAvailable ? 'bg-emerald-600' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.showLocalAvailable ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSaveAdvanced}
                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-emerald-400 py-3 rounded-lg font-bold text-sm transition-colors border border-slate-600"
                >
                    Guardar Cambios Avanzados
                </button>
            </div>
          )}
      </div>

      <div className="mt-auto mb-4">
        <button 
          onClick={handleClear}
          className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Limpiar Base de Datos
        </button>
        <p className="text-center text-slate-600 text-xs mt-4">
          Gomer Calc v2.3
        </p>
      </div>
    </div>
  );
};

export default Settings;