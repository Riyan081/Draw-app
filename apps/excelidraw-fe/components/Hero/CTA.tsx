import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-primary text-primary" />
            ))}
          </div>
          
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-6">
            Ready to start sketching?
          </h2>
          
          <p className="font-body text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of teams who use Sketchy to bring their ideas to life. 
            It's free, fast, and works right in your browser.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="sketch" size="xl" className="group">
              Start Drawing Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="font-body text-sm text-muted-foreground mt-6">
            No credit card required • Export unlimited diagrams
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
