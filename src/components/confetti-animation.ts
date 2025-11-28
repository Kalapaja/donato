import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

/**
 * Confetti particle interface
 */
export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
  spawnDelay: number; // Delay in milliseconds before particle appears
}

/**
 * Confetti animation configuration
 */
export interface ConfettiConfig {
  colors?: string[];
  particleCount?: number;
  duration?: number;
  enabled?: boolean;
}

/**
 * Confetti Animation Component
 * 
 * Renders a canvas-based confetti particle animation with physics simulation.
 * Particles fall downward with gravity, rotation, and fade out over time.
 * 
 * @element confetti-animation
 * 
 * @attr {string} colors - Comma-separated list of hex colors for confetti particles
 * @attr {number} particle-count - Number of particles to generate (auto-scaled by viewport if not provided)
 * @attr {number} duration - Animation duration in milliseconds (default: 4000ms, range: 3000-5000ms)
 * @attr {boolean} enabled - Whether confetti animation is enabled (default: true)
 * 
 * @example
 * ```html
 * <confetti-animation
 *   colors="#ff0000,#00ff00,#0000ff"
 *   duration="4000"
 *   enabled="true">
 * </confetti-animation>
 * ```
 */
@customElement("confetti-animation")
export class ConfettiAnimation extends LitElement {
  /** Comma-separated list of hex colors for confetti particles */
  @property({ type: String, attribute: "colors" })
  accessor colors: string = "";

  /** Number of particles to generate (auto-scaled by viewport if not provided) */
  @property({ type: Number, attribute: "particle-count" })
  accessor particleCount: number | null = null;

  /** Animation duration in milliseconds (default: 4000ms, range: 3000-5000ms) */
  @property({ type: Number, attribute: "duration" })
  accessor duration: number = 4000;

  /** Whether confetti animation is enabled (default: true) */
  @property({ type: Boolean, attribute: "enabled" })
  accessor enabled: boolean = true;

  @state()
  private accessor particles: ConfettiParticle[] = [];

  @state()
  private accessor animationFrameId: number | null = null;

  @state()
  private accessor startTime: number = 0;

  @state()
  private accessor isAnimating: boolean = false;

  @state()
  private accessor prefersReducedMotion: boolean = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Default confetti colors
  private readonly defaultColors = [
    "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
    "#ff8800", "#8800ff", "#00ff88", "#ff0088"
  ];

  // Physics constants
  private readonly gravity = 0.0005; // pixels per ms^2 (reduced by 1000x for slower animation)
  private readonly minParticles = 50;
  private readonly maxParticles = 800;
  private readonly spawnSpreadDuration = 2000; // Spread particle spawning over 2 seconds

  static override styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 1000;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    
    // Check for reduced motion preference
    const mediaQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    this.prefersReducedMotion = mediaQuery.matches;
    
    // Listen for changes to reduced motion preference
    mediaQuery.addEventListener("change", this.handleReducedMotionChange);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up animation
    this.stopAnimation();
    
