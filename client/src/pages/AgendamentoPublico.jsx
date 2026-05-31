import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, Typography, CircularProgress, Alert, Grid, Autocomplete, TextField, Paper, Button, Box } from '@mui/material';
import { StaticDatePicker, DesktopDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../supabaseClient'; // Importando o supabase diretamente
import ClientRegistrationForm from '../components/ClientRegistrationForm'; // Importando o novo componente

function AgendamentoPublico() {
  const { slugDaEmpresa } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para guardar a seleção do cliente
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [step, setStep] = useState('welcome'); // welcome, register, scheduling
  const [registeredClient, setRegisteredClient] = useState(null); // Guarda o cliente identificado/cadastrado


  const handleSaveClient = async () => {
    if (!client.fullName || !client.email || !client.phone || !client.birthDate) {
      enqueueSnackbar('Por favor, preencha todos os campos obrigatórios.', { variant: 'warning' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            company_id: company.id,
            nome: client.fullName,
            email: client.email,
            telefone: client.phone,
            data_nascimento: client.birthDate,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Atualiza o estado com o cliente recém-criado
      setRegisteredClient(data);

      enqueueSnackbar('Cadastro realizado com sucesso! Agora escolha seu horário.', { variant: 'success' });
      
      // Armazena os dados localmente para uma experiência melhor
      const clientInfo = { nome: data.nome, telefone: data.telefone };
      localStorage.setItem(`soften-client-info-${company.id}`, JSON.stringify(clientInfo));
      
      setStep('scheduling'); // Avança para a próxima etapa

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      enqueueSnackbar(`Erro ao salvar cadastro: ${error.message}`, { variant: 'error' });
    }
  };


  const [client, setClient] = useState({
    fullName: '',
    email: '',
    birthDate: null,
    phone: '',
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!slugDaEmpresa) {
        setError("Nenhuma empresa especificada.");
        setLoading(false);
        return;
      }

      try {
        // 1. Buscar a empresa pelo slug
        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', slugDaEmpresa)
          .single();

        if (companyError || !companyData) {
          throw new Error("Empresa não encontrada ou slug inválido.");
        }
        setCompany(companyData);

        // VERIFICA SE O CLIENTE JÁ É CONHECIDO
        const savedClientInfo = localStorage.getItem(`soften-client-info-${companyData.id}`);
        if (savedClientInfo) {
          const client = JSON.parse(savedClientInfo);
          setClientName(client.nome);
          setClientPhone(client.telefone);
          setStep('scheduling'); // Pula direto para o agendamento
          enqueueSnackbar(`Olá de volta, ${client.nome}!`, { variant: 'info' });
        }

        // 2. Buscar os serviços da empresa
        const { data: servicesData, error: servicesError } = await supabase
          .from('servicos')
          .select('*')
          .eq('company_id', companyData.id);

        if (servicesError) throw new Error("Erro ao buscar serviços.");
        setServices(servicesData);

        // 3. Buscar os profissionais (colaboradores) da empresa
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('colaboradores')
          .select('id, nome, horario_trabalho') // <-- Pedi o horário de trabalho aqui
          .eq('company_id', companyData.id);

        if (professionalsError) throw new Error("Erro ao buscar profissionais.");
        setProfessionals(professionalsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [slugDaEmpresa]);

  // useEffect para calcular os horários disponíveis
  useEffect(() => {
    const calculateAvailableTimes = async () => {
      if (!selectedService || !selectedProfessional || !selectedDate || !company) {
        setAvailableTimes([]);
        return;
      }

      setLoadingTimes(true);
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        const agendaIntervalo = selectedService.configuracoes_agenda?.intervalo || selectedService.duracao;

        // 1. Buscar agendamentos e bloqueios existentes
        const { data: existingAppointments, error: appointmentsError } = await supabase
          .from('agendamentos')
          .select('hora, servico_id(duracao)')
          .eq('colaborador_id', selectedProfessional.id)
          .eq('data', dateString);
        if (appointmentsError) throw new Error('Erro ao buscar agendamentos.');

        const { data: existingBlocks, error: blocksError } = await supabase
          .from('bloqueios')
          .select('data_inicio, data_fim')
          .eq('colaborador_id', selectedProfessional.id)
          .lte('data_inicio', `${dateString}T23:59:59Z`)
          .gte('data_fim', `${dateString}T00:00:00Z`);
        if (blocksError) throw new Error('Erro ao buscar bloqueios.');

        // 2. Mapear todos os minutos ocupados
        const occupiedMinutes = new Set();
        existingAppointments.forEach(app => {
          if (app.servico_id) {
            const startTime = app.hora.split(':');
            const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
            const duration = app.servico_id.duracao;
            for (let i = 0; i < duration; i++) {
              occupiedMinutes.add(startMinutes + i);
            }
          }
        });

        const selectedDateMidnight = new Date(dateString + 'T00:00:00');
        existingBlocks.forEach(block => {
            const blockStart = new Date(block.data_inicio);
            const blockEnd = new Date(block.data_fim);
            const startMinutes = blockStart < selectedDateMidnight ? 0 : blockStart.getHours() * 60 + blockStart.getMinutes();
            const endMinutes = blockEnd > new Date(dateString + 'T23:59:59') ? 1440 : blockEnd.getHours() * 60 + blockEnd.getMinutes();
            for (let i = startMinutes; i < endMinutes; i++) {
                occupiedMinutes.add(i);
            }
        });

        // 3. Definir horário de trabalho (com prioridade para exceções)
        let workHours = '';
        const { data: exceptions, error: exceptionError } = await supabase
          .from('horarios_excecao')
          .select('horario_inicio, horario_fim')
          .eq('colaborador_id', selectedProfessional.id)
          .eq('data', dateString);

        if (exceptionError) {
          console.error('Erro ao buscar horários de exceção, usando horário padrão:', exceptionError);
        }

        if (exceptions && exceptions.length > 0) {
          // Usa o horário de exceção se existir
          const exception = exceptions[0];
          workHours = `${exception.horario_inicio.substring(0, 5)}-${exception.horario_fim.substring(0, 5)}`;
        } else {
          // Caso contrário, usa o horário de trabalho padrão
          const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
          const diaDaSemana = dias[selectedDate.getDay()];
          const professionalWorkHours = selectedProfessional.horario_trabalho; // Corrigido para singular

          if (professionalWorkHours && professionalWorkHours[diaDaSemana]?.trabalha) {
            workHours = `${professionalWorkHours[diaDaSemana].inicio}-${professionalWorkHours[diaDaSemana].fim}`;
          }
        }
        
        if (!workHours) { // Se não houver horário de trabalho definido para o dia
          setAvailableTimes([]);
          setLoadingTimes(false);
          return;
        }

        const serviceDuration = selectedService.duracao;
        if (!serviceDuration) throw new Error('A duração do serviço não está definida.');

        const allTimes = [];
        const workIntervals = workHours.split(',');

        workIntervals.forEach(interval => {
          const [start, end] = interval.split('-');
          const openingTime = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
          const closingTime = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

          // 4. Gerar "slots" de tempo possíveis
          for (let time = openingTime; time <= closingTime - serviceDuration; ) {
            let isSlotAvailable = true;
            // Verifica se a duração completa do serviço cabe a partir de 'time'
            for (let i = 0; i < serviceDuration; i++) {
              if (occupiedMinutes.has(time + i)) {
                isSlotAvailable = false;
                break;
              }
            }

            if (isSlotAvailable) {
              const hours = Math.floor(time / 60).toString().padStart(2, '0');
              const minutes = (time % 60).toString().padStart(2, '0');
              allTimes.push(`${hours}:${minutes}`);
              
              // Pula para o próximo horário de início que não sobrepõe, alinhado ao grid.
              const slotsToSkip = Math.ceil(serviceDuration / agendaIntervalo);
              time += slotsToSkip * agendaIntervalo;
            } else {
              // Se não couber, apenas avança para o próximo ponto do grid.
              time += agendaIntervalo;
            }
          }
        });
        
        const uniqueTimes = [...new Set(allTimes)].sort();
        setAvailableTimes(uniqueTimes);

      } catch (err) {
        console.error(err);
        enqueueSnackbar('Não foi possível carregar os horários disponíveis.', { variant: 'error' });
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    };

    calculateAvailableTimes();
  }, [selectedService, selectedProfessional, selectedDate, company, supabase, enqueueSnackbar]);

  const handleAgendamentoSubmit = async () => {
    // Validação final
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      enqueueSnackbar('Por favor, preencha todos os campos antes de confirmar.', { variant: 'warning' });
      return;
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const agendamento = {
        data: dateString,
        hora: `${selectedTime}:00`, // Garante o formato HH:MM:SS
        cliente_nome: clientName,
        cliente_telefone: clientPhone,
        servico_id: selectedService.id,
        colaborador_id: selectedProfessional.id,
        company_id: company.id,
        status: 'pendente', // ou o status inicial que você preferir
        cliente_id: registeredClient?.id, // Vincula ao cliente cadastrado, se houver
      };

      const { error } = await supabase.from('agendamentos').insert(agendamento);

      if (error) {
        throw error;
      }

      enqueueSnackbar('Agendamento realizado com sucesso!', { variant: 'success' });

      // Limpar o formulário
      setSelectedService(null);
      setSelectedProfessional(null);
      setSelectedTime(null);
      setClientName('');
      setClientPhone('');
      setAvailableTimes([]);

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      enqueueSnackbar(`Erro ao realizar o agendamento: ${error.message}`, { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Renderiza o conteúdo principal apenas se a empresa foi carregada
  if (!company) {
    // Pode retornar null ou um loader mais simples se preferir
    return null; 
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: { xs: 'stretch', sm: 'center' }, // Estica no mobile, centraliza no desktop
        justifyContent: 'flex-start',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        p: { xs: 0, sm: 3 }, // Padding geral removido em telas pequenas
      }}>
        {step === 'welcome' && (
          <Box sx={{
            width: '100%',
            maxWidth: '600px', // Limita a largura em telas maiores
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: { sm: 4 }, // Margem no topo apenas em desktop
            boxShadow: { sm: '0 8px 24px rgba(0,0,0,0.12)' }, // Sombra apenas em desktop
            borderRadius: { sm: '16px' }, // Bordas arredondadas apenas em desktop
            overflow: { sm: 'hidden' } // Garante que o conteúdo interno respeite as bordas
          }}>
            
            {/* Header com Capa (sem texto) */}
            <Box sx={{
              width: '100%',
              height: { xs: 150, sm: 200 }, // Altura menor no mobile
              backgroundImage: company.cover_url ? `url(${company.cover_url})` : 'none',
              backgroundColor: company.cover_url ? 'transparent' : '#005A9C',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}/>

            {/* Card Branco com Logo, Texto e Botões */}
            <Paper elevation={0} sx={{ // elevation={0} para remover sombra padrão
              width: '100%',
              p: { xs: '60px 24px 32px', sm: 4 }, // Padding ajustado para mobile (top, horizontal, bottom)
              pb: { xs: 4, sm: 4 },
              pt: '80px', // Espaço para o logo
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mt: { sm: '-50px' }
            }}>
              {/* Logo */}
              {company.logo_url && (
                <Box
                  component="img"
                  src={company.logo_url}
                  alt={`Logo de ${company.nome_fantasia || company.name}`}
                  sx={{
                    width: { xs: 100, sm: 120 }, // Tamanho da logo responsivo
                    height: { xs: 100, sm: 120 }, // Tamanho da logo responsivo
                    borderRadius: '50%',
                    border: '5px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: { xs: -50, sm: -60 }, // Posição da logo responsiva
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                  }}
                />
              )}

              {/* Textos movidos para cá */}
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mt: 2, color: '#1D5277', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                Bem-vindo(a)!
              </Typography>
              <Typography variant="h6" component="h2" sx={{ color: 'text.secondary', mb: 3, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {company.nome_fantasia || company.name}
              </Typography>

              {/* Botões com mais espaço */}
              <Box sx={{ pt: 12, display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', maxWidth: '350px', mt: 2 }}>
                <Button variant="contained" size="large" onClick={() => setStep('register')} fullWidth>Quero me cadastrar</Button>
                <Button variant="outlined" size="large" onClick={() => setStep('scheduling')} fullWidth>Continuar como visitante</Button>
              </Box>
            </Paper>
          </Box>
        )}

        {step === 'register' && (
            <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h5" gutterBottom align="center">Seu Cadastro</Typography>
              <Typography variant="body2" color="text.secondary" align="center" mb={3}>Preencha seus dados para continuar.</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nome Completo"
                    name="fullName"
                    value={client.fullName}
                    onChange={(e) => setClient({...client, fullName: e.target.value})}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({...client, email: e.target.value})}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone"
                    name="phone"
                    value={client.phone}
                    onChange={(e) => setClient({...client, phone: e.target.value})}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DesktopDatePicker
                    label="Data de Nascimento"
                    inputFormat="dd/MM/yyyy"
                    value={client.birthDate}
                    onChange={(newValue) => {
                      setClient({...client, birthDate: newValue});
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button variant="outlined" onClick={() => setStep('scheduling')}>Pular</Button>
                <Button variant="contained" onClick={handleSaveClient}>Salvar e Continuar</Button>
              </Box>
            </Container>
          )}

        {step === 'scheduling' && (
          <Container maxWidth="sm" sx={{ mt: { xs: 0, sm: 4 }, p: { xs: 0, sm: 3 }, backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Paper sx={{ 
              p: { xs: 2, sm: 4 },
              borderRadius: { xs: 0, sm: 4 },
              boxShadow: { sm: '0 8px 24px rgba(0,0,0,0.12)' },
              overflow: 'hidden', // Garante que a capa respeite as bordas
              position: 'relative',
              mt: { sm: 8 } // Margem para o logo que vai vazar para cima
            }}>
              {/* Header com Capa e Logo */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: { xs: 120, sm: 180 },
                backgroundImage: company.cover_url ? `url(${company.cover_url})` : 'none',
                backgroundColor: company.cover_url ? 'transparent' : '#005A9C',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderTopLeftRadius: { sm: '16px' },
                borderTopRightRadius: { sm: '16px' },
              }} />

              {company.logo_url && (
                <Box
                  component="img"
                  src={company.logo_url}
                  alt={`Logo de ${company.nome_fantasia || company.name}`}
                  sx={{
                    position: 'relative',
                    width: { xs: 80, sm: 120 },
                    height: { xs: 80, sm: 120 },
                    borderRadius: '50%',
                    border: '4px solid white',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    objectFit: 'cover',
                    display: 'block',
                    mx: 'auto',
                    mb: 2,
                    mt: { xs: '60px', sm: '120px' } // Puxa o logo para cima da capa
                  }}
                />
              )}

              {/* Títulos */}
              <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 600, color: '#1D5277', mt: 2 }}>
                Agendamento Online
              </Typography>
              <Typography variant="h6" component="h2" align="center" sx={{ color: 'text.secondary', mb: 4 }}>
                {company.nome_fantasia || company.name}
              </Typography>

              {/* Formulário de Agendamento */}
              <Grid container spacing={3}>
                {/* Seção de Seleção */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={services}
                    getOptionLabel={(option) => option.nome || ""}
                    value={selectedService}
                    onChange={(event, newValue) => {
                      setSelectedService(newValue);
                      setSelectedProfessional(null); // Limpa o profissional ao trocar de serviço
                    }}
                    renderInput={(params) => <TextField {...params} label="Escolha o Serviço" variant="outlined" />}
                    noOptionsText="Nenhum serviço disponível"
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={professionals}
                    getOptionLabel={(option) => option.nome || ""}
                    value={selectedProfessional}
                    onChange={(event, newValue) => {
                      setSelectedProfessional(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} label="Escolha o Profissional" variant="outlined" />}
                    disabled={!selectedService}
                    noOptionsText="Nenhum profissional disponível para este serviço"
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>

                {/* Seção de Data e Hora */}
                {selectedService && selectedProfessional && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Escolha a Data e Hora</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                          <StaticDatePicker
                            displayStaticWrapperAs="desktop"
                            openTo="day"
                            value={selectedDate}
                            onChange={(newValue) => {
                              setSelectedDate(newValue);
                              setSelectedTime(null); // Limpa a hora ao trocar de data
                            }}
                            renderInput={(params) => <TextField {...params} />}
                            minDate={new Date()}
                          />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {loadingTimes ? (
                          <CircularProgress />
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {availableTimes.length > 0 ? availableTimes.map(time => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? "contained" : "outlined"}
                                onClick={() => setSelectedTime(time)}
                              >
                                {time}
                              </Button>
                            )) : (
                              <Typography>Não há horários disponíveis para esta data.</Typography>
                            )}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* Seção de Dados do Cliente (se visitante) */}
                {selectedTime && !registeredClient && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Seus Dados</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Seu Nome"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Seu Telefone (WhatsApp)"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* Botão de Confirmação */}
                {selectedTime && (registeredClient || (clientName && clientPhone)) && (
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleAgendamentoSubmit}
                      disabled={!registeredClient && (!clientName || !clientPhone)}
                    >
                      Confirmar Agendamento
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Container>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default AgendamentoPublico;