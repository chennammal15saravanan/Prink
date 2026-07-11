import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { 
  ArrowLeft, Download, Upload, ZoomIn, ZoomOut, Save, FileCheck, RefreshCw, 
  Trash2, Move, Crop, Image as ImageIcon, Layers, Type, Sliders, Wand2, 
  Scissors, Box, Focus, Copy, Sun, Contrast, Droplet, Check
} from 'lucide-react';
import { motion } from 'framer-motion';

const PRINT_AREAS: Record<string, { x: number; y: number; width: number; height: number; }> = {
  'MUG-WHT-11OZ': { x: 125, y: 150, width: 250, height: 250 },
  'TSH-WHT-L': { x: 150, y: 180, width: 200, height: 280 },
  'BAG-CAN-001': { x: 120, y: 160, width: 260, height: 280 },
  'CAS-IP14-PRO': { x: 140, y: 100, width: 220, height: 420 },
  'FRM-WDN-8X10': { x: 130, y: 110, width: 240, height: 380 },
  'FRM-BLK-11X14': { x: 120, y: 100, width: 260, height: 400 },
};

interface AdminEditorProps {
  order: any;
  onBack: () => void;
}

const EditorImage = ({ 
  src, 
  isSelected, 
  onSelect, 
  onChange, 
  filterType, 
  brightness = 0, 
  contrast = 0, 
  ...props 
}: any) => {
  const [img] = useImage(src, 'anonymous');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Apply Konva filters dynamically
  useEffect(() => {
    if (img && shapeRef.current) {
      const node = shapeRef.current;
      const filters = [];
      
      if (filterType === 'grayscale') {
        filters.push((window as any).Konva.Filters.Grayscale);
      } else if (filterType === 'sepia') {
        filters.push((window as any).Konva.Filters.Sepia);
      }
      
      if (brightness !== 0) {
        filters.push((window as any).Konva.Filters.Brighten);
        node.brightness(brightness);
      }
      
      if (contrast !== 0) {
        filters.push((window as any).Konva.Filters.Contrast);
        node.contrast(contrast);
      }
      
      node.filters(filters);
      node.cache();
      node.getLayer()?.batchDraw();
    }
  }, [img, filterType, brightness, contrast]);

  return (
    <>
      <KonvaImage
        image={img}
        ref={shapeRef}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...props,
            filterType,
            brightness,
            contrast,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...props,
            filterType,
            brightness,
            contrast,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
        {...props}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default function AdminEditor({ order, onBack }: AdminEditorProps) {
  const [scale, setScale] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('adjust');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const stageRef = useRef<any>(null);
  
  const [currentOrder, setCurrentOrder] = useState(order);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const adminUploadInputRef = useRef<HTMLInputElement>(null);

  const fetchRecentUploads = async () => {
    try {
      const res = await fetch('/api/uploads', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentUploads(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'uploads') {
      fetchRecentUploads();
    }
  }, [activeTab]);

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, replaceMode = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (replaceMode && selectedId) {
          setItems(items.map(item => item.id === selectedId ? { ...item, src: data.url } : item));
        } else {
          const freshArea = printArea;
          const newItem = {
            id: `cust-img-${Date.now()}`,
            type: 'image',
            src: data.url,
            x: freshArea.x + 40,
            y: freshArea.y + 40,
            width: freshArea.width - 80,
            height: freshArea.height - 80,
            rotation: 0
          };
          setItems([...items, newItem]);
        }
        fetchRecentUploads();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteUpload = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file from the file manager?')) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        fetchRecentUploads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load product mock image
  const defaultBg = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800'; // fallback
  const [bgImage] = useImage(currentOrder.productImage || defaultBg, 'anonymous');

  const printArea = PRINT_AREAS[currentOrder.sku] || { x: 100, y: 100, width: 300, height: 300 };

  // Fetch freshest order details on mount to capture new customer uploads
  useEffect(() => {
    const fetchFreshOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentOrder(data);
          
          const uploadedImgs = data.images || data.customerUploadedImages;
          if (uploadedImgs && uploadedImgs.length > 0) {
            const freshArea = PRINT_AREAS[data.sku] || { x: 100, y: 100, width: 300, height: 300 };
            const newItems = uploadedImgs.map((img: any, i: number) => ({
              id: `cust-img-${i}`,
              type: 'image',
              src: img.src || img.url,
              x: freshArea.x + 20 + (i * 20),
              y: freshArea.y + 20 + (i * 20),
              width: freshArea.width - 40,
              height: freshArea.height - 40,
              rotation: 0
            }));
            setItems(newItems);
          }
        }
      } catch (err) {
        console.error('Failed to fetch fresh order details:', err);
      }
    };
    fetchFreshOrder();
  }, [order.id]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs.id === 'bg';
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const deleteSelected = () => {
    if (selectedId) {
      setItems(items.filter(i => i.id !== selectedId));
      setSelectedId(null);
    }
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const index = items.findIndex(i => i.id === selectedId);
    if (index < 0) return;
    const newItems = [...items];
    if (direction === 'up' && index < items.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setItems(newItems);
    } else if (direction === 'down' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      setItems(newItems);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const uri = stageRef.current.toDataURL();
      
      const response = await fetch(`/api/orders/${encodeURIComponent(currentOrder.id)}/submit-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: JSON.stringify({ designData: items, previewBase64: uri })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Prink Admin Pro Editor</h1>
            <p className="text-xs text-gray-500 font-medium">Order {currentOrder.id} • {currentOrder.product}</p>
          </div>
        </div>

        {/* Top Tools */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Undo"><RefreshCw size={18} className="transform -scale-x-100" /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Redo"><RefreshCw size={18} /></button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={handleZoomOut} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ZoomOut size={18} /></button>
          <span className="text-sm font-medium text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ZoomIn size={18} /></button>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
            <Save size={18} /> Save Draft
          </button>
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="px-5 py-2 bg-[#171C62] text-white font-medium rounded-lg hover:bg-blue-900 transition-colors shadow-md flex items-center gap-2"
          >
            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <FileCheck size={18} />}
            {isGenerating ? 'Generating...' : 'Generate PDF & Approve'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Professional Toolbar */}
        <div className="w-72 bg-white border-r flex flex-col z-10 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button onClick={() => setActiveTab('adjust')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'adjust' ? 'border-[#171C62] text-[#171C62]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Adjust</button>
            <button onClick={() => setActiveTab('uploads')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'uploads' ? 'border-[#171C62] text-[#171C62]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Uploads</button>
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'ai' ? 'border-[#171C62] text-[#171C62]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>AI Tools</button>
            <button onClick={() => setActiveTab('layers')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'layers' ? 'border-[#171C62] text-[#171C62]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Layers</button>
          </div>

          <div className="p-5 overflow-y-auto">
            {activeTab === 'adjust' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Transform</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      onClick={() => {
                        if (!selectedId) return;
                        setItems(items.map(item => item.id === selectedId ? { ...item, rotation: (item.rotation || 0) - 90 } : item));
                      }}
                      className="p-2 border rounded hover:bg-gray-50 flex justify-center" 
                      title="Rotate Left"
                    >
                      <RefreshCw size={16} className="transform -scale-x-100" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedId) return;
                        setItems(items.map(item => item.id === selectedId ? { ...item, rotation: (item.rotation || 0) + 90 } : item));
                      }}
                      className="p-2 border rounded hover:bg-gray-50 flex justify-center" 
                      title="Rotate Right"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedId) return;
                        setItems(items.map(item => item.id === selectedId ? { ...item, scaleX: -(item.scaleX || 1) } : item));
                      }}
                      className="p-2 border rounded hover:bg-gray-50 flex justify-center" 
                      title="Flip Horizontal"
                    >
                      <Move size={16} className="transform rotate-90" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedId) return;
                        setItems(items.map(item => item.id === selectedId ? { ...item, scaleY: -(item.scaleY || 1) } : item));
                      }}
                      className="p-2 border rounded hover:bg-gray-50 flex justify-center" 
                      title="Flip Vertical"
                    >
                      <Move size={16} className="transform rotate-180" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Color Adjustments</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Brightness</span>
                        <span>{Math.round(((items.find(i => i.id === selectedId)?.brightness || 0) + 1) * 50)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-1" 
                        max="1" 
                        step="0.1"
                        disabled={!selectedId}
                        value={items.find(i => i.id === selectedId)?.brightness || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setItems(items.map(item => item.id === selectedId ? { ...item, brightness: val } : item));
                        }}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Contrast</span>
                        <span>{Math.round(((items.find(i => i.id === selectedId)?.contrast || 0) + 1) * 50)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-1" 
                        max="1" 
                        step="0.1"
                        disabled={!selectedId}
                        value={items.find(i => i.id === selectedId)?.contrast || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setItems(items.map(item => item.id === selectedId ? { ...item, contrast: val } : item));
                        }}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filters</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      disabled={!selectedId}
                      onClick={() => setItems(items.map(item => item.id === selectedId ? { ...item, filterType: 'normal' } : item))}
                      className={`aspect-square rounded flex flex-col items-center justify-center text-xs text-gray-600 border ${items.find(i => i.id === selectedId)?.filterType === 'normal' || !items.find(i => i.id === selectedId)?.filterType ? 'border-[#171C62] bg-blue-50 font-bold' : 'bg-gray-100 hover:bg-gray-200 border-transparent'}`}
                    >
                      <Sun size={16} className="mb-1" /> Normal
                    </button>
                    <button 
                      disabled={!selectedId}
                      onClick={() => setItems(items.map(item => item.id === selectedId ? { ...item, filterType: 'grayscale' } : item))}
                      className={`aspect-square rounded flex flex-col items-center justify-center text-xs text-gray-600 border ${items.find(i => i.id === selectedId)?.filterType === 'grayscale' ? 'border-[#171C62] bg-blue-50 font-bold' : 'bg-gray-100 hover:bg-gray-200 border-transparent grayscale'}`}
                    >
                      <Contrast size={16} className="mb-1" /> B&W
                    </button>
                    <button 
                      disabled={!selectedId}
                      onClick={() => setItems(items.map(item => item.id === selectedId ? { ...item, filterType: 'sepia' } : item))}
                      className={`aspect-square rounded flex flex-col items-center justify-center text-xs text-gray-600 border ${items.find(i => i.id === selectedId)?.filterType === 'sepia' ? 'border-[#171C62] bg-blue-50 font-bold' : 'bg-gray-100 hover:bg-gray-200 border-transparent sepia'}`}
                    >
                      <Droplet size={16} className="mb-1" /> Sepia
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'uploads' && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={adminUploadInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleAdminFileUpload(e, false)} 
                />
                
                <div 
                  onClick={() => adminUploadInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#171C62] cursor-pointer bg-gray-50 transition-colors"
                >
                  <Upload size={28} className="mx-auto text-gray-400 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-gray-700">Click to Upload Photo</p>
                  <p className="text-xs text-gray-500 mt-1">Saves directly to File Manager</p>
                </div>

                {selectedId && (
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.onchange = (e: any) => handleAdminFileUpload(e, true);
                      input.click();
                    }}
                    className="w-full py-2 border border-[#171C62] text-[#171C62] rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Replace Selected Photo
                  </button>
                )}

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Uploads</h3>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-4">
                      <RefreshCw size={16} className="animate-spin" /> Uploading...
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                    {recentUploads.map((img: any) => (
                      <div key={img.id} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
                        <img 
                          src={img.url} 
                          alt={img.originalName} 
                          onClick={() => {
                            const freshArea = printArea;
                            const newItem = {
                              id: `cust-img-${Date.now()}`,
                              type: 'image',
                              src: img.url,
                              x: freshArea.x + 40,
                              y: freshArea.y + 40,
                              width: freshArea.width - 80,
                              height: freshArea.height - 80,
                              rotation: 0
                            };
                            setItems([...items, newItem]);
                          }}
                          className="w-full aspect-square object-cover cursor-pointer"
                          title="Click to add to canvas"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a 
                            href={img.url} 
                            download={img.originalName}
                            style={{ display: 'flex' }}
                            className="p-1 bg-white rounded text-gray-800 hover:bg-gray-100"
                            title="Download file"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={14} />
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteUpload(img.id); }}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Delete file"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                  <Wand2 size={24} className="text-purple-600 mb-2" />
                  <h3 className="font-bold text-gray-900 mb-1">AI Background Removal</h3>
                  <p className="text-xs text-gray-600 mb-3">Automatically strip the background from the selected subject.</p>
                  <button className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded shadow-sm hover:bg-purple-700 transition-colors">
                    Remove Background
                  </button>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <Focus size={24} className="text-green-600 mb-2" />
                  <h3 className="font-bold text-gray-900 mb-1">AI Upscale & Enhance</h3>
                  <p className="text-xs text-gray-600 mb-3">Increase resolution to 300 DPI for perfect print quality.</p>
                  <button className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded shadow-sm hover:bg-green-700 transition-colors">
                    Enhance Image
                  </button>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100">
                  <Scissors size={24} className="text-orange-600 mb-2" />
                  <h3 className="font-bold text-gray-900 mb-1">Magic Eraser</h3>
                  <p className="text-xs text-gray-600 mb-3">Remove unwanted objects or blemishes.</p>
                  <button className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded shadow-sm hover:bg-orange-700 transition-colors">
                    Use Magic Eraser
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'layers' && (
              <div className="space-y-3">
                <div className="flex justify-between mb-4">
                  <button onClick={() => moveLayer('up')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700">Bring Fwd</button>
                  <button onClick={() => moveLayer('down')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700">Send Back</button>
                  <button onClick={deleteSelected} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm"><Trash2 size={16}/></button>
                </div>
                
                {items.map((item, i) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedId(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedId === item.id ? 'border-[#171C62] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                      {item.type === 'image' ? <img src={item.src} className="w-full h-full object-cover" /> : <Type size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Layer {items.length - i}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-[#e5e7eb] flex items-center justify-center relative p-8 relative">
          {/* Overlays / Guides */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow-sm flex items-center gap-2 z-10">
            <span className="w-3 h-3 border-2 border-green-500 rounded-sm"></span>
            <span className="text-xs font-medium text-gray-700">Safe Print Area</span>
            <span className="w-3 h-3 border-2 border-red-500 border-dashed rounded-sm ml-2"></span>
            <span className="text-xs font-medium text-gray-700">Bleed Zone</span>
          </div>

          <div 
            className="bg-white shadow-2xl overflow-hidden relative"
            style={{ width: 500 * scale, height: 600 * scale }}
          >
            <Stage
              width={500 * scale}
              height={600 * scale}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={checkDeselect}
              onTouchStart={checkDeselect}
              ref={stageRef}
            >
              <Layer>
                {/* Background Product Image */}
                <KonvaImage image={bgImage} width={500} height={600} id="bg" />
                
                {/* Print Area Clip / Mask */}
                <Rect 
                  x={printArea.x} 
                  y={printArea.y} 
                  width={printArea.width} 
                  height={printArea.height} 
                  strokeDasharray={[5, 5]}
                  stroke="#22c55e" 
                  strokeWidth={2}
                />

                {/* Elements */}
                {items.map((item, i) => {
                  if (item.type === 'image') {
                    return (
                      <EditorImage
                        key={item.id}
                        {...item}
                        isSelected={item.id === selectedId}
                        onSelect={() => setSelectedId(item.id)}
                        onChange={(newAttrs: any) => {
                          const newItems = items.slice();
                          newItems[i] = newAttrs;
                          setItems(newItems);
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Generated!</h2>
            <p className="text-gray-600">The order has been approved and sent to the printer.</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
