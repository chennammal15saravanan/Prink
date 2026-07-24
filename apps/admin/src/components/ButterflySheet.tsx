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
}

export const ButterflySheet: React.FC<ButterflySheetProps> = ({ images, butterflyCrops }) => {
  return (
    <div 
      id="butterfly-sheet-layout"
      style={{
        width: '560px',
        height: '396px',
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

      <div style={{ zIndex: 6, textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#000', marginBottom: '4px' }}>Butterfly Box Print Template</div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '1px' }}>A4 SHEET - 300 DPI - CMYK - READY FOR PRINT</div>
      </div>

      <div style={{ display: 'flex', gap: '60px', zIndex: 6 }}>
        {/* Product 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '153px' }}>
          <div style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '10px', fontWeight: 800, textAlign: 'center', padding: '6px 0', border: '2px solid #0ea5e9', borderBottom: 'none' }}>
            PRODUCT 1 - 81x81mm
          </div>
          <div style={{ width: '153px', height: '153px', border: '3px solid #0ea5e9', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
            {[0].map(idx => {
              const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
              const ratio = 153 / 140; 
              return (
                <div key={idx} style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, overflow: 'hidden' }}>
                  {images[idx] ? (
                    <img crossOrigin="anonymous" src={images[idx].src || images[idx].url} alt={`p1`} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'center', transform: `translate(${crop.x * ratio}px, ${crop.y * ratio}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px' }}>Photo 1</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '153px' }}>
          <div style={{ background: '#fce7f3', color: '#be123c', fontSize: '10px', fontWeight: 800, textAlign: 'center', padding: '6px 0', border: '2px solid #e11d48', borderBottom: 'none' }}>
            PRODUCT 2 - 81x81mm
          </div>
          <div style={{ width: '153px', height: '153px', border: '3px solid #e11d48', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
            {[1].map(idx => {
              const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
              const ratio = 153 / 140; 
              return (
                <div key={idx} style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, overflow: 'hidden' }}>
                  {images[idx] ? (
                    <img crossOrigin="anonymous" src={images[idx].src || images[idx].url} alt={`p2`} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'center', transform: `translate(${crop.x * ratio}px, ${crop.y * ratio}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px' }}>Photo 2</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
