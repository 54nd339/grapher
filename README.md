# Grapher 📐

> **Advanced Mathematical Graphing & Computation Platform**

A comprehensive Desmos-like graphing calculator built with Next.js 16, featuring real-time 2D/3D graphing, calculus operations, matrix/vector computations, equation solving, and a beautiful theme system with mobile-optimized touch interactions.

## 🚀 Features

### 📊 Graphing Capabilities
- **2D Graphing**: Plot explicit and implicit functions with real-time rendering using Plotly.js
- **3D Graphing**: Interactive 3D surface plots with Plotly.js
- **Parametric Equations**: Support for parametric curve plotting
- **Polar Coordinates**: Visualize polar equations
- **Implicit Functions**: Plot implicit equations (e.g., x^2+y^2=25)
- **Mouse Wheel Zoom**: Smooth zooming centered at cursor position
- **Coordinate Display**: Real-time hover coordinates
- **Toggleable Sidebar**: Maximize graph viewing area

### 🧮 Advanced Calculations
- **Derivatives**: Symbolic and numerical differentiation
- **Integrals**: Definite integration using symbolic and numerical methods
- **Equation Solver**: Solve linear and nonlinear equations
- **Matrix Operations**: Add, subtract, multiply, inverse, determinant, transpose, eigenvalues
- **Vector Operations**: Dot product, cross product, magnitude, normalization, projection
- **LaTeX Rendering**: Beautiful equation display with react-katex

### ⚡ Performance & UX
- Real-time graph rendering with expression caching
- Multi-equation support with color coding
- Customizable graph settings (ranges, grid)
- Rich theming system with 11 presets and auto OS detection
- **Mobile-optimized** with touch gestures and swipe navigation
- Hardware-accelerated animations and transitions
- Responsive design for all devices
- Optimized computation using nerdamer
- Adaptive grid spacing based on zoom level
- Dynamic sampling for smooth curves
- Custom hooks architecture for code reusability

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling

### Mathematical Libraries
- **nerdamer** - Symbolic mathematics engine
- **Plotly.js** - Interactive 2D & 3D visualizations
- **react-katex** - LaTeX equation rendering

### State Management
- **Zustand** - Lightweight state management

## 🎨 Theme System

The UI uses a centralized theme registry located under `app/theme/presets`.

- Built-in palettes: Nebula Dark, Halo Light, Solarized Dark/Light, Neon Pulse, Midnight Aero, Forest Glade, Sunset Fader, Aurora Wave, Pastel Haze, plus a `system` option that mirrors the OS preference.
- `ThemeProvider` listens to `prefers-color-scheme` and swaps tokens automatically, so buttons/inputs/text adjust instantly when the OS theme changes.
- Equation colors are sourced from each theme's `equationPalette`, ensuring plotted traces always contrast against the current background.
- To add a theme, append a new object to `themeOptions`; every component reads variables via CSS custom properties so no component changes are required.
- Modular CSS architecture in `app/styles/` with separate files for variables, base styles, scrollbars, mobile optimizations, animations, and components.

## 📁 Project Structure

```
grapher/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── docker-merge.yml # Docker build on main branch
│       └── docker-pull-request.yml # Docker build on PRs
├── app/
│   ├── components/          # React components
│   │   ├── Graph2D.tsx      # 2D graph renderer (Plotly)
│   │   ├── Graph3D.tsx      # 3D graph renderer (Plotly)
│   │   ├── EquationInput.tsx # Equation input panel
│   │   ├── Calculator.tsx   # Advanced calculator
│   │   ├── Settings.tsx     # Graph settings panel
│   │   ├── MobileSidebar.tsx # Mobile-optimized sidebar
│   │   ├── ThemeSwitcher.tsx # Theme selection UI
│   │   └── calculatorForms/ # Calculator form components
│   ├── hooks/               # Custom React hooks
│   │   ├── useMediaQuery.ts # Responsive media queries
│   │   ├── useMobileGestures.ts # Touch gesture handling
│   │   ├── useLatexInput.ts # LaTeX validation logic
│   │   ├── useLocalStorage.ts # Persistent storage hook
│   │   └── useClickOutside.ts # Outside click detection
│   ├── lib/                 # Core logic
│   │   ├── mathEngine.ts    # Mathematical computation engine
│   │   ├── store.ts         # Zustand state management
│   │   ├── utils.ts         # Utility functions
│   │   ├── latex.ts         # LaTeX conversion utilities
│   │   └── math/            # Math operation modules
│   ├── styles/              # Modular CSS architecture
│   │   ├── variables.css    # CSS custom properties
│   │   ├── base.css         # Base element styles
│   │   ├── scrollbar.css    # Scrollbar styling
│   │   ├── mobile.css       # Mobile optimizations
│   │   ├── animations.css   # Keyframe animations
│   │   └── components.css   # Component utilities
│   ├── types/               # TypeScript definitions
│   │   └── index.ts         # Type definitions
│   ├── theme/               # Centralized theming system
│   │   ├── ThemeProvider.tsx # Theme context provider
│   │   ├── presets/         # Theme presets (11 themes)
│   │   ├── styles.ts        # Component styling utilities
│   │   └── themeVars.ts     # CSS variable helpers
│   ├── globals.css          # Main CSS entry (imports modular styles)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── public/                  # Static assets
├── .dockerignore            # Docker ignore file
├── Dockerfile               # Multi-stage Docker build
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── next.config.ts           # Next.js config (standalone output)
└── README.md                # Documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/54nd339/grapher.git
cd grapher
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Run development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t grapher .

# Run container
docker run -p 3000:3000 grapher
```

## 📖 Usage Guide

### Adding Equations

