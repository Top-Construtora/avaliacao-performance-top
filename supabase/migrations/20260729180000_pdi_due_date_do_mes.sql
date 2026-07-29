-- Preenche o prazo real das ações do PDI a partir da calendarização.
--
-- A tela pede só mês/ano ("2026-03"), que é a granularidade real de um PDI. Mas
-- o lembrete de prazo pergunta ao banco "o que vence nos próximos 7 dias?", e
-- texto não responde isso: o Postgres não sabe que março acaba no dia 31.
--
-- Daqui em diante o backend deriva o dia a cada salvamento (pdiActionsService).
-- Esta migração faz o mesmo para as ações que já existiam, senão elas só
-- ganhariam prazo quando alguém reabrisse e salvasse o plano.
--
-- Último dia do mês = a leitura correta de "em algum momento de março": a ação
-- tem até o fim do mês para acontecer.

-- O mês é validado no próprio padrão (01 a 12) porque to_date é tolerante:
-- '2026-13' seria aceito e viraria janeiro de 2027 sem avisar.
update public.pdi_actions
set due_date = (
      date_trunc('month', to_date(calendarizacao || '-01', 'YYYY-MM-DD'))
      + interval '1 month - 1 day'
    )::date
where due_date is null
  and calendarizacao ~ '^[0-9]{4}-(0[1-9]|1[0-2])$';

-- Calendarização já gravada como data completa (formato legado do JSONB)
update public.pdi_actions
set due_date = calendarizacao::date
where due_date is null
  and calendarizacao ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
