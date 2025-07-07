export const mapCycleFromDB = (cycle: any) => {
    return {
      ...cycle,
      name: cycle.title || cycle.name, // Aceita ambos os campos
    };
  };
  
  export const mapCycleToDB = (cycle: any) => {
    return {
      ...cycle,
      title: cycle.name || cycle.title, // Converte para o formato do banco
    };
  };