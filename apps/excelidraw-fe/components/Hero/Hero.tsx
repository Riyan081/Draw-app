import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary/20 rounded-full float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-20 h-20 border-2 border-secondary/20 rounded-lg rotate-12 float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-20 w-16 h-16 bg-accent/10 rounded-lg -rotate-12 float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-40 w-24 h-24 border-2 border-accent/20 rounded-full float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border mb-8 opacity-0 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-body text-muted-foreground">Now with real-time collaboration</span>
          </div>
          
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-bold text-foreground mb-6 opacity-0 animate-fade-in-up animation-delay-100">
            Sketch your
            <span className="text-gradient-primary block">brilliant ideas</span>
          </h1>
          
          <p className="font-body text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up animation-delay-200">
            A virtual whiteboard for sketching hand-drawn like diagrams. 
            Collaborate in real-time, export anywhere, and bring your ideas to life.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-300">
            <Button variant="sketch" size="xl" className="group">
              Start Drawing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="sketchOutline" size="xl">
              Watch Demo
            </Button>
          </div>

          <p className="font-body text-sm text-muted-foreground mt-6 opacity-0 animate-fade-in-up animation-delay-400">
            No signup required • Works in your browser • Free forever
          </p>
        </div>

        {/* Preview mockup */}
        <div className="mt-16 max-w-5xl mx-auto opacity-0 animate-fade-in-up animation-delay-500">
          <div className="sketch-card p-4 bg-card">
            <div className="aspect-video bg-background rounded-lg flex items-center justify-center overflow-hidden">
              <SketchPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SketchPreview = () => {
  return (
    <svg viewBox="0 0 800 450" className="w-full h-full p-8">
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Hand-drawn shapes */}
      <g className="draw-in" style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}>
        {/* Rectangle */}
        <path
          d="M 100 100 Q 105 95 250 98 Q 255 103 252 200 Q 248 205 103 202 Q 98 198 100 100"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Arrow */}
        <path
          d="M 270 150 Q 350 145 420 148"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 400 138 L 420 148 L 400 158"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Circle */}
        <ellipse
          cx="520"
          cy="150"
          rx="60"
          ry="58"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="2"
        />
        
        {/* Diamond */}
        <path
          d="M 680 100 Q 685 95 730 150 Q 728 158 680 200 Q 672 198 630 150 Q 632 145 680 100"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Text labels */}
        <text x="140" y="160" className="font-display text-lg" fill="hsl(var(--foreground))">Start</text>
        <text x="490" y="155" className="font-display text-lg" fill="hsl(var(--foreground))">Process</text>
        <text x="655" y="155" className="font-display text-lg" fill="hsl(var(--foreground))">End</text>
        
        {/* Lower shapes */}
        <path
          d="M 150 300 Q 155 295 350 298 Q 355 303 352 380 Q 348 385 153 382 Q 148 378 150 300"
          fill="hsl(var(--primary) / 0.1)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        <path
          d="M 450 300 Q 455 295 650 298 Q 655 303 652 380 Q 648 385 453 382 Q 448 378 450 300"
          fill="hsl(var(--secondary) / 0.1)"
          stroke="hsl(var(--secondary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Connector line */}
        <path
          d="M 360 340 Q 380 335 440 340"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 4"
        />
      </g>
    </svg>
  );
};

export default Hero;
