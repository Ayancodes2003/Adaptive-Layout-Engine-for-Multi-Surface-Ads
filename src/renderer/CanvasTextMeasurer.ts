import type { TextMeasurer, TextMeasurement } from '../core/types';

export class CanvasTextMeasurer implements TextMeasurer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
  }

  public measureText(text: string, fontSize: number, fontWeight: string, maxWidth?: number): TextMeasurement {
    this.ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
    
    // Simple width calculation if no wrap limit
    if (!maxWidth) {
      const metrics = this.ctx.measureText(text);
      return {
        width: metrics.width,
        height: fontSize * 1.2, // Line height estimation
        lines: 1
      };
    }

    // Wrapping logic
    const words = text.split(' ');
    let lines = 1;
    let currentLine = '';
    let maxLineWidth = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        // Wrap to next line
        const currentLineMetrics = this.ctx.measureText(currentLine);
        maxLineWidth = Math.max(maxLineWidth, currentLineMetrics.width);
        
        currentLine = word + ' ';
        lines++;
      } else {
        currentLine = testLine;
      }
    }
    
    // Check the last line width
    const lastLineMetrics = this.ctx.measureText(currentLine);
    maxLineWidth = Math.max(maxLineWidth, lastLineMetrics.width);

    return {
      width: Math.min(maxLineWidth, maxWidth),
      height: (fontSize * 1.2) * lines,
      lines
    };
  }
}
