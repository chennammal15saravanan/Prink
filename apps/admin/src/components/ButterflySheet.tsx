import React from 'react';

interface CropData {
  scale: number;
  rotation: number;
  x: number;
  y: number;
}

interface ButterflySheetProps {
  images: any[];
  butterflyCrops: Record<number, CropData>;
  orderId?: string;
}

export const ButterflySheet: React.FC<ButterflySheetProps> = ({ images, butterflyCrops, orderId }) => {
  return (
    <div 
      id="butterfly-sheet-layout"
      style={{
        width: '840px',
        height: '594px',
        background: '#ffffff',
        borderRadius: '4px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px 20px',
        boxSizing: 'border-box'
      }}
    >
      {/* Green Cut Line */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px', border: '2px dashed #22c55e', pointerEvents: 'none', zIndex: 5 }} />
      {/* Red Safe Margin */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', bottom: '24px', border: '2px dashed #ef4444', pointerEvents: 'none', zIndex: 5 }} />

      <div style={{ zIndex: 6, textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#000', marginBottom: '4px' }}>Butterfly Box Print Template</div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px', marginBottom: '15px' }}>A3 SHEET - 300 DPI - CMYK - READY FOR PRINT</div>
        {orderId && (
          <img 
            crossOrigin="anonymous" 
            src={`https://www.barcodesinc.com/generator/image.php?code=${encodeURIComponent(orderId)}&style=197&type=C128B&width=200&height=50&xres=1&font=3`} 
            alt="barcode" 
            style={{ width: '150px', margin: '0 auto' }} 
          />
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', zIndex: 6, justifyContent: 'center', maxWidth: '780px' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(idx => {
          const isProduct1 = idx < 4;
          const label = isProduct1 ? `P1 - Face ${idx + 1}` : `P2 - Face ${idx - 3}`;
          const color = isProduct1 ? '#0ea5e9' : '#e11d48';
          const bgColor = isProduct1 ? '#e0f2fe' : '#fce7f3';
          
          const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
          const ratio = 162 / 140; 
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '162px' }}>
              <div style={{ background: bgColor, color: color, fontSize: '10px', fontWeight: 800, textAlign: 'center', padding: '6px 0', border: `2px solid ${color}`, borderBottom: 'none' }}>
                {label} (81x81mm)
              </div>
              <div style={{ width: '162px', height: '162px', border: `3px solid ${color}`, background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, overflow: 'hidden' }}>
                  {images[idx] ? (
                    <img crossOrigin="anonymous" src={images[idx].src || images[idx].url} alt={`photo-${idx}`} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'center', transform: `translate(${crop.x * ratio}px, ${crop.y * ratio}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px' }}>Photo {idx + 1}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
