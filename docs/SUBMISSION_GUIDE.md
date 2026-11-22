# B4F submission handoff

Deadline from PDF page 9: **Tuesday, 24 November 2026 at 16:00, Asia/Damascus**. Source PDF is preserved at repository root. This repository is an initial setup, not a completed hackathon submission. Names and GitHub roster were deferred by the owner; never use the PDF's illustrative people as actual teammates.

## Required final deliverables

| Artifact                                       | Rule                                                                    | Current status                               |
| ---------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| `اسم-الفريق_ملخص-المشروع.docx`                 | Replace team-name segment; Arabic, maximum one page                     | Pending real roster and final implementation |
| `TeamName_ProjectBrief_EN.docx`                | English, maximum one page, same facts as Arabic                         | Pending                                      |
| `اسم-الفريق_الدراسة-التحليلية-والتصميمية.docx` | Arabic analysis/design                                                  | Pending                                      |
| `TeamName_AnalysisDesign_EN.docx`              | English analysis/design                                                 | Pending                                      |
| GitHub repository URL                          | Public or grant reviewer collaborator access incl. commits/contributors | No remote configured in setup                |
| Demo URL                                       | Include if available and document actual status                         | Pending deployment                           |
| APK or Expo review link                        | Required mobile review path plus local run instructions                 | Pending build/project configuration          |
| Short demo video                               | Optional                                                                | Not scheduled                                |

Use the PDF's filename convention with the actual chosen team name; the Arabic text's right-to-left display can reorder the `.docx` suffix visually. Save real filenames with a normal `.docx` extension. Markdown architecture documents do not replace these four Word files. Produce and render the Word files only after the final facts and roster are known; count pages and verify diagrams/readability in both languages.

## Brief content (both languages)

One page each: project name and short overview; problem and solution; target users and main features; NestJS, Next.js and React Native stack; each actual member's full name, primary role, main contribution and GitHub username; repository URL and demo link if available. Every contribution statement must match real Git history. Do not imply business features exist solely because they appear in this setup's design.

## Analysis/design content (both languages)

Prefer 4-5 pages per language, hard maximum 10 per language, including diagrams. Required sections: overview with goal/audience/problem/scope/out-of-scope; actors; functional requirements; relevant nonfunctional requirements (security/performance/usability/reliability/response/maintainability); at least three main use cases with brief scenarios; architecture diagram connecting Next/Nest/React Native/database/external services; entities/relationships/PK/FK and ERD; security covering authentication/authorization/roles/password hashing/protected endpoints/input validation. Use-case diagram optional. Business rules and main data flow optional additions if room allows. Source material is in SYSTEM_DESIGN, ERD, PERMISSIONS_MATRIX, API_CONVENTIONS and BUSINESS_RULES.

## Repository and reviewer gate

- Complete backend/frontend/mobile inside one repository with exact required root names, plus README/docs/.gitignore; packages is additive.
- Real members use their own primary GitHub accounts and matching Git emails. Preserve authorship, avoid squashes hiding contributors, never upload everyone else's code under one name. README roster and Word briefs agree with contribution history.
- README has all required sections, actual install/run/migrate/seed commands, reviewer-ready demo credentials with actual demo passwords, Swagger and Postman links, demo status, mobile artifact and known limitations.
- Separate environment templates contain every required variable per app and no real secrets. Public web/Expo variables use their correct prefixes. Never commit credentials, private keys, production keys or real database passwords.
- Swagger `/api/docs` includes DTO/request/response/auth/error detail; Postman v2.1 covers every route with auth/bodies/examples and `{{baseUrl}}`/`{{token}}` variables; no secrets. Domain folders agree with README overview.
- Final seed recreates each role, both currencies and demo scenarios. README documents actual seeded credentials; setup metadata seed does not satisfy this gate.
- Fresh-clone reviewer verifies web/mobile/API/worker, migrations/seed, both locales/admin interfaces, all minimum acceptance scenarios and mobile push on development builds.
- Confirm final URLs/reviewer access and test APK or Expo link before submission. Record exact verification and limitations in SETUP_REPORT or a later release report.
