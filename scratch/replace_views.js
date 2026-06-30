import fs from 'fs';

const filePath = 'c:/Users/CHENNAMMAL/Downloads/Prink/src/components/CustomerPortal.tsx';
let fileContent = fs.readFileSync(filePath, 'utf8');

const targetStartText = `        {/* ================================================================
            SUBVIEW: PREVIEW
            ================================================================ */}`;
const targetEndText = `        )}

      </main>`;

const startIndex = fileContent.indexOf(targetStartText);
const endIndex = fileContent.indexOf(targetEndText, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('Target not found!', { startIndex, endIndex });
  process.exit(1);
}

const beforePart = fileContent.substring(0, startIndex);
const afterPart = fileContent.substring(endIndex + targetEndText.length);

const replacement = `        {/* ================================================================
            SUBVIEW: CANVA EDITOR
            ================================================================ */}
        {subView === 'editor' && (
          <div className="flex flex-col gap-4">
            {/* Editor Navigation Bar */}
            <div className="flex align-center justify-between flex-wrap gap-3 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex align-center gap-3">
                <button className="btn btn-outline btn-sm" onClick={() => setSubView('dashboard')}>
                  <i className="bi bi-arrow-left" /> Back to Dashboard
                </button>
                <div>
                  <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>
                    Personalizing: {activeOrder?.product || 'Custom Product'}
                  </h1>
                  <div className="text-xs text-muted">SKU: {activeOrder?.sku || 'Default'}</div>
                </div>
              </div>

              {/* Action operations */}
              <div className="flex align-center gap-2">
                <button className="btn btn-outline btn-sm" title="Undo" onClick={handleUndo} disabled={undoStack.length === 0}>
                  <i className="bi bi-arrow-counterclockwise" />
                </button>
                <button className="btn btn-outline btn-sm" title="Redo" onClick={handleRedo} disabled={redoStack.length === 0}>
                  <i className="bi bi-arrow-clockwise" />
                </button>
                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                <button className="btn btn-outline btn-sm" onClick={saveDesign}>
                  <i className="bi bi-save" /> Save Draft
                </button>
                <button className="btn btn-primary btn-sm" onClick={submitDesign}>
                  <i className="bi bi-check-circle" /> Submit Design
                </button>
              </div>
            </div>

            {/* Split layout workspace */}
            <div className="grid grid-3 gap-6 align-start" style={{ gridTemplateColumns: '260px 1fr 280px', minHeight: '520px' }}>
              {/* Tool panel (Left) */}
              <div className="card p-4 flex flex-col gap-4" style={{ height: '100%', overflowY: 'auto' }}>
                <h3 className="font-bold text-xs" style={{ color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>Canva Design Tools</h3>
                
                {/* Text additions */}
                <div>
                  <button className="btn btn-outline btn-sm w-full text-left" onClick={addTextLayer}>
                    <i className="bi bi-fonts" style={{ marginRight: '8px' }} /> Add Text Layer
                  </button>
                </div>

                {/* Shapes selector */}
                <div>
                  <div className="text-xxs text-muted mb-2 font-bold" style={{ textTransform: 'uppercase' }}>Add Shapes</div>
                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm flex-1" title="Rectangle" onClick={() => addShapeLayer('rect')}>
                      <i className="bi bi-square" />
                    </button>
                    <button className="btn btn-outline btn-sm flex-1" title="Circle" onClick={() => addShapeLayer('circle')}>
                      <i className="bi bi-circle" />
                    </button>
                  </div>
                </div>

                {/* Upload Photos Center */}
                <div>
                  <div className="text-xxs text-muted mb-2 font-bold" style={{ textTransform: 'uppercase' }}>Add Images</div>
                  <button className="btn btn-outline btn-sm w-full mb-3" onClick={() => fileInputRef.current?.click()}>
                    <i className="bi bi-cloud-upload" style={{ marginRight: '8px' }} /> Upload New Image
                  </button>
                  
                  {/* Photo picker list */}
                  <div className="flex flex-col gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {images.map(img => (
                      <div key={img.id} className="flex align-center justify-between p-2" style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }} onClick={() => addImageLayer(img.src)}>
                        <img src={img.src} alt={img.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                        <span className="text-xxs text-truncate" style={{ flex: 1, paddingLeft: '8px', maxWidth: '120px' }}>{img.name}</span>
                        <i className="bi bi-plus-lg text-xs" style={{ color: 'var(--accent)' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layer order list */}
                <div>
                  <div className="text-xxs text-muted mb-2 font-bold" style={{ textTransform: 'uppercase' }}>Layer Ordering</div>
                  <div className="flex flex-col gap-1">
                    {canvasElements.sort((a, b) => b.zIndex - a.zIndex).map(el => (
                      <div key={el.id} className={\`flex align-center justify-between p-2 text-xxs \${selectedElementId === el.id ? 'font-bold' : ''}\`} style={{
                        background: selectedElementId === el.id ? 'var(--bg-tertiary)' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--primary)'
                      }} onClick={() => setSelectedElementId(el.id)}>
                        <span className="capitalize">{el.type}: {el.text ? el.text.slice(0, 10) + '...' : el.shapeType || 'image'}</span>
                        <div className="flex gap-1">
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={(e) => { e.stopPropagation(); bringToFront(el.id); }} title="Bring to Front">
                            <i className="bi bi-chevron-double-up text-xxs" />
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={(e) => { e.stopPropagation(); sendToBack(el.id); }} title="Send to Back">
                            <i className="bi bi-chevron-double-down text-xxs" />
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} title="Delete">
                            <i className="bi bi-trash text-xxs" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bounded Canvas Workspace (Center) */}
              <div className="flex flex-col gap-3 align-center">
                {/* Scale & Guides Control */}
                <div className="flex align-center gap-4 justify-between w-full p-2 card" style={{ flexDirection: 'row' }}>
                  <div className="flex align-center gap-2">
                    <label className="text-xs text-muted">Canvas Zoom:</label>
                    <input type="range" min="0.6" max="1.5" step="0.1" value={canvasScale} onChange={e => setCanvasScale(parseFloat(e.target.value))} style={{ width: '80px' }} />
                    <span className="text-xxs">{Math.round(canvasScale * 100)}%</span>
                  </div>
                  <div className="flex align-center gap-3">
                    <label className="text-xs flex align-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={showSafe} onChange={e => setShowSafe(e.target.checked)} />
                      <span>Safe Margin</span>
                    </label>
                    <label className="text-xs flex align-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} />
                      <span>Bleed Margin</span>
                    </label>
                  </div>
                </div>

                {/* Canvas Bounding Area */}
                <div style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed var(--border-color)',
                  overflow: 'hidden'
                }} onClick={() => setSelectedElementId(null)}>
                  {/* Canvas dimensions */}
                  <div className="canvas-box" style={{
                    width: '450px',
                    height: '320px',
                    background: activeTheme.bg,
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    transform: \`scale(\${canvasScale})\`,
                    transition: 'transform 0.15s ease-out',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {/* Safe guidelines overlay */}
                    {showSafe && (
                      <div style={{
                        position: 'absolute',
                        inset: '16px',
                        border: '1px dashed rgba(23,28,98,0.35)',
                        pointerEvents: 'none',
                        zIndex: 1000
                      }}>
                        <div style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(23,28,98,0.75)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '2px' }}>Safe Margin</div>
                      </div>
                    )}

                    {/* Bleed zone overlay */}
                    {showBleed && (
                      <div style={{
                        position: 'absolute',
                        inset: '0px',
                        border: '4px solid rgba(255,48,76,0.25)',
                        pointerEvents: 'none',
                        zIndex: 1000
                      }}>
                        <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(255,48,76,0.75)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '2px' }}>Bleed zone</div>
                      </div>
                    )}

                    {/* Grid Snap Guidelines (Simulated) */}
                    {editorSnapAlign && selectedElementId && (
                      <>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dotted rgba(23,28,98,0.2)', pointerEvents: 'none', zIndex: 999 }} />
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px dotted rgba(23,28,98,0.2)', pointerEvents: 'none', zIndex: 999 }} />
                      </>
                    )}

                    {/* Render Layers */}
                    {canvasElements.map(el => {
                      if (el.type === 'text') {
                        return (
                          <div
                            key={el.id}
                            id={el.id}
                            className={\`canvas-layer-text \${selectedElementId === el.id ? 'active' : ''}\`}
                            onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                            style={{
                              position: 'absolute',
                              left: \`\${el.x}px\`,
                              top: \`\${el.y}px\`,
                              width: \`\${el.width}px\`,
                              height: \`\${el.height}px\`,
                              transform: \`rotate(\${el.rotation}deg)\`,
                              fontFamily: el.fontFamily || 'Outfit',
                              fontSize: \`\${el.fontSize || 20}px\`,
                              color: el.color || '#171c62',
                              textAlign: el.textAlign || 'center',
                              cursor: 'move',
                              padding: '2px',
                              border: selectedElementId === el.id ? '2px dashed var(--accent)' : 'none',
                              zIndex: el.zIndex,
                              opacity: el.opacity,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              overflow: 'hidden'
                            }}
                          >
                            {el.text}
                          </div>
                        );
                      } else if (el.type === 'image') {
                        return (
                          <div
                            key={el.id}
                            id={el.id}
                            className={\`canvas-layer-image \${selectedElementId === el.id ? 'active' : ''}\`}
                            onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                            style={{
                              position: 'absolute',
                              left: \`\${el.x}px\`,
                              top: \`\${el.y}px\`,
                              width: \`\${el.width}px\`,
                              height: \`\${el.height}px\`,
                              transform: \`rotate(\${el.rotation}deg)\`,
                              cursor: 'move',
                              border: selectedElementId === el.id ? '2px dashed var(--accent)' : 'none',
                              zIndex: el.zIndex,
                              opacity: el.opacity,
                              overflow: 'hidden'
                            }}
                          >
                            <img
                              src={el.src}
                              alt="Canvas Item"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: \`brightness(\${el.brightness ?? 100}%) contrast(\${el.contrast ?? 100}%) saturate(\${el.saturation ?? 100}%) blur(\${el.blur ?? 0}px) sepia(\${el.sepia ?? 0}%) \${el.grayscale ? 'grayscale(100%)' : ''}\`,
                                transform: \`\${el.flipX ? 'scaleX(-1)' : ''} \${el.flipY ? 'scaleY(-1)' : ''}\`
                              }}
                            />
                          </div>
                        );
                      } else if (el.type === 'shape') {
                        return (
                          <div
                            key={el.id}
                            id={el.id}
                            className={\`canvas-layer-shape \${selectedElementId === el.id ? 'active' : ''}\`}
                            onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                            style={{
                              position: 'absolute',
                              left: \`\${el.x}px\`,
                              top: \`\${el.y}px\`,
                              width: \`\${el.width}px\`,
                              height: \`\${el.height}px\`,
                              transform: \`rotate(\${el.rotation}deg)\`,
                              cursor: 'move',
                              border: selectedElementId === el.id ? '2px dashed var(--accent)' : 'none',
                              zIndex: el.zIndex,
                              opacity: el.opacity
                            }}
                          >
                            {el.shapeType === 'circle' ? (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: el.fillColor || '#FF304C',
                                border: \`\${el.strokeWidth || 1}px solid \${el.strokeColor || '#171c62'}\`
                              }} />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                background: el.fillColor || '#FF304C',
                                border: \`\${el.strokeWidth || 1}px solid \${el.strokeColor || '#171c62'}\`
                              }} />
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>

              {/* Inspector Panel (Right) */}
              <div className="card p-4 flex flex-col gap-4" style={{ height: '100%' }}>
                <h3 className="font-bold text-xs" style={{ color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>Inspector Settings</h3>
                
                {(() => {
                  const activeEl = canvasElements.find(el => el.id === selectedElementId);
                  if (!activeEl) {
                    return (
                      <div className="text-xs text-muted" style={{ padding: '2rem 0', textAlign: 'center', fontStyle: 'italic' }}>
                        Click on any canvas element to customize its properties.
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-3">
                      {/* Common Size/Pos Sliders */}
                      <div>
                        <div className="text-xxs text-muted mb-1 font-bold">Layer Properties</div>
                        <div className="flex flex-col gap-2">
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Position X</span>
                              <span>{activeEl.x}px</span>
                            </div>
                            <input type="range" min="0" max="400" value={activeEl.x} onChange={e => updateElementProps(activeEl.id, { x: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Position Y</span>
                              <span>{activeEl.y}px</span>
                            </div>
                            <input type="range" min="0" max="300" value={activeEl.y} onChange={e => updateElementProps(activeEl.id, { y: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Layer Width</span>
                              <span>{activeEl.width}px</span>
                            </div>
                            <input type="range" min="20" max="450" value={activeEl.width} onChange={e => updateElementProps(activeEl.id, { width: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Layer Height</span>
                              <span>{activeEl.height}px</span>
                            </div>
                            <input type="range" min="20" max="320" value={activeEl.height} onChange={e => updateElementProps(activeEl.id, { height: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Rotation</span>
                              <span>{activeEl.rotation}°</span>
                            </div>
                            <input type="range" min="0" max="360" value={activeEl.rotation} onChange={e => updateElementProps(activeEl.id, { rotation: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Opacity</span>
                              <span>{Math.round(activeEl.opacity * 100)}%</span>
                            </div>
                            <input type="range" min="0.1" max="1" step="0.1" value={activeEl.opacity} onChange={e => updateElementProps(activeEl.id, { opacity: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                      </div>

                      {/* Text Specific Settings */}
                      {activeEl.type === 'text' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }} className="flex flex-col gap-2">
                          <div className="text-xxs text-muted mb-1 font-bold">Text Editor</div>
                          <div>
                            <label className="text-xxs font-semibold">Change Text:</label>
                            <input type="text" className="input text-xs" style={{ padding: '6px 8px', marginTop: '0.2rem' }} value={activeEl.text || ''} onChange={e => updateElementProps(activeEl.id, { text: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xxs font-semibold">Font Family:</label>
                            <select className="input text-xs" style={{ padding: '4px 6px', marginTop: '0.2rem' }} value={activeEl.fontFamily || 'Outfit'} onChange={e => updateElementProps(activeEl.id, { fontFamily: e.target.value })}>
                              <option value="Outfit">Outfit</option>
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times Roman</option>
                              <option value="Courier New">Courier</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Font Size</span>
                              <span>{activeEl.fontSize || 20}px</span>
                            </div>
                            <input type="range" min="10" max="80" value={activeEl.fontSize || 20} onChange={e => updateElementProps(activeEl.id, { fontSize: parseInt(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-xxs font-semibold">Text Color:</label>
                            <input type="color" style={{ width: '100%', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }} value={activeEl.color || '#171c62'} onChange={e => updateElementProps(activeEl.id, { color: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xxs font-semibold">Alignment:</label>
                            <div className="flex gap-1" style={{ marginTop: '0.2rem' }}>
                              {(['left', 'center', 'right'] as const).map(align => (
                                <button key={align} className={\`btn btn-outline btn-sm flex-1 capitalize \${activeEl.textAlign === align ? 'active' : ''}\`} style={{ fontSize: '10px', padding: '4px' }} onClick={() => updateElementProps(activeEl.id, { textAlign: align })}>
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Specific Settings */}
                      {activeEl.type === 'image' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }} className="flex flex-col gap-2">
                          <div className="text-xxs text-muted mb-1 font-bold">Image Filters</div>
                          
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Brightness</span>
                              <span>{activeEl.brightness ?? 100}%</span>
                            </div>
                            <input type="range" min="50" max="150" value={activeEl.brightness ?? 100} onChange={e => updateElementProps(activeEl.id, { brightness: parseInt(e.target.value) })} />
                          </div>

                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Contrast</span>
                              <span>{activeEl.contrast ?? 100}%</span>
                            </div>
                            <input type="range" min="50" max="150" value={activeEl.contrast ?? 100} onChange={e => updateElementProps(activeEl.id, { contrast: parseInt(e.target.value) })} />
                          </div>

                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Saturation</span>
                              <span>{activeEl.saturation ?? 100}%</span>
                            </div>
                            <input type="range" min="50" max="150" value={activeEl.saturation ?? 100} onChange={e => updateElementProps(activeEl.id, { saturation: parseInt(e.target.value) })} />
                          </div>

                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Blur</span>
                              <span>{activeEl.blur ?? 0}px</span>
                            </div>
                            <input type="range" min="0" max="10" value={activeEl.blur ?? 0} onChange={e => updateElementProps(activeEl.id, { blur: parseInt(e.target.value) })} />
                          </div>

                          <div className="flex justify-between mt-2 flex-wrap gap-2">
                            <label className="text-xxs flex align-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={!!activeEl.grayscale} onChange={e => updateElementProps(activeEl.id, { grayscale: e.target.checked })} />
                              <span>Grayscale</span>
                            </label>
                            <label className="text-xxs flex align-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={!!activeEl.flipX} onChange={e => updateElementProps(activeEl.id, { flipX: e.target.checked })} />
                              <span>Flip X</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Shape Specific Settings */}
                      {activeEl.type === 'shape' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }} className="flex flex-col gap-2">
                          <div className="text-xxs text-muted mb-1 font-bold">Shape Styling</div>
                          <div>
                            <label className="text-xxs font-semibold">Fill Color:</label>
                            <input type="color" style={{ width: '100%', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }} value={activeEl.fillColor || '#FF304C'} onChange={e => updateElementProps(activeEl.id, { fillColor: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xxs font-semibold">Border Color:</label>
                            <input type="color" style={{ width: '100%', height: '24px', border: 'none', cursor: 'pointer', padding: 0 }} value={activeEl.strokeColor || '#171c62'} onChange={e => updateElementProps(activeEl.id, { strokeColor: e.target.value })} />
                          </div>
                          <div>
                            <div className="flex justify-between text-xxs mb-1">
                              <span>Border Width</span>
                              <span>{activeEl.strokeWidth || 1}px</span>
                            </div>
                            <input type="range" min="0" max="10" value={activeEl.strokeWidth || 1} onChange={e => updateElementProps(activeEl.id, { strokeWidth: parseInt(e.target.value) })} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            SUBVIEW: TRACKING
            ================================================================ */}
        {subView === 'tracking' && (
          <div className="flex flex-col gap-6">
            <div className="flex align-center justify-between mb-2">
              <div>
                <button className="btn btn-outline btn-sm mb-2" onClick={() => setSubView('dashboard')}>
                  <i className="bi bi-arrow-left" /> Back to Dashboard
                </button>
                <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
                  Order Customization Tracking
                </h1>
                <p className="text-xs text-muted" style={{ margin: 0 }}>
                  Follow the progress from sync to package dispatch.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-muted">Estimated Delivery</div>
                <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>July 04, 2026</div>
              </div>
            </div>

            {/* Tracking Status Timeline */}
            {activeOrder && (
              <div className="card p-6 flex flex-col gap-6">
                <div className="flex justify-between flex-wrap gap-4 align-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                  <div>
                    <span className="text-xs text-muted">Product Type:</span>
                    <div className="font-semibold text-sm capitalize" style={{ color: 'var(--primary)' }}>{activeOrder.productType}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Job ID:</span>
                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{activeOrder.id}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Shopify Order Ref:</span>
                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>Shopify-{activeOrder.id.split('-')[0]}</div>
                  </div>
                </div>

                {/* Vertical Step Timeline */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2rem', paddingLeft: '24px' }}>
                  {/* Spine connection line */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    bottom: '8px',
                    left: '8px',
                    width: '3px',
                    background: 'var(--border-color)',
                    zIndex: 1
                  }} />

                  {(
                    [
                      { title: 'Shopify Sync Completed', desc: 'Shopify order captured and itemized details fetched.', isPast: true },
                      { title: 'Customization Design Drafted', desc: 'Customer started using the personalizing lab editor.', isPast: activeOrder.customizationStatus !== 'pending' },
                      { title: 'Design Review Submitted', desc: 'Customization final submission received by the manager.', isPast: activeOrder.customizationStatus === 'completed' },
                      { title: 'Admin Layout Approved', desc: 'Review completed. Compiled high-DPI assets verified.', isPast: activeOrder.uploadStatus === 'ready' },
                      { title: 'Vector Bleed Compiled', desc: 'Job moved into printing queues for automated press run.', isPast: activeOrder.uploadStatus === 'ready' },
                      { title: 'Package Packed', desc: 'Box printed, packed and labeled with Shopify dispatch info.', isPast: activeOrder.deliveryStatus === 'shipped' || activeOrder.deliveryStatus === 'delivered' },
                      { title: 'Shipped (Courier Dispatched)', desc: 'Order left packaging unit via priority shipping provider.', isPast: activeOrder.deliveryStatus === 'shipped' || activeOrder.deliveryStatus === 'delivered' },
                      { title: 'Order Completed & Delivered', desc: 'Order delivered to recipient address.', isPast: activeOrder.deliveryStatus === 'delivered' }
                    ]
                  ).map((step, idx) => (
                    <div key={idx} className="flex gap-4" style={{ position: 'relative', zIndex: 2 }}>
                      {/* Bullet point indicator */}
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        width: '19px',
                        height: '19px',
                        borderRadius: '50%',
                        background: step.isPast ? 'var(--success)' : 'var(--bg-secondary)',
                        border: \`4px solid \${step.isPast ? 'var(--success-light)' : 'var(--border-color)'}\`,
                        transition: 'background 0.3s'
                      }} />
                      <div>
                        <div className="font-bold text-sm" style={{ color: step.isPast ? 'var(--primary)' : 'var(--text-secondary)' }}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Admin Feedback Box */}
                {activeOrder.adminComments && (
                  <div style={{
                    marginTop: '1rem',
                    background: 'rgba(255,48,76,0.06)',
                    border: '1px solid rgba(255,48,76,0.12)',
                    padding: '1.25rem',
                    borderRadius: '8px'
                  }}>
                    <div className="font-bold text-xs" style={{ color: 'var(--error)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      <i className="bi bi-exclamation-triangle" style={{ marginRight: '6px' }} />
                      Admin Revision Requested
                    </div>
                    <p className="text-xs text-muted" style={{ margin: 0, lineHeight: 1.4 }}>
                      "\${activeOrder.adminComments}"
                    </p>
                    <button className="btn btn-primary btn-sm mt-3" onClick={() => loadSkuTemplate(activeOrder)}>
                      <i className="bi bi-pencil-square" /> Edit Design &amp; Resubmit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            SUBVIEW: DRAFTS / ORDER HISTORY
            ================================================================ */}
        {subView === 'drafts' && (
          <div className="flex flex-col gap-6">
            <div className="flex align-center justify-between mb-2">
              <div>
                <button className="btn btn-outline btn-sm mb-2" onClick={() => setSubView('dashboard')}>
                  <i className="bi bi-arrow-left" /> Back to Dashboard
                </button>
                <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
                  Order History &amp; Reordering
                </h1>
                <p className="text-xs text-muted" style={{ margin: 0 }}>
                  Track previously delivered orders or re-order.
                </p>
              </div>
            </div>

            {/* Historical Order List */}
            <div className="flex flex-col gap-4">
              {[
                { id: '#1039-1', product: 'Coffee Mug Wrap', date: 'May 10, 2026', total: '$14.99', status: 'Delivered', thumb: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150' },
                { id: '#1035-1', product: 'Stretch Canvas 12×16', date: 'Apr 24, 2026', total: '$39.00', status: 'Delivered', thumb: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150' }
              ].map(h => (
                <div key={h.id} className="card p-4 flex align-center justify-between flex-wrap gap-4">
                  <div className="flex align-center gap-3">
                    <img src={h.thumb} alt={h.product} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{h.product}</div>
                      <div className="text-xxs text-muted" style={{ marginTop: '0.15rem' }}>ID: {h.id} | Date: {h.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-success text-xxs" style={{ marginBottom: '0.2rem', display: 'inline-block' }}>{h.status}</span>
                    <div className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{h.total}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href="#" className="btn btn-outline btn-sm" onClick={e => { e.preventDefault(); showToast('Downloading invoice PDF...', 'info'); }}>
                      <i className="bi bi-file-earmark-pdf" /> Invoice
                    </a>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      showToast('Reorder item added to Shopify cart!', 'success');
                    }}>
                      <i className="bi bi-arrow-repeat" /> Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      `;

const updatedContent = beforePart + replacement + afterPart;
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Successfully updated views via scratch script!');
