const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already in use. Please choose another.', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = signToken(user._id);

  // Exclude password from output
  user.password = undefined;

  return { user, token };
};

const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password.', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password, user.password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  const token = signToken(user._id);
  user.password = undefined;

  return { user, token };
};

const updateUserProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'email', 'gender', 'birthDate', 'activityLevel'];
  const filteredData = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    userId,
    filteredData,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
};
