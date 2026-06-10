/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, BookOpen, Upload, Plus, Search, Folder, 
  ChevronRight, ChevronDown, Edit2, Trash2, Save,
  Tag, Calendar, Download, File, FileImage, FileCode,
  FileJson, FileText as FileTextIcon, Eye, X
} from 'lucide-react';
import { WikiPage, DocumentFormat } from '../types';

interface WikiKnowledgeBaseProps {
  pages: WikiPage[];
  onAddPage: (page: WikiPage) => void;
  onUpdatePage: (page: WikiPage) => void;
  onDeletePage: (id: string) => void;
}

const DOCUMENT_FORMATS: { value: DocumentFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'markdown', label: 'Markdown', icon: <FileTextIcon className="w-4 h-4" /> },
  { value: 'text', label: 'Plain Text', icon: <FileTextIcon className="w-4 h-4" /> },
  { value: 'json', label: 'JSON', icon: <FileJson className="w-4 h-4" /> },
  { value: 'yaml', label: 'YAML', icon: <FileCode className="w-4 h-4" /> },
  { value: 'python', label: 'Python', icon: <FileCode className="w-4 h-4" /> },
  { value: 'typescript', label: 'TypeScript', icon: <FileCode className="w-4 h-4" /> },
];

const IMPORT_FORMATS = [
  { ext: '.md', label: 'Markdown', icon: '📝' },
  { ext: '.txt', label: 'Plain Text', icon: '📄' },
  { ext: '.json', label: 'JSON', icon: '📋' },
  { ext: '.md', label: 'Word (docx)', icon: '📘' },
  { ext: '.pdf', label: 'PDF', icon: '📕' },
];

