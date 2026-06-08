'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollAnimations() {
  useEffect(() => {
    // 1. ANIMATION DES SECTIONS ENTIÈRES
    gsap.utils.toArray<HTMLElement>('section').forEach((section, i) => {
      gsap.fromTo(section,
        {
          opacity: 0,
          y: 80,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 2. FADE-UP CLASSIQUE (texte, titres)
    gsap.utils.toArray<HTMLElement>('.fade-up').forEach((el) => {
      gsap.fromTo(el,
        {
          y: 60,
          opacity: 0,
          rotationX: -15,
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.9,
          ease: 'back.out(0.4)',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 3. STAGGER - cascade avec effet "pop"
    gsap.utils.toArray<HTMLElement>('.stagger-container').forEach((container) => {
      const children = container.querySelectorAll('.stagger-child');
      if (children.length) {
        gsap.fromTo(children,
          {
            scale: 0.8,
            opacity: 0,
            y: 50,
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'elastic.out(1, 0.5)',
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });

    // 4. ZOOM SUR LES IMAGES AU SCROLL
    gsap.utils.toArray<HTMLElement>('.zoom-image').forEach((el) => {
      gsap.fromTo(el,
        {
          scale: 1.1,
          filter: 'blur(4px)',
        },
        {
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 5. ANIMATION DE TEXTE AVEC GLOW
    gsap.utils.toArray<HTMLElement>('.glow-text').forEach((el) => {
      gsap.fromTo(el,
        {
          textShadow: '0 0 0px rgba(255,107,61,0)',
          letterSpacing: '0px',
        },
        {
          textShadow: '0 0 15px rgba(255,107,61,0.5)',
          letterSpacing: '2px',
          duration: 1,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 6. SLIDE FROM LEFT
    gsap.utils.toArray<HTMLElement>('.slide-left').forEach((el) => {
      gsap.fromTo(el,
        {
          x: -100,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 7. SLIDE FROM RIGHT
    gsap.utils.toArray<HTMLElement>('.slide-right').forEach((el) => {
      gsap.fromTo(el,
        {
          x: 100,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 8. FLIP CARD AU SCROLL (pour les outils)
    gsap.utils.toArray<HTMLElement>('.flip-card').forEach((el) => {
      gsap.fromTo(el,
        {
          rotationY: -90,
          opacity: 0,
        },
        {
          rotationY: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(0.6)',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 9. BOUNCE SUR LES ÉLÉMENTS IMPORTANTS
    gsap.utils.toArray<HTMLElement>('.bounce-in').forEach((el) => {
      gsap.fromTo(el,
        {
          y: 100,
          opacity: 0,
          scale: 0.5,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'bounce.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // 10. RÉVÉLATION PROGRESSIVE DES COULEURS
    gsap.utils.toArray<HTMLElement>('.reveal-color').forEach((el) => {
      const originalBg = window.getComputedStyle(el).backgroundColor;
      gsap.fromTo(el,
        {
          backgroundColor: 'rgba(255,255,255,0)',
          boxShadow: '0 0 0px rgba(0,0,0,0)',
        },
        {
          backgroundColor: originalBg,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          duration: 0.8,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Rafraîchir ScrollTrigger
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return null;
}