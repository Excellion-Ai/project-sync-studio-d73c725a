#!/usr/bin/env node
/**
 * One-off script to create the EverFeatured reviewer account.
 * Run via: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-reviewer.mjs
 *
 * This script:
 * 1. Creates an auth user with auto-confirmed email
 * 2. Updates the profile row (created by handle_new_user trigger)
 * 3. Adds to comp_access for Stripe bypass
 * 4. Seeds a sample published course with curriculum
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const EMAIL = "reviewer+everfeatured@excellion.com";
const PASSWORD = "AiUGDg3U9OCdh457";
const FULL_NAME = "EverFeatured Reviewer";

async function api(path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function query(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  // Use the REST API directly for table operations instead
}

async function restGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function restPost(table, body, opts = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${opts}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function restPatch(table, body, match) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  console.log("=== Creating EverFeatured Reviewer Account ===\n");

  // 1. Create auth user
  console.log("1. Creating auth user...");
  const { status: authStatus, data: authData } = await api(
    "/auth/v1/admin/users",
    {
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    }
  );

  if (authStatus >= 400 && !authData?.id) {
    console.error("Auth user creation failed:", authData);
    process.exit(1);
  }

  const userId = authData.id;
  console.log("   User ID:", userId);

  // Wait for handle_new_user trigger to create profile
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Update profile
  console.log("2. Updating profile...");
  const { status: profStatus } = await restPatch(
    "profiles",
    {
      full_name: FULL_NAME,
      role: "coach",
      updated_at: new Date().toISOString(),
    },
    `id=eq.${userId}`
  );
  console.log("   Profile status:", profStatus);

  // 3. Add to comp_access
  console.log("3. Adding to comp_access...");
  const { status: compStatus } = await restPost("comp_access", {
    email: EMAIL,
    note: "EverFeatured reviewer account, full platform access for product review",
    granted_by: "excellionai@gmail.com",
  });
  console.log("   Comp access status:", compStatus);

  // 4. Create builder project
  console.log("4. Creating sample course...");
  const { data: projData } = await restPost("builder_projects", {
    name: "Iron Foundation: 12-Week Strength Program",
    user_id: userId,
  });
  const projectId = projData?.[0]?.id;
  console.log("   Project ID:", projectId);

  // 5. Create published course
  const curriculum = [
    {
      id: "mod-0",
      title: "Phase 1: Foundation (Weeks 1-4)",
      description: "Build your base with compound lifts and movement quality.",
      lessons: [
        {
          id: "mod-0-les-0",
          title: "Squat & Deadlift Fundamentals",
          description: "Master the two most important lifts with proper bracing, foot position, and bar path.",
          duration: "45m",
          type: "text",
          content_markdown: "## Squat & Deadlift Fundamentals\n\nBefore you add weight, you need to own the movement.\n\n### The Squat\n- Feet shoulder-width, toes slightly out\n- Brace your core before descending\n- Break at the hips and knees simultaneously\n- Depth: hip crease below knee\n\n### The Deadlift\n- Bar over mid-foot\n- Grip just outside the knees\n- Chest up, lats engaged\n- Push the floor away\n\n### Programming for Weeks 1-4\n- Squat: 3x8 at RPE 6-7\n- Deadlift: 3x6 at RPE 6-7\n- Focus on form over load",
        },
        {
          id: "mod-0-les-1",
          title: "Upper Body Push & Pull Balance",
          description: "Program your bench press, overhead press, and rows for balanced development.",
          duration: "40m",
          type: "text",
          content_markdown: "## Upper Body Push & Pull Balance\n\nMost programs overdevelop the push muscles. We fix that here.\n\n### Push Movements\n- Bench Press: 3x8\n- Overhead Press: 3x8\n\n### Pull Movements (match volume 1:1)\n- Barbell Row: 3x8\n- Pull-ups or Lat Pulldown: 3x10\n\n### Key Rule\nFor every set of pressing, do one set of pulling. Your shoulders will thank you in year two.",
        },
      ],
    },
    {
      id: "mod-1",
      title: "Phase 2: Progression (Weeks 5-8)",
      description: "Increase training volume and introduce progressive overload strategies.",
      lessons: [
        {
          id: "mod-1-les-0",
          title: "Linear Progression Model",
          description: "Add 2.5-5 lbs per session using the double progression method.",
          duration: "35m",
          type: "text",
          content_markdown: "## Linear Progression Model\n\nYou don't need a complicated periodization scheme. You need consistent small jumps.\n\n### Double Progression Method\n1. Pick a rep range (e.g., 3x6-8)\n2. Start at the low end (3x6)\n3. Each session, add 1 rep per set\n4. When you hit 3x8, add 5 lbs and reset to 3x6\n\n### When to Deload\n- If you miss reps 2 sessions in a row\n- Drop weight by 10% and rebuild\n- This is not failure. This is the plan.",
        },
        {
          id: "mod-1-les-1",
          title: "Recovery & Nutrition Basics",
          description: "Sleep, protein, and training frequency. The three things that actually matter.",
          duration: "30m",
          type: "text",
          content_markdown: "## Recovery & Nutrition Basics\n\nTraining is the stimulus. Recovery is where you grow.\n\n### The Big Three\n1. **Sleep**: 7-9 hours. Non-negotiable.\n2. **Protein**: 0.8-1g per pound of bodyweight daily.\n3. **Frequency**: Each muscle group 2x per week minimum.\n\n### What Doesn't Matter (Yet)\n- Meal timing\n- Supplements\n- The perfect macro split\n\nGet the big three right first. Everything else is noise.",
        },
      ],
    },
    {
      id: "mod-2",
      title: "Phase 3: Peak & Test (Weeks 9-12)",
      description: "Taper volume, peak strength, and test your new maxes.",
      lessons: [
        {
          id: "mod-2-les-0",
          title: "Peaking Protocol",
          description: "Reduce volume, increase intensity, and prepare for max testing.",
          duration: "35m",
          type: "text",
          content_markdown: "## Peaking Protocol\n\nWeeks 9-12 are about expressing the strength you built.\n\n### Week 9-10: Reduce Volume\n- Drop from 3x8 to 3x5\n- Increase weight by 5-10%\n\n### Week 11: Openers\n- Work up to your estimated 90% for singles\n- 2-3 singles per lift\n- Full rest between sets (3-5 min)\n\n### Week 12: Test Day\n- Squat, Bench, Deadlift\n- Start at 85%, jump 5% per attempt\n- 3 attempts max per lift\n- Record everything",
        },
        {
          id: "mod-2-les-1",
          title: "What Comes Next",
          description: "How to run this program again with adjusted numbers and new goals.",
          duration: "25m",
          type: "text",
          content_markdown: "## What Comes Next\n\nYou tested your maxes. Now what?\n\n### Option 1: Run It Again\n- Use your new maxes as the baseline\n- Same structure, heavier weights\n- Most people can run this 3-4 cycles before needing a change\n\n### Option 2: Specialize\n- Pick your weakest lift\n- Add an extra day focused on it\n- Keep the other lifts on maintenance volume\n\n### The Only Rule\nDon't program hop. Pick a direction and commit for 12 weeks. Consistency beats optimization every time.",
        },
      ],
    },
  ];

  const slug = "iron-foundation-12-week-strength-program";
  const { status: courseStatus, data: courseData } = await restPost("courses", {
    user_id: userId,
    title: "Iron Foundation: 12-Week Strength Program",
    description: "A no-nonsense 12-week program that builds real strength using proven compound lifts and linear progression. Designed for intermediate lifters ready to commit.",
    tagline: "Build real strength in 12 weeks. No gimmicks.",
    slug,
    subdomain: slug,
    curriculum,
    status: "published",
    published_at: new Date().toISOString(),
    type: "course",
    is_free: false,
    builder_project_id: projectId,
    layout_template: "creator",
    design_config: {
      colors: {
        primary: "#e53e3e",
        secondary: "#1a1a2e",
        accent: "#f56565",
        background: "#0a0a0a",
        cardBackground: "#111111",
        text: "#ffffff",
        textMuted: "#9ca3af",
      },
      fonts: { heading: "Space Grotesk", body: "Inter" },
      spacing: "normal",
      borderRadius: "medium",
      heroStyle: "gradient",
    },
    section_order: ["hero", "outcomes", "who_is_for", "curriculum", "course_includes", "testimonials", "pricing", "faq", "guarantee"],
    page_sections: {
      landing_sections: ["hero", "outcomes", "who_is_for", "curriculum", "course_includes", "testimonials", "pricing", "faq", "guarantee"],
      target_audience: "Intermediate lifters with 6+ months of training who want a structured strength program.",
      faq: [
        { question: "Do I need a gym membership?", answer: "Yes. This program uses barbells, a squat rack, and a bench. A basic commercial gym works fine." },
        { question: "How many days per week?", answer: "4 days. Upper/Lower split with built-in rest days." },
        { question: "What if I miss a session?", answer: "Shift the week forward. Don't skip the session entirely. Consistency matters more than the calendar." },
      ],
    },
    meta: { difficulty: "intermediate", duration_weeks: 12 },
    instructor_name: "EverFeatured Reviewer",
    instructor_bio: "Strength coach and program designer focused on compound lifts and progressive overload.",
  });

  const courseId = courseData?.[0]?.id;
  console.log("   Course status:", courseStatus);
  console.log("   Course ID:", courseId);

  // Output
  console.log("\n=== ACCOUNT READY ===\n");
  console.log("Login email:     ", EMAIL);
  console.log("Login password:  ", PASSWORD);
  console.log("Login URL:       ", "https://excellioncourses.com/auth?mode=signin");
  console.log("User ID:         ", userId);
  console.log("Course public URL:", `https://excellioncourses.com/course/${slug}`);
  console.log("\nComp access via comp_access table (bypasses Stripe).");
  console.log("No schema changes required.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
