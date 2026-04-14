/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Telora Design System - Dark Mode First
        background: '#0A0A0F',      // Noir bleuté profond
        surface: '#15151E',         // Gris foncé pour les cartes
        surfaceLight: '#1E1E2D',    // Surface plus claire (hover)
        
        // Couleurs principales
        primary: '#FF6B35',         // Orange Telora (action, énergie)
        secondary: '#00D9A7',       // Vert succès (validation, positif)
        accent: '#5E6AD2',          // Violet (gamification, XP)
        
        // États
        error: '#EF4444',           // Rouge erreur
        warning: '#F59E0B',         // Orange warning
        success: '#10B981',         // Vert succès
        
        // Textes
        textPrimary: '#FFFFFF',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
        
        // Bordures
        border: '#27272A',
        borderLight: '#3F3F46',
        
        // Transparences
        overlay: 'rgba(0, 0, 0, 0.6)',
      },
      fontFamily: {
        heading: ['Inter-Bold', 'sans-serif'],
        body: ['Inter-Regular', 'sans-serif'],
        mono: ['JetBrainsMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        glow: '0 0 20px rgba(255, 107, 53, 0.3)',  // Orange glow
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 53, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
