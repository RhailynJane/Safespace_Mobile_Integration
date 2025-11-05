// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seed...");

  // 1️⃣ Roles
  await prisma.role.createMany({
    data: [
      { role_name: "admin", description: "System Administrator" },
      { role_name: "team_leader", description: "Oversees team operations" },
      { role_name: "support_worker", description: "Provides client support" },
      { role_name: "client", description: "Receives support services" },
    ],
    skipDuplicates: true,
  });

  const teamLeaderRole = await prisma.role.findUnique({ where: { role_name: "team_leader" } });
  const supportWorkerRole = await prisma.role.findUnique({ where: { role_name: "support_worker" } });
  const clientRole = await prisma.role.findUnique({ where: { role_name: "client" } });

  // 2️⃣ Lookup tables
  await prisma.riskLevel.createMany({
    data: [
      { level_name: "Low" },
      { level_name: "Medium" },
      { level_name: "High" },
    ],
    skipDuplicates: true,
  });

  await prisma.priorityLevel.createMany({
    data: [
      { level_name: "Low", order_rank: 1 },
      { level_name: "Medium", order_rank: 2 },
      { level_name: "High", order_rank: 3 },
    ],
    skipDuplicates: true,
  });

  await prisma.sessionType.createMany({
    data: [
      { type_name: "Individual Therapy" },
      { type_name: "Group Therapy" },
      { type_name: "Assessment" },
      { type_name: "Follow-up" },
    ],
    skipDuplicates: true,
  });

  // 3️⃣ Team Leader User
  const leader = await prisma.user.upsert({
    where: { email: "leader@safespace.com" },
    update: {},
    create: {
      first_name: "Team",
      last_name: "Leader",
      email: "leader@safespace.com",
      role_id: teamLeaderRole.id,
      clerk_user_id: "user_33LgdhFYXVVACfPhhcpaKGr6Egq",
    },
  });

  await prisma.user.upsert({
    where: { email: "teamleader@test.com" },
    update: {
        first_name: "team",
        last_name: "leader",
        clerk_user_id: "user_33ylFjc40kAhFaH7AgzvfJTmp64",
    },
    create: {
      first_name: "team",
      last_name: "leader",
      email: "teamleader@test.com",
      role_id: teamLeaderRole.id,
      clerk_user_id: "user_33ylFjc40kAhFaH7AgzvfJTmp64",
    },
  });

  await prisma.user.upsert({
    where: { email: "supportworker@test.com" },
    update: {
        first_name: "support",
        last_name: "worker",
        clerk_user_id: "user_33ykux9arPfJry1yCW0ljDKbluy",
    },
    create: {
      first_name: "support",
      last_name: "worker",
      email: "supportworker@test.com",
      role_id: supportWorkerRole.id,
      clerk_user_id: "user_33ykux9arPfJry1yCW0ljDKbluy",
    },
  });

  // 4️⃣ Support Workers (users table - for authentication)
  const supportWorkers = [];
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        role_id: supportWorkerRole.id,
      },
    });
    supportWorkers.push(user);
  }

  // 🆕 4B️⃣ Support Workers (support_workers table - for profiles/booking)
  console.log("📝 Creating support workers in support_workers table...");
  await prisma.supportWorker.createMany({
    data: [
      {
        first_name: "Eric",
        last_name: "Young",
        email: "eric.young@safespace.com",
        phone_number: "+1-555-0101",
        specialization: "Anxiety, Depression, Trauma",
        bio: "Experienced support worker specializing in anxiety disorders and trauma recovery. I use evidence-based approaches to help clients develop coping strategies and build resilience.",
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
        bio: "Passionate about helping individuals navigate mental health challenges. Specialized training in cognitive behavioral therapy and mindfulness techniques.",
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
        bio: "Dedicated to creating a safe, supportive environment for clients dealing with depression and life transitions. Strong focus on building healthy coping mechanisms.",
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
        bio: "Specialized in trauma-informed care and crisis intervention. Committed to helping clients process traumatic experiences in a compassionate, non-judgmental setting.",
        years_of_experience: 12,
        avatar_url: "https://randomuser.me/api/portraits/men/3.jpg",
        status: "active",
        hourly_rate: 95.00,
        languages_spoken: ["English", "Spanish"],
        certifications: ["EMDR Certified Therapist", "Crisis Intervention Specialist"],
        education: "PsyD - Pepperdine University",
        license_number: "PSY-22222",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Support workers created in support_workers table!");

  // 5️⃣ Clients
  const clients = [];
  for (let i = 0; i < 10; i++) {
    const client = await prisma.client.create({
      data: {
        client_first_name: faker.person.firstName(),
        client_last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        status: faker.helpers.arrayElement(["Active", "Inactive", "Pending"]),
        risk_level: faker.helpers.arrayElement(["Low", "Medium", "High"]),
        user_id: leader.id,
      },
    });
    clients.push(client);
  }

  // 6️⃣ Referrals
  for (let i = 0; i < 10; i++) {
    const client = faker.helpers.arrayElement(clients);
    const worker = faker.helpers.arrayElement(supportWorkers);
    await prisma.referral.create({
      data: {
        client_id: client.id,
        client_first_name: client.client_first_name,
        client_last_name: client.client_last_name,
        referral_source: faker.company.name(),
        reason_for_referral: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(["Pending", "Approved", "Rejected"]),
        submitted_date: faker.date.past(),
        processed_by_user_id: worker.id,
      },
    });
  }

  // 7️⃣ Appointments
  for (let i = 0; i < 10; i++) {
    const client = faker.helpers.arrayElement(clients);
    const date = faker.date.future();
    await prisma.appointment.create({
      data: {
        client_id: client.id,
        scheduled_by_user_id: leader.id,
        appointment_date: date,
        appointment_time: date,
        type: faker.helpers.arrayElement(["Individual Therapy", "Group Therapy", "Assessment"]),
        duration: faker.helpers.arrayElement(["30 min", "60 min", "90 min"]),
        details: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(["Scheduled", "Completed", "Cancelled"]),
      },
    });
  }

  // 8️⃣ Notes
  for (let i = 0; i < 10; i++) {
    const client = faker.helpers.arrayElement(clients);
    const worker = faker.helpers.arrayElement(supportWorkers);
    await prisma.note.create({
      data: {
        client_id: client.id,
        author_user_id: worker.id,
        note_date: faker.date.past(),
        session_type: faker.helpers.arrayElement(["Individual Therapy", "Group Therapy", "Assessment"]),
        summary: faker.lorem.sentence(),
        detailed_notes: faker.lorem.paragraph(),
        risk_assessment: faker.helpers.arrayElement(["Low", "Medium", "High"]),
      },
    });
  }

  // 9️⃣ Crisis Events
  for (let i = 0; i < 5; i++) {
    const client = faker.helpers.arrayElement(clients);
    await prisma.crisisEvent.create({
      data: {
        client_id: client.id,
        initiator_user_id: leader.id,
        event_type: faker.helpers.arrayElement(["Emergency Call", "Safety Plan Activation"]),
        description: faker.lorem.sentence(),
        risk_level_at_event: faker.helpers.arrayElement(["Low", "Medium", "High"]),
      },
    });
  }

  // 🔟 Notifications for Leader
  await prisma.notification.createMany({
    data: [
      {
        user_id: leader.id,
        title: "Pending Referral Review",
        message: "You have new pending referrals to review.",
        type: "pending_referral",
      },
      {
        user_id: leader.id,
        title: "Upcoming Appointment",
        message: "You have an appointment scheduled tomorrow.",
        type: "upcoming_appointment",
      },
      {
        user_id: leader.id,
        title: "High-Risk Client Alert",
        message: "One of your clients is flagged as high risk.",
        type: "high_risk",
      },
      {
        user_id: leader.id,
        title: "New Client Assigned",
        message: "A new client has been assigned to your team.",
        type: "assignment",
      },
      {
        user_id: leader.id,
        title: "System Update",
        message: "Dashboard enhancements have been deployed.",
        type: "system",
      },
    ],
  });

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