# Resources Feature Test Cases Mapping

Status Legend: IMPLEMENTED = covered by automated test, PARTIAL = some aspects covered or requires environment/network simulation, PENDING = not yet automated.

| ID | Req | Title | Preconditions | Steps | Expected Result | Status | Notes |
|----|-----|-------|---------------|-------|-----------------|--------|-------|
| TC-RES-P01 | REQ-RES-001 | Featured inspirational quote displays | Resources screen loaded with featuredResource present | 1. Navigate to Resources 2. View Featured section | Featured quote content and optional author displayed | IMPLEMENTED | Mock returns quote resource |
| TC-RES-P02 | REQ-RES-002 | Daily Affirmation quick action card | Resources screen | 1. Locate Quick Actions 2. View Daily Affirmation card | Card visible with emoji/icon and label | IMPLEMENTED | UI presence only |
| TC-RES-P03 | REQ-RES-002 | Random Quote quick action card | Resources screen | 1. Locate Quick Actions 2. View Random Quote card | Card visible with emoji/icon and label | IMPLEMENTED | UI presence only |
| TC-RES-P04 | REQ-RES-002 | Daily Affirmation navigation | Resources screen | 1. Tap Daily Affirmation card | Navigates to detail screen w/ affirmation data | PARTIAL | Navigation mocked; detail route assertion basic |
| TC-RES-P05 | REQ-RES-002 | Random Quote navigation | Resources screen | 1. Tap Random Quote card | Navigates to detail screen w/ quote data | PARTIAL | Same as above |
| TC-RES-P06 | REQ-RES-003 | Search box visibility & placeholder | Resources screen | 1. Locate search box | Placeholder "Search resources..." visible | IMPLEMENTED | |
| TC-RES-P07 | REQ-RES-003 | Search valid keyword | Resources present | 1. Enter "breathing" 2. Observe | Matching resources displayed | IMPLEMENTED | Mock search returns filtered list |
| TC-RES-P08 | REQ-RES-003 | Search case-insensitive | Resources present | 1. Enter "BREATHING" | Same results as lowercase | IMPLEMENTED | |
| TC-RES-P09 | REQ-RES-001 | All 6 category cards display | Resources screen | 1. Scroll to Categories | 6 categories visible | IMPLEMENTED | |
| TC-RES-P10 | REQ-RES-001 | Stress category card display | Resources screen | 1. View Stress card | Stress card visible with icon | IMPLEMENTED | |
| TC-RES-P11 | REQ-RES-001 | Anxiety category card display | Resources screen | 1. View Anxiety card | Anxiety card visible | IMPLEMENTED | |
| TC-RES-P12 | REQ-RES-001 | Depression category card display | Resources screen | 1. View Depression card | Depression card visible | IMPLEMENTED | |
| TC-RES-P13 | REQ-RES-001 | Sleep category card display | Resources screen | 1. View Sleep card | Sleep card visible | IMPLEMENTED | |
| TC-RES-P14 | REQ-RES-001 | Motivation category card display | Resources screen | 1. View Motivation card | Motivation card visible | IMPLEMENTED | |
| TC-RES-P15 | REQ-RES-001 | Mindfulness category card display | Resources screen | 1. View Mindfulness card | Mindfulness card visible | IMPLEMENTED | |
| TC-RES-P16 | REQ-RES-004 | Stress category filtering | Resources screen | 1. Tap Stress card | Only Stress resources shown | IMPLEMENTED | Mock category query returns subset |
| TC-RES-P17 | REQ-RES-004 | Anxiety category filtering | Resources screen | 1. Tap Anxiety card | Only Anxiety resources shown | IMPLEMENTED | |
| TC-RES-P18 | REQ-RES-004 | Depression category filtering | Resources screen | 1. Tap Depression card | Only Depression resources shown | IMPLEMENTED | |
| TC-RES-P19 | REQ-RES-004 | Sleep category filtering | Resources screen | 1. Tap Sleep card | Only Sleep resources shown | IMPLEMENTED | |
| TC-RES-P20 | REQ-RES-004 | Motivation category filtering | Resources screen | 1. Tap Motivation card | Only Motivation resources shown | IMPLEMENTED | |
| TC-RES-P21 | REQ-RES-004 | Mindfulness category filtering | Resources screen | 1. Tap Mindfulness card | Only Mindfulness resources shown | IMPLEMENTED | |
| TC-RES-P22 | REQ-RES-004 | "All" link to view all resources | Category filter active | 1. Tap All (Clear) | All resources displayed | IMPLEMENTED | Uses Clear toggle |
| TC-RES-P23 | REQ-RES-005 | Resource card displays metadata (Quote) | Resources loaded | 1. Observe quote card | Title, type, duration, author | IMPLEMENTED | Mock provides fields |
| TC-RES-P24 | REQ-RES-005 | Exercise card metadata | Resources loaded | 1. Observe exercise card | Title, type, duration | IMPLEMENTED | |
| TC-RES-P25 | REQ-RES-005 | Article card metadata | Resources loaded | 1. Observe article card | Title, type, duration, author | IMPLEMENTED | |
| TC-RES-P26 | REQ-RES-005 | Guide card metadata | Resources loaded | 1. Observe guide card | Title, type, duration | IMPLEMENTED | |
| TC-RES-P27 | REQ-RES-005 | Navigation to resource detail | Resources loaded | 1. Tap resource card | Detail screen shows category tag, title | PARTIAL | Detail rendered w/ params; limited assertions |
| TC-RES-P28 | REQ-RES-005 | Resource detail content display | On detail screen | 1. Read content | Full text visible | IMPLEMENTED | |
| TC-RES-P29 | REQ-RES-005 | "Take a Moment" section | Detail screen | 1. Scroll | Reflection prompt displayed | IMPLEMENTED | |
| TC-RES-P30 | REQ-RES-005 | "What's Next?" options | Detail screen | 1. Scroll | Two options visible | IMPLEMENTED | |
| TC-RES-P31 | REQ-RES-005 | "Return to Home" navigation | Detail screen | 1. Tap Return to Home | Navigates home | PARTIAL | Router mocked only |
| TC-RES-P32 | REQ-RES-005 | "Explore More" navigation | Detail screen | 1. Tap Explore More | Navigates back | PARTIAL | Router.back mocked |
| TC-RES-P33 | REQ-RES-006 | Share button visibility | Detail screen | 1. Locate Share button | Visible with icon | PENDING | Share not yet rendered (no explicit button) |
| TC-RES-P34 | REQ-RES-006 | Share functionality | Detail screen | 1. Tap Share | Native share sheet opens | PENDING | Needs Share button impl |
| TC-RES-P35 | REQ-RES-002 | Inspirational Quote random | Quote detail | 1. Navigate twice | Quote may change | PENDING | Requires external action repeat |
| TC-RES-P36 | REQ-RES-002 | Quote changes on refresh | Resources screen | 1. View 2. Refresh 3. Recheck | Quote updated or consistent per design | PENDING | Need refresh test + time mocking |
| TC-RES-P37 | REQ-RES-005 | Depression resource detail (Three Good Things) | Depression list | 1. Tap resource | Full exercise instructions | PENDING | Specific seed data |
| TC-RES-P38 | REQ-RES-005 | Category tag display | Detail screen | 1. Observe tag | Tag displayed at top | IMPLEMENTED | Uppercase category badge |
| TC-RES-P39 | REQ-RES-001 | Back navigation from Resources page | Resources screen | 1. Tap back arrow | Navigates previous | PENDING | Header back not asserted |
| TC-RES-P40 | REQ-RES-001 | Notification bell visibility | Resources screen | 1. Observe bell | Bell icon visible | PENDING | Header internal; not asserted |
| TC-RES-P41 | REQ-RES-003 | Search multiple keywords | Resources screen | 1. Enter "breathing stress" | Combined results | PENDING | Compound logic test |
| TC-RES-P42 | REQ-RES-004 | Category icon colors distinct | Resources screen | 1. View all | Each distinct color | PARTIAL | Icons present; style color not asserted |
| TC-RES-P43 | REQ-RES-005 | Resource list scrolling | Long list | 1. Scroll list | Smooth scroll | PENDING | RN scroll performance not asserted |
| TC-RES-P44 | REQ-RES-002 | Daily Affirmation content motivational | Affirmation detail | 1. Read content | Positive supportive tone | PENDING | Content semantics not asserted |
| TC-RES-P45 | REQ-RES-005 | Progressive Muscle Relaxation card | All resources | 1. Observe card | Metadata displayed | PENDING | Specific resource absent |
| TC-RES-P46 | REQ-RES-005 | On Perseverance resource | Depression cat | 1. Observe card | Appropriate metadata | PENDING | Specific resource absent |
| TC-RES-P47 | REQ-RES-001 | Resources page title | Resources screen | 1. View title | "Resources" visible | IMPLEMENTED | Header title asserted |
| TC-RES-P48 | REQ-RES-004 | Category selection visual feedback | Resources screen | 1. Tap category | Selected state styling | IMPLEMENTED | Border style asserted |
| TC-RES-P49 | REQ-RES-005 | Resource cards have chevron | Resources list | 1. Observe cards | Chevron forward icon visible | IMPLEMENTED | Ionicon rendered |
| TC-RES-P50 | REQ-RES-003 | Search icon visibility | Resources screen | 1. Locate search field | Magnifying glass icon visible | IMPLEMENTED | Ionicon asserted |
| TC-RES-P51 | REQ-RES-005 | Resource duration display | Resources list | 1. Observe durations | Minutes displayed | IMPLEMENTED | |
| TC-RES-P52 | REQ-RES-005 | Resource type icons distinct | Resources list | 1. Compare types | Distinct icons per type | PENDING | Only text meta implemented |
| TC-RES-P53 | REQ-RES-002 | Featured quote refresh daily | Different day | 1. View day1 2. View day2 | Quote may change | PENDING | Needs date mocking |
| TC-RES-P54 | REQ-RES-005 | "Take a Moment" on all details | Multiple details | 1. Open several resources | Reflection section appears | PARTIAL | Single resource asserted |
| TC-RES-P55 | REQ-RES-006 | Share via email option | Share sheet | 1. Tap Share 2. Choose email | Formatted content shared | PENDING | Share button missing |
| TC-RES-P56 | REQ-RES-003 | Search relevance ordering | Search "anxiety" | 1. Perform search | Relevant first | PENDING | Ranking logic not asserted |
| TC-RES-P57 | REQ-RES-005 | Box Breathing Technique detail | Resource list | 1. Open detail | Breathing steps visible | PENDING | Specific resource absent |
| TC-RES-P58 | REQ-RES-005 | Behavioral Activation detail | Resource list | 1. Open detail | Article content + author | PENDING | Specific resource absent |
| TC-RES-P59 | REQ-RES-001 | Quick Actions heading visible | Resources screen | 1. View heading | "Quick Actions" visible | IMPLEMENTED | |
| TC-RES-P60 | REQ-RES-001 | Categories section heading | Resources screen | 1. View heading | "Categories" visible | IMPLEMENTED | |
| TC-RES-N01 | REQ-RES-003 | Search no matches | Resources screen | 1. Enter impossible string | "No resources found" message | IMPLEMENTED | Mock returns empty list |
| TC-RES-N02 | REQ-RES-003 | Search empty string | Resources screen | 1. Leave empty | All resources OR prompt | PARTIAL | ListResources fallback; logic validated |
| TC-RES-N03 | REQ-RES-003 | Search special chars only | Resources screen | 1. Enter symbols | Handled gracefully | PENDING | Need sanitization test |
| TC-RES-N04 | REQ-RES-003 | Search SQL injection attempt | Resources screen | 1. Enter SQL | Sanitized; no crash | PENDING | Security test deferred |
| TC-RES-N05 | REQ-RES-003 | Search XSS script | Resources screen | 1. Enter script | Not executed | PENDING | Needs injection sanitization |
| TC-RES-N06 | REQ-RES-005 | Detail load w/ disconnect | Opening detail | 1. Tap 2. Disconnect | Error or cached | PENDING | Network simulation required |
| TC-RES-N07 | REQ-RES-005 | Slow network detail load | 2G | 1. Tap resource | Loading then content | PENDING | Requires timers/network throttle |
| TC-RES-N08 | REQ-RES-005 | Airplane mode detail | Offline | 1. Open resource | Offline error/cached | PENDING | Offline simulation |
| TC-RES-N09 | REQ-RES-002 | Daily Affirmation API failure | API down | 1. Tap Affirmation | Fallback/error modal | PARTIAL | Modal path not asserted yet |
| TC-RES-N10 | REQ-RES-002 | Random Quote API failure | API down | 1. Tap Quote | Fallback/error modal | PARTIAL | Same as above |
| TC-RES-N11 | REQ-RES-006 | Share no capability | Unsupported device | 1. Tap Share | Graceful degradation | PENDING | Share absent |
| TC-RES-N12 | REQ-RES-004 | Empty category filter | Category with none | 1. Select empty category | Empty state message | PENDING | Need mock category returning [] |
| TC-RES-N13 | REQ-RES-001 | Unauthorized admin-only resource | Standard user | 1. Access restricted URL | 403 denial | PENDING | Access control not in UI |
| TC-RES-N14 | REQ-RES-005 | Malformed URL/ID | Direct nav | 1. Enter bad id | 404 or graceful fallback | PENDING | Detail screen fetch logic partial |
| TC-RES-N15 | REQ-RES-005 | Non-existent ID | Direct nav | 1. Use invalid id | Not found message | PENDING | |
| TC-RES-N16 | REQ-RES-001 | Resources server error 500 | Navigate | 1. Trigger error | User-friendly error | PENDING | Needs error simulation |
| TC-RES-N17 | REQ-RES-003 | Very long search string | Resources screen | 1. Enter 1000 chars | Handled gracefully | PENDING | Input length test |
| TC-RES-N18 | REQ-RES-006 | Share cancelled | Share sheet | 1. Open Share 2. Cancel | Returns to detail | PENDING | Share absent |
| TC-RES-N19 | REQ-RES-003 | Unicode search | Resources screen | 1. Enter unicode | Results / no crash | PENDING | |
| TC-RES-N20 | REQ-RES-004 | Rapid category switching | Resources screen | 1. Tap categories rapidly | No lag/errors | PENDING | Stress test |
| TC-RES-N21 | REQ-RES-005 | Double-tap resource card | Resources list | 1. Double tap | Single navigation | PENDING | Needs duplicate event test |
| TC-RES-N22 | REQ-RES-001 | Slow loading Resources page | Poor network | 1. Navigate | Loading indicator then content | PARTIAL | Loading asserted normally |
| TC-RES-N23 | REQ-RES-005 | Back during loading | Resource loading | 1. Tap resource then back | Clean cancel | PENDING | Loading scenarios not mocked |
| TC-RES-N24 | REQ-RES-002 | Affirmation multiple same day | Same day | 1. View twice | Consistent affirmation | PENDING | Needs date caching logic |
| TC-RES-N25 | REQ-RES-003 | Search only spaces | Resources screen | 1. Enter spaces | Trimmed/all resources | PENDING | Whitespace trimming not asserted |
| TC-RES-N26 | REQ-RES-005 | Missing content resource | Resource missing content | 1. Open | Placeholder/error | PENDING | Provide mock with empty content |
| TC-RES-N27 | REQ-RES-001 | Session timeout during Resources | Session expires | 1. Interact | Prompt or public view | PENDING | Auth context simulation |
| TC-RES-N28 | REQ-RES-004 | Category filter persistence | Filter applied | 1. Apply 2. Navigate away/back | Design-specific behavior | PENDING | Persistence not tested |
| TC-RES-N29 | REQ-RES-003 | Search during typing | Resources screen | 1. Type slowly | Real-time or debounce | PENDING | Debounce not asserted |
| TC-RES-N30 | REQ-RES-005 | App backgrounding on detail | Detail screen | 1. Background/return | State preserved | PENDING | App state simulation |
| TC-RES-N31 | REQ-RES-006 | Share with network disconnect | Share attempt | 1. Tap Share 2. Disconnect | Graceful failure | PENDING | Share absent |
| TC-RES-N32 | REQ-RES-005 | Corrupted content data | Bad resource data | 1. Open | Error message no crash | PENDING | |
| TC-RES-N33 | REQ-RES-003 | Mixed case special query | Resources screen | 1. Enter "StReSs@123" | Handled appropriately | PENDING | |
| TC-RES-N34 | REQ-RES-002 | Empty Featured API response | API returns empty | 1. Load Resources | Fallback or hidden section | PENDING | Need external action mock |
| TC-RES-N35 | REQ-RES-005 | Accessing deleted resource | Deleted resource link | 1. Open link | 404 friendly message | PENDING | |

## Summary
Implemented: core UI presence, filtering, basic search, resource metadata, navigation to detail and reflection section.
Partial: navigation side-effects, error modal paths, persistence, category colors, multi-resource reflection consistency.
Pending: advanced error handling, performance, security, share functionality, external API variability, edge-case inputs.

## Next Steps
1. Add Share button tests once implemented on detail screen.
2. Introduce mock layers for API failure paths (affirmation/quote actions) and assert StatusModal visibility.
3. Expand resource fixture set to include missing named resources for specific test IDs.
4. Add security and injection sanitization tests after input sanitization utilities confirmed.
