# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run all tests
- `npm test -- --testPathPattern=ComponentName` - Run tests for specific component

## Code Style Guidelines
- **Imports**: Group React imports first, then contexts, components, hooks, utils
- **React Components**: Use functional components with hooks
- **Naming**: CamelCase for variables/functions, PascalCase for components
- **File Structure**: JSX files for components (.jsx), regular JS for utilities (.js)
- **Error Handling**: Use try/catch blocks and log errors to console
- **Testing**: Follow React Testing Library patterns
- **Formatting**: Use consistent indentation (2 spaces)
- **Arabic Text**: Pay special attention to RTL text handling and diacritics
- **Comments**: Use JSDoc style for utility functions
- **Context API**: State management via React Context