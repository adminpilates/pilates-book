import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create session types
  const sessionTypes = await Promise.all([
    prisma.sessionType.upsert({
      where: { name: "Beginner Pilates" },
      update: {},
      create: {
        name: "Beginner Pilates",
        description: "Perfect for those new to Pilates. Focus on basic movements and breathing techniques.",
        capacity: 8,
        duration: 60,
        color: "bg-green-100 text-green-800",
      },
    }),
    prisma.sessionType.upsert({
      where: { name: "Intermediate Pilates" },
      update: {},
      create: {
        name: "Intermediate Pilates",
        description: "Build strength and flexibility with more challenging exercises.",
        capacity: 6,
        duration: 75,
        color: "bg-blue-100 text-blue-800",
      },
    }),
    prisma.sessionType.upsert({
      where: { name: "Advanced Pilates" },
      update: {},
      create: {
        name: "Advanced Pilates",
        description: "Intensive workout for experienced practitioners. Advanced techniques and equipment.",
        capacity: 4,
        duration: 90,
        color: "bg-purple-100 text-purple-800",
      },
    }),
  ])

  console.log("✅ Session types created")

  // Create sessions for the next week
  const today = new Date()
  const sessions = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    // Beginner sessions
    sessions.push(
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[0].id,
            date,
            time: "09:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[0].id,
          date,
          time: "09:00",
        },
      }),
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[0].id,
            date,
            time: "18:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[0].id,
          date,
          time: "18:00",
        },
      }),
    )

    // Intermediate sessions
    sessions.push(
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[1].id,
            date,
            time: "10:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[1].id,
          date,
          time: "10:00",
        },
      }),
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[1].id,
            date,
            time: "19:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[1].id,
          date,
          time: "19:00",
        },
      }),
    )

    // Advanced sessions
    sessions.push(
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[2].id,
            date,
            time: "11:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[2].id,
          date,
          time: "11:00",
        },
      }),
      prisma.session.upsert({
        where: {
          sessionTypeId_date_time: {
            sessionTypeId: sessionTypes[2].id,
            date,
            time: "17:00",
          },
        },
        update: {},
        create: {
          sessionTypeId: sessionTypes[2].id,
          date,
          time: "17:00",
        },
      }),
    )
  }

  await Promise.all(sessions)
  console.log("✅ Sessions created")

  console.log("🎉 Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
