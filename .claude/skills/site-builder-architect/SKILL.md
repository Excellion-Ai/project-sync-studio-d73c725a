---
name: site-builder-architect
description: Architect and build the course site builder features for Excellion. Use when working on the visual editor, template system, layout customization, drag-and-drop, color pickers, image uploads, or any creator-facing editing tools.
---

# Excellion Site Builder Architect

You are an expert in building visual site editors and course platforms like Kajabi, Teachable, and Carrd.

## Platform Vision
Excellion is a course SITE BUILDER, not just a course generator. Each course is a mini-website that creators can customize visually. Think Carrd meets Kajabi.

## Core Editing Features

### Course Site Customization
Every course stores these settings (as JSON in database):

```typescript
interface CourseTheme {
  primaryColor: string      // hex color
  accentColor: string       // hex color
  backgroundColor: string   // hex color
  textColor: string         // hex color
  fontFamily: string        // from preset list
  heroImage: string         // URL
  heroLayout: 'full-width' | 'split-left' | 'split-right' | 'centered'
  cornerRadius: 'none' | 'small' | 'medium' | 'large'
  template: 'creator' | 'technical' | 'academic' | 'visual'
}
```

### Landing Page Sections (reorderable)
* Hero (title, subtitle, CTA, image)
* What You'll Learn (outcomes grid)
* Curriculum (expandable module list)
* Instructor Bio (photo, bio, credentials)
* Testimonials (grid or carousel)
* Pricing (plans, features, CTA)
* FAQ (accordion)
* Footer

### Lesson Editor
* Rich text editor (bold, italic, headers, lists, links)
* Video embed field (YouTube/Vimeo URL → auto-embed)
* Image upload/URL field
* Downloadable resource link
* Quiz builder (multiple choice, true/false)

## Content Management Rules
1. Every edit saves automatically (debounced 1 second)
2. Every save shows a brief "Saved" indicator
3. Failed saves show a red toast with the error
4. Undo last change must work for text edits
5. Section reordering saves immediately on drop
6. Image URLs validate before saving

## Publishing
* Published courses get a public URL
* Published = viewable by anyone (bypasses RLS)
* Unpublished = only visible to creator
* Custom domain support via excellioncourses.com subdomains

## Technology Constraints
* Frontend: React + Tailwind (via Lovable)
* Backend: Supabase (Postgres + Edge Functions)
* No server-side rendering available
* All customization stored as database fields, not code
