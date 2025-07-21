import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Team, Department, HierarchicalRelation } from '../types';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface UserContextType {
  users: User[];
  teams: Team[];
  departments: Department[];
  hierarchicalRelations: HierarchicalRelation[];
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
  addHierarchicalRelation: (relation: Omit<HierarchicalRelation, 'createdAt'>) => void;
  removeHierarchicalRelation: (leaderId: string, subordinateId: string) => void;
  getSubordinates: (leaderId: string) => User[];
  getLeader: (subordinateId: string) => User | undefined;
  calculateAge: (birthDate: string) => number;
  reloadUsers: () => Promise<void>;
  reloadTeams: () => Promise<void>;
  reloadDepartments: () => Promise<void>;
  reloadAll: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Função para calcular idade
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Dados iniciais atualizados
const initialDepartments: Department[] = [
  { id: 'dept1', name: 'Engenharia', description: 'Desenvolvimento de Software', responsibleId: 'user1', createdAt: '2024-01-01' },
  { id: 'dept2', name: 'Design', description: 'UX/UI e Design Gráfico', responsibleId: 'user2', createdAt: '2024-01-01' },
  { id: 'dept3', name: 'Gente & Gestão', description: 'Recursos Humanos', responsibleId: 'user_dir2', createdAt: '2024-01-01' },
  { id: 'dept4', name: 'Comercial', description: 'Vendas e Relacionamento', responsibleId: 'user_dir1', createdAt: '2024-01-01' },
];

const initialTeams: Team[] = [
  { id: 'team_dir', name: 'Diretoria', departmentId: 'dept3', responsibleId: 'user_dir1', memberIds: ['user_dir1', 'user_dir2'], createdAt: '2024-01-01' },
  { id: 'team1', name: 'Backend', departmentId: 'dept1', responsibleId: 'user1', memberIds: ['user1', 'user4'], description: 'Desenvolvimento backend', createdAt: '2024-01-01' },
  { id: 'team2', name: 'Frontend', departmentId: 'dept1', responsibleId: 'user1', memberIds: ['user1', 'user5'], description: 'Desenvolvimento frontend', createdAt: '2024-01-01' },
  { id: 'team3', name: 'UX Research', departmentId: 'dept2', responsibleId: 'user2', memberIds: ['user2', 'user6'], description: 'Pesquisa de usuário', createdAt: '2024-01-01' },
];

const initialUsers: User[] = [
  {
    id: 'user_dir1',
    name: 'Roberto Almeida',
    email: 'roberto.almeida@empresa.com',
    position: 'Diretor de Tecnologia',
    isLeader: true,
    isDirector: true,
    teamIds: ['team_dir'],
    departmentIds: ['dept1', 'dept2', 'dept3', 'dept4'],
    joinDate: '2018-01-10',
    active: true,
    phone: '(11) 98765-4321',
    birthDate: '1975-03-15',
    age: 49,
    profileImage: undefined
  },
  {
    id: 'user_dir2',
    name: 'Patricia Gomes',
    email: 'patricia.gomes@empresa.com',
    position: 'Diretora de Pessoas',
    isLeader: true,
    isDirector: true,
    teamIds: ['team_dir'],
    departmentIds: ['dept1', 'dept2', 'dept3', 'dept4'],
    joinDate: '2019-03-15',
    active: true,
    phone: '(11) 98765-4322',
    birthDate: '1978-07-22',
    age: 46,
    profileImage: undefined
  },
  {
    id: 'user1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    position: 'Tech Lead',
    isLeader: true,
    isDirector: false,
    teamIds: ['team1', 'team2'],
    departmentIds: ['dept1'],
    joinDate: '2020-03-15',
    active: true,
    phone: '(11) 98765-4323',
    birthDate: '1985-05-10',
    age: 39,
    reportsTo: 'user_dir1',
    profileImage: undefined
  },
  {
    id: 'user2',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    position: 'UX Lead',
    isLeader: true,
    isDirector: false,
    teamIds: ['team3'],
    departmentIds: ['dept2'],
    joinDate: '2021-06-10',
    active: true,
    phone: '(11) 98765-4324',
    birthDate: '1990-12-03',
    age: 33,
    reportsTo: 'user_dir1',
    profileImage: undefined
  },
  {
    id: 'user4',
    name: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    position: 'Software Developer',
    isLeader: false,
    isDirector: false,
    teamIds: ['team1'],
    departmentIds: ['dept1'],
    joinDate: '2022-01-20',
    active: true,
    phone: '(11) 98765-4325',
    birthDate: '1995-09-18',
    age: 29,
    reportsTo: 'user1',
    profileImage: undefined
  },
  {
    id: 'user5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@empresa.com',
    position: 'Frontend Developer',
    isLeader: false,
    isDirector: false,
    teamIds: ['team2'],
    departmentIds: ['dept1'],
    joinDate: '2021-04-12',
    active: true,
    phone: '(11) 98765-4326',
    birthDate: '1992-11-25',
    age: 31,
    reportsTo: 'user1',
    profileImage: undefined
  },
  {
    id: 'user6',
    name: 'Beatriz Lima',
    email: 'beatriz.lima@empresa.com',
    position: 'UX Designer',
    isLeader: false,
    isDirector: false,
    teamIds: ['team3'],
    departmentIds: ['dept2'],
    joinDate: '2022-08-15',
    active: true,
    phone: '(11) 98765-4327',
    birthDate: '1993-04-07',
    age: 31,
    reportsTo: 'user2',
    profileImage: undefined
  }
];

const initialHierarchicalRelations: HierarchicalRelation[] = [
  { leaderId: 'user_dir1', subordinateId: 'user1', createdAt: '2020-03-15' },
  { leaderId: 'user_dir1', subordinateId: 'user2', createdAt: '2021-06-10' },
  { leaderId: 'user1', subordinateId: 'user4', createdAt: '2022-01-20' },
  { leaderId: 'user1', subordinateId: 'user5', createdAt: '2021-04-12' },
  { leaderId: 'user2', subordinateId: 'user6', createdAt: '2022-08-15' },
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [hierarchicalRelations, setHierarchicalRelations] = useState<HierarchicalRelation[]>(initialHierarchicalRelations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    const savedTeams = localStorage.getItem('teams');
    const savedDepartments = localStorage.getItem('departments');
    const savedRelations = localStorage.getItem('hierarchicalRelations');
    
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedTeams) setTeams(JSON.parse(savedTeams));
    if (savedDepartments) setDepartments(JSON.parse(savedDepartments));
    if (savedRelations) setHierarchicalRelations(JSON.parse(savedRelations));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('hierarchicalRelations', JSON.stringify(hierarchicalRelations));
  }, [hierarchicalRelations]);

  // Setup real-time subscriptions
  useEffect(() => {
    // Subscribe to changes in users table
    const userSubscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        },
        (payload) => {
          console.log('User change detected:', payload);
          // Aguarda um pouco para garantir que a transação foi completada
          setTimeout(() => {
            reloadUsers();
          }, 1000);
        }
      )
      .subscribe();

    // Subscribe to changes in teams table
    const teamSubscription = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'teams' 
        },
        () => {
          reloadTeams();
        }
      )
      .subscribe();

    // Subscribe to changes in departments table
    const departmentSubscription = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'departments' 
        },
        () => {
          reloadDepartments();
        }
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      teamSubscription.unsubscribe();
      departmentSubscription.unsubscribe();
    };
  }, []);

  // Reload functions
  const reloadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Aguarda um pouco para garantir que o registro foi completado no backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Substituir por chamada real à API quando disponível
      // const data = await userService.getUsers();
      // setUsers(data || []);
      
      // Por enquanto, apenas recarrega do localStorage
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
      
      // Se for erro 406, tenta novamente após 1 segundo
      if (err instanceof Error && err.message.includes('406')) {
        setTimeout(async () => {
          try {
            const savedUsers = localStorage.getItem('users');
            if (savedUsers) {
              setUsers(JSON.parse(savedUsers));
            }
            setError(null);
          } catch (retryErr) {
            console.error('Erro na segunda tentativa:', retryErr);
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadTeams = async () => {
    try {
      setLoading(true);
      // TODO: Substituir por chamada real à API
      const savedTeams = localStorage.getItem('teams');
      if (savedTeams) {
        setTeams(JSON.parse(savedTeams));
      }
    } catch (err) {
      console.error('Erro ao carregar times:', err);
      setError('Erro ao carregar times');
    } finally {
      setLoading(false);
    }
  };

  const reloadDepartments = async () => {
    try {
      setLoading(true);
      // TODO: Substituir por chamada real à API
      const savedDepartments = localStorage.getItem('departments');
      if (savedDepartments) {
        setDepartments(JSON.parse(savedDepartments));
      }
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
      setError('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      reloadUsers(),
      reloadTeams(),
      reloadDepartments()
    ]);
    
    setLoading(false);
  };

  // User operations
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user${Date.now()}`,
      age: userData.birthDate ? calculateAge(userData.birthDate) : undefined,
    };
    
    // If director, ensure Diretoria team exists
    if (userData.isDirector) {
      let dirTeam = teams.find(t => t.name === 'Diretoria');
      if (!dirTeam) {
        // Create Diretoria team
        const newDirTeam: Team = {
          id: `team_dir_${Date.now()}`,
          name: 'Diretoria',
          departmentId: departments.find(d => d.name === 'Gente & Gestão')?.id || departments[0].id,
          responsibleId: newUser.id,
          memberIds: [newUser.id],
          createdAt: new Date().toISOString(),
        };
        setTeams([...teams, newDirTeam]);
        newUser.teamIds = [newDirTeam.id];
      } else {
        // Add to existing Diretoria team
        updateTeam(dirTeam.id, {
          memberIds: [...dirTeam.memberIds, newUser.id]
        });
        newUser.teamIds = [dirTeam.id];
      }
      // Directors have access to all departments
      newUser.departmentIds = departments.map(d => d.id);
    } else {
      // Regular user - add to selected teams
      userData.teamIds.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && !team.memberIds.includes(newUser.id)) {
          updateTeam(teamId, {
            memberIds: [...team.memberIds, newUser.id]
          });
        }
      });
    }

    // Create hierarchical relation if reportsTo is defined
    if (userData.reportsTo) {
      addHierarchicalRelation({
        leaderId: userData.reportsTo,
        subordinateId: newUser.id
      });
    }
    
    setUsers([...users, newUser]);
    toast.success('Usuário cadastrado com sucesso!');
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const currentUser = users.find(u => u.id === id);
    if (!currentUser) return;

    const updatedData = { ...userData };
    if (userData.birthDate) {
      updatedData.age = calculateAge(userData.birthDate);
    }

    // Update hierarchical relations if reportsTo changed
    if (userData.reportsTo !== undefined && userData.reportsTo !== currentUser.reportsTo) {
      // Remove old relation
      if (currentUser.reportsTo) {
        removeHierarchicalRelation(currentUser.reportsTo, id);
      }
      // Add new relation
      if (userData.reportsTo) {
        addHierarchicalRelation({
          leaderId: userData.reportsTo,
          subordinateId: id
        });
      }
    }

    // Update team memberships
    if (userData.teamIds) {
      // Remove from old teams
      currentUser.teamIds.forEach(teamId => {
        if (!userData.teamIds!.includes(teamId)) {
          const team = teams.find(t => t.id === teamId);
          if (team) {
            updateTeam(teamId, {
              memberIds: team.memberIds.filter(memberId => memberId !== id)
            });
          }
        }
      });

      // Add to new teams
      userData.teamIds.forEach(teamId => {
        if (!currentUser.teamIds.includes(teamId)) {
          const team = teams.find(t => t.id === teamId);
          if (team && !team.memberIds.includes(id)) {
            updateTeam(teamId, {
              memberIds: [...team.memberIds, id]
            });
          }
        }
      });
    }

    setUsers(users.map(user => user.id === id ? { ...user, ...updatedData } : user));
    toast.success('Usuário atualizado com sucesso!');
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    // Check if user is responsible for any team or department
    const responsibleForTeams = teams.filter(t => t.responsibleId === id);
    const responsibleForDepts = departments.filter(d => d.responsibleId === id);

    if (responsibleForTeams.length > 0 || responsibleForDepts.length > 0) {
      toast.error('Este usuário é responsável por times ou departamentos. Transfira a responsabilidade antes de excluir.');
      return;
    }

    // Check if user has subordinates
    const subordinates = hierarchicalRelations.filter(rel => rel.leaderId === id);
    if (subordinates.length > 0) {
      toast.error('Este usuário possui subordinados. Reatribua os subordinados primeiro.');
      return;
    }

    // Remove user from teams
    teams.forEach(team => {
      if (team.memberIds.includes(id)) {
        updateTeam(team.id, {
          memberIds: team.memberIds.filter(memberId => memberId !== id)
        });
      }
    });

    // Remove hierarchical relations
    setHierarchicalRelations(hierarchicalRelations.filter(
      rel => rel.leaderId !== id && rel.subordinateId !== id
    ));

    setUsers(users.filter(user => user.id !== id));
    toast.success('Usuário removido com sucesso!');
  };

  // Team operations
  const addTeam = (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team${Date.now()}`,
    };

    // Update team members' teamIds and departmentIds
    teamData.memberIds.forEach(userId => {
      const user = users.find(u => u.id === userId);
      if (user) {
        const newTeamIds = user.teamIds.includes(newTeam.id) 
          ? user.teamIds 
          : [...user.teamIds, newTeam.id];
        
        const newDeptIds = user.departmentIds.includes(teamData.departmentId)
          ? user.departmentIds
          : [...user.departmentIds, teamData.departmentId];

        updateUser(userId, {
          teamIds: newTeamIds,
          departmentIds: newDeptIds
        });
      }
    });
    
    setTeams([...teams, newTeam]);
    toast.success('Time criado com sucesso!');
  };

  const updateTeam = (id: string, teamData: Partial<Team>) => {
    setTeams(teams.map(team => team.id === id ? { ...team, ...teamData } : team));
  };

  const deleteTeam = (id: string) => {
    const team = teams.find(t => t.id === id);
    if (!team) return;

    // Don't allow deleting Diretoria team if directors exist
    if (team.name === 'Diretoria' && users.some(u => u.isDirector)) {
      toast.error('Não é possível excluir o time Diretoria enquanto houver diretores.');
      return;
    }

    // Remove team from users
    users.forEach(user => {
      if (user.teamIds.includes(id)) {
        updateUser(user.id, {
          teamIds: user.teamIds.filter(teamId => teamId !== id)
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
    
    // Add all directors to new department
    users.filter(u => u.isDirector).forEach(director => {
      updateUser(director.id, {
        departmentIds: [...director.departmentIds, newDepartment.id]
      });
    });
    
    toast.success('Departamento criado com sucesso!');
  };

  const updateDepartment = (id: string, departmentData: Partial<Department>) => {
    setDepartments(departments.map(dept => dept.id === id ? { ...dept, ...departmentData } : dept));
    toast.success('Departamento atualizado com sucesso!');
  };

  const deleteDepartment = (id: string) => {
    // Check if there are teams in the department
    const teamsInDept = teams.filter(team => team.departmentId === id);
    if (teamsInDept.length > 0) {
      toast.error('Não é possível excluir um departamento com times ativos.');
      return;
    }

    setDepartments(departments.filter(dept => dept.id !== id));
    
    // Remove department from users (except directors who belong to all)
    users.forEach(user => {
      if (!user.isDirector && user.departmentIds.includes(id)) {
        updateUser(user.id, {
          departmentIds: user.departmentIds.filter(deptId => deptId !== id)
        });
      }
    });
    
    toast.success('Departamento removido com sucesso!');
  };

  // Hierarchical relation operations
  const addHierarchicalRelation = (relation: Omit<HierarchicalRelation, 'createdAt'>) => {
    const newRelation: HierarchicalRelation = {
      ...relation,
      createdAt: new Date().toISOString(),
    };
    
    // Check if relation already exists
    const exists = hierarchicalRelations.some(
      rel => rel.leaderId === relation.leaderId && rel.subordinateId === relation.subordinateId
    );
    
    if (exists) {
      return; // Silently ignore duplicate
    }
    
    setHierarchicalRelations([...hierarchicalRelations, newRelation]);
  };

  const removeHierarchicalRelation = (leaderId: string, subordinateId: string) => {
    setHierarchicalRelations(hierarchicalRelations.filter(
      rel => !(rel.leaderId === leaderId && rel.subordinateId === subordinateId)
    ));
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

  const getSubordinates = (leaderId: string) => {
    const subordinateIds = hierarchicalRelations
      .filter(rel => rel.leaderId === leaderId)
      .map(rel => rel.subordinateId);
    return users.filter(user => subordinateIds.includes(user.id));
  };

  const getLeader = (subordinateId: string) => {
    const user = users.find(u => u.id === subordinateId);
    if (user && user.reportsTo) {
      return users.find(u => u.id === user.reportsTo);
    }
    return undefined;
  };

  const value = {
    users,
    teams,
    departments,
    hierarchicalRelations,
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
    addHierarchicalRelation,
    removeHierarchicalRelation,
    getSubordinates,
    getLeader,
    calculateAge,
    reloadUsers,
    reloadTeams,
    reloadDepartments,
    reloadAll,
    loading,
    error
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