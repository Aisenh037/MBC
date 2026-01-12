# Contributing to MBC Department Management System

Thank you for your interest in contributing! This document provides guidelines for contributing to this project to ensure a high-quality, maintainable codebase.

## Project Structure

The repository is organized as a monorepo with the following main components:

- **`mbc-frontend/`**: React + Vite + TypeScript frontend application.
- **`mbc-backend/`**: Node.js + Express + TypeScript backend API.
- **`ai-service/`**: Python + FastAPI service for AI features.
- **`docs/`**: Comprehensive documentation for development, deployment, architecture, and project status.
- **`scripts/`**: Utility scripts for setup, database management, and manual testing.
- **`nginx/`**: Nginx configuration for reverse proxying in production.

## Getting Started

1.  **Read the Documentation**:
    - Start with the [README.md](./README.md) for an overview.
    - specialized guides are in `docs/`:
        - [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)
        - [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
        - [Project Status](docs/PROJECT_STATUS.md)

2.  **Environment Setup**:
    - Ensure you have Node.js 18+ and Docker installed.
    - Run the setup script to initialize environment variables:
      ```bash
      npm run setup
      ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

## Development Guidelines

### Code Style & Quality

- **TypeScript**: We enforce strict TypeScript configuration. Avoid `any` types; use proper interfaces and types.
- **Linting & Formatting**:
    - We use ESLint and Prettier.
    - Run `npm run lint` to check for issues before committing.
- **Architecture**:
    - Frontend: Functional components with hooks. Use strict separation of concerns (Container/Presenter pattern where applicable).
    - Backend: Service-Repository pattern. Keep controllers thin.

### Git Workflow

1.  **Fork & Clone**: Fork the repository and clone it locally.
2.  **Branching**: Create a new branch for your feature or fix.
    ```bash
    git checkout -b feature/my-new-feature
    # or
    git checkout -b fix/login-issue
    ```
3.  **Commit Messages**: We follow [Conventional Commits](https://www.conventionalcommits.org/).
    - `feat: add user profile page`
    - `fix: handle null token in auth`
    - `docs: update deployment steps`
    - `style: format code`
    - `refactor: simplify data fetching logic`

### Testing

- **Backend**: Unit and integration tests are located in `mbc-backend/tests`.
- **Frontend**: Component tests using Vitest/Jest.
- **Manual Verification**: Use scripts in `scripts/manual_tests` for quick verification of API flows.

## Pull Request Process

1.  Ensure all tests pass: `npm run test`.
2.  Update documentation if you are changing behavior or adding features.
3.  Open a Pull Request (PR) against the `main` branch.
4.  Provide a clear description of the problem and solution.
5.  Request a review from a team member.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
