import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
const CompanyRequiredModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    const preference = localStorage.getItem('registration_preference');
    if (preference === 'PF') {
      navigate('/cadastro-pf');
    } else {
      navigate('/empresa');
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <ReportProblemIcon color="warning" sx={{ mr: 1 }} />
        Acesso Restrito
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Para acessar todas as funcionalidades do sistema, primeiro é necessário cadastrar os dados da sua empresa.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Agora não</Button>
        <Button onClick={handleRedirect} variant="contained">
          Cadastrar Empresa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyRequiredModal;