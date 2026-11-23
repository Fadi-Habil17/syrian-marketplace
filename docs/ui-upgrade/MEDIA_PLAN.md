# Landing media and provenance

## Delivered

| Asset                                                                      | Source / treatment                                                                                                         | Behaviour                                                                                                                                                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/public/images/neighbourhood.webp` and `neighbourhood-small.webp` | Resized/compressed versions of the existing repository's Figma-derived `damascus-souq.webp`; no new third-party photograph | Responsive hero and poster; 960 px / 600 px variants, approximately 94 KB / 49 KB. Existing asset rights must still be established before public commercial use.                  |
| `frontend/public/media/product-tour.webm`                                  | Original recording of the working updated web client against the isolated fictional development dataset                    | Approximately 20 seconds, 1.34 MB, silent. Home → real search → Home Store → real product details → a service journey preview. No financial confirmation or account data appears. |
| `frontend/public/images/walkthrough-poster.webp`                           | Original screenshot from that working client                                                                               | Approximately 48 KB, displayed without downloading the video.                                                                                                                     |
| `walkthrough-en.vtt`, `walkthrough-ar.vtt`                                 | Original navigation descriptions, not a transcript of speech                                                               | Localized captions accompany the silent recording. Native video controls allow pause, seek and captions.                                                                          |

The product walkthrough is playable by default at `/media/product-tour.webm`. `NEXT_PUBLIC_PRODUCT_TOUR_URL` can replace it. No video element/source is mounted until the visitor presses Play. `preload="none"`, poster dimensions and a failed-playback browse link preserve usability. Videos never play on page load. Reduced motion disables decorative transitions; explicit video playback remains under visitor control.

## Marketplace film: outstanding asset

No approved original marketplace footage was available. Its poster-first section is implemented, with an Explore link and **no play control**. Configure `NEXT_PUBLIC_MARKETPLACE_FILM_URL` only when the following assets and permissions are ready; rebuild Next after changing public variables.

Deliver exactly:

- A 20–30 second original film: 1920×1080 landscape master, H.264 MP4 (recommended for broad Safari support), optional VP9/WebM; target delivered file ≤4 MB. Safe central framing for smaller screens.
- A matching optimized 960×640 WebP poster, ideally ≤100 KB, replacing the existing film poster if the composition differs.
- `frontend/public/media/marketplace-film-ar.vtt` and `marketplace-film-en.vtt`, containing captions for **all** speech and meaningful sound, accurate to the final edit. Use a silent edit if voice-over and captions are not approved.
- Written permission for identifiable participants, location filming and all footage/music. No unapproved commercial music. No real customer order, address, phone number or payment information.
- A final accessible playback check in Chrome, Safari/iOS and Android, including captions, slow connection and failed-source fallback. The current WebM tour has not been verified in Safari/iOS.

Suggested original shot list:

| Time    | Shot                                                                       | Purpose                                                                        |
| ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0–4 s   | A Syrian neighbourhood market or maker's workbench, filmed with permission | Establish local context without unverified geographical claims.                |
| 4–9 s   | Maker preparing a fictional product, then its genuine app listing          | Connect people and goods.                                                      |
| 9–14 s  | Professional discussing a fictional request, then selecting a booking      | Show the second workspace.                                                     |
| 14–19 s | Freelancer working, followed by a real listing and order preview           | Show remote services without implying extra payment installments.              |
| 19–24 s | Seller delivery or optional platform driver pickup, filmed with consent    | Explain the supported optional delivery path.                                  |
| 24–28 s | Original app discovery screen and brand end frame                          | End on browsing, with a clear simulated-payments disclosure if money is shown. |

The app walkthrough can be rerecorded from the running test environment using ordinary screen recording. Use isolated fictional seed data. Review every frame before replacing the delivered asset; captions must match the recording.
