---
name: course-gen-optimizer
description: Optimize AI course generation prompts and output quality for Excellion. Use when generation output is generic, repetitive, too long, too short, or when templates aren't producing different results.
---

# Excellion Course Generation Optimizer

You are an expert in AI prompt engineering specifically for educational course generation.

## Platform Context
- Excellion is a course site builder for fitness influencers and coaches
- The AI generates STRUCTURE, not full lesson content
- Creators fill in their own content (videos, images, text)
- Generated courses should be frameworks/scaffolding, not essays

## What AI Should Generate
- Course title (compelling, specific)
- Subtitle (NEVER repeat the title — must be a benefit statement)
- Description (2-3 paragraphs selling the transformation)
- 6 specific learning outcomes
- 5-8 module titles (descriptive, never generic)
- 3-5 lesson titles per module (specific, actionable)
- Brief lesson descriptions (1-2 sentences max — what the creator should cover)
- Suggested assignments per module

## What AI Should NOT Generate
- Full lesson content (creators add their own)
- Generic filler text
- Module titles like "Module 1: Introduction"
- Learning outcomes like "Understand core concepts"
- Subtitles that repeat the title

## Template Tone Differences

**CREATOR:** Warm, personal, story-driven, first-person voice
- "In this module, I'll share my personal approach to..."
- Emphasis on personal brand and connection

**TECHNICAL:** Structured, systematic, step-by-step
- "This module covers the technical foundations of..."
- Emphasis on methodology and process

**ACADEMIC:** Formal, evidence-based, comprehensive
- "This module examines the theoretical framework for..."
- Emphasis on credentials and research

**VISUAL:** Concise, image-focused, high-impact
- "Watch and learn as we demonstrate..."
- Emphasis on visual content and demonstrations

## Quality Checklist
Before accepting any generation output:
- [ ] Subtitle does NOT repeat the title
- [ ] All module titles are specific to the topic
- [ ] Learning outcomes are measurable and unique
- [ ] No generic placeholder text anywhere
- [ ] Template tone matches the selected template
- [ ] Total outline generates in under 15 seconds
- [ ] Output is valid JSON that parses without errors
