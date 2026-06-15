/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Eye, Layout, Type, Shield, Check, RefreshCw } from 'lucide-react';
import { PlatformTheme } from '../types';

interface ThemeCustomizerProps {
  theme: PlatformTheme;
  onUpdateTheme: (updated: PlatformTheme) => void;
}

const ACCENT_COLORS = [
  { name: 'Default Indigo', value: '#6366f1' },
  { name: 'Eco Emerald', value: '#10b981' },
  { name: 'Warm Amber', value: '#d97706' },
  { name: 'Crimson Rose', value: '#f43f5e' },
  { name: 'Cyber Violet', value: '#a855f7' }
];

export default function ThemeCustomizer({ theme, onUpdateTheme }: ThemeCustomizerProps) {
  
  const handleColorChange = (value: string) => {
    onUpdateTheme({ ...theme, primaryColor: value });
    applyThemeToDocument(value);
  };

  const handleStyleChange = (style: 'light' | 'dark' | 'glass-dark' | 'slate-cyber') => {
    onUpdateTheme({ ...theme, backgroundStyle: style });
  };

  const applyThemeToDocument = (color: string) => {
    // Inject active theme variables dynamically onto html root element
    const root = document.documentElement;
    root.style.setProperty('--primary', color);
    
    // Create a smooth blink animation to visualize real-time feedback
    const header = document.getElementById("platform_header_brand");
    if (header) {
      header.classList.add("scale-105");
      setTimeout(() => header.classList.remove("scale-105"), 300);
    }
  };

  return (
    <div id="theme_customizer_panel" className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-xl scale-95 animate-fade-in origin-top duration-300 space-y-6">
      
      {/* HEADER LABEL */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-855 select-none">
        <Palette className="w-5.5 h-5.5 text-indigo-400 animate-pulse" />
        <div>
          <h3 className="font-semibold text-slate-100">Forge AI Custom Branding & Theme Center</h3>
          <p className="text-xs text-slate-400">Tailor platform aesthetics, custom logo properties, and style variables instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COMPONENT: STYLING ADJUSTMENTS */}
        <div className="space-y-4">
          
          {/* Primary Accents */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5 font-bold">Primary Accent Color Choice</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCENT_COLORS.map(col => {
                const isSelected = theme.primaryColor === col.value;
                return (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => handleColorChange(col.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all ${
                      isSelected 
                        ? 'bg-slate-950 border-indigo-500 text-slate-200' 
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full block border border-slate-950 scale-105"
                      style={{ backgroundColor: col.value }}
                    />
                    <span className="truncate">{col.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backdrop styles selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5 font-bold">Canvas Backdrop Style</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'slate-cyber', label: 'Dark Cyberpunk' },
                { id: 'glass-dark', label: 'Acrylic Glass' },
                { id: 'dark', label: 'Ebony Deep' },
                { id: 'light', label: 'Minimalist Light (Clean)' }
              ].map(opt => {
                const isSel = theme.backgroundStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStyleChange(opt.id as any)}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                      isSel 
                        ? 'bg-slate-955 border-indigo-505 text-slate-250 font-semibold' 
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-805 hover:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: LABEL TITLES & PREVIEWS */}
        <div className="space-y-4">
          
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-bold">Platform Branding Label</label>
            <input
              type="text"
              value={theme.logoText}
              onChange={(e) => onUpdateTheme({ ...theme, logoText: e.target.value })}
              placeholder="e.g. Forge AI"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-505"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Modifies logo texts visible within left-hand menus and sidebars.</span>
          </div>

          {/* Realtime aesthetic preview box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-855 select-none text-center relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 text-left block border-b border-slate-900 pb-1.5 mb-3">Live CSS Preview</span>
            
            <div className="py-4 space-y-3 flex flex-col items-center justify-center">
              <span 
                className="text-lg font-bold tracking-wider font-mono px-3.5 py-1.5 rounded-lg border shadow-lg transition-transform"
                style={{ color: theme.primaryColor, borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}10` }}
              >
                {theme.logoText} v1.0
              </span>
              
              <button
                type="button"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-950 shadow transition-all scale-100 hover:scale-105"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Standard Action Node
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* DISPATCH BOTTOM ACTIONS */}
      <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Variables saved in local browser states.</span>
        
        <button
          onClick={() => {
            onUpdateTheme({
              primaryColor: '#6366f1',
              accentColor: '#10b981',
              backgroundStyle: 'slate-cyber',
              fontFamily: 'Inter',
              logoText: 'ForgeAI'
            });
            applyThemeToDocument('#6366f1');
          }}
          className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Reset default styles
        </button>
      </div>

    </div>
  );
}
