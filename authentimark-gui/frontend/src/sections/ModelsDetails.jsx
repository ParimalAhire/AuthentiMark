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
          { id: 'latent_residual', name: 'LR (Diffusion)' },
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

      {/* SUB-TAB: Latent-Residual (Diffusion) */}
      {subTab === 'latent_residual' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Specifications */}
          <div className="panel p-6 space-y-6">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-[#8B5CF618] text-[#8B5CF6] text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                TAESD Latent-Space Diffusion
              </div>
              <h2 className="text-[20px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Latent-Residual Model
              </h2>
            </div>
            <p className="text-[13.5px] text-mute leading-relaxed">
              The <b>Latent-Residual</b> architecture operates inside the compressed 4-channel latent space of a pre-trained, frozen 
              Tiny AutoEncoder for Stable Diffusion (TAESD). A 3-layer convolutional network computes a latent shift 
              <code className="font-mono text-[11px] ml-1">&Delta;z = 2.0 &middot; tanh(f([z, m]) + m_proj)</code>, 
              which is decoded into an image residual and bounded by a pixel perturbation cap (<code className="font-mono text-[11px]">scale = 0.1</code>).
            </p>

            <div className="border-t border-[var(--line)] pt-4 space-y-4">
              <div>
                <span className="tag text-[9px]">Empirical Test Results (9,771 Images)</span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Bit Accuracy (Clean)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">99.96%</div>
                    <span className="text-[8px] text-mute">Exact match: 98.96%</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Attack Robustness</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[#8B5CF6]">0.9968</div>
                    <span className="text-[8px] text-[var(--signal)]">Top-tier resilience</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">JPEG Q90 Accuracy</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--signal)]">99.94%</div>
                    <span className="text-[8px] text-mute">JPEG Q30: 99.56%</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Crop 0.8 &amp; Blur</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">99.32% / 99.89%</div>
                    <span className="text-[8px] text-mute">Crop 80% &amp; Gaussian Blur</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">PSNR (Fidelity)</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[var(--filament)]">21.00 dB</div>
                    <span className="text-[8px] text-mute">SSIM: 0.6443</span>
                  </div>
                  <div className="panel-inset p-3">
                    <span className="tag text-[8px]">Final Overall Score</span>
                    <div className="text-[18px] font-bold readout mt-1 text-[#8B5CF6]">0.8945</div>
                    <span className="text-[8px] text-mute">Quality: 0.7922</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="tag text-[9px]">Research Paper Analysis &amp; Trade-Offs</span>
                <p className="text-[12px] text-mute mt-1 leading-relaxed">
                  Embedding watermarks inside the TAESD latent space guarantees high survivability under real-world distortions like JPEG compression and cropping, because latent features represent high-level semantic image components. 
                  However, because the TAESD encoder and decoder compress images by an 8&times; spatial factor (16&times;16 latent representation for 128&times;128 images), decoding introduces block-level reconstruction artifacts that limit PSNR to 21.00 dB (&Delta;E 12.05) compared to direct pixel-residual architectures.
                </p>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <div className="panel p-5">
              <span className="tag mb-2">Training Performance &amp; Attack Curves</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/diffusion_assests/all_curves_output.png" alt="Latent-Residual All Curves" className="w-full h-auto object-contain max-h-[480px] mx-auto" />
              </figure>
              <p className="text-[11px] text-mute mt-2">
                Training dynamics for Latent-Residual: image loss (MSE), message loss (BCE), learning rate / scale schedule, and bit recovery rates under clean, JPEG Q90, JPEG Q30, Crop 0.8, and Blur attacks across epochs.
              </p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'comparison' && (
        <div className="space-y-8">
          {/* Training Architecture */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="tag">Unified Framework</span>
                <h3 className="text-[17px] font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Training Architecture Shared by All Five Models
                </h3>
              </div>
              <span className="text-[11px] font-mono text-mute">Research Benchmark</span>
            </div>
            <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-3">
              <img src="/assets/final_comparison/Training architecture shared by all five models.png" alt="Shared Training Architecture" className="w-full h-auto object-contain max-h-[420px] mx-auto" />
            </figure>
            <p className="text-[11.5px] text-mute mt-2">
              End-to-end differentiable watermarking pipeline incorporating Encoder (Generator), simulated attack channel (JPEG, Crop, Blur, Noise), and recovery Decoder.
            </p>
          </div>

          {/* Benchmark Comparison Figures: Quality, Robustness, Final Score + Bit Accuracy */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel p-5">
              <span className="tag mb-2">Quality, Robustness &amp; Final Score</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/final_comparison/Quality, robustness and final score per model.png" alt="Quality, Robustness and Final Score" className="w-full h-auto object-contain max-h-[290px] mx-auto" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Comparative trade-offs between perceptual image quality, distortion robustness, and final weighted benchmark scores.</p>
            </div>

            <div className="panel p-5">
              <span className="tag mb-2">Bit Accuracy Under Real Attacks</span>
              <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
                <img src="/assets/final_comparison/Bit accuracy on the test split, real attacks.png" alt="Bit Accuracy on Real Attacks" className="w-full h-auto object-contain max-h-[290px] mx-auto" />
              </figure>
              <p className="text-[11px] text-mute mt-2">Bit recovery accuracy across clean, JPEG Q90, JPEG Q30, Crop 0.8, and Gaussian Blur attack evaluations.</p>
            </div>
          </div>

          {/* PSNR, SSIM & Colour Difference Figure */}
          <div className="panel p-5">
            <span className="tag mb-2">Fidelity &amp; Perceptual Quality Distribution</span>
            <figure className="border border-[var(--line)] rounded-lg overflow-hidden bg-white p-2">
              <img src="/assets/final_comparison/PSNR, SSIM and colour difference.png" alt="PSNR, SSIM and Colour Difference" className="w-full h-auto object-contain max-h-[320px] mx-auto" />
            </figure>
            <p className="text-[11px] text-mute mt-2">Evaluation of Peak Signal-to-Noise Ratio (PSNR), Structural Similarity Index (SSIM), and CIEDE2000 colour difference (&Delta;E).</p>
          </div>

          {/* Complete 5-Model Benchmark Table */}
          <div className="panel p-6">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <h3 className="text-[16px] font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                Table IV: Main Results on the 9,771-Image Test Split (Real Attacks)
              </h3>
              <span className="text-[11px] font-mono text-mute">AuthentiMark Research Evaluation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--line-2)] text-mute uppercase font-mono text-[9px] tracking-wider">
                    <th className="py-3 px-2.5">Model</th>
                    <th className="py-3 px-2.5">Bit Acc.</th>
                    <th className="py-3 px-2.5">Exact Match</th>
                    <th className="py-3 px-2.5">PSNR (dB)</th>
                    <th className="py-3 px-2.5">SSIM</th>
                    <th className="py-3 px-2.5">&Delta;E (CIEDE2000)</th>
                    <th className="py-3 px-2.5">Quality</th>
                    <th className="py-3 px-2.5">Robustness</th>
                    <th className="py-3 px-2.5 font-bold">Final Score</th>
                    <th className="py-3 px-2.5">Train (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-mute font-mono text-[11.5px]">
                  <tr>
                    <td className="py-3 px-2.5 font-sans font-semibold text-[#5B8DEF]">Autoencoder (AE)</td>
                    <td className="py-3 px-2.5">0.9996</td>
                    <td className="py-3 px-2.5">0.9919</td>
                    <td className="py-3 px-2.5">23.17</td>
                    <td className="py-3 px-2.5">0.5766</td>
                    <td className="py-3 px-2.5">13.40</td>
                    <td className="py-3 px-2.5">0.7888</td>
                    <td className="py-3 px-2.5">0.9978</td>
                    <td className="py-3 px-2.5 text-[var(--filament)] font-bold">0.8933</td>
                    <td className="py-3 px-2.5">49</td>
                  </tr>
                  <tr style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                    <td className="py-3 px-2.5 font-sans font-semibold text-[#8B5CF6]">LR (Diffusion)</td>
                    <td className="py-3 px-2.5">0.9996</td>
                    <td className="py-3 px-2.5">0.9896</td>
                    <td className="py-3 px-2.5">21.00</td>
                    <td className="py-3 px-2.5">0.6443</td>
                    <td className="py-3 px-2.5">12.05</td>
                    <td className="py-3 px-2.5">0.7922</td>
                    <td className="py-3 px-2.5">0.9968</td>
                    <td className="py-3 px-2.5 text-[#8B5CF6] font-bold">0.8945</td>
                    <td className="py-3 px-2.5">167</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2.5 font-sans font-semibold text-[#4ADE80]">Variational (VAE)</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">1.0000</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">1.0000</td>
                    <td className="py-3 px-2.5">24.88</td>
                    <td className="py-3 px-2.5">0.6674</td>
                    <td className="py-3 px-2.5">11.20</td>
                    <td className="py-3 px-2.5">0.8223</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">0.9999</td>
                    <td className="py-3 px-2.5 text-[var(--filament)] font-bold">0.9111</td>
                    <td className="py-3 px-2.5">108</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2.5 font-sans font-semibold text-[#F59E0B]">GAN-Rebuild</td>
                    <td className="py-3 px-2.5">0.9993</td>
                    <td className="py-3 px-2.5">0.9830</td>
                    <td className="py-3 px-2.5">25.64</td>
                    <td className="py-3 px-2.5">0.8529</td>
                    <td className="py-3 px-2.5">9.25</td>
                    <td className="py-3 px-2.5">0.8732</td>
                    <td className="py-3 px-2.5">0.9925</td>
                    <td className="py-3 px-2.5 text-[var(--filament)] font-bold">0.9328</td>
                    <td className="py-3 px-2.5">110</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2.5 font-sans font-semibold text-[#F43F5E]">GAN-Residual</td>
                    <td className="py-3 px-2.5">0.9997</td>
                    <td className="py-3 px-2.5">0.9937</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">29.78</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">0.8949</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">3.28</td>
                    <td className="py-3 px-2.5 font-bold text-[var(--signal)]">0.9097</td>
                    <td className="py-3 px-2.5">0.9961</td>
                    <td className="py-3 px-2.5 text-[#F43F5E] font-bold">0.9529</td>
                    <td className="py-3 px-2.5">92</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-[11.5px] text-mute space-y-1">
              <p>&bull; <b>GAN-Residual</b> achieved the highest overall score (0.9529) and lowest colour difference (&Delta;E 3.28) with PSNR of 29.78 dB.</p>
              <p>&bull; <b>VAE</b> achieved perfect clean bit accuracy (1.0000) and highest robustness (0.9999).</p>
              <p>&bull; <b>Latent-Residual</b> balances diffusion latent stability (0.9968 robustness) while being subject to TAESD 8&times; block compression limits (21.00 dB PSNR).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
