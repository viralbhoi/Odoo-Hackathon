import { Request, Response, NextFunction } from "express";
import userService from "./user.service";

class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.listUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, role } = req.body;
      const user = await userService.createUser({ name, email, role });
      res.status(201).json({
        success: true,
        data: user,
        message: `User created. Default password: transitops123`,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.toggleStatus(id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
