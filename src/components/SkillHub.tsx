/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Wrench, Download, Upload, Plus, Play, Edit2, Trash2, 
  CheckCircle, AlertCircle, Tag, Clock, Zap, FileCode,
  ChevronRight, ChevronDown, Search, Filter, Settings,
  Package, Code, Database, Bot, ArrowRight
} from 'lucide-react';
import { Skill, SkillCategory, SkillTriggerType, SkillParameter, SkillExport } from '../types';

interface SkillHubProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onUpdateSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
}

const SKILL_CATEGORIES: { value: SkillCategory; label: string; color: string; icon: string }[] = [
  { value: 'automation', label: '自动化', color: 'bg-indigo-950/50 border-indigo-500/30 text-indigo-400', icon: '⚡' },
  { value: 'analysis', label: '分析', color: 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400', icon: '📊' },
  { value: 'integration', label: '集成', color: 'bg-violet-950/50 border-violet-500/30 text-violet-400', icon: '🔗' },
  { value: 'utility', label: '工具', color: 'bg-amber-950/50 border-amber-500/30 text-amber-400', icon: '🛠️' },
  { value: 'custom', label: '自定义', color: 'bg-rose-950/50 border-rose-500/30 text-rose-400', icon: '🧩' },
];

const TRIGGER_TYPES: { value: SkillTriggerType; label: string }[] = [
  { value: 'manual', label: '手动触发' },
  { value: 'event', label: '事件触发' },
  { value: 'schedule', label: '定时触发' },
  { value: 'api', label: 'API 触发' },
];

export default function SkillHub({ skills, onAddSkill, onUpdateSkill, onDeleteSkill }: SkillHubProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'skills' | 'import' | 'export'>('skills');
  const [filterCategory, setFilterCategory] = useState<SkillCategory | 'all'>('all');
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  // New skill form
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    category: 'custom' as SkillCategory,
    icon: '🧩',
    triggerType: 'manual' as SkillTriggerType,
    parameters: [] as SkillParameter[],
    code: '',
    tags: [] as string[],
  });
  
  const [newParam, setNewParam] = useState({
    name: '',
    type: 'string' as SkillParameter['type'],
    required: false,
    description: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkill(skill);
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    
    const skill: Skill = {
      ...newSkill,
      id: `skill_${Date.now()}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onAddSkill(skill);
    setNewSkill({
      name: '',
      description: '',
      category: 'custom',
      icon: '🧩',
      triggerType: 'manual',
      parameters: [],
      code: '',
      tags: [],
    });
    setSelectedSkill(skill);
  };

  const handleUpdateSkill = () => {
    if (!selectedSkill) return;
    
    onUpdateSkill({
      ...selectedSkill,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExecuteSkill = async (skill: Skill) => {
    setIsExecuting(true);
    setExecutionOutput('');
    
    try {
      const response = await fetch('/api/skill/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id, skill }),
      });
      
      const result = await response.json();
      setExecutionOutput(result.output || '执行完成');
    } catch (err) {
      setExecutionOutput(`执行失败: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportSkills = () => {
    const exportData: SkillExport = {
      version: '1.0.0',
      skills: skills,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forgeai-skills-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSkills = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.skills && Array.isArray(data.skills)) {
          data.skills.forEach((skill: Skill) => {
            const newSkill: Skill = {
              ...skill,
              id: `skill_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            onAddSkill(newSkill);
          });
          alert(`成功导入 ${data.skills.length} 个技能`);
        }
      } catch (err) {
        alert('导入失败，请确保文件格式正确');
      }
    };
    reader.readAsText(file);
  };

  const handleAddParameter = () => {
    if (!newParam.name.trim()) return;
    
    const param: SkillParameter = {
      id: `param_${Date.now()}`,
      name: newParam.name,
      type: newParam.type,
      required: newParam.required,
      description: newParam.description,
    };
    
    setNewSkill(prev => ({
      ...prev,
      parameters: [...prev.parameters, param],
    }));
    
    setNewParam({ name: '', type: 'string', required: false, description: '' });
  };

  const handleAddTag = (tag: string) => {
    if (!tag.trim() || newSkill.tags.includes(tag)) return;
    setNewSkill(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
  };

  const categoryInfo = SKILL_CATEGORIES.find(c => c.value === (selectedSkill?.category || 'custom'));

  return (
    <div id="skill_hub" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-95 animate-fade-in origin-top duration-300">
      
      {/* Left Panel: Skills List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-xs uppercase tracking-widest bg-slate-800 px-2.5 py-0.5 rounded text-indigo-300 border border-slate-750">
                Skill Registry
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                title="导入技能"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportSkills}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                title="导出技能"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索技能..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <button
                onClick={() => setFilterCategory('all')}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  filterCategory === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                全部
              </button>
              {SKILL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    filterCategory === cat.value 
                      ? `${cat.color}` 
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skills List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">暂无技能</p>
              </div>
            ) : (
              filteredSkills.map(skill => {
                const catInfo = SKILL_CATEGORIES.find(c => c.value === skill.category);
                return (
                  <div
                    key={skill.id}
                    onClick={() => handleSelectSkill(skill)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSkill?.id === skill.id
                        ? 'bg-indigo-950/40 border-indigo-500/80'
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{skill.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200 truncate">{skill.name}</span>
                          {skill.enabled ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 truncate mt-0.5">{skill.description}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${catInfo?.color}`}>
                        {catInfo?.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Skill Button */}
          <button
            onClick={() => setSelectedSkill(null)}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            创建新技能
          </button>
        </div>
      </div>

      {/* Right Panel: Skill Details / Import/Export */}
      <div className="lg:col-span-8">
        {/* Tab Navigation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 backdrop-blur-xl mb-4 flex gap-2">
          {[
            { id: 'skills', label: '技能详情', icon: Wrench },
            { id: 'import', label: '导入技能', icon: Upload },
            { id: 'export', label: '导出技能', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
            {selectedSkill ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedSkill.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-100">{selectedSkill.name}</h3>
                        {selectedSkill.enabled ? (
                          <span className="text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">
                            已启用
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800">
                            已禁用
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedSkill.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExecuteSkill(selectedSkill)}
                      disabled={isExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4" />
                      {isExecuting ? '执行中...' : '执行'}
                    </button>
                    <button
                      onClick={() => onDeleteSkill(selectedSkill.id)}
                      className="p-2 text-red-400 hover:text-red-300 border border-red-950 hover:bg-red-955/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Execution Output */}
                {executionOutput && (
                  <div className="bg-slate-950 rounded-lg border border-slate-850 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      执行输出
                    </span>
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{executionOutput}</pre>
                  </div>
                )}

                {/* Properties Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 rounded-lg border border-slate-850 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      分类
                    </span>
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs ${categoryInfo?.color}`}>
                      <span>{categoryInfo?.icon}</span>
                      <span>{categoryInfo?.label}</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 rounded-lg border border-slate-850 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      触发方式
                    </span>
                    <span className="text-xs text-slate-300">
                      {TRIGGER_TYPES.find(t => t.value === selectedSkill.triggerType)?.label}
                    </span>
                  </div>
                  <div className="bg-slate-950 rounded-lg border border-slate-850 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      创建时间
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {new Date(selectedSkill.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 rounded-lg border border-slate-850 p-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      更新时间
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {new Date(selectedSkill.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {selectedSkill.tags.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      标签
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parameters */}
                {selectedSkill.parameters.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      参数
                    </span>
                    <div className="space-y-2">
                      {selectedSkill.parameters.map(param => (
                        <div key={param.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-200">{param.name}</span>
                              {param.required && <span className="text-[9px] text-red-400 ml-2">*必填</span>}
                            </div>
                            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500">{param.type}</span>
                          </div>
                          {param.description && (
                            <p className="text-[10px] text-slate-450 mt-1">{param.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                    执行代码
                  </span>
                  <textarea
                    value={selectedSkill.code}
                    onChange={(e) => setSelectedSkill({ ...selectedSkill, code: e.target.value })}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleUpdateSkill}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  保存修改
                </button>
              </div>
            ) : (
              /* New Skill Form */
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100">创建新技能</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                      技能名称
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      placeholder="输入技能名称"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                      图标 (Emoji)
                    </label>
                    <input
                      type="text"
                      value={newSkill.icon}
                      onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
                      placeholder="🧩"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                    placeholder="描述这个技能的功能"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                      分类
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as SkillCategory })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {SKILL_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                      触发方式
                    </label>
                    <select
                      value={newSkill.triggerType}
                      onChange={(e) => setNewSkill({ ...newSkill, triggerType: e.target.value as SkillTriggerType })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {TRIGGER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags Input */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newSkill.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button onClick={() => setNewSkill({ ...newSkill, tags: newSkill.tags.filter(t => t !== tag) })} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(e.currentTarget.value))}
                      placeholder="输入标签后按回车"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Parameters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      参数
                    </label>
                    <button
                      onClick={handleAddParameter}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 添加参数
                    </button>
                  </div>
                  
                  {newSkill.parameters.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {newSkill.parameters.map((param, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={param.name}
                              onChange={(e) => {
                                const params = [...newSkill.parameters];
                                params[idx] = { ...params[idx], name: e.target.value };
                                setNewSkill({ ...newSkill, parameters: params });
                              }}
                              placeholder="参数名称"
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                            <select
                              value={param.type}
                              onChange={(e) => {
                                const params = [...newSkill.parameters];
                                params[idx] = { ...params[idx], type: e.target.value as SkillParameter['type'] };
                                setNewSkill({ ...newSkill, parameters: params });
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="select">select</option>
                              <option value="file">file</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={param.required}
                                onChange={(e) => {
                                  const params = [...newSkill.parameters];
                                  params[idx] = { ...params[idx], required: e.target.checked };
                                  setNewSkill({ ...newSkill, parameters: params });
                                }}
                                className="w-3.5 h-3.5 accent-indigo-500"
                              />
                              <span className="text-[10px] text-slate-500">必填</span>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={param.description}
                            onChange={(e) => {
                              const params = [...newSkill.parameters];
                              params[idx] = { ...params[idx], description: e.target.value };
                              setNewSkill({ ...newSkill, parameters: params });
                            }}
                            placeholder="参数描述"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 mt-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* New Parameter Form */}
                  <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newParam.name}
                        onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                        placeholder="参数名称"
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newParam.type}
                        onChange={(e) => setNewParam({ ...newParam, type: e.target.value as SkillParameter['type'] })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="select">select</option>
                        <option value="file">file</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newParam.required}
                          onChange={(e) => setNewParam({ ...newParam, required: e.target.checked })}
                          className="w-3.5 h-3.5 accent-indigo-500"
                        />
                        <span className="text-[10px] text-slate-500">必填</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={newParam.description}
                      onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
                      placeholder="参数描述"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 mt-2"
                    />
                  </div>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    执行代码
                  </label>
                  <textarea
                    value={newSkill.code}
                    onChange={(e) => setNewSkill({ ...newSkill, code: e.target.value })}
                    rows={6}
                    placeholder="// 编写技能执行代码\n// 支持 JavaScript/Python"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddSkill}
                  disabled={!newSkill.name.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  创建技能
                </button>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
            <div className="max-w-md mx-auto text-center">
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-100 mb-2">导入技能配置</h3>
              <p className="text-xs text-slate-400 mb-6">
                上传 JSON 格式的技能配置文件进行批量导入
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportSkills}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 transition-colors"
              >
                <div className="text-center">
                  <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-sm text-slate-300">点击或拖拽文件到此处</span>
                  <p className="text-xs text-slate-500 mt-1">支持 .json 格式</p>
                </div>
              </button>
              
              <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  导出格式说明
                </span>
                <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">
{`{
  "version": "1.0.0",
  "skills": [...],
  "exportedAt": "2024-01-01T00:00:00Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
            <div className="max-w-md mx-auto text-center">
              <Download className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-100 mb-2">导出技能配置</h3>
              <p className="text-xs text-slate-400 mb-6">
                将所有技能导出为 JSON 文件进行备份或迁移
              </p>
              
              <div className="bg-slate-950 rounded-lg border border-slate-850 p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-slate-400" />
                    <div className="text-left">
                      <span className="text-slate-200">forgeai-skills.json</span>
                      <p className="text-[10px] text-slate-500">{skills.length} 个技能</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {JSON.stringify(skills).length} bytes
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleExportSkills}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出技能配置
              </button>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-950 rounded-lg border border-slate-850 p-3 text-center">
                  <Database className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <span className="text-[10px] text-slate-500 block">本地存储</span>
                  <span className="text-sm text-emerald-400 font-bold">{skills.length}</span>
                </div>
                <div className="bg-slate-950 rounded-lg border border-slate-850 p-3 text-center">
                  <Bot className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <span className="text-[10px] text-slate-500 block">启用技能</span>
                  <span className="text-sm text-violet-400 font-bold">
                    {skills.filter(s => s.enabled).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportSkills}
          className="hidden"
        />
      </div>
    </div>
  );
}