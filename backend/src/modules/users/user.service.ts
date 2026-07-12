import { prisma } from "../../common/config/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/AppError";

class UserService {
  async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return users;
  }

  async createUser(data: { name: string; email: string; role: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, "A user with this email already exists.");
    }

    const DEFAULT_PASSWORD = "transitops123";
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role as any,
        password: hashed,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async toggleStatus(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, "User not found");

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    return updated;
  }
}

export default new UserService();
