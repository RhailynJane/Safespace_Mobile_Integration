// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seed...");

  // Create Support Workers (this table exists)
  console.log("📝 Creating support workers in support_workers table...");
  await prisma.supportWorker.createMany({
    data: [
      {
        first_name: "Eric",
        last_name: "Young",
        email: "eric.young@safespace.com",
        phone_number: "+1-555-0101",
        specialization: "Anxiety, Depression, Trauma",
        bio: "Experienced support worker specializing in anxiety disorders and trauma recovery.",
        years_of_experience: 8,
        avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
        status: "active",
        hourly_rate: 85.00,
        languages_spoken: ["English", "Spanish"],
        certifications: ["Licensed Clinical Social Worker", "Trauma-Informed Care Certificate"],
        education: "MSW - Columbia University",
        license_number: "LCSW-12345",
      },
      {
        first_name: "Michael",
        last_name: "Chen",
        email: "michael.chen@safespace.com",
        phone_number: "+1-555-0102",
        specialization: "Anxiety, Depression, Trauma",
        bio: "Passionate about helping individuals navigate mental health challenges.",
        years_of_experience: 5,
        avatar_url: "https://randomuser.me/api/portraits/men/2.jpg",
        status: "active",
        hourly_rate: 75.00,
        languages_spoken: ["English", "Mandarin"],
        certifications: ["CBT Specialist", "Mindfulness-Based Stress Reduction"],
        education: "MA Psychology - UCLA",
        license_number: "MFT-67890",
      },
      {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.johnson@safespace.com",
        phone_number: "+1-555-0103",
        specialization: "Depression, Stress Management, Family Support",
        bio: "Dedicated to creating a safe, supportive environment for clients.",
        years_of_experience: 10,
        avatar_url: "https://randomuser.me/api/portraits/women/1.jpg",
        status: "active",
        hourly_rate: 90.00,
        languages_spoken: ["English", "French"],
        certifications: ["Licensed Professional Counselor", "Family Systems Therapy"],
        education: "PhD Clinical Psychology - Stanford",
        license_number: "LPC-11111",
      },
      {
        first_name: "David",
        last_name: "Martinez",
        email: "david.martinez@safespace.com",
        phone_number: "+1-555-0104",
        specialization: "PTSD, Trauma, Crisis Intervention",
        bio: "Specialized in trauma-informed care and crisis intervention.",
        years_of_experience: 12,
        avatar_url: "https://randomuser.me/api/portraits/men/3.jpg",
        status: "active",
        hourly_rate: 95.00,
        languages_spoken: ["English", "Spanish"],
        certifications: ["EMDR Certified Therapist", "Crisis Intervention Specialist"],
        education: "PsyD - Pepperdine University",
        license_number: "PSY-22222",
      },
      {
        first_name: "Lisa",
        last_name: "Anderson",
        email: "lisa.anderson@safespace.com",
        phone_number: "+1-555-0105",
        specialization: "Grief Counseling, Loss, Life Transitions",
        bio: "Compassionate counselor with expertise in grief and loss.",
        years_of_experience: 7,
        avatar_url: "https://randomuser.me/api/portraits/women/2.jpg",
        status: "active",
        hourly_rate: 80.00,
        languages_spoken: ["English"],
        certifications: ["Certified Grief Counselor", "Life Transitions Specialist"],
        education: "MSW - University of Toronto",
        license_number: "LPC-33333",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Support workers created!");

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });