import { Request, Response } from 'express';
import User from '../models/User';

export const f_getAllUsers = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_page = parseInt(p_req.query.page as string) || 1;
    const v_limit = parseInt(p_req.query.limit as string) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_users = await User.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await User.countDocuments();

    p_res.json({
      users: v_users,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalUsers: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_getUserById = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_user = await User.findById(p_req.params.id);
    if (!v_user) {
      p_res.status(404).json({ message: 'User not found' });
      return;
    }
    p_res.json(v_user);
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_createUser = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_user = new User(p_req.body);
    const v_savedUser = await v_user.save();
    p_res.status(201).json(v_savedUser);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_updateUser = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_user = await User.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_user) {
      p_res.status(404).json({ message: 'User not found' });
      return;
    }
    p_res.json(v_user);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_deleteUser = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_user = await User.findByIdAndDelete(p_req.params.id);
    if (!v_user) {
      p_res.status(404).json({ message: 'User not found' });
      return;
    }
    p_res.json({ message: 'User deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};
