# Dependency security handoff

This setup preserves the owner's NestJS **10**, Next.js **15**, React **19** and Expo/React Native choices. It is not a deployment security approval. Dependency advisories are separate from business-feature acceptance. The initial `npm audit --omit=dev` reported 33 affected dependency nodes (15 high, 18 moderate, zero critical); counts include inherited package chains, not 33 independently exposed application exploits. Final locked-tree counts are recorded in `SETUP_REPORT.md`.

## Compatible updates

Root `package.json` overrides pin same-major updates rather than upgrading the requested frameworks or running `npm audit fix --force`. The lockfile must actually resolve these versions; declaring an override alone is insufficient. A fresh dependency-tree resolution was necessary after npm retained old installed versions during an incremental install.

| Dependency         | Selected version | Advisory / reason                                                                                                                           |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| body-parser        | 1.20.9           | [Compressed-body denial of service](https://github.com/advisories/GHSA-27r3-jxmh-p828)                                                      |
| qs                 | 6.17.1           | [Stringification denial of service](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw)                                                      |
| multer             | 2.5.0            | [Pending file-filter cleanup](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)                                                            |
| postcss            | 8.5.33           | [Untrusted source-map loading](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp); includes Next/Expo nested copies                         |
| lodash             | 4.18.1           | [Template injection](https://github.com/advisories/GHSA-r5fr-rjxr-66jc)                                                                     |
| js-yaml            | 4.3.2            | [Merge processing resource exhaustion](https://github.com/advisories/GHSA-2883-xcg3-v3hh)                                                   |
| effect             | 3.22.5           | [Template-literal schema regular expressions](https://github.com/advisories/GHSA-7589-6fvf-x4pw)                                            |
| picomatch 4.x only | 4.0.7            | [Extglob regular-expression denial of service](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj); retain separate compatible 2.x consumers |

After changing these pins, run type checks, Jest, web/backend builds, Prisma validation, API/Swagger smoke tests and both native JavaScript bundles. Do not upgrade a transitive dependency across a major version without testing the consuming API.

## Remaining review before production

- Nest 10 core is covered by an [SSE output injection advisory](https://github.com/advisories/GHSA-36xv-jgw5-4q75), patched upstream in Nest 11.1.18. Changing to Nest 11/12 would violate the currently requested Nest 10 major. This project uses REST and Socket.IO, with no SSE routes. Do not introduce SSE while this finding remains unresolved; obtain a compatible backport or owner-approved framework change before using that surface.
- Nest's `file-type` dependency has [malformed-file parsing](https://github.com/advisories/GHSA-j47w-4g3g-c36v) findings. No upload endpoints exist in the setup. Before Files implementation, select and verify a patched detection/scan adapter; do not expose the affected parser to untrusted uploads.
- Expo SDK 54 tooling includes `image-size`, `glob` and `minimatch` versions covered by parsing/traversal/resource-exhaustion advisories. Their patched lines require major dependency changes relative to current consumers. Do not blindly force those major changes into the SDK; verify an upstream-compatible SDK/tooling update and regenerate native bundles/builds before release.
- Prisma 6 configuration tooling includes `deepmerge-ts` covered by [recursive merge exhaustion](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Treat configuration as trusted source, never accept executable/untrusted Prisma configuration from an API. Validate a supported upstream fix before production tooling approval.

Historical setup reachability assessment (before this backend increment): only health and documentation were exposed; no SSE, uploads, user-supplied build assets, financial commands or dynamic Prisma configuration are accepted. That limits currently exposed paths but does not remove the dependency findings. Feature implementation and deployment must revisit reachability rather than suppress audit failures or label the project vulnerability-free. Development-only deprecated CLI dependencies are also not a clean security bill.

Run `npm audit --omit=dev --json` against the committed lockfile to refresh evidence. Keep any local JSON report outside Git if it contains environment-specific information; no credentials are needed for public-package advisory lookup. The remaining security gate does not prevent the requested local architecture/setup commit, but prevents calling this scaffold a production-approved release.

## Implemented backend audit, 2026-11-23

The current production-dependency audit reports **22 affected dependency nodes: 18 moderate, 4 high, 0 critical**. The full tree reports **33: 3 low, 23 moderate, 7 high**. These include inherited advisory chains, not independent reachable vulnerabilities. Audit exits nonzero; this is not a clean production approval.

The active backend DTO validator is pinned to **AJV 8.20.0**, beyond the affected range of [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6). Older AJV consumers in trusted Nest CLI tooling retain their own compatible branch; a blanket major override is not used. Images use **Sharp 0.35.5**, verified by actual decode/re-encode tests and real uploads/scans. The lockfile retains the reviewed framework-compatible overrides above.

Reachability assessment is an inference from the implemented code: Nest SSE is unused; uploads use custom signature/extension/MIME checks, Sharp and ClamAV, not Nest's affected file-type parser. Prisma configuration is trusted repository code and cannot be submitted through an API. Expo image-size/glob/minimatch findings concern the retained SDK/tooling; native/client review remains pending. These boundaries reduce relevant exposure without removing the advisories. The backend now exposes real authenticated business commands and uploads, so the earlier health-only reachability assessment is historical.

Before deployment, review the unresolved Nest 10, Prisma/deepmerge and Expo/tooling findings, use least-privileged database credentials, verify mail/push providers and perform deployment/load/backup checks. The requested Nest 10/Next 15/Expo stack was not silently changed to resolve incompatible upstream advisories.

## Comprehensive verification refresh

The current production audit on 2026-11-23 reports **27 affected dependency nodes: 20 moderate, 7 high, 0 critical**, with a nonzero audit exit. Older counts above describe earlier trees. See [current limitations](KNOWN_LIMITATIONS.md#dependency-disposition) for the Prisma/configuration, Expo Router/decoder, Metro image-size and Nest findings and compatibility limits. No production security approval was issued.

Backend archive validation now directly pins `yauzl` 3.4.0 with its matching TypeScript declarations and uses bounded sequential validation plus Node's CRC-32. Content is still quarantined and scanned; no filesystem extraction was introduced. See [actual tests](TEST_REPORT.md). Both original framework majors and payment policies are preserved.

## Map renderer review, 2026-11-24

The web renderer is pinned to MapLibre GL JS 6.19.0. The earlier candidate was affected by a critical attribution-sanitization advisory. The fixed release also uses a separately bundled, same-origin worker. A fresh production dependency audit returned **20 moderate, 7 high and 0 critical**. It listed no advisory against `maplibre-gl`. The earlier disposition for the remaining findings still applies. [GitHub advisory GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579)
