import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Team, Department } from '../types';
import { toast } from 'react-hot-toast';

interface UserContextType {
  users: User[];
  teams: Team[];
  departments: Department[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, team: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addDepartment: (department: Omit<Department, 'id' | 'createdAt'>) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  getUsersByTeam: (teamId: string) => User[];
  getUsersByDepartment: (departmentId: string) => User[];
  getTeamsByDepartment: (departmentId: string) => Team[];
  getTeamByUser: (userId: string) => Team[];
  getDepartmentById: (id: string) => Department | undefined;
  getTeamById: (id: string) => Team | undefined;
  getUserById: (id: string) => User | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Dados iniciais
const initialDepartments: Department[] = [
  { id: 'dept1', name: 'Engenharia', description: 'Desenvolvimento de Software', createdAt: '2024-01-01' },
  { id: 'dept2', name: 'Design', description: 'UX/UI e Design Gráfico', createdAt: '2024-01-01' },
  { id: 'dept3', name: 'Gente & Gestão', description: 'Recursos Humanos', createdAt: '2024-01-01' },
  { id: 'dept4', name: 'Comercial', description: 'Vendas e Relacionamento', createdAt: '2024-01-01' },
];

const initialTeams: Team[] = [
  { id: 'team1', name: 'Backend', departmentId: 'dept1', leaderId: 'user1', memberIds: ['user1', 'user4'], createdAt: '2024-01-01' },
  { id: 'team2', name: 'Frontend', departmentId: 'dept1', leaderId: 'user1', memberIds: ['user1', 'user5'], createdAt: '2024-01-01' },
  { id: 'team3', name: 'UX Research', departmentId: 'dept2', leaderId: 'user2', memberIds: ['user2', 'user6'], createdAt: '2024-01-01' },
];

const initialUsers: User[] = [
  {
    id: 'user1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    position: 'Tech Lead',
    isLeader: true,
    teamIds: ['team1', 'team2'],
    leaderOfTeamIds: ['team1', 'team2'],
    departmentIds: ['dept1'],
    joinDate: '2020-03-15',
    active: true
  },
  {
    id: 'user2',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    position: 'Head of Design',
    isLeader: true,
    teamIds: ['team3'],
    leaderOfTeamIds: ['team3'],
    departmentIds: ['dept2'],
    joinDate: '2021-06-10',
    active: true
  },
  {
    id: 'user4',
    name: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    position: 'Software Developer',
    isLeader: false,
    teamIds: ['team1'],
    leaderOfTeamIds: [],
    departmentIds: ['dept1'],
    joinDate: '2022-01-20',
    active: true
  },
  {
    id: 'user5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@empresa.com',
    position: 'Frontend Developer',
    isLeader: false,
    teamIds: ['team2'],
    leaderOfTeamIds: [],
    departmentIds: ['dept1'],
    joinDate: '2021-04-12',
    active: true
  },
  {
    id: 'user6',
    name: 'Beatriz Lima',
    email: 'beatriz.lima@empresa.com',
    position: 'UX Designer',
    isLeader: false,
    teamIds: ['team3'],
    leaderOfTeamIds: [],
    departmentIds: ['dept2'],
    joinDate: '2022-08-15',
    active: true
  }
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  // User operations
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user${Date.now()}`,
    };
    setUsers([...users, newUser]);
    
    // Atualizar times com o novo usuário
    userData.teamIds.forEach(teamId => {
      updateTeam(teamId, {
        memberIds: [...(teams.find(t => t.id === teamId)?.memberIds || []), newUser.id]
      });
    });
    
    toast.success('Usuário cadastrado com sucesso!');
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(users.map(user => user.id === id ? { ...user, ...userData } : user));
    toast.success('Usuário atualizado com sucesso!');
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    // Verificar se é líder de algum time
    if (user.leaderOfTeamIds.length > 0) {
      toast.error('Não é possível excluir um líder. Transfira a liderança primeiro.');
      return;
    }

    // Remover usuário dos times
    teams.forEach(team => {
      if (team.memberIds.includes(id)) {
        updateTeam(team.id, {
          memberIds: team.memberIds.filter(memberId => memberId !== id)
        });
      }
    });

    setUsers(users.filter(user => user.id !== id));
    toast.success('Usuário removido com sucesso!');
  };

  // Team operations
  const addTeam = (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team${Date.now()}`,
    };
    setTeams([...teams, newTeam]);
    
    // Atualizar usuários com o novo time
    teamData.memberIds.forEach(userId => {
      const user = users.find(u => u.id === userId);
      if (user) {
        updateUser(userId, {
          teamIds: [...user.teamIds, newTeam.id]
        });
      }
    });
    
    // Atualizar líder
    const leader = users.find(u => u.id === teamData.leaderId);
    if (leader) {
      updateUser(teamData.leaderId, {
        leaderOfTeamIds: [...leader.leaderOfTeamIds, newTeam.id],
        isLeader: true
      });
    }
    
    toast.success('Time criado com sucesso!');
  };

  const updateTeam = (id: string, teamData: Partial<Team>) => {
    setTeams(teams.map(team => team.id === id ? { ...team, ...teamData } : team));
  };

  const deleteTeam = (id: string) => {
    // Remover time dos usuários
    users.forEach(user => {
      if (user.teamIds.includes(id)) {
        updateUser(user.id, {
          teamIds: user.teamIds.filter(teamId => teamId !== id),
          leaderOfTeamIds: user.leaderOfTeamIds.filter(teamId => teamId !== id)
        });
      }
    });

    setTeams(teams.filter(team => team.id !== id));
    toast.success('Time removido com sucesso!');
  };

  // Department operations
  const addDepartment = (departmentData: Omit<Department, 'id' | 'createdAt'>) => {
    const newDepartment: Department = {
      ...departmentData,
      id: `dept${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDepartments([...departments, newDepartment]);
    toast.success('Departamento criado com sucesso!');
  };

  const updateDepartment = (id: string, departmentData: Partial<Department>) => {
    setDepartments(departments.map(dept => dept.id === id ? { ...dept, ...departmentData } : dept));
    toast.success('Departamento atualizado com sucesso!');
  };

  const deleteDepartment = (id: string) => {
    // Verificar se há times no departamento
    const teamsInDept = teams.filter(team => team.departmentId === id);
    if (teamsInDept.length > 0) {
      toast.error('Não é possível excluir um departamento com times ativos.');
      return;
    }

    setDepartments(departments.filter(dept => dept.id !== id));
    toast.success('Departamento removido com sucesso!');
  };

  // Helper functions
  const getUsersByTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return users.filter(user => team.memberIds.includes(user.id));
  };

  const getUsersByDepartment = (departmentId: string) => {
    return users.filter(user => user.departmentIds.includes(departmentId));
  };

  const getTeamsByDepartment = (departmentId: string) => {
    return teams.filter(team => team.departmentId === departmentId);
  };

  const getTeamByUser = (userId: string) => {
    return teams.filter(team => team.memberIds.includes(userId));
  };

  const getDepartmentById = (id: string) => departments.find(d => d.id === id);
  const getTeamById = (id: string) => teams.find(t => t.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const value = {
    users,
    teams,
    departments,
    addUser,
    updateUser,
    deleteUser,
    addTeam,
    updateTeam,
    deleteTeam,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getUsersByTeam,
    getUsersByDepartment,
    getTeamsByDepartment,
    getTeamByUser,
    getDepartmentById,
    getTeamById,
    getUserById,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};