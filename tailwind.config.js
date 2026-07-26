/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}", "../blog-frontend/src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      screens: {
        // =========================
        // Phone (iPhone) breakpoints
        // Mục tiêu: chia rõ ràng theo dải viewport width (CSS px)
        // =========================
        iosMini: { raw: "(min-width: 360px) and (max-width: 389px)" },  // 360×780 (iPhone Mini)
        iosStd:  { raw: "(min-width: 390px) and (max-width: 392px)" },  // 390×844 (iPhone 12–14 tiêu chuẩn)
        iosPro:  { raw: "(min-width: 393px) and (max-width: 429px)" },  // 393×852 (iPhone 14 Pro–16)
        iosMax:  { raw: "(min-width: 430px) and (max-width: 439px)" },  // 430×932 (iPhone Plus/Pro Max)
        ios16Max:{ raw: "(min-width: 440px) and (max-width: 767px)" },  // 440×956 (iPhone 16 Pro Max & màn lớn mới)

        // =========================
        // Tablet-only (tách bạch khỏi desktop)
        // =========================
        tabletOnly: { raw: "(min-width: 768px) and (max-width: 1023px)" },

        // Viewport thực tế phổ biến trên MacBook 12" Retina (Retina scaling)
        mb12: "1152px",
        // Desktop phổ biến & màn lớn để tinh chỉnh spacing/typography khi cần
        desktop: "1440px",
        wide: "1920px",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "24px",
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        nav: ['var(--font-nav)'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        luxury: {
          sage: '#A9B8AE',
          ivory: '#F8F6F2',
          charcoal: '#1E1B17',
          gold: '#C7A46A',
        }
  		},
      boxShadow: {
        'luxury-sm': '0 4px 20px rgba(30, 27, 23, 0.06)',
        'luxury-md': '0 12px 40px rgba(30, 27, 23, 0.1)',
        'luxury-lg': '0 24px 64px rgba(30, 27, 23, 0.14)',
      },
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'marquee': 'marquee 30s linear infinite',
        'fade-up': 'fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'float': 'float 5s ease-in-out infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