    // Remove event listener
    const mediaQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.removeEventListener("change", this.handleReducedMotionChange);
  }

  private handleReducedMotionChange = (e: MediaQueryListEvent) => {
    this.prefersReducedMotion = e.matches;
    if (this.prefersReducedMotion && this.isAnimating) {
      this.stopAnimation();
    }
  };

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    
    // Start animation when enabled changes to true
    if (changedProperties.has("enabled") && this.enabled && !this.isAnimating) {
      this.startAnimation();
    }
    
    // Stop animation when enabled changes to false
    if (changedProperties.has("enabled") && !this.enabled && this.isAnimating) {
      this.stopAnimation();
    }
    
    // Restart animation if duration changes while animating
    if (changedProperties.has("duration") && this.isAnimating) {
      this.stopAnimation();
      this.startAnimation();
    }
  }

  override firstUpdated() {
    // Initialize canvas after first render
    this.initializeCanvas();
    
    // Start animation if enabled
    if (this.enabled) {
      this.startAnimation();
    }
  }

  private initializeCanvas() {
    const canvasElement = this.shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
    if (!canvasElement) {
      return;
    }

    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    
    if (!this.ctx) {
      console.warn("Canvas context not available, confetti animation disabled");
      return;
    }

    // Set canvas size to match container
    this.resizeCanvas();
    
    // Listen for resize events
    globalThis.addEventListener("resize", this.handleResize);
  }

  private handleResize = () => {
    this.resizeCanvas();
  };

  private resizeCanvas() {
    if (!this.canvas) return;
    
    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private startAnimation() {
    // Don't start if reduced motion is preferred
    if (this.prefersReducedMotion) {
      return;
    }

    // Don't start if canvas is not initialized
    if (!this.canvas || !this.ctx) {
      return;
    }

    // Don't start if already animating
    if (this.isAnimating) {
      return;
    }

    // Generate particles
    this.generateParticles();
    
    // Reset animation state
    this.startTime = performance.now();
    this.isAnimating = true;
    
    // Start animation loop
    this.runAnimation();
  }

  private stopAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.isAnimating = false;
    this.particles = [];
    
    // Clear canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private generateParticles() {
    if (!this.canvas) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Calculate particle count based on viewport if not provided
    let count = this.particleCount;
    if (count === null || count <= 0) {
      const area = width * height;
      const baseDensity = 0.0005; // Increased density for more particles (1 particle per 2,000 pixels)
      const baseCount = Math.floor(area * baseDensity);
      count = Math.max(this.minParticles, Math.min(this.maxParticles, baseCount));
    }
    
    // Parse colors
    const colors = this.parseColors();
    
    // Generate particles
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(width, height, colors));
    }
  }

  private parseColors(): string[] {
    if (!this.colors || this.colors.trim() === "") {
      return this.defaultColors;
    }
    
    const parsed = this.colors
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0 && /^#[0-9A-Fa-f]{6}$/.test(c));
    
    return parsed.length > 0 ? parsed : this.defaultColors;
  }

  private createParticle(width: number, _height: number, colors: string[]): ConfettiParticle {
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // More interesting distribution: particles start from wider area and different heights
    const startX = Math.random() * width;
    const startY = -50 - Math.random() * 100; // Start from wider range above viewport
    
    // More varied horizontal velocity for interesting spread
    const horizontalSpread = (Math.random() - 0.5) * 0.01; // Wider horizontal spread
    
    // Stagger particle spawning over time to create a longer stream
    const spawnDelay = Math.random() * this.spawnSpreadDuration;
    
    return {
      x: startX,
      y: startY,
      vx: horizontalSpread, // More varied horizontal velocity for better spread
      vy: Math.random() * -0.002 - 0.001, // Initial upward velocity (reduced by 1000x)
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.0001, // Rotation speed (reduced by 1000x)
      color,
      size: 5 + Math.random() * 8, // Size between 5-13 pixels (slightly larger for better visibility)
      opacity: 1,
      spawnDelay, // Delay before particle appears
    };
  }

  private runAnimation = () => {
    if (!this.isAnimating || !this.ctx || !this.canvas) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const clampedDuration = Math.max(3000, Math.min(5000, this.duration));
    
    // Check if animation should complete
    if (elapsed >= clampedDuration) {
      this.stopAnimation();
      return;
    }

    // Calculate delta time (in milliseconds)
    const deltaTime = 16; // Assume ~60fps (16ms per frame)
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    const _width = this.canvas.width;
    const height = this.canvas.height;
    
    this.particles = this.particles
      .map(particle => {
        // Only update particles that have passed their spawn delay
        if (elapsed < particle.spawnDelay) {
          return particle; // Keep particle but don't update it yet
        }
        // Update particle with elapsed time relative to its spawn time
        const particleElapsed = elapsed - particle.spawnDelay;
        return this.updateParticle(particle, deltaTime, particleElapsed, clampedDuration);
      })
      .filter(particle => {
        // Remove particles that are off-screen or fully faded
        // Also keep particles that haven't spawned yet
        if (elapsed < particle.spawnDelay) {
          return true;
        }
        return particle.y < height + 50 && particle.opacity > 0;
      });
    
    // Draw remaining particles (only those that have spawned)
    this.particles.forEach(particle => {
      if (elapsed >= particle.spawnDelay) {
        this.drawParticle(particle);
      }
    });
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.runAnimation);
  };

  private updateParticle(
    particle: ConfettiParticle,
    deltaTime: number,
    elapsed: number,
    duration: number
  ): ConfettiParticle {
    // Apply gravity (increase vertical velocity)
    const newVy = particle.vy + this.gravity * deltaTime;
    
    // Update position based on velocity
    const newY = particle.y + newVy * deltaTime;
    const newX = particle.x + particle.vx * deltaTime;
    
    // Update rotation
    const newRotation = particle.rotation + particle.rotationSpeed * deltaTime;
    
    // Fade out over time (opacity decreases linearly from 1 to 0 over duration)
    const fadeStart = duration * 0.6; // Start fading at 60% of duration
    const fadeProgress = Math.max(0, Math.min(1, (elapsed - fadeStart) / (duration - fadeStart)));
    const newOpacity = Math.max(0, 1 - fadeProgress);
    
    return {
      ...particle,
      x: newX,
      y: newY,
      vy: newVy,
      rotation: newRotation,
      opacity: newOpacity,
    };
  }

  private drawParticle(particle: ConfettiParticle) {
    if (!this.ctx) return;
    
    this.ctx.save();
    
    // Set opacity
    this.ctx.globalAlpha = particle.opacity;
    
    // Translate to particle position
    this.ctx.translate(particle.x, particle.y);
    
    // Rotate
    this.ctx.rotate(particle.rotation);
    
    // Draw confetti piece (small rectangle)
    this.ctx.fillStyle = particle.color;
    this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    
    this.ctx.restore();
  }

  override render() {
    if (!this.enabled) {
      return html``;
    }

    return html`
      <canvas></canvas>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "confetti-animation": ConfettiAnimation;
  }
}


