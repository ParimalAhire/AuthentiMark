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
          { id: 'gan', name: 'GAN (Adversarial)' },
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
                <div className="mt-1 text-[14px] font-semibold text-[var(--filament)]">31.13 dB PSNR · 0.852 SSIM</div>
                <p className="text-[12px] text-mute mt-1">Reliable preservation of fine textures and sharp edges.</p>
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
              The Variational Autoencoder (VAE) incorporates a regularized, sampled Gaussian latent space. 
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
                    <span className="tag text-[8px]">Val Bit Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">98.87%</div>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Best Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">99.13%</div>
                    <span className="text-[8px] text-mute">at Epoch 58</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Fidelity</span>
                <div className="mt-1 text-[14px] font-semibold text-[var(--filament)]">28.41 dB PSNR · 0.808 SSIM</div>
                <p className="text-[12px] text-mute mt-1">Noise is distributed into smooth stochastic patterns.</p>
              </div>

              <div>
                <span className="tag text-[9px]">Verdict</span>
                <p className="text-[12px] text-mute mt-1 leading-relaxed">
                  Smooth latent regularization prevents overfitting to clean pixels, yielding superior resilience under rotational and spatial transformations.
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
              <p className="text-[11px] text-mute mt-2">Loss curves and validation bit accuracy over epochs.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Reconstruction Samples</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/vae_sample_images.png" alt="VAE Sample Images" className="w-full h-auto object-contain max-h-[350px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Comparison showing original images, watermarked images, and the residual difference (watermark noise).</p>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUB-TAB: GAN (Adversarial Watermark) */}
      {subTab === 'gan' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-[#F43F5E18] text-[#F43F5E] text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                Adversarial Co-Training
              </div>
              <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                GAN Watermarking
              </h2>
            </div>
            <p className="text-[13.5px] text-mute leading-relaxed">
              The Generative Adversarial Network (GAN) architecture frames invisible watermarking as an adversarial minimax game. 
              The <b>Generator (Encoder)</b> embeds the 32-bit watermark while a paired <b>Discriminator</b> attempts to differentiate 
              watermarked images from clean originals. This adversarial pressure forces watermark artifacts into imperceptible high-frequency texture components.
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Measured Benchmark Performance</span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">PSNR (Fidelity)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[#F43F5E]">35.91 dB</div>
                    <span className="text-[8px] text-[var(--signal)]">Highest among all models</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">SSIM (Similarity)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">0.9831</div>
                    <span className="text-[8px] text-[var(--signal)]">Near-lossless visual quality</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Bit Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">99.81%</div>
                    <span className="text-[8px] text-mute">BER: 0.0019</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Residual Mean Abs</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">1.81 / 255</div>
                    <span className="text-[8px] text-mute">65% lower noise than AE</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">JPEG Q90 Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">95.00%</div>
                    <span className="text-[8px] text-mute">vs AE 50.17% / VAE 52.00%</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Final Overall Score</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[#F43F5E]">0.7925</div>
                    <span className="text-[8px] text-[var(--signal)]">Best overall benchmark</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Architectural Advantage</span>
                <p className="text-[12px] text-mute mt-1 leading-relaxed">
                  By penalizing visual trace artifacts via the Discriminator loss (<code className="font-mono text-[11px]">L_adv</code>), 
                  the GAN achieves significantly sharper edges and imperceptible perturbations compared to non-adversarial Autoencoders.
                </p>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="panel p-4">
                <span className="tag mb-2">Generator vs Discriminator Loss</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_losses_g_d.png" alt="GAN Generator & Discriminator Loss" className="w-full h-auto object-contain max-h-[220px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Minimax loss dynamics across 60 co-training epochs.</p>
              </div>

              <div className="panel p-4">
                <span className="tag mb-2">Validation PSNR Progression</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_validation_psnr.png" alt="GAN Validation PSNR" className="w-full h-auto object-contain max-h-[220px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Steady climb reaching a peak 35.91 dB PSNR.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="panel p-4">
                <span className="tag mb-2">Validation Bit Accuracy</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_bit_accuracy.png" alt="GAN Bit Accuracy" className="w-full h-auto object-contain max-h-[220px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Watermark extraction bit accuracy reaching 99.81%.</p>
              </div>

              <div className="panel p-4">
                <span className="tag mb-2">Discriminator Real vs Fake Scores</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_descriminator_scores.png" alt="Discriminator Scores" className="w-full h-auto object-contain max-h-[220px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Equilibrium scores confirming stealthy distribution alignment.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="panel p-4">
                <span className="tag mb-2">Image Reconstruction MSE Loss</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_img_loss.png" alt="GAN Image Loss" className="w-full h-auto object-contain max-h-[200px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Loss tracking image pixel preservation.</p>
              </div>

              <div className="panel p-4">
                <span className="tag mb-2">Message Recovery BCE Loss</span>
                <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                  <img src="/assets/gan_assets/gan_message_loss_bce.png" alt="GAN Message BCE Loss" className="w-full h-auto object-contain max-h-[200px]" />
                </figure>
                <p className="text-[10px] text-mute mt-1.5">Binary cross-entropy loss for 32-bit payload decoding.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'detector' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Vision Transformer (ViT) Detector
              </h2>
              <span className="inline-block px-2 py-0.5 rounded bg-[var(--trace)]/10 text-[var(--trace)] text-[10px] font-mono font-semibold">
                detector_gan_finetuned_v2.pt
              </span>
            </div>
            <p className="text-[13.5px] text-mute leading-relaxed">
              Fine-tuned ViT backbone (`google/vit-base-patch16-224`) explicitly adapted to detect watermarks across <b>all three architectures</b> (AE, VAE, and GAN) 
              as well as distorted/attacked media. Fine-tuning resolved the prior blindspot for subtle GAN perturbations, boosting GAN watermark detection from <b>1.4% to 99.5%</b>.
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Empirical Detection Accuracy (2,915 Test Samples)</span>
                <div className="space-y-2 mt-2">
                  {[
                    { label: 'Clean Plain (Unwatermarked)', val: '99.28%' },
                    { label: 'Clean Under Attacks', val: '93.55%' },
                    { label: 'GAN Plain (Adversarial)', val: '99.52%' },
                    { label: 'GAN Under Attacks', val: '91.50%' },
                    { label: 'AE Plain (Autoencoder)', val: '99.97%' },
                    { label: 'AE Under Attacks', val: '97.99%' },
                    { label: 'VAE Plain (Variational)', val: '99.76%' },
                    { label: 'VAE Under Attacks', val: '88.72%' }
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
              <p className="text-[11px] text-mute mt-2">Confusion matrix between clean and watermarked classes.</p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'comparison' && (
        <div className="space-y-8">
          {/* Main 3-Way Graph */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="tag">Empirical Benchmark Graphs</span>
                <h3 className="text-[17px] font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Tri-Model Performance Comparison: GAN vs AE vs VAE
                </h3>
              </div>
              <span className="text-[11px] font-mono text-mute">60 Epochs Evaluated</span>
            </div>
            <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-3">
              <img src="/assets/gan_assets/scores_comparison_graphs.png" alt="AE vs VAE vs GAN Comparison Graphs" className="w-full h-auto object-contain max-h-[460px] mx-auto" />
            </figure>
            <p className="text-[11.5px] text-mute mt-2">
              Side-by-side metric distributions illustrating GAN superiority in image fidelity (PSNR/SSIM) and JPEG attack survival.
            </p>
          </div>

          {/* Existing metric distributions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel p-5">
              <span className="tag mb-2">Peak Signal-to-Noise Ratio (PSNR)</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/PSNR.png" alt="PSNR Comparison" className="w-full h-auto object-contain max-h-[280px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">PSNR distribution comparison between deterministic and regularized models.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Structural Similarity (SSIM)</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/SSIM.png" alt="SSIM Comparison" className="w-full h-auto object-contain max-h-[280px]" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Structural similarity score distributions.</p>
            </div>
          </div>

          {/* Complete 3-Model Table */}
          <div className="panel p-6">
            <h3 className="text-[16px] font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Head-to-Head Technical Summary (AE vs VAE vs GAN)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line-2)] text-mute uppercase font-mono text-[9px] tracking-wider">
                    <th className="py-3 px-3">Metric</th>
                    <th className="py-3 px-3 text-[#5B8DEF]">Autoencoder (AE)</th>
                    <th className="py-3 px-3 text-[#4ADE80]">Variational (VAE)</th>
                    <th className="py-3 px-3 text-[#F43F5E]">GAN (Adversarial)</th>
                    <th className="py-3 px-3">Architectural Takeaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-mute font-mono text-[12px]">
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">PSNR (Fidelity)</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">31.13 dB</td>
                    <td className="py-3 px-3 text-[#4ADE80]">28.41 dB</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">35.91 dB</td>
                    <td className="py-3 px-3 font-sans text-[11px]">GAN delivers +4.8 dB higher fidelity over AE with near-invisible noise.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">SSIM (Structure)</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">0.8518</td>
                    <td className="py-3 px-3 text-[#4ADE80]">0.8079</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">0.9831</td>
                    <td className="py-3 px-3 font-sans text-[11px]">GAN achieves near-perfect structural preservation (&gt; 0.98).</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">Bit Accuracy (Clean)</td>
                    <td className="py-3 px-3 text-[#5B8DEF] font-bold">99.97%</td>
                    <td className="py-3 px-3 text-[#4ADE80]">98.87%</td>
                    <td className="py-3 px-3 text-[#F43F5E]">99.81%</td>
                    <td className="py-3 px-3 font-sans text-[11px]">AE and GAN both reliably recover &gt; 99.8% of embedded payload bits.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">Bit Error Rate (BER)</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">0.0003</td>
                    <td className="py-3 px-3 text-[#4ADE80]">0.0113</td>
                    <td className="py-3 px-3 text-[#F43F5E]">0.0019</td>
                    <td className="py-3 px-3 font-sans text-[11px]">Extremely low error rates across uncompressed transmissions.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">Residual Mean Abs (0-255)</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">5.24</td>
                    <td className="py-3 px-3 text-[#4ADE80]">6.42</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">1.81</td>
                    <td className="py-3 px-3 font-sans text-[11px]">GAN watermark residual perturbation is ~3x smaller than AE.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">JPEG Q90 Recovery</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">50.17%</td>
                    <td className="py-3 px-3 text-[#4ADE80]">52.00%</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">95.00%</td>
                    <td className="py-3 px-3 font-sans text-[11px]">GAN watermark is engineered to survive lossy DCT compression.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">Overall Quality Score</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">0.9073</td>
                    <td className="py-3 px-3 text-[#4ADE80]">0.8739</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">0.9693</td>
                    <td className="py-3 px-3 font-sans text-[11px]">Weighted quality score incorporating PSNR, SSIM, and residual L-infinity.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-[var(--filament)]">Final Benchmark Score</td>
                    <td className="py-3 px-3 text-[#5B8DEF]">0.7044</td>
                    <td className="py-3 px-3 text-[#4ADE80]">0.6897</td>
                    <td className="py-3 px-3 text-[#F43F5E] font-bold">0.7925</td>
                    <td className="py-3 px-3 font-sans text-[11px]">GAN is the highest-performing watermarking architecture overall.</td>
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