1. Select graph mode (2D, 3D, Parametric, Polar, Implicit)
2. Enter equation in the input field
   - **2D**: `x^2`, `sin(x)`, `log(x)`
   - **3D**: `sin(sqrt(x^2 + y^2))`, `x^2 + y^2`
3. Click "Add Equation"
4. Toggle visibility or remove equations as needed

### Calculator Operations

#### Derivatives
1. Select "Derivative" mode
2. Enter function (e.g., `x^2 + 2*x + 1`)
3. Specify variable (default: `x`)
4. Optionally enter point for evaluation
5. Click "Calculate"

#### Integrals
1. Select "Integral" mode
2. Enter function (e.g., `x^2`)
3. Set lower and upper bounds
4. Click "Calculate"

#### Matrix Operations
1. Select "Matrix" mode
2. Enter matrices in format: `[[1,2],[3,4]]`
3. Operations: multiply, add, subtract, inverse, determinant, transpose, eigenvalues

#### Vector Operations
1. Select "Vector" mode
2. Enter vectors in format: `[1,2,3]`
3. Operations: dot, cross, magnitude, normalize, projection

#### Equation Solver
1. Select "Solve" mode
2. Enter equation (e.g., `x^2 - 4 = 0`)
3. Specify variable
4. Click "Calculate"

### Graph Settings

- **Axis Ranges**: Customize X, Y, Z ranges
- **Display Options**: Toggle grid, axes, labels
- **Graph Mode**: Switch between 2D/3D/Parametric/Polar/Implicit

## 🎨 Supported Mathematical Functions

### Basic Operations
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Exponentiation: `^` or `**`

### Functions
- Trigonometric: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`
- Hyperbolic: `sinh()`, `cosh()`, `tanh()`
- Exponential: `exp()`, `log()`, `log10()`, `ln()`
- Root: `sqrt()`, `cbrt()`
- Absolute: `abs()`
- Rounding: `round()`, `ceil()`, `floor()`

### Constants
- Pi: `pi` or `PI`
- Euler's number: `e` or `E`

## 🔧 Configuration

### Customizing Graph Settings

Edit default settings in `app/lib/store.ts`:

```typescript
const defaultGraphSettings: GraphSettings = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  zMin: -10,
  zMax: 10,
  gridEnabled: true,
  axesEnabled: true,
  labelsEnabled: true,
  backgroundColor: '#ffffff',
  gridColor: '#e5e7eb',
  axesColor: '#000000',
};
```

## 🧪 Examples

### 2D Functions
```
x^2
sin(x)
cos(x) * sin(x)
exp(-x^2)
1/x
abs(x)
log(x)
sqrt(x)
```

### 3D Functions
```
sin(sqrt(x^2 + y^2))
x^2 + y^2
cos(x) * sin(y)
exp(-(x^2 + y^2))
x^2 - y^2
```

### Parametric Equations
```
x = cos(t), y = sin(t)
x = t, y = t^2
```

### Polar Equations
```
r = cos(3*theta)
r = 1 + sin(theta)
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow existing code patterns** and architecture
4. **Write clean, documented code** with TypeScript types
5. **Extract reusable logic** into custom hooks
6. **Test your changes** thoroughly
7. **Commit your changes** (`git commit -m 'Add amazing feature'`)
8. **Push to the branch** (`git push origin feature/amazing-feature`)
9. **Open a Pull Request**

All PRs will be automatically checked by CI for:
- **Docker Build**: Multi-platform Docker image build verification
- **Platform Support**: Validates builds for linux/amd64 and linux/arm64

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **`docker-pull-request.yml`**: Builds Docker images on pull requests
  - Triggers on pull requests from the same repository
  - Multi-platform builds (amd64, arm64)
  - Pushes to Docker Hub as `54nd33p/grapher:latest`
  - Uses Docker layer caching for faster builds
  - Validates that the Docker build succeeds before merging

- **`docker-merge.yml`**: Builds and publishes Docker images on main branch
  - Triggers automatically on push to main branch
  - Multi-platform builds (amd64, arm64)
  - Publishes to Docker Hub as `54nd33p/grapher:latest`
  - Uses registry caching for optimal build performance

## 📝 Code Standards

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: JSDoc style documentation
- **Formatting**: Prettier/ESLint configured

## 🐛 Known Issues

- Some complex 3D equations may have performance limitations
- Symbolic integration not fully implemented (uses numerical methods)
- System of equations solver is simplified

## 🔮 Future Enhancements

- [ ] Advanced equation solver (Newton-Raphson, etc.)
- [ ] Share equations via URL
- [ ] In-app theme editor/preset sharing
- [ ] Statistical analysis tools
- [ ] Offline PWA support
- [ ] Collaborative equation sharing

## 🚀 Deployment

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/54nd339/grapher)

### Docker

**Pull from Docker Hub:**
```bash
docker pull 54nd33p/grapher:latest
docker run -p 3000:3000 54nd33p/grapher:latest
```

**Build locally:**
```bash
docker build -t grapher .
docker run -p 3000:3000 grapher
```

### Manual Deployment
The app is configured with `output: "standalone"` for optimized deployments to any Node.js hosting platform.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Nerdamer](https://github.com/jiggzson/nerdamer) - Symbolic mathematics engine
- [Plotly.js](https://plotly.com/javascript/) - Interactive graphing
- [Desmos](https://www.desmos.com/) - Inspiration for UI/UX
- [emathhelp.net](https://www.emathhelp.net/) - Calculation features inspiration

## 📧 Support

For issues, questions, or suggestions, please [open an issue](https://github.com/54nd33p/grapher/issues) on GitHub.

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐️!

---

**Built with ❤️ using Next.js, Zustand, and modern web technologies**

<div align="center">
  <sub>Made by developers, for developers</sub>
</div>

