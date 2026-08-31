import { useState } from 'react'

export default function ModelsDetails() {
  const [subTab, setSubTab] = useState('ae')

  return (
    <div className="space-y-8">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
        {[
          { id: 'ae', name: 'Autoencoder (AE)' },
          { id: 'vae', name: 'Variational AE (VAE)' },
          { id: 'detector', name: 'ViT Detector' },
          { id: 'comparison', name: 'Comparison & Metrics' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className="px-4 py-2 text-[12px] font-medium tracking-wide uppercase transition-colors rounded-lg border"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: subTab === tab.id ? 'var(--trace)' : 'var(--line-2)',
              background: subTab === tab.id ? 'rgba(153, 183, 245, 0.12)' : 'var(--panel)',
              color: subTab === tab.id ? 'var(--filament)' : 'var(--mute)'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {subTab === 'ae' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Autoencoder (AE)
            </h2>
            <p className="text-[13.5px] text-mute leading-relaxed">
              The Autoencoder (AE) model represents our deterministic baseline for watermark embedding. 
              The encoder embeds a 32-bit signature into the source image with minimal perceptual distortion.
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Key Metrics</span>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Image Loss (MSE)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">0.00025</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Message Loss (BCE)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">0.00043</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Val Bit Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">99.96%</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Best Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">100.0%</div>
                    <span className="text-[8px] text-mute">at Epoch 1</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Fidelity</span>
                <div className="mt-1 text-[14px] font-semibold text-[var(--filament)]">~31 dB PSNR</div>
                <p className="text-[12px] text-mute mt-1">Excellent preservation of fine textures and sharp edges.</p>
              </div>

              <div>
                <span className="tag text-[9px]">Verdict</span>
                <p className="text-[12px] text-mute mt-1 leading-relaxed">
                  Strong watermark recovery. The encoder-decoder pair reliably embeds and recovers the 32-bit message with high fidelity, and the low image loss indicates the watermark remains visually unobtrusive.
                </p>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <div className="panel p-5">
              <span className="tag mb-2">Training Performance</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/ae_training_curves.png" alt="AE Training Curves" className="w-full h-auto object-contain max-h-[300px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Loss curves and validation bit accuracy over epochs.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Reconstruction Samples</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/ae_sample_images.png" alt="AE Sample Images" className="w-full h-auto object-contain max-h-[350px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Comparison showing original images, watermarked images, and the residual difference (watermark noise).</p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'vae' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Variational AE (VAE)
            </h2>
            <p className="text-[13.5px] text-mute leading-relaxed">
              The Variational Autoencoder (VAE) incorporates a regularized, sampled latent space. 
              This structure encourages generalization and robustness to post-processing attacks at the cost of some clean-condition capacity.
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Key Metrics</span>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Image Loss (MSE)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">0.00131</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Message Loss (BCE)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">0.00832</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Final KL Div</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">1.4433</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Val Bit Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">98.83%</div>
                  </div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Fidelity & Generalization</span>
                <div className="mt-1 text-[14px] font-semibold text-[var(--filament)]">~17 dB PSNR (unconstrained / raw)</div>
                <p className="text-[12px] text-mute mt-1">
                  The KL divergence constraints the latent space mapping. This trade-off yields a smoother space better suited to withstand geometric and compression modifications.
                </p>
              </div>

              <div>
                <span className="tag text-[9px]">Verdict</span>
                <p className="text-[12px] text-mute mt-1 leading-relaxed">
                  Strong watermark recovery with a regularized latent space. The KL term successfully structures the embedding space without destroying message recoverability.
                </p>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <div className="panel p-5">
              <span className="tag mb-2">Training Performance</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/vae_training_curves.png" alt="VAE Training Curves" className="w-full h-auto object-contain max-h-[300px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Loss curves, KL divergence, and validation bit accuracy over epochs.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Reconstruction Samples</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/vae_sample_images.png" alt="VAE Sample Images" className="w-full h-auto object-contain max-h-[350px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Comparison showing original images, watermarked VAE images, and the residual difference.</p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'detector' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              ViT Detector
            </h2>
            <p className="text-[13.5px] text-mute leading-relaxed">
              A fine-tuned Vision Transformer (ViT-base) classifier designed to verify whether an image is clean, AE-watermarked, or VAE-watermarked. 
              Equipped with a 75% confidence threshold to prevent false claims.
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Global Accuracy</span>
                <div className="panel-inset p-4 mt-2">
                  <span className="tag text-[8.5px]">Overall Test Accuracy</span>
                  <div className="text-[26px] font-bold readout mt-1 text-[var(--signal)]">99.46%</div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Accuracy by Source</span>
                <div className="space-y-2 mt-2">
                  {[
                    { label: 'Clean (unwatermarked)', val: '99.01%' },
                    { label: 'Autoencoder (AE)', val: '99.93%' },
                    { label: 'Variational AE (VAE)', val: '99.45%' }
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center text-[13px] border-b border-[var(--line)] pb-1.5">
                      <span className="text-mute">{row.label}</span>
                      <span className="font-semibold readout text-[var(--filament)]">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Accuracy by Category</span>
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  {[
                    { label: 'Portrait', val: '99.75%' },
                    { label: 'Art Style', val: '99.58%' },
                    { label: 'Landscape', val: '98.95%' },
                    { label: 'Other', val: '99.05%' },
                    { label: 'Object', val: '96.55%' }
                  ].map((row) => (
                    <div key={row.label} className="panel-inset p-2">
                      <span className="tag text-[7.5px]">{row.label}</span>
                      <div className="text-[13px] font-semibold readout mt-0.5 text-[var(--filament)]">{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <div className="panel p-5">
              <span className="tag mb-2">Detector Accuracy Curve</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/detector_accuracy.png" alt="ViT Detector Accuracy" className="w-full h-auto object-contain max-h-[300px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Accuracy behavior and epochs log during training.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Confusion Matrix</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/tranformer_detector_confussion_matrix.png" alt="ViT Confusion Matrix" className="w-full h-auto object-contain max-h-[300px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Confusion matrix between clean, AE, and VAE watermarked classes.</p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'comparison' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel p-5">
              <span className="tag mb-2">Peak Signal-to-Noise Ratio (PSNR)</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/PSNR.png" alt="PSNR Comparison" className="w-full h-auto object-contain max-h-[280px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">PSNR distribution comparison between AE and VAE models.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Structural Similarity (SSIM)</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/SSIM.png" alt="SSIM Comparison" className="w-full h-auto object-contain max-h-[280px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">SSIM distribution comparison between AE and VAE models.</p>
            </div>
          </div>

          <div className="panel p-5">
            <span className="tag mb-2">Accuracy Under Attacks Comparison</span>
            <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
              <img src="/assets/Final_accuracy_comparison.png" alt="Accuracy comparison under post-processing attacks" className="w-full h-auto object-contain max-h-[400px]" />
            </figure>
            <p className="text-[11px] text-mute mt-2">Overall bit recovery accuracy comparisons under various simulated attacks.</p>
          </div>

          <div className="panel p-6">
            <h3 className="text-[16px] font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Head-to-Head Technical Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line-2)] text-mute uppercase font-mono text-[9px] tracking-wider">
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">Autoencoder (AE)</th>
                    <th className="py-3 px-4">Variational AE (VAE)</th>
                    <th className="py-3 px-4">Trade-off & Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-mute">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[var(--filament)]">Final Image Loss (MSE)</td>
                    <td className="py-3 px-4 readout">0.00025</td>
                    <td className="py-3 px-4 readout">0.00131</td>
                    <td className="py-3 px-4">AE preserves image fidelity slightly better (lower image loss by 0.00106).</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[var(--filament)]">Final Message Loss (BCE)</td>
                    <td className="py-3 px-4 readout">0.00043</td>
                    <td className="py-3 px-4 readout">0.00832</td>
                    <td className="py-3 px-4">AE message recovery is cleaner on unattacked media.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[var(--filament)]">Final Validation Accuracy</td>
                    <td className="py-3 px-4 readout">99.96%</td>
                    <td className="py-3 px-4 readout">98.83%</td>
                    <td className="py-3 px-4">AE outperforms VAE on clean bit recovery by 1.1 percentage points.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-[var(--filament)]">Best Validation Accuracy</td>
                    <td className="py-3 px-4 readout">100.00% (Epoch 1)</td>
                    <td className="py-3 px-4 readout">99.13% (Epoch 58)</td>
                    <td className="py-3 px-4">Deterministic baseline maps unconstrained features faster than the regularized space.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

