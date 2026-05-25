import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Global GSAP defaults for StockOS
gsap.defaults({
  ease: 'power2.out',
  duration: 0.4,
});

ScrollTrigger.config({
  ignoreMobileResize: true,
});

export { gsap, ScrollTrigger };
