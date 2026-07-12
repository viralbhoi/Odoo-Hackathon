import { prisma } from "../../common/config/prisma";

class AuthRepository {
    findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    findUserById(id: string) {
        return prisma.user.findUnique({
            where: {
                id,
            },
        });
    }
}

export default new AuthRepository();