export default function WikiKnowledgeBase({ pages, onAddPage, onUpdatePage, onDeletePage }: WikiKnowledgeBaseProps) {
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pages' | 'import'>('pages');
  const [newPage, setNewPage] = useState({
    title: '',
    content: '',
    format: 'markdown' as DocumentFormat,
    tags: [] as string[],
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPage = (page: WikiPage) => {
    setSelectedPage(page);
    setNewPage({
      title: page.title,
      content: page.content,
      format: page.format,
      tags: [...page.tags],
    });
  };

  const handleAddPage = () => {
    if (!newPage.title.trim()) return;
    
    const page: WikiPage = {
      id: `wiki_${Date.now()}`,
      title: newPage.title,
      content: newPage.content,
      format: newPage.format,
      tags: newPage.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
    };
    
    onAddPage(page);
    setSelectedPage(page);
  };

  const handleUpdatePage = () => {
    if (!selectedPage) return;
    
    onUpdatePage({
      ...selectedPage,
      title: newPage.title,
      content: newPage.content,
      format: newPage.format,
      tags: newPage.tags,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleImportDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const fileName = file.name;
        const ext = fileName.split('.').pop()?.toLowerCase();
        
        let format: DocumentFormat = 'text';
        if (ext === 'md') format = 'markdown';
        else if (ext === 'json') format = 'json';
        else if (ext === 'yaml' || ext === 'yml') format = 'yaml';
        else if (ext === 'py') format = 'python';
        else if (ext === 'ts') format = 'typescript';
        
        const page: WikiPage = {
          id: `wiki_import_${Date.now()}`,
          title: fileName.replace(/\.[^/.]+$/, ''),
          content: content,
          format: format,
          tags: ['imported', ext || ''],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [],
        };
        
        onAddPage(page);
        setSelectedPage(page);
        setNewPage({
          title: page.title,
          content: page.content,
          format: page.format,
          tags: [...page.tags],
        });
        
        alert(`成功导入文档: ${fileName}`);
      } catch (err) {
        alert('导入失败，请确保文件格式正确');
      }
    };
    reader.readAsText(file);
  };

  const handleAddTag = (tag: string) => {
    if (!tag.trim() || newPage.tags.includes(tag)) return;
    setNewPage(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    setNewTag('');
  };

  const formatInfo = DOCUMENT_FORMATS.find(f => f.value === newPage.format);

  return (
    <div id="wiki_knowledge_base" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-95 animate-fade-in origin-top duration-300">
      
      {/* Left Panel: Pages List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="font-mono text-xs uppercase tracking-widest bg-slate-800 px-2.5 py-0.5 rounded text-amber-300 border border-slate-750">
                Knowledge Base
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                title="导入文档"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文档..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-slate-950/60 rounded-lg p-2 text-center">
              <span className="text-sm font-bold text-amber-400">{pages.length}</span>
              <p className="text-[9px] text-slate-500">文档总数</p>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-2 text-center">
              <span className="text-sm font-bold text-emerald-400">
                {pages.reduce((acc, p) => acc + p.content.length, 0)}
              </span>
              <p className="text-[9px] text-slate-500">总字符数</p>
            </div>
          </div>

          {/* Pages List */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto mt-4">
            {filteredPages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">暂无文档</p>
                <button
                  onClick={() => setSelectedPage(null)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 mt-2"
                >
                  创建第一篇文档
                </button>
              </div>
            ) : (
              filteredPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPage?.id === page.id
                      ? 'bg-amber-950/40 border-amber-500/80'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-xs text-slate-200 truncate">{page.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-500">
                          {new Date(page.updatedAt).toLocaleDateString()}
                        </span>
                        {page.tags.length > 0 && (
                          <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                            {page.tags.length} 标签
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Page Button */}
          <button
            onClick={() => setSelectedPage(null)}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 font-medium border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            创建新文档
          </button>
        </div>
      </div>

      {/* Right Panel: Editor / Import */}
      <div className="lg:col-span-8">
        {/* Tab Navigation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 backdrop-blur-xl mb-4 flex gap-2">
          {[
            { id: 'pages', label: '文档编辑', icon: FileText },
            { id: 'import', label: '导入文档', icon: Upload },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Documents Tab */}
        {activeTab === 'pages' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
            {selectedPage ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-amber-400" />
                    <div>
                      <input
                        type="text"
                        value={newPage.title}
                        onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                        className="bg-transparent text-lg font-bold text-slate-100 border-none outline-none"
                      />
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedPage.updatedAt).toLocaleString()}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${formatInfo ? 'bg-slate-950 border-slate-800 text-slate-400' : ''}`}>
                          {formatInfo?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      预览
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([newPage.content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${newPage.title}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                    <button
                      onClick={() => onDeletePage(selectedPage.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 border border-red-950 hover:bg-red-955/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    <Tag className="w-3 h-3 inline mr-1" />
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPage.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400 flex items-center gap-1">
                        {tag}
                        <button onClick={() => setNewPage({ ...newPage, tags: newPage.tags.filter(t => t !== tag) })} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newTag))}
                      placeholder="输入标签后按回车"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
                    文档格式
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOCUMENT_FORMATS.map(fmt => (
                      <button
                        key={fmt.value}
                        onClick={() => setNewPage({ ...newPage, format: fmt.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          newPage.format === fmt.value
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fmt.icon}
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                      内容编辑
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {newPage.content.length} 字符
                    </span>
                  </div>
                  <textarea
                    value={newPage.content}
                    onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                    rows={12}
                    placeholder="开始编写文档内容..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleUpdatePage}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  保存文档
                </button>
              </div>
            ) : (
              /* New Page Form */
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-slate-100">创建新文档</h3>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    文档标题
                  </label>
                  <input
                    type="text"
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    placeholder="输入文档标题"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
                    <Tag className="w-3 h-3 inline mr-1" />
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPage.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400 flex items-center gap-1">
                        {tag}
                        <button onClick={() => setNewPage({ ...newPage, tags: newPage.tags.filter(t => t !== tag) })} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newTag))}
                      placeholder="输入标签后按回车"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
                    文档格式
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOCUMENT_FORMATS.map(fmt => (
                      <button
                        key={fmt.value}
                        onClick={() => setNewPage({ ...newPage, format: fmt.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          newPage.format === fmt.value
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fmt.icon}
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                    内容编辑
                  </span>
                  <textarea
                    value={newPage.content}
                    onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                    rows={8}
                    placeholder="开始编写文档内容..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddPage}
                  disabled={!newPage.title.trim()}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  创建文档
                </button>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-xl">
            <div className="max-w-md mx-auto text-center">
              <Upload className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-100 mb-2">导入文档</h3>
              <p className="text-xs text-slate-400 mb-6">
                上传文档文件进行导入，支持多种格式
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.json,.yaml,.yml,.py,.ts"
                onChange={handleImportDocument}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-8 transition-colors"
              >
                <div className="text-center">
                  <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-sm text-slate-300">点击或拖拽文件到此处</span>
                  <p className="text-xs text-slate-500 mt-1">支持多种文档格式</p>
                </div>
              </button>
              
              <div className="mt-6 grid grid-cols-3 gap-3">
                {IMPORT_FORMATS.map(fmt => (
                  <div key={fmt.ext} className="bg-slate-950 rounded-lg border border-slate-850 p-3 text-center">
                    <span className="text-xl block mb-1">{fmt.icon}</span>
                    <span className="text-[10px] text-slate-400">{fmt.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  支持的格式
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['.md', '.txt', '.json', '.yaml', '.py', '.ts'].map(ext => (
                    <span key={ext} className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400 font-mono">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-semibold text-slate-100">文档预览</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)]">
                <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">{newPage.content}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.json,.yaml,.yml,.py,.ts"
          onChange={handleImportDocument}
          className="hidden"
        />
      </div>
    </div>
  );
}