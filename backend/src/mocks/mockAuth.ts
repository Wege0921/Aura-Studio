// Mock authentication for testing without database
export const mockUsers = [
  {
    id: 'admin-1',
    email: 'admin@aura-yoga.com',
    name: 'AURA Admin',
    role: 'ADMIN',
    password: 'admin123' // In production, this would be hashed
  },
  {
    id: 'user-1',
    email: 'user@aura-yoga.com',
    name: 'Test User',
    role: 'USER',
    password: 'user123'
  },
  {
    id: 'instructor-1',
    email: 'instructor@aura-yoga.com',
    name: 'Sarah Johnson',
    role: 'USER',
    password: 'instructor123'
  }
];

export const findUserByEmail = (email: string) => {
  return mockUsers.find(user => user.email === email);
};

export const validatePassword = (user: any, password: string) => {
  return user.password === password;
};
