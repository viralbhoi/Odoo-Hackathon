import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("Admin@123", 10);

    const users = [
        {
            name: "System Admin",
            email: "admin@transitops.com",
            role: UserRole.ADMIN,
        },
        {
            name: "Fleet Manager",
            email: "fleet@transitops.com",
            role: UserRole.FLEET_MANAGER,
        },
        {
            name: "Safety Officer",
            email: "safety@transitops.com",
            role: UserRole.SAFETY_OFFICER,
        },
        {
            name: "Financial Analyst",
            email: "finance@transitops.com",
            role: UserRole.FINANCIAL_ANALYST,
        },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: {
                email: user.email,
            },
            update: {},
            create: {
                ...user,
                password,
                status: UserStatus.ACTIVE,
            },
        });
    }

    console.log("✅ Seed completed");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });