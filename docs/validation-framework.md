# Fallow  Phase 0 Validation Framework

## Purpose
Validate the two riskiest assumptions before writing production code:
1. Can the matching framework produce recommendations that feel "surprisingly personal"?
2. Will people actually try a recommended activity?

---

## Experiment 1: Wizard-of-Oz Matching

### Protocol

**Step 1  Recruit 20 Participants**
- Source: Reddit (r/hobbies, r/selfimprovement, r/socialskills), Twitter/X, personal network
- Screening criteria: Adults 22-40 who express interest in "finding new things to do"
- Incentive: Free personalized hobby recommendations (the product itself is the incentive)

**Step 2  Onboarding (via Typeform or the built prototype)**
Each participant completes the 13-question onboarding flow. Their responses are saved.

**Step 3  Manual Matching (Founder performs this)**
Using the response data, manually:
1. Compute dimensional scores for each participant
2. Review the activity database (~60 activities)
3. Select 5 recommendations:
   - 3 high-match activities (highest dimensional alignment)
   - 1 stretch recommendation (different category, shared latent traits)
   - 1 wildcard (deliberately unexpected, tests the serendipity hypothesis)
4. Write a 2-3 sentence explanation for each recommendation

**Step 4  Deliver Recommendations**
Send each participant a personalized email containing:
- Their "Activity DNA" summary (2-3 sentences about their preference profile)
- 5 recommended activities, each with:
  - Activity name
  - Why we think it matches
  - What might not work
  - The smallest way to try it this weekend
  - Estimated cost and time

**Step 5  Immediate Feedback (Day 0)**
Reply-requested question: "Which of these recommendations surprised you? Did any feel 'weirdly perfect'?"

**Step 6  Follow-Up (Day 14)**
Send a follow-up email with the post-activity questionnaire (below).

### Success Criteria
| Metric | Target | Kill Threshold |
|---|---|---|
| At least 1 recommendation called "surprising" | 50% of users | <25% |
| At least 1 recommendation called "weirdly perfect" | 30% of users | <15% |
| User tried at least 1 recommendation | 30% of users | <15% |
| User says they'd use this product again | 60% of users | <30% |

---

## Experiment 2: ChatGPT A/B Test

### Protocol

**Setup:** Split 20 participants into two groups of 10.

**Group A (Fallow):** Receives recommendations through the Wizard-of-Oz process above.

**Group B (ChatGPT):** Is given a well-crafted ChatGPT prompt and asked to have a conversation:

> Prompt for Group B participants:
> "Paste this into ChatGPT and follow its lead:
>
> 'I want to find new hobbies or activities that I'd genuinely enjoy. Don't just give me a generic list  ask me about my personality, what I enjoy, my constraints, and my past experiences first. Then recommend 5 specific activities I might love, including at least one I've probably never heard of. For each, explain why it matches me and how I can try it for the first time with minimal cost and effort.'"

**Measurement:** After both groups receive their recommendations, send identical survey.

### Success Criteria
| Metric | Target |
|---|---|
| Fallow perceived as more personal | 60% of blind comparisons |
| Fallow generates more "surprises" | 50% more surprise nominations |
| Fallow try rate  ChatGPT try rate | At least equal or higher |

---

## Post-Activity Questionnaire (Day 14 Follow-Up)

### Section 1: Did You Try Anything?
- I tried one or more of the recommended activities
- I haven't tried any yet but I plan to
- I haven't tried any and probably won't

### Section 2: If You Tried Something

1. Which activity did you try?
2. Did time pass quickly while you were doing it?
3. How did you feel afterward? (Energized / Satisfied / Neutral / Drained)
4. Would you do this again voluntarily?
5. Was beginning the activity harder than doing the activity?
6. Did you enjoy the process, or mainly the result?
7. Would you spend money to do this again?
8. Did frustration feel satisfying or irritating?
9. Best describes your reaction? ("Love it" / "Glad I tried" / "Once was enough" / "Not for me")
10. Did you feel more like yourself while doing it?

### Section 3: If You Didn't Try Anything

1. What stopped you? (Busy / Can't find locally / Too expensive / Intimidated / Nothing appealed / Forgot)
2. Did any recommendation make you curious?

### Section 4: Overall Experience

1. How personal did the recommendations feel? (1-5)
2. Was there a "I never would have thought of that" recommendation?
3. Would you use this product again?

---

## Decision Gate

| Outcome | Decision |
|---|---|
| 30% tried + 50% surprised | **Proceed to Phase 1 build** |
| 30% tried but <50% surprised | Refine matching framework, re-test |
| <30% tried but 50% surprised | Redesign experiment mode (activation is the bottleneck) |
| <30% tried AND <50% surprised | **Reconsider product thesis** |
