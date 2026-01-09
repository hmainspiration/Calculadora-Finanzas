import React, { useState } from 'react';
import { GomerConfig } from '../types';

interface SettingsProps {
  config: GomerConfig;
  onUpdateConfig: (newConfig: GomerConfig) => void;
  onClearData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, onClearData }) => {
  const [tempThreshold, setTempThreshold] = useState(config.monthlyThreshold.toString());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tithePercent, setTithePercent] = useState(config.directionTithePercentage.toString());

  const handleSave = () => {
    const val = parseFloat(tempThreshold);
    const tp = parseFloat(tithePercent);
    
    if (!isNaN(val) && val > 0 && !isNaN(tp)) {
      onUpdateConfig({ 
          ...config, 
          monthlyThreshold: val,
          directionTithePercentage: tp
      });
      alert('Configuración guardada.');
    }
  };

  const toggleGomer = () => {
      onUpdateConfig({ ...config, enableGomerLogic: !config.enableGomerLogic });
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

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 pt-4 overflow-y-auto">
      <h2 className="text-3xl font-light text-white mb-8">Ajustes</h2>

      {/* Basic Settings */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg mb-6">
        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wide">
          Umbral Mensual
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
            onClick={handleSave}
            className="bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-500 transition-colors"
          >
            ✓
          </button>
        </div>
      </div>

      {/* Categories Management */}
      <div className="mb-6">
        <h3 className="text-slate-500 text-xs font-bold uppercase mb-3">Categorías Personalizadas</h3>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {config.customCategories.length === 0 ? (
                <div className="p-4 text-slate-500 text-sm italic text-center">
                    No hay categorías guardadas. Agrega una desde la Calculadora (botón "+").
                </div>
            ) : (
                config.customCategories.map((cat, idx) => (
                    <div key={cat.id} className={`flex justify-between items-center p-3 ${idx !== config.customCategories.length - 1 ? 'border-b border-slate-700' : ''}`}>
                        <span className="text-white">{cat.name}</span>
                        <button 
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Advanced Toggle */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-slate-500 text-sm flex items-center gap-2 mb-4 hover:text-slate-300"
      >
        {showAdvanced ? '▼' : '▶'} Opciones Avanzadas
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6 space-y-4 animate-fade-in">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">
                    Porcentaje Diezmo Dirección
                </label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={tithePercent}
                        onChange={(e) => setTithePercent(e.target.value)}
                        className="w-20 bg-slate-900 text-white rounded-lg py-2 px-3 border border-slate-600"
                    />
                    <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <div>
                      <div className="text-white text-sm font-medium">Lógica Gomer</div>
                      <div className="text-xs text-slate-500">Calcula meta semanal y remanente.</div>
                  </div>
                  <button 
                    onClick={toggleGomer}
                    className={`w-12 h-6 rounded-full transition-colors relative ${config.enableGomerLogic ? 'bg-emerald-600' : 'bg-slate-600'}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.enableGomerLogic ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
          </div>
      )}

      <div className="mt-8 mb-4">
        <button 
          onClick={handleClear}
          className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Limpiar Base de Datos
        </button>
        <p className="text-center text-slate-600 text-xs mt-4">
          Gomer Calc v2.1
        </p>
      </div>
    </div>
  );
};

export default Settings;