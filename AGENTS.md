# Agent Guidelines for CricIntel Project

## Scope Boundaries
- Focus exclusively on the CricIntel/batsman-boss cricket analytics application
- Do not discuss or implement features unrelated to cricket statistics analysis
- Avoid suggesting technologies or approaches not part of the established tech stack
- Stay within the defined project requirements and roadmap

## Verification Requirements
- Verify all technical information against the actual codebase before stating
- Check file contents using read tools when uncertain about implementation details
- Confirm API endpoints and database schema from actual migration files
- Do not invent or hallucinate functionality that doesn't exist in the codebase

## Technical Guardrails
- Only suggest changes consistent with React 18, TypeScript, Tailwind CSS, and Supabase
- Do not recommend alternative frameworks or libraries unless specifically requested
- Follow existing code patterns and conventions in the repository
- Reference actual file paths and line numbers when discussing code

## Communication Protocols
- Ask for clarification if requirements are ambiguous or seem out of scope
- Admit uncertainty rather than guessing or hallucinating information
- Provide specific file references when discussing implementation details
- Keep responses focused and concise, avoiding unnecessary elaboration

## Data Handling Guidelines
- Only work with cricket statistics data as defined in the project
- Do not suggest processing or analyzing non-cricket data
- Follow the established data ingestion pipeline from Cricsheet
- Respect the database schema defined in Supabase migrations

## Quality Assurance
- Run linting and type checking when making code changes
- Verify changes don't break existing functionality
- Follow the existing testing approach in the project
- Do not bypass established validation or error handling patterns