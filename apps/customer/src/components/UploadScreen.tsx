import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UploadCloud, X, ArrowLeft, Image as ImageIcon, Package, Download } from 'lucide-react';

// Real product images keyed by SKU – fallback when orderInfo has no images
const SKU_PRODUCT_IMAGES: Record<string, string> = {
  'MUG-WHT-11OZ':    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  'MUG-BLK-11OZ':    'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=800&auto=format&fit=crop',
  'MUG-MAGIC-15OZ':  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop',
  'TSH-WHT-L':        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  'TSH-BLK-L':        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop',
  'BAG-CAN-001':      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
  'CAS-IP14-PRO':     'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'CAS-IP15-PRO':     'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'FRM-WDN-8X10':     'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  'FRM-BLK-11X14':    'https://images.unsplash.com/photo-1618220048851-db15a46e62b4?q=80&w=800&auto=format&fit=crop',
  'CANVAS-12X16':     'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  'CANVAS-16X20':     'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop',
  'CAL-DESK-2026':    'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  'BOOK-HC-20P':      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  'PIL-SOFT-18X18':   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
  'PRK-MUG-CLASSIC':  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  'PRK-MUG-MAGIC':    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop',
  'PRK-TSHIRT-WHITE': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  'PRK-TSHIRT-BLACK': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop',
  'PRK-CANVAS-1216':  'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  'PRK-FRM-810':      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  'PRK-CAL-2026':     'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  'PRK-BOOK-20P':     'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  'PRK-CASE-IP15P':   'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'PRK-PIL-SOFT':     'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
};

interface UploadScreenProps {
  orderId: string;
  orderInfo: any;
  onBack: () => void;
  onComplete: () => void;
}

const SKU_RULES: Record<string, { max: number; types: string }> = {
  'MUG-WHT-11OZ': { max: 3, types: 'JPG, PNG' },
  'FRM-WDN-8X10': { max: 5, types: 'JPG, PNG' },
  'FRM-BLK-11X14': { max: 5, types: 'JPG, PNG' },
  'TSH-WHT-L': { max: 2, types: 'JPG, PNG' },
  'BAG-CAN-001': { max: 2, types: 'JPG, PNG' },
  'CAS-IP14-PRO': { max: 1, types: 'JPG, PNG' }
};

const UploadScreen: React.FC<UploadScreenProps> = ({ orderId, orderInfo, onBack, onComplete }) => {
  const [uploadedImages, setUploadedImages] = useState<any[]>(orderInfo.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(orderInfo.customerNotes || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rules = SKU_RULES[orderInfo.sku] || { max: 5, types: 'JPG, PNG' };
  
  const handleUploadClick = () => {
    if (uploadedImages.length >= rules.max) {
      alert(`You have reached the maximum upload limit of ${rules.max} images for this product.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > rules.max) {
      alert(`You can only upload a maximum of ${rules.max} images. Please select fewer files.`);
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simple 20MB validation
        if (file.size > 20 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 20MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/orders/public/${encodeURIComponent(orderId)}/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        if (data.success) {
          setUploadedImages(prev => [...prev, { url: data.imageUrl, file: file }]);
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during upload.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/orders/public/${encodeURIComponent(orderId)}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          items: uploadedImages.length, 
          notes: customerNotes,
          images: uploadedImages.map(img => ({
            id: img.id || Math.random().toString(36).substring(7),
            url: img.url,
            src: img.src || img.url,
            name: img.name || (img.file ? img.file.name : '')
          }))
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSuccess(true);
      } else {
        alert('Failed to submit order.');
      }
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitted Successfully!</h2>
          <p className="text-gray-600 mb-8">Your images have been submitted successfully. Our design team will now prepare your personalized product.</p>
          <button 
            onClick={onComplete}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Orders
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Upload Photos</h1>
            <p className="text-sm text-gray-500">For Order {orderId} • Customer: {orderInfo.customer || 'Guest'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-5 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={uploadedImages.length === 0 || isUploading || isSubmitting}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Photos'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Product Details Sidebar */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Product Details</h3>
            
            <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden border border-gray-200">
              {(() => {
                // Priority: productImage field → SKU map → placeholder
                const imgSrc =
                  (orderInfo.productImage && orderInfo.productImage.startsWith('http'))
                    ? orderInfo.productImage
                    : (orderInfo.sku && SKU_PRODUCT_IMAGES[orderInfo.sku]) || null;
                return imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={orderInfo.product}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const parent = (e.currentTarget as HTMLImageElement).parentElement;
                      if (parent) {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        parent.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <Package size={48} strokeWidth={1} />
                    <span className="text-xs font-medium text-gray-400">No Product Image</span>
                  </div>
                );
              })()}
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Product:</span>
                <span className="font-semibold text-gray-900">{orderInfo.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SKU:</span>
                <span className="font-medium text-gray-900">{orderInfo.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium text-gray-900">{orderInfo.quantity}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <UploadCloud size={18} /> Upload Instructions
            </h4>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>Maximum <strong>{rules.max} images</strong> allowed.</li>
              <li>Supported formats: <strong>{rules.types}</strong>.</li>
              <li>Max file size: <strong>20MB</strong>.</li>
              <li>Our design team will expertly crop and enhance your photos to perfectly fit this product.</li>
            </ul>
          </div>
        </div>

        {/* Upload Area */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Photos</h2>
                <p className="text-gray-500 mt-1">Upload the images you want printed on this item.</p>
              </div>
              <div className="text-sm font-medium text-gray-500">
                {uploadedImages.length} / {rules.max} uploaded
              </div>
            </div>

            {/* Upload Zone */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.webp" 
              multiple 
              onChange={handleFileChange} 
            />

            {uploadedImages.length < rules.max && (
              <div 
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 hover:border-primary transition-all group mb-8"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Click to Upload</h3>
                <p className="text-gray-500 text-sm">or drag and drop your photos here</p>
              </div>
            )}

            {isUploading && (
              <div className="text-center py-8 text-primary font-medium animate-pulse">
                Uploading images... Please wait.
              </div>
            )}

            {/* Image Grid */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a 
                        href={img.url}
                        download={img.name || `uploaded_photo_${index + 1}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 hover:bg-primary text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        title="Download image"
                      >
                        <Download size={20} />
                      </a>
                      <button 
                        onClick={() => removeImage(index)}
                        className="bg-white/20 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        title="Remove image"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uploadedImages.length === 0 && !isUploading && (
              <div className="text-center py-12">
                <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No photos uploaded yet.</p>
              </div>
            )}
            {/* Customer Notes */}
            <div className="mt-8 border-t pt-6">
              <label htmlFor="customer-notes" className="block text-sm font-bold text-gray-700 mb-2">
                Add Notes for Design Team (Optional)
              </label>
              <textarea
                id="customer-notes"
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="E.g. Please crop closely to the faces, place text at the bottom, or enhance the lighting..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadScreen;
