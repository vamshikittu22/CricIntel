# Domain Pitfalls

**Domain:** Cricket Analytics Platform (Cricsheet + Supabase)
**Researched:** 2026-03-10
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Player Identity Collision
**What goes wrong:** New/uncapped players with same surname as famous players get incorrectly mapped to the wrong player ID. Cricsheet has documented this issue - they found errors "generally down to confusion between players with the same surname, such as Brendon and Nathan McCullum."

**Why it happens:** 
- Cricsheet JSON uses internal identifiers without guaranteed uniqueness
- No automatic handling when new players share surnames with existing players
- Player registry mappings incomplete for new/capped players

**Consequences:**
- Career statistics get merged or attributed to wrong player
- Player profiles show incorrect career totals
- User trust destroyed when "Virat Kohli" stats include another player's runs

**Prevention:**
- Use Cricsheet Register (https://cricsheet.org/register/) for player ID canonicalization
- Implement manual review queue for surname collisions during import
- Add unique constraints on player identifiers with fallback matching

**Detection:**
- Run validation: compare imported player count vs expected from Cricsheet metadata
- Flag when single player shows wildly different career spans
- Check for sudden jumps in career totals after imports

**Phase:** Data Import / Schema Design

---

### Pitfall 2: Incorrect Wicket/Dismissal Attribution
**What goes wrong:** Review data shows wickets incorrectly attributed to wrong bowlers. Cricsheet's own review corrections note "I'd associated some reviews to the incorrect delivery in an over. Generally this was down to my failing to take wides or no-balls into account."

**Why it happens:**
- Wides and no-balls don't count as legal deliveries but can result in wickets
- Complex dismissal types (caught behind, lbw, run out) require careful tracking
- DRS reviews may reverse decisions, requiring retroactive updates

**Consequences:**
- Bowler stats show wickets they didn't take
- Partnership records show wrong batsmen combinations
- Match outcome narratives become incorrect

**Prevention:**
- Implement explicit validation: total wickets per innings must equal sum of dismissals
- Track wides/no-balls separately with their own dismissal flags
- Store review outcomes with delivery reference, not inferred

**Detection:**
- Query: innings total wickets != sum of dismissal types
- Check: wicket count vs player dismissals array length mismatch

**Phase:** Data Import / Validation

---

### Pitfall 3: Extras Calculation Errors
**What goes wrong:** Wides, no-balls, byes, leg-byes not properly attributed. In cricket, these have different implications:
- Wides/no-balls: extra balls bowled (affects over count)
- Byes/leg-byes: runs but not scored by batsman (don't affect striker's stats)

**Why it happens:**
- Naive aggregation treating all extras the same
- Confusing which extras count against bowler's economy vs batsman's runs
- Not accounting for overthrow runs that can be scored off extras

**Consequences:**
- Wrong batting strike rates (byes counted as striker runs)
- Wrong bowling economy (wides/no-balls should count but byes shouldn't)
- Total match scores don't add up correctly

**Prevention:**
- Model extras as separate fields with proper cricket semantics
- Use database constraints: wides + no-balls + byes + leg-byes = total_extras
- Track "runs_off_bat" separately from "total_runs" per delivery

**Detection:**
- Check: total_runs - (runs_off_bat + extras) should equal overthrow runs
- Verify: no-ball+wides count as extra balls in over progression

**Phase:** Schema Design / Data Import

---

### Pitfall 4: Venue Name Normalization Failure
**What goes wrong:** Same stadium appears with multiple names. Research shows venues have extensive aliasing: "AC-VDCA Stadium" → "Dr YS Rajasekhara Reddy Cricket Stadium", "Alexandra Park" → "City Oval", etc.

**Why it happens:**
- Grounds renamed over time
- Different competitions use different names
- Human scorers enter names inconsistently
- New stadiums replace old ones at same location

**Consequences:**
- Venue statistics split across multiple records
- Historical analysis spans wrong data sets
- "Most runs at venue X" queries return incomplete results

**Prevention:**
- Create venue normalization table with aliases mapping to canonical name
- Use HowSTAT's ground aliases (https://www.howstat.com/Cricket/statistics/Grounds/GroundAliases.asp) as reference
- Store both original_name and canonical_venue_id

**Detection:**
- Group by venue shows low counts per entry
- Same city has multiple venue entries

**Phase:** Data Import / Schema Design

---

### Pitfall 5: Over/Ball Sequence Breaking
**What goes wrong:** Innings data doesn't respect cricket's over structure (6 legal balls per over in limited-overs). Cricsheet notes "miscounted_overs" exists in their format for a reason.

**Why it happens:**
- Wides don't count as balls bowled but do count in over number
- No-balls count as ball faced but not as completed over ball
- Invalid data in source files (Cricsheet acknowledges this)
- Failed import parsing loses sequence

**Consequences:**
- Can't accurately calculate strike rate at different phases (powerplay vs death)
- Over-by-over commentary desynchronized
- Partnership calculations fail mid-over

**Prevention:**
- Validate: each over must have 1-7 deliveries (considering wides)
- Store over_number and ball_in_over as separate computed fields
- Reject imports where ball sequence doesn't make cricket sense

**Detection:**
- Query for overs with <1 or >7 balls where wides don't explain discrepancy
- Check: ball_sequence numbers have gaps

**Phase:** Data Import / Validation

---

## Moderate Pitfalls

### Pitfall 6: Match Format Confusion
**What goes wrong:** Treating T20, ODI, and Test statistics as equivalent. Same player appears with wildly different aggregate stats.

**Why it happens:**
- Different formats have different batting/bowling norms (30 average good in Tests, terrible in T20)
- Mixing formats in career totals
- Not filtering by format in queries

**Prevention:**
- Always include format filter in queries (test/odi/t20)
- Store format as enum with proper indexing
- Consider separate aggregation tables per format

**Detection:**
- Player average in "career" shows unrealistic number (neither test nor ODI norm)

**Phase:** Schema Design / Query Building

---

### Pitfall 7: Season/Year Boundary Errors
**What goes wrong:** IPL 2024 appears in 2023 data or vice versa. Cricket seasons cross calendar years (Australian summer).

**Why it happens:**
- Using calendar year instead of season/competition year
- Start date vs match date confusion
- Different competitions run concurrently

**Prevention:**
- Store competition_season field (e.g., "IPL 2024", "BBL 2023-24")
- Use competition ID from Cricsheet metadata

**Phase:** Schema Design

---

### Pitfall 8: Player Name Variations Not Linked
**What goes wrong:** Same player appears as "Rohit Sharma", "Rohit Gurunath Sharma", "RG Sharma" in different contexts.

**Why it happens:**
- No central player registry applied during import
- Different sources use different name formats
- Cricsheet has 8,768 name variations for 17,775 people

**Prevention:**
- Use Cricsheet Register identifiers as canonical
- Store name variations but link to canonical ID
- Display preferred name but query across all variations

**Phase:** Data Import

---

## Minor Pitfalls

### Pitfall 9: Missing Historical Data Backfill
**What goes wrong:** Only importing recent matches, breaking historical trend analysis.

**Prevention:**
- Import full Cricsheet archive, not just recent seasons
- Document data coverage (which competitions, which years)

### Pitfall 10: Real-Time Update Race Conditions
**What goes wrong:** Live match updates conflict with historical imports.

**Prevention:**
- Use separate tables for live vs archived data
- Implement proper locking or event sourcing

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data Import | Player identity collision | Use Cricsheet Register, manual review queue |
| Schema Design | Extras calculation wrong | Model extras separately with cricket semantics |
| Data Import | Venue fragmentation | Pre-build venue normalization table |
| Validation | Wicket attribution errors | Cross-check total wickets vs dismissal array |
| Query Building | Format mixing | Always filter by match format |
| Data Import | Over sequence breaks | Validate ball count per over |

---

## Sources

- **Cricsheet Data Accuracy**: https://cricsheet.org/article/how-accurate-is-the-data/ (HIGH - Official source)
- **Cricsheet Review Corrections**: https://cricsheet.org/article/review_corrections/ (HIGH - Official source)  
- **Cricsheet Register**: https://cricsheet.org/register/ (HIGH - Official source)
- **Cricsheet Format Changes**: https://cricsheet.org/format/changes.html (HIGH - Official source)
- **HowSTAT Venue Aliases**: https://www.howstat.com/Cricket/statistics/Grounds/GroundAliases.asp (MEDIUM - Authoritative cricket stats)
- **Player ID Audit Report**: https://github.com/dwijesh-r/cricket-playbook/blob/main/analysis/player_id_audit_report.md (MEDIUM - Real-world case)
- **Sports Analytics Mistakes**: https://medium.com/@glantonandjudge/5-common-mistakes-in-sports-analytics-data-science-9492fee8c8c2 (LOW - General domain)
